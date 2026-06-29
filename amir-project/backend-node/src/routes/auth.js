const {
  authenticateSanctumRequest,
  createSanctumToken,
  createUser,
  deleteCurrentToken,
  emailExists,
  findUserById,
  findUserByLogin,
  findUserBySanctumToken,
  getUserResponseById,
  markEmailVerified,
  touchLastSeen,
  updatePasswordAndDeleteTokens,
  updateUserProfile,
  usernameExists,
  usernameExistsForAnotherUser,
  verifyPassword,
} = require("../repositories/authRepository")
const { isTrustedDevice, registerUnknownDevice, trustDevice } = require("../services/deviceService")
const { sendOtpEmail, sendWelcomeEmail } = require("../services/mailService")
const { createOtp, getResendCooldown, verifyOtp } = require("../services/otpService")
const { sendJson } = require("../utils/http")
const { readJsonBody } = require("../utils/request")
const { allow, retryAfter } = require("../utils/rateLimit")

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown"
}

function rateLimited(res, ip, action, opts) {
  if (allow(ip, action, opts)) return false
  const wait = retryAfter(ip, action)
  sendJson(res, { message: `Too many attempts. Please try again in ${wait} seconds.` }, 429)
  return true
}

const PROFILE_LIMITS = {
  name: 255,
  username: 50,
  phone: 30,
  company_name: 255,
  address: 1000,
  industry: 255,
  goals: 1000,
}

