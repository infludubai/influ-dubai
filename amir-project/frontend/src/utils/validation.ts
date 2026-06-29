export function isValidPhone(phone: string) {
  const value = phone.trim()
  if (!value) return true
  return /^[+]?[0-9()\-\s.]{7,20}$/.test(value) && value.replace(/\D/g, "").length >= 7
}

export function passwordChecks(password: string) {
  return [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Number", passed: /\d/.test(password) },
    { label: "Special character", passed: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function passwordScore(password: string) {
  return passwordChecks(password).filter((item) => item.passed).length
}

export function isStrongPassword(password: string) {
  return passwordScore(password) === 4
}
