const https = require("node:https")
const { query } = require("../db/postgres")

async function getTwilioSettings(config) {
  const rows = await query(config, `
    SELECT "key", "value" FROM settings
    WHERE "key" IN (
      'twilio_sms_enabled','twilio_account_sid','twilio_auth_token',
      'twilio_from_number','twilio_webhook_token'
    )
  `).catch(() => [])

  const s = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    enabled: s.twilio_sms_enabled === "1",
    accountSid: s.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID || "",
    authToken: s.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN || "",
    fromNumber: s.twilio_from_number || process.env.TWILIO_FROM_NUMBER || "",
    webhookToken: s.twilio_webhook_token || process.env.TWILIO_WEBHOOK_TOKEN || "",
  }
}

async function sendSms(config, to, body) {
  const twilio = await getTwilioSettings(config)

  if (!twilio.enabled) throw new Error("SMS is not enabled. Enable it in Admin → Integrations.")
  if (!twilio.accountSid || !twilio.authToken || !twilio.fromNumber) {
    throw new Error("Twilio credentials not configured. Set them in Admin → Integrations.")
  }
  if (!to) throw new Error("Recipient phone number is required.")

  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams({ To: to, From: twilio.fromNumber, Body: body }).toString()
    const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString("base64")

    const options = {
      hostname: "api.twilio.com",
      path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
        "Content-Length": Buffer.byteLength(payload),
      },
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.sid) {
            resolve({ sid: parsed.sid, status: parsed.status })
          } else {
            reject(new Error(parsed.message || "Twilio API error"))
          }
        } catch {
          reject(new Error("Invalid response from Twilio"))
        }
      })
    })

    req.on("error", reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Twilio request timed out")) })
    req.write(payload)
    req.end()
  })
}

module.exports = { sendSms, getTwilioSettings }
