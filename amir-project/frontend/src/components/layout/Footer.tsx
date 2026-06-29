import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, Mail } from "lucide-react"
import { publicApi } from "@/api/public"
import { EditableImage, EditableSection, EditableText, useLiveEditor } from "@/components/live-editor/LiveReactEditor"
import EditableSocialLinks from "@/components/shared/EditableSocialLinks"
import { assetUrl } from "@/utils/assets"

const fallbackServices = [
  "Web Design", "Web Development", "E-Commerce", "SEO Services",
  "Digital Marketing", "Branding & Logo", "UI/UX Design", "Website Maintenance",
]

const fallbackQuickLinks = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/services" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
]

const DEFAULT_LOGO_DARK = "/brand/amirnazir-logo-dark.png"
const DEFAULT_LOGO_LIGHT = "/brand/amirnazir-logo-light.png"

function logoImageClass(onDark: boolean) {
  return `h-full w-full object-contain ${onDark ? "" : "[mix-blend-mode:multiply]"}`
}

function logoShellStyle(config: any) {
  return {
    width: `${Number(config.logoWidth || 176)}px`,
    height: `${Number(config.logoHeight || 44)}px`,
    background: config.logoBg && config.logoBg !== 'transparent' ? config.logoBg : 'transparent',
    padding: `${Number(config.logoPadding || 0)}px`,
    borderRadius: `${Number(config.logoRadius || 8)}px`,
  }
}

function FooterLogo({ config }: { config: any }) {
  return (
    <span className="mb-3 inline-flex shrink-0 items-center justify-center overflow-hidden" style={logoShellStyle(config)}>
      {config.logoImage ? (
        <img src={config.logoImage} alt={config.logoText || "Amir Nazir"} className="h-full w-full object-contain" />
      ) : (
        <span className="font-heading text-2xl font-bold leading-tight" style={{ color: config.logoColor || "#93c5fd" }}>
          {config.logoText || "Amir Nazir"}
        </span>
      )}
    </span>
  )
}

