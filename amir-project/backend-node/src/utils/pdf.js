function esc(v) {
  return String(v || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function money(v) {
  return "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const STATUS_STYLES = {
  paid:    { bg: "#f0fdf4", border: "#86efac", color: "#15803d", badgeBg: "#dcfce7", label: "PAID",    icon: "&#10003;" },
  sent:    { bg: "#eff6ff", border: "#93c5fd", color: "#1d4ed8", badgeBg: "#dbeafe", label: "SENT",    icon: "&#128203;" },
  draft:   { bg: "#f8fafc", border: "#cbd5e1", color: "#475569", badgeBg: "#f1f5f9", label: "DRAFT",   icon: "&#9998;" },
  overdue: { bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", badgeBg: "#fee2e2", label: "OVERDUE", icon: "&#9888;" },
}

function logoImg(logoUrl, h, maxW) {
  return '<img src="' + logoUrl + '" alt="Amir Nazir" height="' + h + '" style="display:block;height:' + h + 'px;width:auto;max-width:' + maxW + 'px">'
}

function logoImgDark(logoUrl, h, maxW) {
  return '<img src="' + logoUrl + '" alt="Amir Nazir" height="' + h + '" style="display:block;height:' + h + 'px;width:auto;max-width:' + maxW + 'px;filter:brightness(0) invert(1)">'
}

function logoText() {
  return '<span style="font-size:26px;font-weight:800;letter-spacing:-.5px;color:#0f172a">Amir <span style="color:#2563eb">Nazir</span></span>'
}

function buildInvoiceHtml(invoice, logoUrl) {
  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : []
  const user  = invoice.user  || {}
  const order = invoice.order || {}
  const st    = STATUS_STYLES[invoice.status] || STATUS_STYLES.draft

  var rows = lineItems.map(function(item, idx) {
    var label = esc(item.description || item.label || "")
    var qty   = Number(item.quantity || item.qty || 1)
    var unit  = Number(item.unit_price || 0)
    var total = qty * unit
    var rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc"
    return "\n        <tr style=\"background:" + rowBg + "\">" +
      "<td class=\"td-num\" style=\"color:#94a3b8;width:40px\">" + (idx + 1) + "</td>" +
      "<td class=\"td-desc\">" + label + "</td>" +
      "<td class=\"td-num\">" + qty + "</td>" +
      "<td class=\"td-num\">" + money(unit) + "</td>" +
      "<td class=\"td-num td-total\">" + money(total) + "</td></tr>"
  }).join("")

  var headerLogo = logoUrl ? logoImg(logoUrl, 72, 320) : logoText()

  return "<!DOCTYPE html>\n" +
"<html lang=\"en\">\n" +
"<head>\n" +
"<meta charset=\"UTF-8\">\n" +
"<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n" +
"<title>Invoice " + esc(invoice.invoice_number) + "</title>\n" +
"<style>\n" +
"  *{margin:0;padding:0;box-sizing:border-box}\n" +
"  html{font-size:14px}\n" +
"  body{\n" +
"    font-family:'Segoe UI',Arial,sans-serif;\n" +
"    background:#f1f5f9;\n" +
"    color:#1e293b;\n" +
"    min-height:100vh;\n" +
"    display:flex;\n" +
"    flex-direction:column;\n" +
"    align-items:center;\n" +
"    padding:36px 16px;\n" +
"  }\n" +
"  .print-bar{\n" +
"    width:100%;max-width:820px;\n" +
"    display:flex;align-items:center;justify-content:space-between;\n" +
"    margin-bottom:20px;\n" +
"  }\n" +
"  .print-label{font-size:14px;font-weight:600;color:#334155}\n" +
"  .btn-print{\n" +
"    display:inline-flex;align-items:center;gap:8px;\n" +
"    background:#2563eb;color:#fff;border:none;\n" +
"    padding:10px 22px;border-radius:10px;\n" +
"    font-size:14px;font-weight:700;cursor:pointer;\n" +
"    transition:background .15s;\n" +
"  }\n" +
"  .btn-print:hover{background:#1d4ed8}\n" +
"  .btn-print svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n" +
"  .card{\n" +
"    width:100%;max-width:820px;\n" +
"    background:#fff;\n" +
"    border-radius:20px;\n" +
"    overflow:hidden;\n" +
"    box-shadow:0 8px 40px rgba(0,0,0,.10);\n" +
"  }\n" +
"\n" +
"  /* Header — white with subtle border */\n" +
"  .header{\n" +
"    padding:32px 44px;\n" +
"    display:flex;\n" +
"    justify-content:space-between;\n" +
"    align-items:flex-start;\n" +
"    border-bottom:1px solid #e2e8f0;\n" +
"  }\n" +
"  .header-brand{display:flex;flex-direction:column;gap:6px}\n" +
"  .brand-sub{font-size:12px;color:#94a3b8;margin-top:6px}\n" +
"  .brand-site{font-size:12px;color:#2563eb;text-decoration:none;font-weight:600}\n" +
"  .inv-heading{text-align:right}\n" +
"  .inv-heading h1{font-size:32px;font-weight:800;color:#0f172a;letter-spacing:-1px;text-transform:uppercase}\n" +
"  .inv-number{font-size:15px;color:#64748b;margin-top:4px;font-family:'Courier New',monospace;font-weight:600}\n" +
"  .inv-date{font-size:13px;color:#94a3b8;margin-top:4px}\n" +
"  .status-pill{\n" +
"    display:inline-block;margin-top:10px;\n" +
"    padding:5px 16px;border-radius:999px;\n" +
"    font-size:11px;font-weight:800;letter-spacing:.8px;\n" +
"    background:" + st.badgeBg + ";color:" + st.color + ";\n" +
"    border:1px solid " + st.border + ";\n" +
"  }\n" +
"\n" +
"  /* Accent bar */\n" +
"  .accent-bar{height:4px;background:linear-gradient(90deg,#2563eb,#6366f1)}\n" +
"\n" +
"  /* Meta section */\n" +
"  .meta{\n" +
"    display:grid;grid-template-columns:1fr 1fr;\n" +
"    gap:0;padding:32px 44px;\n" +
"    border-bottom:1px solid #f1f5f9;\n" +
"  }\n" +
"  .meta-label{\n" +
"    font-size:9px;font-weight:700;text-transform:uppercase;\n" +
"    letter-spacing:1.5px;color:#94a3b8;margin-bottom:10px;\n" +
"  }\n" +
"  .meta-name{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px}\n" +
"  .meta-detail{font-size:13px;color:#64748b;line-height:1.8}\n" +
"  .meta-right{border-left:1px solid #f1f5f9;padding-left:36px}\n" +
"  .meta-grid{display:grid;grid-template-columns:auto 1fr;gap:4px 20px}\n" +
"  .meta-key{font-size:12px;color:#94a3b8;font-weight:500;line-height:1.8}\n" +
"  .meta-val{font-size:12px;color:#0f172a;font-weight:600;line-height:1.8}\n" +
"\n" +
"  /* Table */\n" +
"  .table-wrap{padding:28px 44px}\n" +
"  table{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden}\n" +
"  thead tr{background:#f8fafc}\n" +
"  th{\n" +
"    padding:11px 14px;\n" +
"    font-size:9px;text-transform:uppercase;letter-spacing:1px;\n" +
"    color:#94a3b8;font-weight:700;\n" +
"    border-bottom:2px solid #e2e8f0;\n" +
"    text-align:left;\n" +
"  }\n" +
"  th.th-num{text-align:right}\n" +
"  th.th-idx{text-align:center;width:40px}\n" +
"  .td-desc{padding:12px 14px;color:#334155;font-size:13.5px;border-bottom:1px solid #f1f5f9}\n" +
"  .td-num{padding:12px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#334155;font-size:13.5px}\n" +
"  .td-total{font-weight:700;color:#0f172a}\n" +
"  tbody tr:last-child .td-desc,\n" +
"  tbody tr:last-child .td-num{border-bottom:none}\n" +
"\n" +
"  /* Totals */\n" +
"  .totals{display:flex;justify-content:flex-end;padding:0 44px 32px}\n" +
"  .totals-box{width:280px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}\n" +
"  .total-row{\n" +
"    display:flex;justify-content:space-between;align-items:center;\n" +
"    padding:10px 18px;border-bottom:1px solid #f1f5f9;\n" +
"    font-size:13px;\n" +
"  }\n" +
"  .total-row .lbl{color:#64748b;font-weight:500}\n" +
"  .total-row .val{color:#0f172a;font-weight:600}\n" +
"  .total-grand{\n" +
"    display:flex;justify-content:space-between;align-items:center;\n" +
"    padding:14px 18px;\n" +
"    background:#f8fafc;\n" +
"  }\n" +
"  .total-grand .lbl{font-size:14px;font-weight:800;color:#0f172a}\n" +
"  .total-grand .val{font-size:22px;font-weight:800;color:#2563eb}\n" +
"\n" +
"  /* Bottom section: payment status + notes */\n" +
"  .bottom{\n" +
"    display:grid;grid-template-columns:1fr 1fr;\n" +
"    gap:20px;\n" +
"    margin:0 44px 36px;\n" +
"  }\n" +
"  .payment-box{\n" +
"    border:2px solid " + st.border + ";\n" +
"    border-radius:14px;\n" +
"    padding:22px;\n" +
"    background:" + st.bg + ";\n" +
"  }\n" +
"  .payment-icon{font-size:28px;margin-bottom:10px}\n" +
"  .payment-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:" + st.color + ";margin-bottom:6px}\n" +
"  .payment-status{font-size:18px;font-weight:800;color:" + st.color + "}\n" +
"  .payment-detail{font-size:12px;color:#64748b;margin-top:6px;line-height:1.6}\n" +
"  .notes-box{\n" +
"    border:1px solid #e2e8f0;\n" +
"    border-radius:14px;\n" +
"    padding:22px;\n" +
"    background:#f8fafc;\n" +
"  }\n" +
"  .notes-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:10px}\n" +
"  .notes-content{font-size:13px;color:#475569;line-height:1.7}\n" +
"\n" +
"  /* Footer */\n" +
"  .footer{\n" +
"    padding:20px 44px;\n" +
"    border-top:1px solid #f1f5f9;\n" +
"    display:flex;justify-content:space-between;align-items:center;\n" +
"  }\n" +
"  .footer-contact{display:flex;gap:24px}\n" +
"  .footer-item{display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b}\n" +
"  .footer-item a{color:#2563eb;text-decoration:none}\n" +
"  .footer-copy{font-size:11px;color:#cbd5e1}\n" +
"\n" +
"  @media print{\n" +
"    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}\n" +
"    body{background:#fff;padding:0;display:block}\n" +
"    .print-bar{display:none}\n" +
"    .card{box-shadow:none;border-radius:0;max-width:100%;width:100%}\n" +
"  }\n" +
"  @page{margin:0;size:A4}\n" +
"</style>\n" +
"</head>\n" +
"<body>\n" +
"\n" +
"<!-- Print bar (hidden on print) -->\n" +
"<div class=\"print-bar\">\n" +
"  <span class=\"print-label\">Invoice " + esc(invoice.invoice_number) + "</span>\n" +
"  <button class=\"btn-print\" onclick=\"window.print()\">\n" +
"    <svg viewBox=\"0 0 24 24\"><polyline points=\"6 9 6 2 18 2 18 9\"/><path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\"/><rect x=\"6\" y=\"14\" width=\"12\" height=\"8\"/></svg>\n" +
"    Save as PDF\n" +
"  </button>\n" +
"</div>\n" +
"\n" +
"<div class=\"card\">\n" +
"\n" +
"  <!-- Header -->\n" +
"  <div class=\"header\">\n" +
"    <div class=\"header-brand\">\n" +
"      " + headerLogo + "\n" +
"      <div class=\"brand-sub\">Digital Services Platform</div>\n" +
"      <a href=\"https://a-mir.com\" class=\"brand-site\">a-mir.com</a>\n" +
"    </div>\n" +
"    <div class=\"inv-heading\">\n" +
"      <h1>Invoice</h1>\n" +
"      <div class=\"inv-number\">#" + esc(invoice.invoice_number) + "</div>\n" +
"      <div class=\"inv-date\">Issued " + formatDate(invoice.created_at) + "</div>\n" +
"      <span class=\"status-pill\">" + st.icon + " " + st.label + "</span>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  <!-- Gradient accent bar -->\n" +
"  <div class=\"accent-bar\"></div>\n" +
"\n" +
"  <!-- Meta -->\n" +
"  <div class=\"meta\">\n" +
"    <div class=\"meta-left\">\n" +
"      <div class=\"meta-label\">Billed To</div>\n" +
"      <div class=\"meta-name\">" + esc(user.name || "—") + "</div>\n" +
"      <div class=\"meta-detail\">" + esc(user.email || "") + "</div>\n" +
(user.phone ? "      <div class=\"meta-detail\">" + esc(user.phone) + "</div>\n" : "") +
"    </div>\n" +
"    <div class=\"meta-right\">\n" +
"      <div class=\"meta-label\">Invoice Details</div>\n" +
"      <div class=\"meta-grid\">\n" +
(order.order_number ? "        <span class=\"meta-key\">Project</span><span class=\"meta-val\">#" + esc(order.order_number) + "</span>\n" : "") +
(invoice.due_date   ? "        <span class=\"meta-key\">Due Date</span><span class=\"meta-val\">" + formatDate(invoice.due_date) + "</span>\n" : "") +
(invoice.paid_at    ? "        <span class=\"meta-key\">Paid On</span><span class=\"meta-val\">" + formatDate(invoice.paid_at) + "</span>\n" : "") +
"        <span class=\"meta-key\">Currency</span><span class=\"meta-val\">USD</span>\n" +
"        <span class=\"meta-key\">Payment Terms</span><span class=\"meta-val\">Due on receipt</span>\n" +
"      </div>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  <!-- Line items -->\n" +
"  <div class=\"table-wrap\">\n" +
"    <table>\n" +
"      <thead>\n" +
"        <tr>\n" +
"          <th class=\"th-idx\">#</th>\n" +
"          <th>Service / Description</th>\n" +
"          <th class=\"th-num\">Qty</th>\n" +
"          <th class=\"th-num\">Unit Price</th>\n" +
"          <th class=\"th-num\">Amount</th>\n" +
"        </tr>\n" +
"      </thead>\n" +
"      <tbody>\n" +
(rows || "        <tr><td class=\"td-num\" style=\"text-align:center;color:#94a3b8;padding:24px\" colspan=\"5\">No line items</td></tr>") +
"      </tbody>\n" +
"    </table>\n" +
"  </div>\n" +
"\n" +
"  <!-- Totals -->\n" +
"  <div class=\"totals\">\n" +
"    <div class=\"totals-box\">\n" +
"      <div class=\"total-row\"><span class=\"lbl\">Subtotal</span><span class=\"val\">" + money(invoice.subtotal) + "</span></div>\n" +
(Number(invoice.tax_amount) > 0 ? "      <div class=\"total-row\"><span class=\"lbl\">Tax (" + Number(invoice.tax_rate || 0).toFixed(1) + "%)</span><span class=\"val\">" + money(invoice.tax_amount) + "</span></div>\n" : "") +
(Number(invoice.discount) > 0   ? "      <div class=\"total-row\"><span class=\"lbl\">Discount</span><span class=\"val\">&minus;" + money(invoice.discount) + "</span></div>\n" : "") +
"      <div class=\"total-grand\"><span class=\"lbl\">Total Due</span><span class=\"val\">" + money(invoice.total) + "</span></div>\n" +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  <!-- Payment status + Notes -->\n" +
"  <div class=\"bottom\">\n" +
"    <div class=\"payment-box\">\n" +
"      <div class=\"payment-icon\">" + st.icon + "</div>\n" +
"      <div class=\"payment-title\">Payment Status</div>\n" +
"      <div class=\"payment-status\">" + st.label + "</div>\n" +
(invoice.paid_at
  ? "      <div class=\"payment-detail\">Paid on " + formatDate(invoice.paid_at) + "</div>\n"
  : invoice.due_date
    ? "      <div class=\"payment-detail\">Due by " + formatDate(invoice.due_date) + "</div>\n"
    : "      <div class=\"payment-detail\">Please pay by the due date.</div>\n") +
"    </div>\n" +
"    <div class=\"notes-box\">\n" +
"      <div class=\"notes-title\">Notes &amp; Terms</div>\n" +
(invoice.notes
  ? "      <div class=\"notes-content\">" + esc(invoice.notes) + "</div>\n"
  : "      <div class=\"notes-content\" style=\"color:#cbd5e1\">No notes for this invoice.</div>\n") +
"    </div>\n" +
"  </div>\n" +
"\n" +
"  <!-- Footer -->\n" +
"  <div class=\"footer\">\n" +
"    <div class=\"footer-contact\">\n" +
"      <div class=\"footer-item\">&#128231; <a href=\"mailto:info@a-mir.com\">info@a-mir.com</a></div>\n" +
"      <div class=\"footer-item\">&#127760; <a href=\"https://a-mir.com\">a-mir.com</a></div>\n" +
"    </div>\n" +
"    <div class=\"footer-copy\">Thank you for your business &mdash; &copy; " + new Date().getFullYear() + " Amir Nazir</div>\n" +
"  </div>\n" +
"\n" +
"</div>\n" +
"</body>\n" +
"</html>"
}

module.exports = { buildInvoiceHtml }
