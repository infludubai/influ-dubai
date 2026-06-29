const { activePaymentMethods } = require("../repositories/paymentMethodsRepository")
const { sendJson } = require("../utils/http")

function paymentMethodsRouter(req, res, url, config) {
  if (req.method !== "GET") return false
  if (url.pathname !== `${config.apiPrefix}/checkout/payment-methods`) return false

  activePaymentMethods(config)
    .then((methods) => sendJson(res, { data: methods }))
    .catch((error) => {
      console.error("[node-api] Failed to load payment methods", error)
      sendJson(res, { message: "Failed to load payment methods." }, 500)
    })

  return true
}

module.exports = { paymentMethodsRouter }
