import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft } from 'lucide-react'
import { EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'

export default function PrivacyPolicy() {
  const liveEditor = useLiveEditor()
  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us when you:
- Create an account or register for our services
- Place an order or request a quote
- Contact us through our website or email
- Subscribe to our newsletter or updates

This information may include your name, email address, phone number, company name, billing information, and any project details you share with us.`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:
- Process your orders and provide the services you request
- Send you transactional emails (order confirmations, invoices, status updates)
- Communicate with you about your projects and our services
- Improve our website and services
- Comply with legal obligations

We do not sell, trade, or otherwise transfer your personal information to outside parties.`,
    },
    {
      title: '3. Data Security',
      content: `We implement industry-standard security measures to protect your personal information including:
- SSL/TLS encryption for all data in transit
- Secure servers and databases with access controls
- Regular security audits and updates
- Limited employee access to personal data on a need-to-know basis

While we strive to use commercially acceptable means to protect your information, no method of transmission over the internet is 100% secure.`,
    },
    {
      title: '4. Cookies & Tracking',
      content: `Our website uses cookies to enhance your browsing experience. Cookies are small files stored on your device that help us:
- Remember your preferences and login status
- Analyze website traffic and usage patterns
- Improve our services and user experience

You can control cookie settings through your browser preferences. Disabling cookies may affect some features of our website.`,
    },
    {
      title: '5. Third-Party Services',
      content: `We may use third-party services to help us operate our website and provide our services, including:
- Payment processors (for secure payment handling)
- Email service providers (for transactional emails)
- Analytics tools (for understanding website usage)

These third parties have access to your information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.`,
    },
    {
      title: '6. Your Rights',
      content: `You have the right to:
- Access the personal information we hold about you
- Request correction of inaccurate or incomplete data
- Request deletion of your personal data (subject to legal requirements)
- Opt-out of marketing communications at any time
- Data portability — receive your data in a structured format

To exercise any of these rights, please contact us at info@a-mir.com`,
    },
    {
      title: '7. Data Retention',
      content: `We retain your personal information for as long as necessary to:
- Provide our services to you
- Comply with legal obligations (such as tax and accounting requirements)
- Resolve disputes and enforce our agreements

Typically, we retain client project data for 3 years after project completion, unless you request earlier deletion.`,
    },
    {
      title: '8. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by:
- Posting a notice on our website
- Sending an email to registered users

We encourage you to review this policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.`,
    },
  ]

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-32 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <EditableText fieldKey="page_privacy_hero_eyebrow" label="Privacy hero eyebrow" fallback="Legal" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_privacy_hero_title" label="Privacy hero title" fallback="Privacy Policy" as="h1" className="font-heading font-bold text-4xl md:text-5xl text-foreground dark:text-white mb-4" />
            <p className="text-muted-foreground dark:text-white/60 text-lg max-w-xl mx-auto">
              <EditableText fieldKey="page_privacy_hero_subtitle" label="Privacy hero subtitle" fallback="How we collect, use, and protect your personal information." type="textarea" />
            </p>
            <EditableText fieldKey="page_privacy_updated_text" label="Privacy last updated text" fallback="Last updated: June 2, 2026" as="p" className="text-muted-foreground dark:text-white/40 text-sm mt-3" />
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> <EditableText fieldKey="page_privacy_back_link_text" label="Privacy back link text" fallback="Back to Home" />
          </Link>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-10">
            <p className="text-blue-800 text-sm leading-relaxed">
              <EditableText fieldKey="page_privacy_notice_text" label="Privacy notice text" fallback="Summary: We take your privacy seriously. We only collect what we need, we protect it carefully, and we never sell it to anyone. This policy explains everything in detail." type="textarea" />
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <EditableText fieldKey={`page_privacy_section_${i}_title`} label={`Privacy section ${i + 1} title`} fallback={liveEditor.value(`page_privacy_section_${i}_title`, section.title)} as="h2" className="font-heading font-bold text-lg mb-4 text-foreground" />
                <EditableText fieldKey={`page_privacy_section_${i}_content`} label={`Privacy section ${i + 1} content`} fallback={liveEditor.value(`page_privacy_section_${i}_content`, section.content)} as="div" type="textarea" className="text-muted-foreground text-sm leading-7 whitespace-pre-line" />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-center">
            <EditableText fieldKey="page_privacy_cta_title" label="Privacy CTA title" fallback="Have Questions?" as="h3" className="font-heading font-bold text-white text-xl mb-2" />
            <p className="text-white/60 text-sm mb-5">
              <EditableText fieldKey="page_privacy_cta_text" label="Privacy CTA text" fallback="If you have any questions about this Privacy Policy, please contact us." type="textarea" />
            </p>
            <Link to={liveEditor.value('page_privacy_cta_url', '/contact')}
              className="inline-block gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all">
              <EditableText fieldKey="page_privacy_cta_button_text" label="Privacy CTA button text" fallback="Contact Us" relatedFields={[{ key: 'page_privacy_cta_url', label: 'Privacy CTA button URL', type: 'url' }]} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
