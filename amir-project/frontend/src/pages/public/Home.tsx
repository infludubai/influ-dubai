import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Star, Zap, Globe, BarChart3, Palette, ShieldCheck, Code2, Search } from 'lucide-react'
import AnimatedSection from '@/components/shared/AnimatedSection'
import { packagesApi } from '@/api/packages'
import { publicApi } from '@/api/public'
import { staggerContainer, fadeUp, scaleIn } from '@/utils/motion'
import { EditableSection, EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'

const DEFAULT_SERVICES = [
  { icon: Globe,       title: 'Web Design & Development', desc: 'Modern, fast, mobile-first websites that convert visitors into clients.', color: 'text-blue-500 bg-blue-50' },
  { icon: Search,      title: 'SEO Services',              desc: 'Rank higher on Google with local SEO, technical SEO, and monthly management.', color: 'text-green-500 bg-green-50' },
  { icon: BarChart3,   title: 'Digital Marketing',         desc: 'Social media, email marketing, and paid ads to grow your brand online.', color: 'text-purple-500 bg-purple-50' },
  { icon: Palette,     title: 'Branding & Logo Design',    desc: 'Professional brand identity that makes your business memorable.', color: 'text-orange-500 bg-orange-50' },
  { icon: Code2,       title: 'E-Commerce Solutions',      desc: 'Full online stores with payment gateways and inventory management.', color: 'text-pink-500 bg-pink-50' },
  { icon: ShieldCheck, title: 'Website Maintenance',       desc: 'Keep your site secure, fast, and updated with monthly care packages.', color: 'text-teal-500 bg-teal-50' },
]

const DEFAULT_STATS = [
  { value: '50+',  label: 'Projects Delivered' },
  { value: '100%', label: 'Client Satisfaction' },
  { value: '5+',   label: 'Years Experience' },
  { value: '24/7', label: 'Support Available' },
]

export default function Home() {
  const [packages, setPackages] = useState<any[]>([])
  const liveEditor = useLiveEditor()

  // Editable hero content — settable from /admin/builder home editor
  const [hero, setHero] = useState({
    eyebrow:   'Premium Digital Services',
    title:     '',          // populated below — site_name used as title
    subtitle:  'Web design, development, SEO, and digital marketing services that turn your vision into a high-performing online business.',
    btn1Text:  'View Packages',
    btn1Url:   '/pricing',
    btn2Text:  'See My Work',
    btn2Url:   '/portfolio',
    stat1Val:  '50+',  stat1Label: 'Projects Delivered',
    stat2Val:  '100%', stat2Label: 'Client Satisfaction',
    stat3Val:  '5+',   stat3Label: 'Years Experience',
    stat4Val:  '24/7', stat4Label: 'Support Available',
  })

  const [siteName, setSiteName] = useState('Amir Nazir')

  useEffect(() => {
    packagesApi.list().then(r => setPackages(r.data.data?.slice(0, 3) ?? []))
    publicApi.settings().then(r => {
      const d = r.data.data || {}
      // Builder saves page settings as page_home_<field>
      const pg = (k: string) => d[`page_home_${k}`] || d[k] || ''
      if (d.site_name) setSiteName(d.site_name)
      setHero(prev => ({
        ...prev,
        eyebrow:    pg('hero_eyebrow')    || prev.eyebrow,
        subtitle:   pg('hero_subtitle')   || prev.subtitle,
        btn1Text:   pg('hero_btn1_text')  || prev.btn1Text,
        btn1Url:    pg('hero_btn1_url')   || prev.btn1Url,
        btn2Text:   pg('hero_btn2_text')  || prev.btn2Text,
        btn2Url:    pg('hero_btn2_url')   || prev.btn2Url,
        stat1Val:   pg('hero_stat1_val')  || prev.stat1Val,
        stat1Label: pg('hero_stat1_label')|| prev.stat1Label,
        stat2Val:   pg('hero_stat2_val')  || prev.stat2Val,
        stat2Label: pg('hero_stat2_label')|| prev.stat2Label,
        stat3Val:   pg('hero_stat3_val')  || prev.stat3Val,
        stat3Label: pg('hero_stat3_label')|| prev.stat3Label,
        stat4Val:   pg('hero_stat4_val')  || prev.stat4Val,
        stat4Label: pg('hero_stat4_label')|| prev.stat4Label,
      }))
    }).catch(() => {})
  }, [])

  const stats = [
    { value: liveEditor.value('page_home_hero_stat1_val', hero.stat1Val), label: liveEditor.value('page_home_hero_stat1_label', hero.stat1Label), valueKey: 'page_home_hero_stat1_val', labelKey: 'page_home_hero_stat1_label' },
    { value: liveEditor.value('page_home_hero_stat2_val', hero.stat2Val), label: liveEditor.value('page_home_hero_stat2_label', hero.stat2Label), valueKey: 'page_home_hero_stat2_val', labelKey: 'page_home_hero_stat2_label' },
    { value: liveEditor.value('page_home_hero_stat3_val', hero.stat3Val), label: liveEditor.value('page_home_hero_stat3_label', hero.stat3Label), valueKey: 'page_home_hero_stat3_val', labelKey: 'page_home_hero_stat3_label' },
    { value: liveEditor.value('page_home_hero_stat4_val', hero.stat4Val), label: liveEditor.value('page_home_hero_stat4_label', hero.stat4Label), valueKey: 'page_home_hero_stat4_val', labelKey: 'page_home_hero_stat4_label' },
  ]

  const services = DEFAULT_SERVICES.map((service, index) => ({
    ...service,
    title: liveEditor.value(`page_home_service_${index}_title`, service.title),
    desc: liveEditor.value(`page_home_service_${index}_desc`, service.desc),
    titleKey: `page_home_service_${index}_title`,
    descKey: `page_home_service_${index}_desc`,
  }))

  const heroBtn1Url = liveEditor.value('page_home_hero_btn1_url', hero.btn1Url)
  const heroBtn2Url = liveEditor.value('page_home_hero_btn2_url', hero.btn2Url)

  return (
    <div className="flex flex-col overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <EditableSection sectionKey="page_home_hero_section" label="Home hero">
      <section className="relative min-h-screen flex items-center pt-16 pb-20 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-foreground/5 dark:bg-white/8 border border-foreground/10 dark:border-white/10 rounded-full px-4 py-1.5 mb-6"
            >
              <Zap className="w-3.5 h-3.5 text-primary" />
              <EditableText fieldKey="page_home_hero_eyebrow" label="Hero eyebrow" fallback={hero.eyebrow} className="text-foreground/70 dark:text-white/70 text-sm" />
            </motion.div>

            <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl text-foreground dark:text-white leading-tight mb-6">
              <EditableText fieldKey="site_name" label="Site name" fallback={siteName} />
              <EditableText fieldKey="page_home_hero_gradient_text" label="Hero gradient text" fallback="Digital Services" as="span" className="block gradient-text" />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-muted-foreground dark:text-white/60 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              <EditableText fieldKey="page_home_hero_subtitle" label="Hero subtitle" fallback={hero.subtitle} type="textarea" />
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to={heroBtn1Url} className="gradient-brand text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                <EditableText fieldKey="page_home_hero_btn1_text" label="Hero primary button text" fallback={hero.btn1Text} relatedFields={[{ key: 'page_home_hero_btn1_url', label: 'Hero primary button URL', type: 'url' }]} /> <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to={heroBtn2Url} className="bg-foreground/5 dark:bg-white/8 border border-foreground/15 dark:border-white/15 text-foreground dark:text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-foreground/10 dark:hover:bg-white/12 transition-all flex items-center justify-center gap-2">
                <EditableText fieldKey="page_home_hero_btn2_text" label="Hero secondary button text" fallback={hero.btn2Text} relatedFields={[{ key: 'page_home_hero_btn2_url', label: 'Hero secondary button URL', type: 'url' }]} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <EditableText fieldKey={s.valueKey} label={`${s.label} value`} fallback={s.value} as="div" className="font-heading font-bold text-3xl text-foreground dark:text-white mb-1" />
                <EditableText fieldKey={s.labelKey} label={`${s.label} label`} fallback={s.label} as="div" className="text-muted-foreground dark:text-white/40 text-sm" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      </EditableSection>

      {/* ── Services ─────────────────────────────────────────────────── */}
      <EditableSection sectionKey="page_home_services_section" label="Home services">
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-14">
            <EditableText fieldKey="page_home_services_eyebrow" label="Services eyebrow" fallback="What I Do" as="p" className="text-primary font-semibold text-sm uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_home_services_title" label="Services title" fallback="Services That Drive Results" as="h2" className="font-heading font-bold text-4xl text-foreground mb-4" />
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From a stunning website to a complete digital marketing strategy — everything you need to grow.
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp} custom={i}
                className="group p-7 rounded-2xl border border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 bg-card cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${s.color} group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <EditableText fieldKey={s.titleKey} label={`Service ${i + 1} title`} fallback={s.title} as="h3" className="font-heading font-semibold text-lg mb-2" />
                <EditableText fieldKey={s.descKey} label={`Service ${i + 1} description`} fallback={s.desc} as="p" type="textarea" className="text-muted-foreground text-sm leading-relaxed" />
                <Link to="/services" className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <AnimatedSection delay={2} className="text-center mt-10">
              <Link to={liveEditor.value('page_home_services_button_url', '/services')} className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-xl text-sm font-semibold hover:bg-accent hover:border-primary/20 transition-all">
              <EditableText fieldKey="page_home_services_button_text" label="Services button text" fallback="View All Services" relatedFields={[{ key: 'page_home_services_button_url', label: 'Services button URL', type: 'url' }]} /> <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
      </EditableSection>

      {/* ── Packages Preview ──────────────────────────────────────────── */}
      {packages.length > 0 && (
        <EditableSection sectionKey="page_home_packages_section" label="Home packages">
        <section className="py-24 bg-muted/40">
          <div className="container mx-auto px-4">
            <AnimatedSection className="text-center mb-14">
              <EditableText fieldKey="page_home_packages_eyebrow" label="Packages eyebrow" fallback="Transparent Pricing" as="p" className="text-primary font-semibold text-sm uppercase tracking-wider mb-3" />
              <EditableText fieldKey="page_home_packages_title" label="Packages title" fallback="Choose Your Package" as="h2" className="font-heading font-bold text-4xl mb-4" />
              <p className="text-muted-foreground text-lg max-w-xl mx-auto"><EditableText fieldKey="page_home_packages_subtitle" label="Packages subtitle" fallback="Clear pricing, real deliverables, no hidden fees. Pick a package or request a custom quote." type="textarea" /></p>
            </AnimatedSection>

            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg, i) => (
                <motion.div key={pkg.id} variants={scaleIn} custom={i}
                  className={`rounded-2xl p-7 border transition-all hover:-translate-y-1 hover:shadow-xl duration-300 ${
                    pkg.is_featured ? 'gradient-brand text-white border-transparent shadow-lg shadow-primary/20' : 'bg-card border-border hover:border-primary/20'
                  }`}
                >
                  {pkg.is_featured && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-3.5 h-3.5 fill-white text-white" />
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Most Popular</span>
                    </div>
                  )}
                  <h3 className={`font-heading font-bold text-lg mb-1 ${pkg.is_featured ? 'text-white' : ''}`}>{pkg.name}</h3>
                  <p className={`text-sm mb-4 ${pkg.is_featured ? 'text-white/70' : 'text-muted-foreground'}`}>{pkg.short_description}</p>
                  <div className={`font-heading font-bold text-3xl mb-5 ${pkg.is_featured ? 'text-white' : 'text-foreground'}`}>${pkg.price.toLocaleString()}</div>
                  <ul className="space-y-2 mb-6">
                    {(pkg.features ?? []).slice(0, 4).map((f: string) => (
                      <li key={f} className={`flex items-center gap-2 text-sm ${pkg.is_featured ? 'text-white/80' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${pkg.is_featured ? 'text-white' : 'text-primary'}`} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/checkout?package=${pkg.slug}`}
                    className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 ${pkg.is_featured ? 'bg-white text-primary' : 'gradient-brand text-white'}`}>
                    Get Started
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <AnimatedSection delay={2} className="text-center mt-10">
              <Link to={liveEditor.value('page_home_packages_button_url', '/pricing')} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                <EditableText fieldKey="page_home_packages_button_text" label="Packages link text" fallback="View all packages & pricing" relatedFields={[{ key: 'page_home_packages_button_url', label: 'Packages link URL', type: 'url' }]} /> <ArrowRight className="w-4 h-4" />
              </Link>
            </AnimatedSection>
          </div>
        </section>
        </EditableSection>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <EditableSection sectionKey="page_home_cta_section" label="Home CTA">
      <section className="py-24 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <EditableText fieldKey="page_home_cta_title" label="CTA title" fallback="Ready to grow your business?" as="h2" className="font-heading font-bold text-4xl text-white mb-4" />
            <EditableText fieldKey="page_home_cta_subtitle" label="CTA subtitle" fallback="Let's build something great together. Get a custom quote or browse packages to get started today." as="p" type="textarea" className="text-white/70 text-lg mb-8" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={liveEditor.value('page_home_cta_btn1_url', '/contact')} className="bg-white text-primary font-semibold px-7 py-3.5 rounded-xl hover:bg-white/95 transition-all shadow-lg"><EditableText fieldKey="page_home_cta_btn1_text" label="CTA primary button text" fallback="Get Custom Quote" relatedFields={[{ key: 'page_home_cta_btn1_url', label: 'CTA primary button URL', type: 'url' }]} /></Link>
              <Link to={liveEditor.value('page_home_cta_btn2_url', '/pricing')} className="bg-white/10 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/15 transition-all"><EditableText fieldKey="page_home_cta_btn2_text" label="CTA secondary button text" fallback="Browse Packages" relatedFields={[{ key: 'page_home_cta_btn2_url', label: 'CTA secondary button URL', type: 'url' }]} /></Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
      </EditableSection>
    </div>
  )
}
