import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Globe, Search, BarChart3, Palette, Code2, ShieldCheck, Bot, Smartphone, Mail, Settings } from 'lucide-react'
import AnimatedSection from '@/components/shared/AnimatedSection'
import { staggerContainer, fadeUp } from '@/utils/motion'
import { EditableSection, EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'

const categories = [
  {
    icon: Globe, title: 'Web Design & Development', color: 'text-blue-600 bg-blue-50 border-blue-100',
    services: [
      { name: 'Business Website', desc: 'Professional sites that build trust and generate leads.' },
      { name: 'Portfolio Website', desc: 'Showcase your work with a stunning personal site.' },
      { name: 'Landing Page', desc: 'High-converting single-page campaigns.' },
      { name: 'E-Commerce Website', desc: 'Full online stores with cart, checkout, and payments.' },
      { name: 'Website Redesign', desc: 'Modernize your existing website for better performance.' },
    ],
  },
  {
    icon: Search, title: 'SEO Services', color: 'text-green-600 bg-green-50 border-green-100',
    services: [
      { name: 'Local SEO', desc: 'Dominate local search results and Google Maps.' },
      { name: 'Technical SEO', desc: 'Fix site structure, speed, and crawlability issues.' },
      { name: 'On-Page SEO', desc: 'Optimize content and meta for target keywords.' },
      { name: 'Monthly SEO Management', desc: 'Ongoing SEO work for consistent rank improvement.' },
      { name: 'SEO Audit', desc: 'Detailed analysis of your current SEO health.' },
    ],
  },
  {
    icon: BarChart3, title: 'Digital Marketing', color: 'text-purple-600 bg-purple-50 border-purple-100',
    services: [
      { name: 'Social Media Marketing', desc: 'Strategy, content, and management for all platforms.' },
      { name: 'Email Marketing', desc: 'Campaign design, automation, and list management.' },
      { name: 'Google Business Profile', desc: 'Setup and optimization for maximum local visibility.' },
      { name: 'Meta & TikTok Pixel Setup', desc: 'Retargeting pixel installation and verification.' },
      { name: 'Google Analytics Setup', desc: 'Full GA4 and Search Console configuration.' },
    ],
  },
  {
    icon: Palette, title: 'Branding & Design', color: 'text-orange-600 bg-orange-50 border-orange-100',
    services: [
      { name: 'Logo Design', desc: 'Professional logos that represent your brand identity.' },
      { name: 'Brand Identity Kit', desc: 'Complete guide with colors, fonts, and usage rules.' },
      { name: 'UI/UX Design', desc: 'User-centered interfaces that delight and convert.' },
      { name: 'Social Media Design', desc: 'Templates and posts for consistent branding.' },
      { name: 'Email Template Design', desc: 'On-brand HTML email templates.' },
    ],
  },
  {
    icon: Bot, title: 'AI & Automation', color: 'text-pink-600 bg-pink-50 border-pink-100',
    services: [
      { name: 'AI Chatbot Integration', desc: '24/7 AI assistant trained on your business.' },
      { name: 'Live Chat Integration', desc: 'Real-time customer support widget.' },
      { name: 'CRM Integration', desc: 'Connect your forms and leads to your CRM system.' },
      { name: 'WhatsApp Integration', desc: 'WhatsApp chat button for instant customer contact.' },
      { name: 'Booking System', desc: 'Online appointment and scheduling setup.' },
    ],
  },
  {
    icon: ShieldCheck, title: 'Maintenance & Support', color: 'text-teal-600 bg-teal-50 border-teal-100',
    services: [
      { name: 'Monthly Maintenance', desc: 'Updates, backups, security monitoring, bug fixes.' },
      { name: 'Speed Optimization', desc: 'PageSpeed improvements for better UX and SEO.' },
      { name: 'Security Hardening', desc: 'Firewall, malware scanning, and SSL setup.' },
      { name: 'Hosting & Domain Setup', desc: 'Help choosing and configuring your hosting.' },
      { name: 'Content Updates', desc: 'Regular text, image, and page content changes.' },
    ],
  },
]

export default function Services() {
  const liveEditor = useLiveEditor()
  const editableCategories = categories.map((cat, categoryIndex) => ({
    ...cat,
    title: liveEditor.value(`page_services_category_${categoryIndex}_title`, cat.title),
    titleKey: `page_services_category_${categoryIndex}_title`,
    services: cat.services.map((service, serviceIndex) => ({
      ...service,
      name: liveEditor.value(`page_services_category_${categoryIndex}_service_${serviceIndex}_name`, service.name),
      desc: liveEditor.value(`page_services_category_${categoryIndex}_service_${serviceIndex}_desc`, service.desc),
      nameKey: `page_services_category_${categoryIndex}_service_${serviceIndex}_name`,
      descKey: `page_services_category_${categoryIndex}_service_${serviceIndex}_desc`,
    })),
  }))

  return (
    <div className="flex flex-col pb-24 overflow-hidden">
      {/* Hero */}
      <EditableSection sectionKey="page_services_hero_section" label="Services hero">
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-32 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[300px] bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <EditableText fieldKey="page_services_hero_eyebrow" label="Services hero eyebrow" fallback="What I Offer" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_services_hero_title" label="Services hero title" fallback="Digital Services" as="h1" className="font-heading font-bold text-5xl text-foreground dark:text-white mb-4" />
            <p className="text-muted-foreground dark:text-white/60 text-lg max-w-2xl mx-auto mb-8">
              Everything your business needs to succeed online — from a beautiful website to a complete digital marketing strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={liveEditor.value('page_services_hero_btn1_url', '/pricing')} className="gradient-brand text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 justify-center">
                <EditableText fieldKey="page_services_hero_btn1_text" label="Services hero primary button text" fallback="View Pricing" relatedFields={[{ key: 'page_services_hero_btn1_url', label: 'Services hero primary button URL', type: 'url' }]} /> <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to={liveEditor.value('page_services_hero_btn2_url', '/contact')} className="bg-foreground/5 dark:bg-white/8 border border-foreground/15 dark:border-white/15 text-foreground dark:text-white font-semibold px-6 py-3 rounded-xl hover:bg-foreground/10 dark:hover:bg-white/12 transition-all">
                <EditableText fieldKey="page_services_hero_btn2_text" label="Services hero secondary button text" fallback="Request Custom Quote" relatedFields={[{ key: 'page_services_hero_btn2_url', label: 'Services hero secondary button URL', type: 'url' }]} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      </EditableSection>

      {/* Service Categories */}
      <EditableSection sectionKey="page_services_categories_section" label="Service categories">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-20">
            {editableCategories.map((cat, ci) => (
              <AnimatedSection key={cat.title} delay={0}>
                <div className={`flex items-center gap-3 mb-8 ${ci % 2 === 0 ? '' : 'flex-row-reverse justify-end'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${cat.color}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <EditableText fieldKey={cat.titleKey} label={`Service category ${ci + 1} title`} fallback={cat.title} as="h2" className="font-heading font-bold text-2xl" />
                </div>
                <motion.div
                  variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                >
                  {cat.services.map((s, si) => (
                    <motion.div key={s.name} variants={fadeUp} custom={si}
                      className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                      <CheckCircle2 className="w-5 h-5 text-primary mb-3" />
                      <EditableText fieldKey={s.nameKey} label={`${s.name} service name`} fallback={s.name} as="h3" className="font-semibold text-sm mb-1.5" />
                      <EditableText fieldKey={s.descKey} label={`${s.name} service description`} fallback={s.desc} as="p" type="textarea" className="text-muted-foreground text-xs leading-relaxed" />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
      </EditableSection>

      {/* CTA */}
      <EditableSection sectionKey="page_services_cta_section" label="Services CTA">
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <EditableText fieldKey="page_services_cta_title" label="Services CTA title" fallback="Don't see exactly what you need?" as="h2" className="font-heading font-bold text-3xl mb-4" />
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              <EditableText fieldKey="page_services_cta_subtitle" label="Services CTA subtitle" fallback="Every project is unique. Request a custom quote and we'll build the perfect solution for your business." type="textarea" />
            </p>
            <Link to={liveEditor.value('page_services_cta_btn_url', '/contact')} className="gradient-brand text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2">
              <EditableText fieldKey="page_services_cta_btn_text" label="Services CTA button text" fallback="Request Custom Quote" relatedFields={[{ key: 'page_services_cta_btn_url', label: 'Services CTA button URL', type: 'url' }]} /> <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
      </EditableSection>
    </div>
  )
}
