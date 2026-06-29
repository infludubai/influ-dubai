import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Star, ArrowRight, Zap } from 'lucide-react'
import AnimatedSection from '@/components/shared/AnimatedSection'
import PageLoader from '@/components/shared/PageLoader'
import { packagesApi } from '@/api/packages'
import { staggerContainer, scaleIn } from '@/utils/motion'
import { EditableSection, EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'

const fallbackPackages = [
  {
    id: 'fallback-starter',
    name: 'Starter Website',
    slug: 'starter-website',
    short_description: 'A clean professional website for a small business or personal brand.',
    price: 299,
    delivery_days: 7,
    revisions: 2,
    is_featured: false,
    features: ['Up to 5 pages', 'Mobile responsive layout', 'Contact form', 'Basic SEO setup', 'Launch support'],
  },
  {
    id: 'fallback-business',
    name: 'Business Growth',
    slug: 'business-growth',
    short_description: 'A stronger website package for growing businesses that need more trust and conversion.',
    price: 798,
    delivery_days: 14,
    revisions: 4,
    is_featured: true,
    features: ['Up to 10 pages', 'Premium design system', 'Blog or portfolio setup', 'Speed optimization', 'Analytics setup', '30 days support'],
  },
  {
    id: 'fallback-custom',
    name: 'Custom Platform',
    slug: 'custom-platform',
    short_description: 'For advanced websites, dashboards, e-commerce, booking, or custom Laravel/React builds.',
    price: 0,
    delivery_days: 21,
    revisions: -1,
    is_featured: false,
    features: ['Custom feature planning', 'Admin/client dashboard options', 'Checkout or payments', 'Integrations', 'Priority support'],
  },
]

export default function Pricing() {
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<'USD' | 'AED'>('USD')
  const liveEditor = useLiveEditor()

  useEffect(() => {
    packagesApi.list().then((r) => setPackages(r.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  const formatPrice = (pkg: any) => {
    if (pkg.price === 0) return 'Custom'
    if (currency === 'AED') {
      if (pkg.price_aed && Number(pkg.price_aed) > 0) {
        return `AED ${Number(pkg.price_aed).toLocaleString()}`
      }
      return `~AED ${Math.round(Number(pkg.price) * 3.67).toLocaleString()}`
    }
    return `$${Number(pkg.price).toLocaleString()}`
  }

  if (loading) return <div className="pt-16"><PageLoader /></div>

  return (
    <div className="flex flex-col pb-24">
      {/* Hero */}
      <EditableSection sectionKey="page_pricing_hero_section" label="Pricing hero">
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-32 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <EditableText fieldKey="page_pricing_hero_eyebrow" label="Pricing hero eyebrow" fallback="Transparent Pricing" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_pricing_hero_title" label="Pricing hero title" fallback="Simple, Clear Packages" as="h1" className="font-heading font-bold text-5xl text-foreground dark:text-white mb-4" />
            <p className="text-muted-foreground dark:text-white/60 text-lg max-w-2xl mx-auto">
              <EditableText fieldKey="page_pricing_hero_subtitle" label="Pricing hero subtitle" fallback="Choose the package that fits your needs. All packages include professional delivery and ongoing support. Need something custom?" type="textarea" /> <Link to={liveEditor.value('page_pricing_quote_url', '/contact')} className="text-primary hover:underline"><EditableText fieldKey="page_pricing_quote_text" label="Pricing quote link text" fallback="Request a quote" relatedFields={[{ key: 'page_pricing_quote_url', label: 'Pricing quote link URL', type: 'url' }]} /></Link>.
            </p>
          </motion.div>
        </div>
      </section>
      </EditableSection>

      <EditableSection sectionKey="page_pricing_packages_section" label="Pricing packages">
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            {(['USD', 'AED'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  currency === c ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {c === 'USD' ? '$ USD' : 'AED د.إ'}
              </button>
            ))}
          </div>
        </div>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {(packages.length ? packages : fallbackPackages).map((pkg, i) => (
            <motion.div key={pkg.id} variants={scaleIn} custom={i}
              className={`rounded-2xl p-8 border flex flex-col transition-all hover:-translate-y-1 duration-300 ${
                pkg.is_featured
                  ? 'gradient-brand text-white border-transparent shadow-2xl shadow-primary/20 relative'
                  : pkg.price === 0
                  ? 'bg-slate-900 text-white border-slate-700'
                  : 'bg-card border-border hover:border-primary/20 hover:shadow-lg'
              }`}>
              {pkg.is_featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                    <Star className="w-3 h-3 fill-current" /> <EditableText fieldKey="page_pricing_featured_label" label="Featured package label" fallback="Most Popular" />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-heading font-bold text-xl mb-2 ${pkg.is_featured || pkg.price === 0 ? 'text-white' : ''}`}>{pkg.name}</h3>
                <p className={`text-sm leading-relaxed mb-4 ${pkg.is_featured ? 'text-white/70' : pkg.price === 0 ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {pkg.short_description}
                </p>
                <div className={`font-heading font-bold text-4xl ${pkg.is_featured || pkg.price === 0 ? 'text-white' : 'text-foreground'}`}>
                  {formatPrice(pkg)}
                </div>
                {pkg.price > 0 && (
                  <p className={`text-sm mt-1 ${pkg.is_featured ? 'text-white/60' : 'text-muted-foreground'}`}>
                    Delivered in {pkg.delivery_days} days · {pkg.revisions === -1 ? 'Unlimited' : pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {(pkg.features ?? []).map((f: string) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${pkg.is_featured ? 'text-white/85' : pkg.price === 0 ? 'text-white/70' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${pkg.is_featured || pkg.price === 0 ? 'text-white' : 'text-primary'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={!packages.length || pkg.price === 0 ? '/contact' : `/checkout?package=${pkg.slug}`}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 ${
                  pkg.is_featured
                    ? 'bg-white text-primary hover:bg-white/95'
                    : pkg.price === 0
                    ? 'bg-primary text-white'
                    : 'gradient-brand text-white'
                }`}>
                <EditableText
                  fieldKey={!packages.length || pkg.price === 0 ? 'page_pricing_custom_button_text' : 'page_pricing_package_button_text'}
                  label={!packages.length || pkg.price === 0 ? 'Custom quote button text' : 'Package checkout button text'}
                  fallback={!packages.length || pkg.price === 0 ? 'Request Custom Quote' : 'Get Started'}
                /> <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {!packages.length && (
          <AnimatedSection className="mb-12 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center">
            <EditableText fieldKey="page_pricing_sample_title" label="Pricing sample notice title" fallback="Sample pricing content" as="p" className="text-sm font-semibold text-blue-900" />
            <EditableText fieldKey="page_pricing_sample_text" label="Pricing sample notice text" fallback="Add real packages and add-ons in the admin dashboard to replace these preview packages automatically." as="p" className="mt-1 text-sm text-blue-700" type="textarea" />
          </AnimatedSection>
        )}

        </div>
      </EditableSection>

      <EditableSection sectionKey="page_pricing_included_section" label="Pricing included">
      <div className="container mx-auto px-4">
        {/* FAQ / guarantee */}
        <AnimatedSection className="bg-muted/40 rounded-2xl p-10 text-center">
          <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
          <EditableText fieldKey="page_pricing_included_title" label="Pricing included title" fallback="What's included with every package?" as="h2" className="font-heading font-bold text-2xl mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm text-muted-foreground">
            {['Professional delivery', 'Mobile-responsive design', 'Revisions included', 'Post-launch support'].map((f, index) => (
              <div key={f} className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <EditableText fieldKey={`page_pricing_included_item_${index}`} label={`Included item ${index + 1}`} fallback={f} />
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
      </EditableSection>
    </div>
  )
}