export default function Footer() {
  const [builderFooter, setBuilderFooter] = useState<any>(null)
  const liveEditor = useLiveEditor()
  const liveFooter = builderFooter || {}
  const footerLogoText = liveEditor.value("page_global_footer_logo_text", liveFooter.logoText || "Amir Nazir")
  const footerPrimaryLogo = liveEditor.value("page_global_footer_logo_image_dark", liveEditor.value("page_global_footer_logo_image", liveFooter.logoImageDark || liveFooter.logoImage || DEFAULT_LOGO_DARK))
  const footerLogoLight = liveEditor.value("page_global_footer_logo_image_light", liveFooter.logoImageLight || "")
  const footerLogoImage = assetUrl(footerLogoLight || footerPrimaryLogo || DEFAULT_LOGO_LIGHT)
  const footerLogoWidth = Number(liveEditor.value("page_global_footer_logo_width", String(liveFooter.logoWidth || 176)))
  const footerLogoHeight = Number(liveEditor.value("page_global_footer_logo_height", String(liveFooter.logoHeight || 44)))
  const footerLogoPadding = Number(liveEditor.value("page_global_footer_logo_padding", String(liveFooter.logoPadding || 0)))
  const footerLogoRadius = Number(liveEditor.value("page_global_footer_logo_radius", String(liveFooter.logoRadius || 0)))
  const footerLogoBg = liveEditor.value("page_global_footer_logo_bg", liveFooter.logoBg || "transparent")
  const footerEmail = liveEditor.value("page_global_footer_email", liveFooter.email || "info@a-mir.com")
  const footerPhone = liveEditor.value("page_global_footer_phone", liveFooter.phone || "")
  const services = (liveFooter.services?.length ? liveFooter.services : fallbackServices).map((service: string, index: number) => liveEditor.value(`page_global_footer_service_${index}`, service))
  const quickLinks = (liveFooter.quickLinks?.length
    ? liveFooter.quickLinks.map((item: any) => ({ label: item.label, to: item.url }))
    : fallbackQuickLinks).map((item: any, index: number) => ({
      label: liveEditor.value(`page_global_footer_quick_${index}_label`, item.label),
      to: liveEditor.value(`page_global_footer_quick_${index}_url`, item.to),
      labelKey: `page_global_footer_quick_${index}_label`,
      urlKey: `page_global_footer_quick_${index}_url`,
    }))

  useEffect(() => {
    const loadBuilderFooter = () => publicApi.settings().then((response) => {
      const raw = response.data.data?.builder_footer
      if (raw) setBuilderFooter(JSON.parse(raw))
    }).catch(() => {})
    loadBuilderFooter()
    window.addEventListener('builder:settings-saved', loadBuilderFooter)
    return () => window.removeEventListener('builder:settings-saved', loadBuilderFooter)
  }, [])

  return (
    <EditableSection sectionKey="page_global_footer_section" label="Footer">
    <footer className="bg-[#0a0f1e] text-white mt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-1">
            <span className="mb-3 inline-flex shrink-0 items-center justify-center overflow-hidden" style={logoShellStyle({ ...liveFooter, logoText: footerLogoText, logoImage: footerLogoImage, logoWidth: footerLogoWidth, logoHeight: footerLogoHeight, logoPadding: footerLogoPadding, logoRadius: footerLogoRadius, logoBg: footerLogoBg })}>
              {footerLogoImage ? (
                <EditableImage
                  fieldKey="page_global_footer_logo_image_dark"
                  label="Footer primary logo"
                  fallback={footerLogoImage}
                  alt={footerLogoText}
                  className={logoImageClass(true)}
                  relatedFields={[
                    { key: "page_global_footer_logo_image_dark", label: "Primary footer logo", type: "image", fallback: footerPrimaryLogo },
                    { key: "page_global_footer_logo_image_light", label: "Optional white footer logo", type: "image", fallback: footerLogoLight },
                    { key: "page_global_footer_logo_width", label: "Footer logo width", fallback: String(footerLogoWidth) },
                    { key: "page_global_footer_logo_height", label: "Footer logo height", fallback: String(footerLogoHeight) },
                    { key: "page_global_footer_logo_padding", label: "Footer logo padding", fallback: String(footerLogoPadding) },
                    { key: "page_global_footer_logo_bg", label: "Footer logo background", fallback: footerLogoBg },
                    { key: "page_global_footer_logo_radius", label: "Footer logo radius", fallback: String(footerLogoRadius) },
                  ]}
                />
              ) : (
                <span className="font-heading text-2xl font-bold leading-tight" style={{ color: liveFooter.logoColor || "#93c5fd" }}>
                  <EditableText fieldKey="page_global_footer_logo_text" label="Footer logo text" fallback={footerLogoText} relatedFields={[{ key: "page_global_footer_logo_image_dark", label: "Primary footer logo", type: "image", fallback: footerLogoImage }, { key: "page_global_footer_logo_image_light", label: "Optional white footer logo", type: "image", fallback: footerLogoLight }]} />
                </span>
              )}
            </span>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              <EditableText fieldKey="page_global_footer_description" label="Footer description" fallback={liveFooter.description || "Premium digital services - web design, development, SEO, and marketing solutions that grow your business."} type="textarea" />
            </p>
            <EditableSocialLinks />
          </div>

          <div>
            <EditableText fieldKey="page_global_footer_services_heading" label="Footer services heading" fallback="Services" as="h3" className="font-semibold text-sm text-white/90 mb-4 uppercase tracking-wider" />
            <ul className="space-y-2">
              {services.map((s: string, index: number) => (
                <li key={s}>
                  <Link to="/services" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 group">
                    <EditableText fieldKey={`page_global_footer_service_${index}`} label={`Footer service ${index + 1}`} fallback={s} />
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <EditableText fieldKey="page_global_footer_quick_heading" label="Footer quick links heading" fallback="Quick Links" as="h3" className="font-semibold text-sm text-white/90 mb-4 uppercase tracking-wider" />
            <ul className="space-y-2">
              {quickLinks.map((l: any) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/50 hover:text-white transition-colors">
                    <EditableText fieldKey={l.labelKey} label={`${l.label} quick link label`} fallback={l.label} relatedFields={[{ key: l.urlKey, label: `${l.label} quick link URL`, type: "url" }]} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <EditableText fieldKey="page_global_footer_contact_heading" label="Footer contact heading" fallback="Get In Touch" as="h3" className="font-semibold text-sm text-white/90 mb-4 uppercase tracking-wider" />
            <a href={`mailto:${footerEmail}`}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors mb-4">
              <Mail className="w-4 h-4" />
              <EditableText fieldKey="page_global_footer_email" label="Footer email" fallback={footerEmail} />
            </a>
            {footerPhone && <EditableText fieldKey="page_global_footer_phone" label="Footer phone" fallback={footerPhone} as="p" className="mb-4 text-sm text-white/50" />}
            <Link to={liveEditor.value("page_global_footer_cta_url", "/contact")}
              className="inline-flex items-center gap-2 gradient-brand text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
              <EditableText fieldKey="page_global_footer_cta_text" label="Footer CTA text" fallback="Start a Project" relatedFields={[{ key: "page_global_footer_cta_url", label: "Footer CTA URL", type: "url" }]} />
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <div className="mt-6">
              <EditableText fieldKey="page_global_footer_quick_order_heading" label="Footer quick order heading" fallback="Quick Order" as="p" className="text-xs text-white/30 mb-2" />
              <Link to={liveEditor.value("page_global_footer_quick_order_url", "/pricing")}
                className="text-sm text-white/50 hover:text-white border border-white/10 rounded-lg px-4 py-2 transition-colors inline-block">
                <EditableText fieldKey="page_global_footer_quick_order_text" label="Footer quick order text" fallback="View Packages" relatedFields={[{ key: "page_global_footer_quick_order_url", label: "Footer quick order URL", type: "url" }]} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            <EditableText fieldKey="page_global_footer_copyright" label="Footer copyright" fallback={liveFooter.copyright || `${new Date().getFullYear()} Amir Nazir. All rights reserved.`} />
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
    </EditableSection>
  )
}
