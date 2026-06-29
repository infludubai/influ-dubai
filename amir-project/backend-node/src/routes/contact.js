const https = require("node:https")
const { query } = require("../db/postgres")
const { sendJson } = require("../utils/http")
const { readJsonBody } = require("../utils/request")
const { sendEmail } = require("../services/mailService")
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

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
}

function contactRouter(req, res, url, config) {
  const p = url.pathname
  const prefix = config.apiPrefix

  if (p === `${prefix}/contact` && req.method === "POST") {
    handleContact(req, res, config).catch(err => {
      console.error("[node-api] Contact form error", err)
      sendJson(res, { message: "Failed to send message." }, 500)
    })
    return true
  }

  if (p === `${prefix}/ai/chat` && req.method === "POST") {
    handleAiChat(req, res, config).catch(err => {
      console.error("[node-api] AI chat error", err)
      sendJson(res, { reply: "I'm having trouble right now. Please try again or contact us directly." })
    })
    return true
  }

  if (p === `${prefix}/ai/transfer` && req.method === "POST") {
    sendJson(res, { message: "Transferred to human support." })
    return true
  }

  if (p === `${prefix}/quotes` && req.method === "POST") {
    handleQuoteSubmit(req, res, config).catch(err => {
      console.error("[node-api] Quote submit error", err)
      sendJson(res, { message: "Failed to submit quote request." }, 500)
    })
    return true
  }

  return false
}

async function handleContact(req, res, config) {
  if (rateLimited(res, clientIp(req), "contact", { max: 5, windowMs: 10 * 60_000 })) return
  const body = await readJsonBody(req)
  const { name, email, message, phone, subject } = body

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return sendJson(res, { message: "Name, email and message are required." }, 422)
  }
  if (!isEmail(email)) {
    return sendJson(res, { message: "A valid email address is required." }, 422)
  }
  if (String(message).length > 5000) {
    return sendJson(res, { message: "Message may not exceed 5000 characters." }, 422)
  }

  const adminEmail = await getAdminEmail(config)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#1e293b">
      <h2 style="color:#0f172a;border-bottom:3px solid #3b82f6;padding-bottom:8px">New Contact Form Message</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      ${phone ? `<p><strong>Phone:</strong> ${esc(phone)}</p>` : ""}
      ${subject ? `<p><strong>Subject:</strong> ${esc(subject)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:8px;border-left:4px solid #3b82f6">${esc(message)}</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">Submitted via a-mir.com contact form · Reply directly to ${esc(email)}</p>
    </div>`

  sendEmail(config, {
    to: adminEmail,
    replyTo: `"${name}" <${email}>`,
    subject: `Contact: ${subject || name}`,
    text: `New contact from ${name} (${email}): ${message}`,
    html,
  }).catch(e => console.error("[node-api] Contact email failed", e.message))

  await query(config, `
    INSERT INTO contact_messages (name, email, phone, subject, message, created_at, updated_at)
    VALUES (:name, :email, :phone, :subject, :message, NOW(), NOW())
  `, { name, email, phone: phone || null, subject: subject || null, message }).catch(() => {})

  return sendJson(res, { message: "Your message has been sent. We'll get back to you soon!" })
}

async function handleAiChat(req, res, config) {
  if (rateLimited(res, clientIp(req), "ai-chat", { max: 20, windowMs: 60_000 })) return
  const body = await readJsonBody(req)
  const userMessage = String(body.message || "").slice(0, 2000)

  const rows = await query(config, `SELECT "value" FROM settings WHERE "key" = 'openai_api_key' LIMIT 1`).catch(() => [])
  const apiKey = rows[0]?.value || process.env.OPENAI_API_KEY || ""

  if (!apiKey) {
    return sendJson(res, { reply: getRuleBasedReply(userMessage) })
  }

  const promptRows = await query(config, `SELECT "value" FROM settings WHERE "key" = 'ai_system_prompt' LIMIT 1`).catch(() => [])
  const systemPrompt = promptRows[0]?.value || "You are a helpful assistant for Amir Nazir's digital services platform. Help clients with questions about web design, development, SEO, and other digital services."

  const reply = await callOpenAi(apiKey, systemPrompt, userMessage)
  return sendJson(res, { reply })
}

