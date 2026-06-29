import { useEffect } from "react"
import { publicApi } from "@/api/public"

const injectedIds = new Set<string>()

function injectHtml(id: string, html: string, target: HTMLElement) {
  if (!html.trim() || injectedIds.has(id)) return
  const wrapper = document.createElement("div")
  wrapper.innerHTML = html
  Array.from(wrapper.childNodes).forEach((node) => {
    if (node.nodeName.toLowerCase() === "script") {
      const source = node as HTMLScriptElement
      const script = document.createElement("script")
      Array.from(source.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value))
      script.text = source.text
      target.appendChild(script)
    } else {
      target.appendChild(node)
    }
  })
  injectedIds.add(id)
}

export default function PublicIntegrations() {
  useEffect(() => {
    publicApi.settings().then((response) => {
      const settings = response.data.data || {}

      if (settings.google_adsense_client && !injectedIds.has("adsense")) {
        const script = document.createElement("script")
        script.async = true
        script.crossOrigin = "anonymous"
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.google_adsense_client}`
        document.head.appendChild(script)
        injectedIds.add("adsense")
      }

      if (settings.google_site_verification && !injectedIds.has("google-site-verification")) {
        const meta = document.createElement("meta")
        meta.name = "google-site-verification"
        meta.content = settings.google_site_verification
        document.head.appendChild(meta)
        injectedIds.add("google-site-verification")
      }

      injectHtml("google-site-verification-script", settings.google_site_verification_script || "", document.head)

      if (settings.google_tag_manager_id && !injectedIds.has("gtm")) {
        const script = document.createElement("script")
        script.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.google_tag_manager_id}');`
        document.head.appendChild(script)

        const noscript = document.createElement("noscript")
        noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${settings.google_tag_manager_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
        document.body.prepend(noscript)
        injectedIds.add("gtm")
      }

      injectHtml("custom-head", settings.custom_head_scripts || "", document.head)
      injectHtml("custom-body", settings.custom_body_scripts || "", document.body)
    }).catch(() => {})
  }, [])

  return null
}
