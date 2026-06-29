function sendJson(res, data, statusCode = 200) {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  })
  res.end(body)
}

function sendNotFound(res, message) {
  sendJson(res, { message }, 404)
}

module.exports = { sendJson, sendNotFound }