async function handleQuoteSubmit(req, res, config) {
  if (rateLimited(res, clientIp(req), "quote-submit", { max: 5, windowMs: 10 * 60_000 })) return
  const body = await readJsonBody(req)
  const { name, email, phone, message, service_type, budget } = body

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return sendJson(res, { message: "Name, email and message are required." }, 422)
  }
  if (!isEmail(email)) {
    return sendJson(res, { message: "A valid email address is required." }, 422)
  }
  if (String(message).length > 5000) {
    return sendJson(res, { message: "Message may not exceed 5000 characters." }, 422)
  }

  const result = await query(config, `
    INSERT INTO custom_quotes (name, email, phone, message, service_type, budget, status, created_at, updated_at)
    VALUES (:name, :email, :phone, :message, :serviceType, :budget, 'pending', NOW(), NOW())
  `, {
    name, email,
    phone: phone || null,
    message,
    serviceType: service_type || null,
    budget: budget || null,
  })

  const adminEmail = await getAdminEmail(config)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#1e293b">
      <h2 style="color:#0f172a;border-bottom:3px solid #6366f1;padding-bottom:8px">New Quote Request</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      ${phone ? `<p><strong>Phone:</strong> ${esc(phone)}</p>` : ""}
      ${service_type ? `<p><strong>Service:</strong> ${esc(service_type)}</p>` : ""}
      ${budget ? `<p><strong>Budget:</strong> ${esc(budget)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:8px;border-left:4px solid #6366f1">${esc(message)}</p>
      <p style="margin-top:20px"><a href="https://a-mir.com/admin/quotes" style="background:#6366f1;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700">View in Admin →</a></p>
      <p style="font-size:12px;color:#94a3b8;margin-top:16px">Submitted via a-mir.com · Reply directly to ${esc(email)}</p>
    </div>`

  sendEmail(config, {
    to: adminEmail,
    replyTo: `"${name}" <${email}>`,
    subject: `New Quote Request from ${name}`,
    text: `New quote from ${name} (${email})${service_type ? ", service: " + service_type : ""}${budget ? ", budget: " + budget : ""}: ${message}`,
    html,
  }).catch(e => console.error("[node-api] Quote email failed", e.message))

  return sendJson(res, {
    message: "Quote request submitted! We'll contact you within 24 hours.",
    data: { id: result.insertId },
  }, 201)
}

function callOpenAi(apiKey, systemPrompt, userMessage) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
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
          resolve(parsed.choices?.[0]?.message?.content || getRuleBasedReply(""))
        } catch {
          resolve(getRuleBasedReply(""))
        }
      })
    })

    req.on("error", () => resolve(getRuleBasedReply("")))
    req.setTimeout(10000, () => { req.destroy(); resolve(getRuleBasedReply("")) })
    req.write(payload)
    req.end()
  })
}

function getRuleBasedReply(msg) {
  const m = msg.toLowerCase()
  if (m.includes("price") || m.includes("cost") || m.includes("how much")) {
    return "Our packages start from $199 for a basic website. Check out our Pricing page for full details, or request a custom quote!"
  }
  if (m.includes("portfolio") || m.includes("work") || m.includes("example")) {
    return "You can view our portfolio at a-mir.com/portfolio — we've built websites, e-commerce stores, and more!"
  }
  if (m.includes("service") || m.includes("offer") || m.includes("what do you")) {
    return "We offer web design, development, SEO, digital marketing, branding, and e-commerce solutions. Visit our Services page to learn more!"
  }
  if (m.includes("contact") || m.includes("talk") || m.includes("human") || m.includes("support")) {
    return "I'll connect you with Amir directly. Click 'Talk to a human' and send your message — he typically replies within a few hours!"
  }
  if (m.includes("hello") || m.includes("hi") || m.includes("hey")) {
    return "Hi! I'm Amir's AI assistant. How can I help you today? You can ask about our services, pricing, or portfolio!"
  }
  return "Thanks for your message! For detailed enquiries, I recommend clicking 'Talk to a human' to reach Amir directly. He replies within a few hours!"
}

async function getAdminEmail(config) {
  const rows = await query(config, `SELECT "value" FROM settings WHERE "key" IN ('admin_email','contact_email') ORDER BY "key" LIMIT 2`).catch(() => [])
  return rows[0]?.value || process.env.ADMIN_EMAIL || "info@a-mir.com"
}

function esc(v) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

module.exports = { contactRouter }
