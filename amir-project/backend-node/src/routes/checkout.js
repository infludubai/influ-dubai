const https = require("node:https")
const { authenticateSanctumRequest, findUserById } = require("../repositories/authRepository")
const { placeOrder } = require("../repositories/checkoutRepository")
const { sendJson } = require("../utils/http")
const { readJsonBody } = require("../utils/request")
const { parseMultipart } = require("../utils/multipart")
const { query } = require("../db/postgres")
const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = require("../services/mailService")
const fs = require("node:fs")

function checkoutRouter(req, res, url, config) {
  const pre = config.apiPrefix

  if (url.pathname === `${pre}/checkout/place` && req.method === "POST") {
    handlePlaceOrder(req, res, config).catch((error) => {
      console.error("[node-api] Checkout place order failed", error)
      sendJson(res, { message: "Failed to place order." }, 500)
    })
    return true
  }

  if (url.pathname === `${pre}/checkout/extract-transaction` && req.method === "POST") {
    handleExtractTransaction(req, res, config).catch((err) => {
      console.error("[node-api] Extract transaction failed", err)
      sendJson(res, { transaction_id: null })
    })
    return true
  }

  return false
}

async function handleExtractTransaction(req, res, config) {
  const { files } = await parseMultipart(req)
  if (!files.length) return sendJson(res, { transaction_id: null })

  const file = files[0]

  const rows = await query(config, `SELECT "value" FROM settings WHERE "key" = 'openai_api_key' LIMIT 1`).catch(() => [])
  const apiKey = rows[0]?.value || process.env.OPENAI_API_KEY || ""

  if (!apiKey) {
    try { fs.unlinkSync(file.path) } catch {}
    return sendJson(res, { transaction_id: null })
  }

  try {
    const imageData = fs.readFileSync(file.path)
    const base64 = imageData.toString("base64")
    const mimeType = file.mimetype || "image/jpeg"
    fs.unlinkSync(file.path)

    const result = await callOpenAiVision(apiKey, base64, mimeType)
    return sendJson(res, { transaction_id: result })
  } catch (err) {
    try { fs.unlinkSync(file.path) } catch {}
    return sendJson(res, { transaction_id: null })
  }
}

function callOpenAiVision(apiKey, base64, mimeType) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract the transaction ID or reference number from this payment screenshot. Return ONLY the transaction ID as plain text, nothing else. If you cannot find one, return empty string." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }],
      max_tokens: 100,
    })

    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(payload),
      },
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          const text = parsed.choices?.[0]?.message?.content?.trim() || ""
          resolve(text || null)
        } catch {
          resolve(null)
        }
      })
    })
    req.on("error", reject)
    req.setTimeout(15000, () => { req.destroy(); resolve(null) })
    req.write(payload)
    req.end()
  })
}

async function handlePlaceOrder(req, res, config) {
  const auth = await authenticateSanctumRequest(config, req.headers.authorization)
  if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)

  const body = await readJsonBody(req)
  const errors = validateCheckoutPayload(body)
  if (Object.keys(errors).length > 0) {
    return sendJson(res, { message: "The given data was invalid.", errors }, 422)
  }

  const result = await placeOrder(config, auth.user.id, sanitizeCheckoutPayload(body), req)
  if (!result.ok) {
    return sendJson(res, { message: "The given data was invalid.", errors: result.errors }, result.statusCode || 422)
  }

  // Fire confirmation emails — don't await so response is instant
  const user = await findUserById(config, auth.user.id).catch(() => auth.user)
  sendOrderConfirmationEmail(config, result.order, user || auth.user)
  sendAdminNewOrderEmail(config, result.order, user || auth.user)

  return sendJson(res, { message: "Order placed successfully!", order: result.order }, 201)
}

function validateCheckoutPayload(body) {
  const errors = {}

  if (!Number(body.package_id)) errors.package_id = ["The package id field is required."]
  if (!Number(body.payment_method_id)) errors.payment_method_id = ["The payment method id field is required."]
  if (!body.project_description || String(body.project_description).trim().length === 0) {
    errors.project_description = ["The project description field is required."]
  }
  if (body.project_description && String(body.project_description).length > 5000) {
    errors.project_description = ["The project description may not be greater than 5000 characters."]
  }
  if (body.website_goals && String(body.website_goals).length > 2000) {
    errors.website_goals = ["The website goals may not be greater than 2000 characters."]
  }
  if (body.existing_url && String(body.existing_url).length > 500) {
    errors.existing_url = ["The existing url may not be greater than 500 characters."]
  }
  if (body.reference_urls && String(body.reference_urls).length > 1000) {
    errors.reference_urls = ["The reference urls may not be greater than 1000 characters."]
  }
  if (body.addon_ids !== undefined && !Array.isArray(body.addon_ids)) {
    errors.addon_ids = ["The addon ids must be an array."]
  }

  return errors
}

function sanitizeCheckoutPayload(body) {
  return {
    package_id: Number(body.package_id),
    addon_ids: Array.isArray(body.addon_ids) ? body.addon_ids.map(Number).filter(Boolean) : [],
    company_name: optionalString(body.company_name),
    website_type: optionalString(body.website_type),
    project_description: String(body.project_description).trim(),
    website_goals: optionalString(body.website_goals),
    existing_url: optionalString(body.existing_url),
    reference_urls: optionalString(body.reference_urls),
    business_industry: optionalString(body.business_industry),
    payment_method_id: Number(body.payment_method_id),
    transaction_id: optionalString(body.transaction_id),
  }
}

function optionalString(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null
  return String(value).trim()
}

module.exports = { checkoutRouter }
