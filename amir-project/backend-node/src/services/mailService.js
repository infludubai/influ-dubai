const https = require("node:https")
const nodemailer = require("nodemailer")
const { query } = require("../db/postgres")

const SMTP_KEYS = [
  "smtp_enabled", "smtp_host", "smtp_port", "smtp_username",
  "smtp_password", "smtp_encryption", "smtp_from_address", "smtp_from_name",
]

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
async function getEmailSettings(config) {
  const rows = await query(config,
    `SELECT "key","value" FROM settings WHERE "key" IN ('logo_url','email_logo_url','whatsapp_url','whatsapp_icon','instagram_url','instagram_icon')`
  ).catch(() => [])
  const s = {}
  rows.forEach(r => { s[r.key] = r.value })
  return {
    logoUrl:          s.logo_url       || s.email_logo_url || null,
    whatsappUrl:      s.whatsapp_url   || null,
    whatsappIconUrl:  s.whatsapp_icon  || null,
    instagramUrl:     s.instagram_url  || null,
    instagramIconUrl: s.instagram_icon || null,
  }
}

async function getLogoUrl(config) {
  const es = await getEmailSettings(config).catch(() => ({}))
  return es.logoUrl || null
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────
function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
function fmt(d) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG icons — only used where no uploaded image exists (OTP box, security note,
// footer contact row). Body "top icon" circles now use emojis instead of SVG
// because Gmail strips inline SVG and renders a blank box.
// ─────────────────────────────────────────────────────────────────────────────
const I = {
  lock:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a6fa8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="11" rx="2.5"/><path d="M7 11V7.5a5 5 0 0 1 10 0V11"/><circle cx="12" cy="16.5" r="1.5" fill="#1a6fa8" stroke="none"/></svg>`,
  clock:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a6fa8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
  shield:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6fa8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>`,
  mail14:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  globe14: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Top icon circle — EMOJI based (renders in Gmail, Outlook, Apple Mail, all)
// bg: background color, emoji: unicode emoji character
// ─────────────────────────────────────────────────────────────────────────────
function topIcon(emoji, bg = "#e8f3fc") {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 20px">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td width="72" height="72" align="center" valign="middle" bgcolor="${bg}"
          style="background-color:${bg};border-radius:36px;width:72px;height:72px;
                 text-align:center;vertical-align:middle;line-height:72px;
                 mso-line-height-rule:exactly;font-size:32px">
          <span style="font-size:32px;line-height:72px;mso-line-height-rule:exactly">${emoji}</span>
        </td>
      </tr></table>
    </td></tr>
  </table>`
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP digit boxes
// ─────────────────────────────────────────────────────────────────────────────
function otpDigits(code) {
  const digits = String(code).trim().slice(0, 6).split("")
  const cells = digits.map(d => `
    <td style="padding:0 4px">
      <table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td class="odig" width="42" height="52" align="center" valign="middle" bgcolor="#eef4ff"
          style="background-color:#eef4ff;border:1.5px solid #bed4f9;border-radius:10px;
                 width:42px;height:52px;text-align:center;vertical-align:middle;font-size:24px;
                 font-weight:800;color:#1a4fa8;line-height:52px;mso-line-height-rule:exactly;
                 font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${esc(d)}</td>
      </tr></table>
    </td>`).join("")
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto"><tr>${cells}</tr></table>`
}

function otpCard(code) {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 22px">
    <tr><td bgcolor="#f5f8ff" style="background-color:#f5f8ff;border:1px solid #dce7fb;border-radius:14px;padding:22px 16px">

      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 18px">
        <tr>
          <td style="border-top:1px solid #cfddf5;line-height:0;font-size:0">&nbsp;</td>
          <td style="white-space:nowrap;padding:0 12px;vertical-align:middle">
            <table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="padding-right:5px;vertical-align:middle">${I.lock}</td>
              <td style="vertical-align:middle;font-size:10px;font-weight:700;color:#1a6fa8;
                         letter-spacing:2.5px;text-transform:uppercase;
                         font-family:'Segoe UI',Helvetica,Arial,sans-serif">Your OTP Code</td>
            </tr></table>
          </td>
          <td style="border-top:1px solid #cfddf5;line-height:0;font-size:0">&nbsp;</td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 18px">
        <tr><td align="center">${otpDigits(code)}</td></tr>
      </table>

      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 14px">
        <tr><td height="1" bgcolor="#dce7fb" style="background-color:#dce7fb;font-size:0;line-height:0">&nbsp;</td></tr>
      </table>

      <table cellpadding="0" cellspacing="0" width="100%" role="presentation">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="padding-right:6px;vertical-align:middle">${I.clock}</td>
            <td style="vertical-align:middle;font-size:13px;color:#64748b;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif">
              This code expires in&nbsp;<strong style="color:#1a6fa8;font-weight:700">10 minutes</strong>
            </td>
          </tr></table>
        </td></tr>
      </table>

    </td></tr>
  </table>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────────────────────
function hero(heading, sub) {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 26px">
    <tr><td align="center">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0a1128;letter-spacing:-.3px;
                 line-height:1.3;font-family:'Segoe UI',Helvetica,Arial,sans-serif">${heading}</h1>
      <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;max-width:380px;
                font-family:'Segoe UI',Helvetica,Arial,sans-serif">${sub}</p>
    </td></tr>
  </table>`
}

function btn(text, href, bg = "#1a6fa8") {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 22px">
    <tr>
      <td align="center" bgcolor="${bg}" style="background-color:${bg};border-radius:10px">
        <a href="${esc(href)}" target="_blank"
          style="display:block;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;
                 text-align:center;padding:14px 24px;letter-spacing:.2px;
                 font-family:'Segoe UI',Helvetica,Arial,sans-serif">${esc(text)} &rarr;</a>
      </td>
    </tr>
  </table>`
}

function secNote() {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" role="presentation">
    <tr>
      <td bgcolor="#eef5fc" style="background-color:#eef5fc;border:1px solid #cce0f5;border-radius:10px;padding:14px 16px">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>
          <td width="32" style="vertical-align:top;padding-top:1px">${I.shield}</td>
          <td style="vertical-align:top;padding-left:12px">
            <p style="margin:0 0 3px;font-size:12px;font-weight:700;color:#0a1128;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif">Security Note</p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif">
              For your security, do not share this code with anyone. Amir Nazir will never ask for your OTP.
            </p>
          </td>
        </tr></table>
      </td>
    </tr>
  </table>`
}

function sLabel(t) {
  return `<p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;
                     letter-spacing:2px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">${esc(t)}</p>`
}

function iTable(rows) {
  return `<table cellpadding="0" cellspacing="0" width="100%" role="presentation"
    style="border:1px solid #e4eaf2;border-radius:12px;overflow:hidden;margin:0 0 24px">${rows}</table>`
}
function iRow(label, val) {
  return `<tr>
    <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:10px 16px;font-size:10px;font-weight:700;
           color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;width:110px;white-space:nowrap;
           border-bottom:1px solid #f0f4f8;vertical-align:middle;
           font-family:'Segoe UI',Helvetica,Arial,sans-serif">${esc(label)}</td>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:10px 16px;font-size:14px;color:#1e293b;
           font-weight:500;border-bottom:1px solid #f0f4f8;vertical-align:middle;
           font-family:'Segoe UI',Helvetica,Arial,sans-serif">${val}</td>
  </tr>`
}

function pill(text, color = "#1a6fa8") {
  return `<span style="display:inline-block;background-color:${color}1a;color:${color};font-size:11px;
                        font-weight:700;padding:3px 10px;border-radius:999px;letter-spacing:.5px;
                        text-transform:uppercase;
                        font-family:'Segoe UI',Helvetica,Arial,sans-serif">${esc(text)}</span>`
}

function step(n, color, title, desc) {
  return `<tr><td style="padding-bottom:14px">
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>
      <td width="32" style="vertical-align:top;padding-top:1px">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td width="28" height="28" align="center" valign="middle" bgcolor="${color}"
            style="background-color:${color};border-radius:14px;font-size:12px;font-weight:800;
                   color:#ffffff;text-align:center;vertical-align:middle;line-height:28px;
                   mso-line-height-rule:exactly;
                   font-family:'Segoe UI',Helvetica,Arial,sans-serif">${n}</td>
        </tr></table>
      </td>
      <td style="vertical-align:top;padding-left:12px">
        <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0a1128;
                   font-family:'Segoe UI',Helvetica,Arial,sans-serif">${esc(title)}</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.55;
                   font-family:'Segoe UI',Helvetica,Arial,sans-serif">${esc(desc)}</p>
      </td>
    </tr></table>
  </td></tr>`
}

function noteBox(html, bg = "#f8fafc", bl = "#e2e8f0", color = "#475569") {
  return `<table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 20px">
    <tr><td bgcolor="${bg}" style="background-color:${bg};border-left:3px solid ${bl};
              border-radius:0 8px 8px 0;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${color};line-height:1.65;
                 font-family:'Segoe UI',Helvetica,Arial,sans-serif">${html}</p>
    </td></tr>
  </table>`
}

function para(html, extra = "") {
  return `<p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.7;
                     font-family:'Segoe UI',Helvetica,Arial,sans-serif${extra ? ";" + extra : ""}">${html}</p>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Master email shell
//
// HEADER: Logo (60px tall) on left — Contact Us button on right. No services
//         text. No divider. Clean premium two-column.
//
// FOOTER: WhatsApp + Instagram only — using <img> with uploaded icon URLs.
//         Globe removed (website link shown as text below instead).
//         No border on social icons — just the image, clean.
//
// DARK MODE: locked to light via meta + :root so clients don't invert colors.
// ─────────────────────────────────────────────────────────────────────────────
function shell({
  title = "", preheader = "", body,
  logoUrl = null,
  whatsappUrl = null, whatsappIconUrl = null,
  instagramUrl = null, instagramIconUrl = null,
}) {
  const year = new Date().getFullYear()

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Amir Nazir" height="60"
            style="display:block;height:60px;width:auto;max-width:260px;border:0;outline:0">`
    : `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="vertical-align:middle">
          <span style="font-size:24px;font-weight:900;color:#0a1128;letter-spacing:-.5px;
                        font-family:'Segoe UI',Helvetica,Arial,sans-serif">AMIR</span><span
               style="font-size:24px;font-weight:900;color:#1a6fa8;
                        font-family:'Segoe UI',Helvetica,Arial,sans-serif"> NAZIR</span>
          <p style="margin:2px 0 0;font-size:9px;color:#94a3b8;letter-spacing:1.5px;
                     text-transform:uppercase;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            Digital Agency
          </p>
        </td>
      </tr></table>`

  // Social icons — only show if uploaded image URL exists, no border, clean img
  const socialCells = [
    ...(whatsappUrl && whatsappIconUrl
      ? [`<td style="padding:0 7px">
          <a href="${esc(whatsappUrl)}" title="WhatsApp" style="text-decoration:none;display:inline-block">
            <img src="${esc(whatsappIconUrl)}" width="30" height="30" alt="WhatsApp"
              style="display:block;width:30px;height:30px;border:0;border-radius:6px">
          </a>
        </td>`]
      : []),
    ...(instagramUrl && instagramIconUrl
      ? [`<td style="padding:0 7px">
          <a href="${esc(instagramUrl)}" title="Instagram" style="text-decoration:none;display:inline-block">
            <img src="${esc(instagramIconUrl)}" width="30" height="30" alt="Instagram"
              style="display:block;width:30px;height:30px;border:0;border-radius:6px">
          </a>
        </td>`]
      : []),
  ].join("")

  const hasSocials = socialCells.length > 0

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(title)}</title>
<style>
:root { color-scheme: light only; supported-color-schemes: light; }
body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; }
img { -ms-interpolation-mode:bicubic; border:0; display:block; outline:none; }
body { margin:0; padding:0; background-color:#eef2f7; }
a { color:#1a6fa8; }
@media only screen and (max-width:600px) {
  .wrap { width:100% !important; max-width:100% !important; }
  .hdr  { padding:18px 22px 16px !important; }
  .bdy  { padding:28px 22px 26px !important; }
  .ftr  { padding:20px 22px 24px !important; }
  .odig { width:34px !important; height:44px !important; font-size:20px !important; line-height:44px !important; }
  .ctab { font-size:12px !important; padding:8px 12px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7">
${preheader ? `<!--[if !mso]><!--><div style="display:none;max-height:0;overflow:hidden;mso-hide:all;line-height:0;font-size:0">${esc(preheader)}&zwnj;&nbsp;&zwnj;&nbsp;</div><!--<![endif]-->` : ""}

<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
  bgcolor="#eef2f7" style="background-color:#eef2f7">
<tr><td align="center" style="padding:36px 16px">

<table class="wrap" width="560" cellpadding="0" cellspacing="0" role="presentation"
  bgcolor="#ffffff" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden">

  <!-- ─── HEADER: logo left · Contact Us button right ─── -->
  <tr>
    <td class="hdr" bgcolor="#ffffff"
      style="background-color:#ffffff;padding:22px 36px 20px;border-bottom:1px solid #edf1f7">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="vertical-align:middle">${logoHtml}</td>
          <td style="vertical-align:middle;text-align:right;padding-left:16px;white-space:nowrap">
            <a href="https://a-mir.com/contact" target="_blank" class="ctab"
              style="display:inline-block;background-color:#1a6fa8;color:#ffffff;
                     font-size:13px;font-weight:700;letter-spacing:.2px;
                     padding:10px 20px;border-radius:8px;text-decoration:none;
                     font-family:'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap">
              Contact Us &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ─── BODY ─── -->
  <tr>
    <td class="bdy" bgcolor="#ffffff"
      style="background-color:#ffffff;padding:38px 44px 34px">
      ${body}
    </td>
  </tr>

  <!-- ─── FOOTER ─── -->
  <tr>
    <td class="ftr" bgcolor="#f8fafc"
      style="background-color:#f8fafc;padding:24px 36px 26px;border-top:1px solid #edf1f7">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">

        ${hasSocials ? `
        <tr><td align="center" style="padding-bottom:16px">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>${socialCells}</tr>
          </table>
        </td></tr>` : ""}

        <tr><td align="center" style="padding-bottom:6px">
          <p style="margin:0;font-size:12px;font-weight:700;color:#1e293b;
                     font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            Building Digital Experiences. Driving Real Results.
          </p>
        </td></tr>

        <tr><td align="center" style="padding-bottom:16px">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td width="44" height="2" bgcolor="#1a6fa8"
              style="background-color:#1a6fa8;border-radius:1px;font-size:0;line-height:0">&nbsp;</td>
          </tr></table>
        </td></tr>

        <tr><td align="center" style="padding-bottom:12px">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="vertical-align:middle;padding-right:6px">${I.mail14}</td>
            <td style="vertical-align:middle">
              <a href="mailto:info@a-mir.com"
                style="font-size:12px;color:#1a6fa8;text-decoration:none;font-weight:600;
                        font-family:'Segoe UI',Helvetica,Arial,sans-serif">info@a-mir.com</a>
            </td>
            <td style="padding:0 14px;vertical-align:middle">
              <span style="display:inline-block;width:1px;height:11px;
                           background-color:#d1d9e3;vertical-align:middle">&nbsp;</span>
            </td>
            <td style="vertical-align:middle;padding-right:6px">${I.globe14}</td>
            <td style="vertical-align:middle">
              <a href="https://a-mir.com"
                style="font-size:12px;color:#1a6fa8;text-decoration:none;font-weight:600;
                        font-family:'Segoe UI',Helvetica,Arial,sans-serif">a-mir.com</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td align="center">
          <p style="margin:0;font-size:11px;color:#94a3b8;
                     font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            &copy; ${year} Amir Nazir. All rights reserved.
          </p>
        </td></tr>

      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP email — emoji icons render in ALL clients including Gmail
// ─────────────────────────────────────────────────────────────────────────────
const OTP_SUBJECTS = {
  email_verify:   "Verify your email — Amir Nazir",
  new_device:     "New device sign-in detected — Amir Nazir",
  password_reset: "Reset your password — Amir Nazir",
}
const OTP_PREHEADERS = {
  email_verify:   "Your 6-digit verification code is inside.",
  new_device:     "Someone signed in from a new device. Confirm it was you.",
  password_reset: "Use this code to reset your password.",
}
const OTP_HEADINGS = {
  email_verify:   "Verify Your Email",
  new_device:     "New Device Detected",
  password_reset: "Reset Your Password",
}
const OTP_SUBS = {
  email_verify:   "Enter the code below to verify your email address and activate your account.",
  new_device:     "A sign-in from a new device was detected. Enter the code below to confirm it was you.",
  password_reset: "We received a request to reset your password. Use the code below to continue.",
}
const OTP_CTA_URLS = {
  email_verify:   "https://a-mir.com/verify-otp",
  new_device:     "https://a-mir.com/verify-otp",
  password_reset: "https://a-mir.com/forgot-password",
}
const OTP_CTA_TEXT = {
  email_verify:   "Verify Email",
  new_device:     "Verify Device",
  password_reset: "Change Password",
}
// Emoji icons — work in Gmail, Outlook, Apple Mail, Samsung Mail, all clients
const OTP_EMOJI  = { email_verify: "📧", new_device: "📱", password_reset: "🔑" }
const OTP_ICON_BG = { email_verify: "#e8f3fc", new_device: "#e8faf2", password_reset: "#fef9ec" }

function renderOtpHtml(user, code, type, es = {}) {
  const body = `
    ${topIcon(OTP_EMOJI[type] || "🔐", OTP_ICON_BG[type] || "#e8f3fc")}
    ${hero(OTP_HEADINGS[type] || "Your One-Time Code", OTP_SUBS[type] || "Use this code to complete your request.")}
    ${otpCard(code)}
    ${btn(OTP_CTA_TEXT[type] || "Open Website", OTP_CTA_URLS[type] || "https://a-mir.com")}
    ${secNote()}
  `
  return shell({ title: OTP_SUBJECTS[type] || "Your code", preheader: OTP_PREHEADERS[type] || "", body, ...es })
}

async function sendOtpEmail(config, user, code, type) {
  try {
    const es = await getEmailSettings(config).catch(() => ({}))
    await sendEmail(config, {
      to: user.email,
      subject: OTP_SUBJECTS[type] || "Your OTP — Amir Nazir",
      text: `Hi ${user.name || "there"}, your code is ${code}. Expires in 10 minutes.`,
      html: renderOtpHtml(user, code, type, es),
    })
  } catch (err) {
    console.error("[mail] OTP FAILED", { to: user.email, type, err: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome email
// ─────────────────────────────────────────────────────────────────────────────
async function sendWelcomeEmail(config, user) {
  try {
    const es = await getEmailSettings(config).catch(() => ({}))
    const features = [
      ["&#128270;", "Browse packages",       "Explore website design, branding, and digital marketing solutions."],
      ["&#128203;", "Place your first order", "Pick a package, submit your brief, and we&rsquo;ll get started."],
      ["&#128202;", "Track live progress",    "Follow milestones and get updates right from your dashboard."],
      ["&#128172;", "Message us anytime",     "Have questions? Chat directly with our team at any time."],
    ]
    const featureRows = features.map(([icon, title, desc]) => `
      <tr><td style="padding:11px 0;border-bottom:1px solid #f0f4f8">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>
          <td width="36" style="vertical-align:middle;font-size:20px;text-align:center">${icon}</td>
          <td style="vertical-align:middle;padding-left:14px">
            <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0a1128;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif">${title}</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif">${desc}</p>
          </td>
        </tr></table>
      </td></tr>`).join("")
    const body = `
      ${topIcon("🎉", "#e8faf2")}
      ${hero(`Welcome, ${esc(user.name || "there")}!`, "Your account is ready. We&rsquo;re excited to work with you.")}
      ${sLabel("What you can do now")}
      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 28px">
        ${featureRows}
      </table>
      ${btn("Go to Dashboard", "https://a-mir.com/dashboard")}
      ${para(`Questions? <a href="https://a-mir.com/contact" style="color:#1a6fa8;text-decoration:none;font-weight:600">Contact us</a> anytime.`, "font-size:13px;text-align:center;color:#94a3b8")}
    `
    await sendEmail(config, {
      to: user.email,
      subject: "Welcome to Amir Nazir — your account is ready",
      text: `Hi ${user.name || "there"}, welcome! Your account is verified. Visit https://a-mir.com/dashboard`,
      html: shell({ title: "Welcome!", preheader: "Your account is verified and ready.", body, ...es }),
    })
  } catch (err) {
    console.error("[mail] Welcome FAILED", { to: user.email, err: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Order confirmation — to CLIENT
// ─────────────────────────────────────────────────────────────────────────────
async function sendOrderConfirmationEmail(config, order, user) {
  try {
    const es = await getEmailSettings(config).catch(() => ({}))
    const steps = [
      ["1", "#1a6fa8", "Upload payment proof",  "Screenshot your payment and upload it in your dashboard."],
      ["2", "#7c3aed", "Team review (24 hrs)",  "Our team verifies your payment and approves the order."],
      ["3", "#0891b2", "Project kickoff",        "Work begins with a brief review and timeline confirmation."],
      ["4", "#059669", "Live progress tracking", "Follow milestones and get updates as work advances."],
    ]
    const body = `
      ${topIcon("✅", "#e8faf2")}
      ${hero("Order Confirmed!", `Hi <strong>${esc(user.name || "there")}</strong> &mdash; we&rsquo;ve received your order and will review it shortly.`)}
      ${sLabel("Order Summary")}
      ${iTable(`
        ${iRow("Order #",  `<strong style="font-family:'Courier New',monospace;color:#0a1128">${esc(order.order_number)}</strong>`)}
        ${iRow("Package",  esc(order.package?.name || order.package_name || "Custom"))}
        ${iRow("Amount",   `<strong style="font-size:15px;color:#1a6fa8">$${Number(order.total_price || 0).toFixed(2)}</strong>`)}
        ${iRow("Status",   pill("Pending Approval", "#d97706"))}
      `)}
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0a1128;
                 font-family:'Segoe UI',Helvetica,Arial,sans-serif">What happens next?</p>
      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 28px">
        ${steps.map(([n, c, t, d]) => step(n, c, t, d)).join("")}
      </table>
      ${btn("View My Order", "https://a-mir.com/dashboard/orders")}
    `
    await sendEmail(config, {
      to: user.email,
      subject: `Order #${order.order_number} confirmed — Amir Nazir`,
      text: `Hi ${user.name || "there"}, order #${order.order_number} received.`,
      html: shell({ title: "Order Confirmed", preheader: `Order #${order.order_number} received.`, body, ...es }),
    })
  } catch (err) {
    console.error("[mail] Order confirmation FAILED", { order: order?.order_number, err: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// New order alert — to ADMIN
// ─────────────────────────────────────────────────────────────────────────────
async function sendAdminNewOrderEmail(config, order, user) {
  try {
    const adminEmail = await getAdminEmail(config)
    if (!adminEmail) return
    const es = await getEmailSettings(config).catch(() => ({}))
    const body = `
      ${topIcon("🔔", "#fffbeb")}
      ${hero("New Order Received", "A new order is waiting for your review in the admin panel.")}
      ${sLabel("Order Details")}
      ${iTable(`
        ${iRow("Order #", `<strong style="font-family:'Courier New',monospace;color:#0a1128">${esc(order.order_number)}</strong>`)}
        ${iRow("Client",  esc(user.name || "Unknown"))}
        ${iRow("Email",   `<a href="mailto:${esc(user.email || "")}" style="color:#1a6fa8;text-decoration:none">${esc(user.email || "")}</a>`)}
        ${iRow("Package", esc(order.package?.name || order.package_name || "Custom"))}
        ${iRow("Total",   `<strong style="font-size:15px;color:#1a6fa8">$${Number(order.total_price || 0).toFixed(2)}</strong>`)}
      `)}
      ${btn("Review in Admin Panel", "https://a-mir.com/admin/orders")}
    `
    await sendEmail(config, {
      to: adminEmail,
      subject: `New order #${order.order_number} from ${user.name || user.email}`,
      text: `New order #${order.order_number} from ${user.name || user.email}.`,
      html: shell({ title: "New Order", preheader: `#${order.order_number} waiting for review.`, body, ...es }),
    })
  } catch (err) {
    console.error("[mail] Admin new order FAILED", { order: order?.order_number, err: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Order status update — to CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  approved:         { label: "Approved",         color: "#1a6fa8", emoji: "✅", iconBg: "#e8faf2", msg: "Great news! Your order has been approved and work is about to begin." },
  in_progress:      { label: "In Progress",      color: "#7c3aed", emoji: "🔄", iconBg: "#f5f3ff", msg: "Your project is actively being worked on. We&rsquo;ll keep you updated on milestones." },
  revision:         { label: "Revision",         color: "#d97706", emoji: "✏️", iconBg: "#fffbeb", msg: "A revision has been requested. Please check the notes in your dashboard." },
  completed:        { label: "Completed",        color: "#059669", emoji: "🎉", iconBg: "#e8faf2", msg: "Your project is complete! Please review the deliverables in your dashboard." },
  cancelled:        { label: "Cancelled",        color: "#dc2626", emoji: "❌", iconBg: "#fef2f2", msg: "Your order has been cancelled. Contact us if you have any questions." },
  pending_approval: { label: "Pending Approval", color: "#d97706", emoji: "⏳", iconBg: "#fffbeb", msg: "Your order is pending approval. We&rsquo;ll review it shortly." },
}

async function sendOrderStatusEmail(config, order, user) {
  try {
    const sc = STATUS_CONFIG[order.status] || {
      label: order.status, color: "#64748b", emoji: "📋",
      iconBg: "#f8fafc", msg: "Your order status has been updated.",
    }
    const es = await getEmailSettings(config).catch(() => ({}))
    const body = `
      ${topIcon(sc.emoji, sc.iconBg)}
      ${hero(`Order ${sc.label}`, `Hi <strong>${esc(user.name || "there")}</strong> &mdash; the status of your order has been updated.`)}
      ${sLabel("Order Details")}
      ${iTable(`
        ${iRow("Order #",    `<strong style="font-family:'Courier New',monospace;color:#0a1128">${esc(order.order_number)}</strong>`)}
        ${iRow("New Status", pill(sc.label, sc.color))}
        ${order.admin_notes ? iRow("Note", `<em style="color:#475569">${esc(order.admin_notes)}</em>`) : ""}
      `)}
      ${para(sc.msg)}
      ${btn("View Order Details", "https://a-mir.com/dashboard/orders")}
    `
    await sendEmail(config, {
      to: user.email,
      subject: `Order #${order.order_number} — ${sc.label}`,
      text: `Hi ${user.name || "there"}, your order #${order.order_number} is now ${sc.label}.`,
      html: shell({ title: `Order ${sc.label}`, preheader: `Your order is now ${sc.label}.`, body, ...es }),
    })
  } catch (err) {
    console.error("[mail] Order status FAILED", { order: order?.order_number, err: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment status — to CLIENT
// ─────────────────────────────────────────────────────────────────────────────
async function sendPaymentStatusEmail(config, order, user, verified, reason = "") {
  try {
    const es = await getEmailSettings(config).catch(() => ({}))
    const body = verified
      ? `
          ${topIcon("✅", "#e8faf2")}
          ${hero("Payment Received!", `We&rsquo;ve confirmed your payment for order <strong>#${esc(order.order_number)}</strong>.`)}
          ${para("Your order will now be reviewed and approved. You&rsquo;ll receive another update shortly.")}
          ${btn("View Order", "https://a-mir.com/dashboard/orders")}
        `
      : `
          ${topIcon("⚠️", "#fef2f2")}
          ${hero("Payment Issue", `We couldn&rsquo;t verify your payment for order <strong>#${esc(order.order_number)}</strong>.`)}
          ${reason ? noteBox(`<strong>Reason:</strong> ${esc(reason)}`, "#fef2f2", "#dc2626", "#991b1b") : ""}
          ${para("Please upload a new payment screenshot or contact us if you need assistance.")}
          ${btn("Update Payment", "https://a-mir.com/dashboard/orders", "#dc2626")}
        `
    await sendEmail(config, {
      to: user.email,
      subject: verified ? `Payment confirmed — Order #${order.order_number}` : `Payment issue — Order #${order.order_number}`,
      text: verified ? `Payment for #${order.order_number} confirmed.` : `Could not verify payment for #${order.order_number}.`,
      html: shell({
        title: verified ? "Payment Confirmed" : "Payment Issue",
        preheader: verified ? "Your payment has been received." : "Action needed on your payment.",
        body, ...es,
      }),
    })
  } catch (err) {
    console.error("[mail] Payment status FAILED", { order: order?.order_number, err: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice email — to CLIENT
// ─────────────────────────────────────────────────────────────────────────────
async function sendInvoiceEmail(config, invoice, toEmail) {
  try {
    const es = await getEmailSettings(config).catch(() => ({}))
    const user = invoice.user || {}
    const isPaid    = invoice.status === "paid"
    const isOverdue = invoice.status === "overdue"
    const color  = isPaid ? "#059669" : isOverdue ? "#dc2626" : "#1a6fa8"
    const emoji  = isPaid ? "✅"      : isOverdue ? "⚠️"      : "🧾"
    const iconBg = isPaid ? "#e8faf2" : isOverdue ? "#fef2f2" : "#e8f3fc"
    const statusLabel = (invoice.status || "draft").charAt(0).toUpperCase() + (invoice.status || "draft").slice(1)
    const body = `
      ${topIcon(emoji, iconBg)}
      ${hero(`Invoice #${esc(invoice.invoice_number)}`, `Hi <strong>${esc(user.name || "there")}</strong> &mdash; please find your invoice details below.`)}
      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:0 0 24px">
        <tr><td align="center">
          <p style="margin:0 0 8px;font-size:36px;font-weight:800;color:${color};letter-spacing:-1px;
                     line-height:1;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            $${Number(invoice.total || 0).toFixed(2)}
          </p>
          ${pill(statusLabel, color)}
        </td></tr>
      </table>
      ${sLabel("Invoice Details")}
      ${iTable(`
        ${iRow("Invoice #", `<strong style="font-family:'Courier New',monospace;color:#0a1128">${esc(invoice.invoice_number)}</strong>`)}
        ${iRow("Issued",    fmt(invoice.created_at))}
        ${invoice.due_date ? iRow("Due Date", fmt(invoice.due_date)) : ""}
        ${invoice.paid_at  ? iRow("Paid On",  fmt(invoice.paid_at))  : ""}
        ${iRow("Total",     `<strong style="font-size:15px;color:${color}">$${Number(invoice.total || 0).toFixed(2)}</strong>`)}
      `)}
      ${invoice.notes ? noteBox(`<strong>Notes:</strong> ${esc(invoice.notes)}`) : ""}
      ${btn("Download Invoice PDF", "https://a-mir.com/dashboard/invoices")}
      ${para("Questions about this invoice? Reply to this email.", "font-size:13px;text-align:center;color:#94a3b8")}
    `
    await sendEmail(config, {
      to: toEmail,
      subject: `Invoice #${invoice.invoice_number} from Amir Nazir`,
      text: `Invoice #${invoice.invoice_number} — Total: $${Number(invoice.total || 0).toFixed(2)}.`,
      html: shell({
        title: `Invoice #${invoice.invoice_number}`,
        preheader: `Invoice total: $${Number(invoice.total || 0).toFixed(2)}`,
        body, ...es,
      }),
    })
  } catch (err) {
    console.error("[mail] Invoice FAILED", { invoice: invoice?.invoice_number, err: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core send — Resend first, SMTP fallback
// ─────────────────────────────────────────────────────────────────────────────
function sendViaResend(apiKey, { from, to, subject, html, text, replyTo }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ from, to, subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) })
    const req = https.request({
      hostname: "api.resend.com", path: "/emails", method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    }, res => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data))
        else reject(new Error(`Resend ${res.statusCode}: ${data}`))
      })
    })
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Resend timeout")) })
    req.on("error", reject)
    req.write(payload)
    req.end()
  })
}

async function getResendApiKey(config) {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY
  const rows = await query(config,
    `SELECT "value" FROM settings WHERE "key" = 'resend_api_key' LIMIT 1`
  ).catch(() => [])
  return rows[0]?.value || ""
}

async function sendEmail(config, { to, subject, html, text, replyTo }) {
  const smtp = await getSmtpSettings(config).catch(() => ({}))
  const fromAddress = smtp.fromAddress || process.env.MAIL_FROM_ADDRESS || "info@a-mir.com"
  const fromName    = smtp.fromName    || process.env.MAIL_FROM_NAME    || "Amir Nazir"
  const from = `${fromName} <${fromAddress}>`

  const resendKey = await getResendApiKey(config).catch(() => "")
  if (resendKey) {
    try {
      const result = await sendViaResend(resendKey, { from, to, subject, html, text, replyTo })
      console.log("[mail] Resend OK →", to, subject, "id:", result.id)
      return { via: "resend", id: result.id }
    } catch (err) {
      console.error("[mail] Resend FAILED, trying SMTP →", err.message)
    }
  }

  if (smtp.host) {
    const transporter = nodemailer.createTransport(buildSmtpConfig(smtp))
    const info = await transporter.sendMail({ from, to, subject, html, text, ...(replyTo ? { replyTo } : {}) })
    console.log("[mail] SMTP OK →", to, subject, "id:", info.messageId)
    return { via: "smtp", messageId: info.messageId }
  }

  console.warn("[mail] Skipped — no provider configured", { to, subject })
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// SMTP helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildSmtpConfig(smtp) {
  const isSSL = smtp.encryption === "ssl" || smtp.encryption === "smtps" || smtp.port === 465
  return {
    host: smtp.host, port: smtp.port, secure: isSSL, requireTLS: !isSSL,
    auth: smtp.username || smtp.password ? { user: smtp.username, pass: smtp.password } : undefined,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  }
}

async function getSmtpSettings(config) {
  const rows = await query(
    config,
    `SELECT "key","value" FROM settings WHERE "key" IN (${SMTP_KEYS.map((_, i) => `:key${i}`).join(", ")})`,
    Object.fromEntries(SMTP_KEYS.map((k, i) => [`key${i}`, k]))
  ).catch(() => [])
  const s = rows.reduce((acc, r) => { acc[r.key] = r.value; return acc }, {})
  return {
    enabled:     (s.smtp_enabled || process.env.SMTP_ENABLED || "0") === "1",
    host:        s.smtp_host        || process.env.MAIL_HOST        || "",
    port:        Number(s.smtp_port || process.env.MAIL_PORT        || 587),
    username:    s.smtp_username    || process.env.MAIL_USERNAME    || "",
    password:    s.smtp_password    || process.env.MAIL_PASSWORD    || "",
    encryption:  String(s.smtp_encryption || process.env.MAIL_ENCRYPTION || "tls").toLowerCase(),
    fromAddress: s.smtp_from_address || process.env.MAIL_FROM_ADDRESS || "",
    fromName:    s.smtp_from_name    || process.env.MAIL_FROM_NAME    || "Amir Nazir",
  }
}

async function getSmtpTransporter(config) {
  const smtp = await getSmtpSettings(config)
  if (!smtp.enabled || !smtp.host) return null
  return nodemailer.createTransport(buildSmtpConfig(smtp))
}

async function getAdminEmail(config) {
  const rows = await query(config,
    `SELECT "value" FROM settings WHERE "key" IN ('admin_email','contact_email') ORDER BY "key" LIMIT 2`
  ).catch(() => [])
  return rows[0]?.value || process.env.ADMIN_EMAIL || null
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendOrderStatusEmail,
  sendPaymentStatusEmail,
  sendInvoiceEmail,
  getSmtpSettings,
  getSmtpTransporter,
  getResendApiKey,
  getLogoUrl,
}