function authRouter(req, res, url, config) {
  if (url.pathname === `${config.apiPrefix}/auth/register` && req.method === "POST") {
    handleRegister(req, res, config)
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/login` && req.method === "POST") {
    handleLogin(req, res, config)
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/verify-email` && req.method === "POST") {
    handleVerifyOtp(req, res, config, "email_verify")
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/verify-device` && req.method === "POST") {
    handleVerifyOtp(req, res, config, "new_device")
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/resend-otp` && req.method === "POST") {
    handleResendOtp(req, res, config)
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/forgot-password` && req.method === "POST") {
    handleForgotPassword(req, res, config)
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/reset-password` && req.method === "POST") {
    handleResetPassword(req, res, config)
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/me` && req.method === "GET") {
    findUserBySanctumToken(config, req.headers.authorization)
      .then((user) => {
        if (!user) {
          return sendJson(res, { message: "Unauthenticated." }, 401)
        }

        return sendJson(res, { user })
      })
      .catch((error) => {
        console.error("[node-api] Failed to authenticate Sanctum token", error)
        sendJson(res, { message: "Failed to load authenticated user." }, 500)
      })

    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/logout` && req.method === "POST") {
    authenticateSanctumRequest(config, req.headers.authorization)
      .then((auth) => {
        if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)
        return deleteCurrentToken(config, auth.token).then(() =>
          sendJson(res, { message: "Logged out successfully." })
        )
      })
      .catch((error) => {
        console.error("[node-api] Failed to log out user", error)
        sendJson(res, { message: "Failed to log out." }, 500)
      })

    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/profile` && req.method === "PUT") {
    handleProfileUpdate(req, res, config)
    return true
  }

  if (url.pathname === `${config.apiPrefix}/auth/profile/password` && req.method === "PUT") {
    handlePasswordUpdate(req, res, config)
    return true
  }

  return false
}

async function handlePasswordUpdate(req, res, config) {
  try {
    const auth = await authenticateSanctumRequest(config, req.headers.authorization)
    if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)

    const body = await readJsonBody(req)
    const errors = {}

    if (!body.current_password) errors.current_password = ["Current password is required."]
    if (!body.password) errors.password = ["New password is required."]
    if (body.password && body.password.length < 8) errors.password = ["Password must be at least 8 characters."]
    if (body.password !== body.password_confirmation) errors.password_confirmation = ["Passwords do not match."]

    if (Object.keys(errors).length > 0) return validationResponse(res, errors)

    // Verify current password
    const { findUserById, verifyPassword, updatePasswordAndDeleteTokens, createSanctumToken } = require("../repositories/authRepository")
    const user = await findUserById(config, auth.user.id)
    if (!user || !await verifyPassword(String(body.current_password), user.password)) {
      return validationResponse(res, { current_password: ["Current password is incorrect."] })
    }

    await updatePasswordAndDeleteTokens(config, auth.user.id, body.password)
    const token = await createSanctumToken(config, auth.user.id)

    return sendJson(res, { message: "Password updated successfully.", token })
  } catch (err) {
    console.error("[node-api] Password update failed", err)
    return sendJson(res, { message: "Failed to update password." }, 500)
  }
}

async function handleRegister(req, res, config) {
  try {
    if (rateLimited(res, clientIp(req), "register", { max: 5, windowMs: 10 * 60_000 })) return
    const body = await readJsonBody(req)
    const errors = validateRegisterPayload(body)

    if (body.email && await emailExists(config, String(body.email))) {
      errors.email = ["The email has already been taken."]
    }

    if (body.username && await usernameExists(config, String(body.username))) {
      errors.username = ["The username has already been taken."]
    }

    if (Object.keys(errors).length > 0) return validationResponse(res, errors)

    const user = await createUser(config, {
      name: String(body.name).trim(),
      username: body.username ? String(body.username).trim() : null,
      email: String(body.email).trim(),
      phone: body.phone ? String(body.phone).trim() : null,
      password: String(body.password),
    })

    const code = await createOtp(config, user.id, "email_verify")
    await sendOtpEmail(config, user, code, "email_verify")

    return sendJson(res, {
      message: "Account created. Please verify your email with the OTP sent.",
      user_id: user.id,
      email: user.email,
    }, 201)
  } catch (error) {
    console.error("[node-api] Register failed", error)
    return sendJson(res, { message: "Failed to create account." }, 500)
  }
}

async function handleLogin(req, res, config) {
  try {
    if (rateLimited(res, clientIp(req), "login", { max: 8, windowMs: 15 * 60_000 })) return
    const body = await readJsonBody(req)
    const errors = {}
    if (!body.login) errors.login = ["The login field is required."]
    if (!body.password) errors.password = ["The password field is required."]
    if (Object.keys(errors).length > 0) return validationResponse(res, errors)

    const user = await findUserByLogin(config, String(body.login).trim())
    if (!user || !await verifyPassword(String(body.password), user.password)) {
      return validationResponse(res, { login: ["Invalid credentials. Check your email/username and password."] })
    }

    if (!isActive(user.is_active)) {
      return validationResponse(res, { login: ["Your account has been deactivated. Please contact support."] })
    }

    if (user.role === "admin") {
      await touchLastSeen(config, user.id)
      const token = await createSanctumToken(config, user.id)
      return sendJson(res, { token, user: await authUserResponse(config, user.id) })
    }

    if (!user.email_verified_at) {
      const code = await createOtp(config, user.id, "email_verify")
      await sendOtpEmail(config, user, code, "email_verify")
      return sendJson(res, {
        requires_verification: true,
        message: "Please verify your email first. A new OTP has been sent.",
        user_id: user.id,
      }, 403)
    }

    // Auto-trust device — no second OTP step needed after email is verified
    await trustDevice(config, user.id, req)
    await touchLastSeen(config, user.id)
    const token = await createSanctumToken(config, user.id)
    return sendJson(res, { token, user: await authUserResponse(config, user.id) })
  } catch (error) {
    console.error("[node-api] Login failed", error)
    return sendJson(res, { message: "Failed to log in." }, 500)
  }
}

async function handleVerifyOtp(req, res, config, type) {
  try {
    const body = await readJsonBody(req)
    const errors = validateOtpPayload(body)
    if (Object.keys(errors).length > 0) return validationResponse(res, errors)

    const user = await findUserById(config, Number(body.user_id))
    if (!user) return validationResponse(res, { user_id: ["The selected user is invalid."] })

    const result = await verifyOtp(config, user.id, type, String(body.otp))
    if (!result.ok) return validationResponse(res, result.errors)

    if (type === "email_verify") {
      await markEmailVerified(config, user.id)
      sendWelcomeEmail(config, user)
    }

    await trustDevice(config, user.id, req)
    await touchLastSeen(config, user.id)
    const token = await createSanctumToken(config, user.id)

    return sendJson(res, {
      message: type === "email_verify" ? "Email verified successfully." : "Device verified.",
      token,
      user: await authUserResponse(config, user.id),
    })
  } catch (error) {
    console.error("[node-api] OTP verification failed", error)
    return sendJson(res, { message: "Failed to verify OTP." }, 500)
  }
}

async function handleResendOtp(req, res, config) {
  try {
    if (rateLimited(res, clientIp(req), "resend-otp", { max: 5, windowMs: 10 * 60_000 })) return
    const body = await readJsonBody(req)
    const type = String(body.type || "")
    const errors = {}
    if (!Number(body.user_id)) errors.user_id = ["The user id field is required."]
    if (!["email_verify", "new_device", "password_reset"].includes(type)) errors.type = ["The selected type is invalid."]
    if (Object.keys(errors).length > 0) return validationResponse(res, errors)

    const user = await findUserById(config, Number(body.user_id))
    if (!user) return validationResponse(res, { user_id: ["The selected user is invalid."] })

    const cooldown = await getResendCooldown(config, user.id, type)
    if (cooldown > 0) {
      return sendJson(res, {
        message: `Please wait ${cooldown} seconds before requesting a new OTP.`,
        cooldown,
      }, 429)
    }

    const code = await createOtp(config, user.id, type)
    await sendOtpEmail(config, user, code, type)
    return sendJson(res, { message: "OTP sent successfully." })
  } catch (error) {
    console.error("[node-api] Resend OTP failed", error)
    return sendJson(res, { message: "Failed to send OTP." }, 500)
  }
}

async function handleForgotPassword(req, res, config) {
  try {
    if (rateLimited(res, clientIp(req), "forgot-password", { max: 5, windowMs: 15 * 60_000 })) return
    const body = await readJsonBody(req)
    if (!isEmail(body.email)) return validationResponse(res, { email: ["The email field must be a valid email address."] })

    const user = await findUserByLogin(config, String(body.email).trim())
    if (user) {
      const code = await createOtp(config, user.id, "password_reset")
      await sendOtpEmail(config, user, code, "password_reset")
    }

    // Always return same message regardless of whether email exists (prevents user enumeration)
    return sendJson(res, {
      message: "If this email exists, a password reset OTP has been sent.",
      user_id: user?.id ?? null,
    })
  } catch (error) {
    console.error("[node-api] Forgot password failed", error)
    return sendJson(res, { message: "Failed to send password reset OTP." }, 500)
  }
}

async function handleResetPassword(req, res, config) {
  try {
    const body = await readJsonBody(req)
    const errors = validateResetPasswordPayload(body)
    if (Object.keys(errors).length > 0) return validationResponse(res, errors)

    const user = await findUserById(config, Number(body.user_id))
    if (!user) return validationResponse(res, { user_id: ["The selected user is invalid."] })

    const result = await verifyOtp(config, user.id, "password_reset", String(body.otp))
    if (!result.ok) return validationResponse(res, result.errors)

    await updatePasswordAndDeleteTokens(config, user.id, String(body.password))
    return sendJson(res, { message: "Password reset successfully. Please log in." })
  } catch (error) {
    console.error("[node-api] Reset password failed", error)
    return sendJson(res, { message: "Failed to reset password." }, 500)
  }
}

async function handleProfileUpdate(req, res, config) {
  try {
    const auth = await authenticateSanctumRequest(config, req.headers.authorization)
    if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)

    const body = await readJsonBody(req)
    const errors = validateProfilePayload(body)

    if (body.username && await usernameExistsForAnotherUser(config, body.username, auth.user.id)) {
      errors.username = ["The username has already been taken."]
    }

    if (Object.keys(errors).length > 0) {
      return sendJson(res, { message: "The given data was invalid.", errors }, 422)
    }

    const user = await updateUserProfile(config, auth.user.id, sanitizeProfilePayload(body))
    return sendJson(res, { user })
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode >= 500) console.error("[node-api] Failed to update profile", error)
    sendJson(res, { message: error.message || "Failed to update profile." }, statusCode)
  }
}

function validateRegisterPayload(body) {
  const errors = {}
  if (!body.name || String(body.name).trim().length === 0) errors.name = ["The name field is required."]
  if (body.name && String(body.name).length > 255) errors.name = ["The name may not be greater than 255 characters."]
  if (!isEmail(body.email)) errors.email = ["The email field must be a valid email address."]
  if (body.username && !/^[A-Za-z0-9_-]+$/.test(String(body.username))) {
    errors.username = ["The username may only contain letters, numbers, dashes and underscores."]
  }
  if (body.username && String(body.username).length > 50) errors.username = ["The username may not be greater than 50 characters."]
  if (body.phone && (!/^[\d\s+\-()]+$/.test(String(body.phone)) || String(body.phone).length > 30)) {
    errors.phone = ["The phone format is invalid."]
  }
  addPasswordErrors(errors, body)
  return errors
}

function validateOtpPayload(body) {
  const errors = {}
  if (!Number(body.user_id)) errors.user_id = ["The user id field is required."]
  if (!/^\d{6}$/.test(String(body.otp || ""))) errors.otp = ["The otp must be 6 digits."]
  return errors
}

function validateResetPasswordPayload(body) {
  const errors = validateOtpPayload(body)
  addPasswordErrors(errors, body)
  return errors
}

function addPasswordErrors(errors, body) {
  if (!body.password || String(body.password).length < 8) {
    errors.password = ["The password must be at least 8 characters."]
  }
  if (body.password !== body.password_confirmation) {
    errors.password = ["The password confirmation does not match."]
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
}

function validationResponse(res, errors) {
  return sendJson(res, { message: "The given data was invalid.", errors }, 422)
}

async function authUserResponse(config, userId) {
  return getUserResponseById(config, userId)
}

function isActive(value) {
  return value === true || value === 1 || value === "1"
}

function validateProfilePayload(body) {
  const errors = {}

  for (const [field, limit] of Object.entries(PROFILE_LIMITS)) {
    if (body[field] !== undefined && body[field] !== null && String(body[field]).length > limit) {
      errors[field] = [`The ${field.replace("_", " ")} may not be greater than ${limit} characters.`]
    }
  }

  if (body.username !== undefined && body.username !== null && !/^[A-Za-z0-9_-]+$/.test(String(body.username))) {
    errors.username = ["The username may only contain letters, numbers, dashes and underscores."]
  }

  if (body.account_type !== undefined && body.account_type !== null && !["business", "individual", ""].includes(String(body.account_type))) {
    errors.account_type = ["The selected account type is invalid."]
  }

  return errors
}

function sanitizeProfilePayload(body) {
  const allowed = ["name", "username", "phone", "avatar", "company_name", "address", "industry", "account_type", "goals"]

  return allowed.reduce((payload, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = body[key] === null ? null : String(body[key])
    }
    return payload
  }, {})
}

module.exports = { authRouter }
