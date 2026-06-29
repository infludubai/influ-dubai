import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, ArrowLeft } from 'lucide-react'
import { EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'

export default function Terms() {
  const liveEditor = useLiveEditor()
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing or using the services provided by Amir Nazir ("we," "us," or "our"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.

These terms apply to all clients, visitors, and users of our website and services including web design, development, SEO, digital marketing, and related services.`,
    },
    {
      title: '2. Services',
      content: `We provide the following digital services:
- Web Design and Development
- Search Engine Optimization (SEO)
- Digital Marketing
- Branding and Graphic Design
- Website Maintenance and Support

The specific services, deliverables, timelines, and pricing are outlined in the project agreement or invoice provided to you before work begins.`,
    },
    {
      title: '3. Payment Terms',
      content: `Payment conditions for our services:
- A 50% upfront deposit is required before project work begins
- The remaining 50% is due upon project completion before final files are delivered
- Monthly retainer services are billed at the beginning of each month
- Late payments beyond 7 days may incur a 5% late fee

Accepted payment methods: Bank Transfer, JazzCash, EasyPaisa, and other methods as agreed. All prices are in USD unless otherwise specified.`,
    },
    {
      title: '4. Revisions & Changes',
      content: `Each package includes a set number of revisions as specified in your project agreement. Additional revisions beyond the included amount will be charged at our hourly rate.

Revision requests must be submitted within 7 days of delivery. After this period, any changes will be treated as a new project request. Major changes to scope, design direction, or functionality after work has begun may require a revised quote.`,
    },
    {
      title: '5. Client Responsibilities',
      content: `To ensure timely project completion, clients are responsible for:
- Providing all required content (text, images, logos, brand guidelines) within agreed timelines
- Providing timely feedback on deliverables (within 5 business days)
- Ensuring all provided content does not infringe on third-party rights
- Providing accurate and complete information needed for the project

Delays caused by late client responses or content delivery will not be our responsibility and may affect project timelines.`,
    },
    {
      title: '6. Intellectual Property',
      content: `Upon receipt of full payment:
- You own all final deliverables and custom work created specifically for your project
- We retain the right to display completed work in our portfolio and marketing materials unless you request otherwise in writing

We retain ownership of all pre-existing code libraries, frameworks, and proprietary tools used in the development process. Stock images, fonts, and third-party plugins remain subject to their respective licenses.`,
    },
    {
      title: '7. Confidentiality',
      content: `We treat all client information as confidential. We will not disclose your business information, project details, or personal data to third parties without your consent, except as required by law.

We request the same level of confidentiality regarding our processes, pricing structures, and proprietary methodologies. Non-disclosure agreements (NDAs) can be arranged upon request.`,
    },
    {
      title: '8. Limitation of Liability',
      content: `Our total liability for any claim related to our services is limited to the amount paid for the specific service that gave rise to the claim.

We are not responsible for:
- Loss of profits, revenue, or business opportunities
- Indirect, incidental, or consequential damages
- Damages resulting from client-provided content or third-party services
- Website downtime caused by hosting provider issues`,
    },
    {
      title: '9. Termination',
      content: `Either party may terminate a project with 14 days written notice. Upon termination:
- Work completed to date will be invoiced and must be paid
- Any advance payments are non-refundable for work already completed
- We will provide all completed work files upon receipt of final payment

We reserve the right to suspend or terminate services immediately for breach of these terms or non-payment.`,
    },
    {
      title: '10. Governing Law',
      content: `These Terms and Conditions are governed by the laws of Pakistan. Any disputes arising from our services will be subject to the exclusive jurisdiction of courts in Islamabad, Pakistan.

We encourage resolving disputes through direct communication first. If a resolution cannot be reached, mediation will be attempted before any legal proceedings.`,
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
              <FileText className="w-7 h-7 text-white" />
            </div>
            <EditableText fieldKey="page_terms_hero_eyebrow" label="Terms hero eyebrow" fallback="Legal" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_terms_hero_title" label="Terms hero title" fallback="Terms & Conditions" as="h1" className="font-heading font-bold text-4xl md:text-5xl text-foreground dark:text-white mb-4" />
            <p className="text-muted-foreground dark:text-white/60 text-lg max-w-xl mx-auto">
              <EditableText fieldKey="page_terms_hero_subtitle" label="Terms hero subtitle" fallback="Please read these terms carefully before using our services." type="textarea" />
            </p>
            <EditableText fieldKey="page_terms_updated_text" label="Terms last updated text" fallback="Last updated: June 2, 2026" as="p" className="text-muted-foreground dark:text-white/40 text-sm mt-3" />
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> <EditableText fieldKey="page_terms_back_link_text" label="Terms back link text" fallback="Back to Home" />
          </Link>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10">
            <p className="text-amber-800 text-sm leading-relaxed">
              <EditableText fieldKey="page_terms_notice_text" label="Terms notice text" fallback="Important: By placing an order or using our services, you agree to these terms. If you have any questions, please contact us before proceeding." type="textarea" />
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
                <EditableText fieldKey={`page_terms_section_${i}_title`} label={`Terms section ${i + 1} title`} fallback={liveEditor.value(`page_terms_section_${i}_title`, section.title)} as="h2" className="font-heading font-bold text-lg mb-4 text-foreground" />
                <EditableText fieldKey={`page_terms_section_${i}_content`} label={`Terms section ${i + 1} content`} fallback={liveEditor.value(`page_terms_section_${i}_content`, section.content)} as="div" type="textarea" className="text-muted-foreground text-sm leading-7 whitespace-pre-line" />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-center">
            <EditableText fieldKey="page_terms_cta_title" label="Terms CTA title" fallback="Need Clarification?" as="h3" className="font-heading font-bold text-white text-xl mb-2" />
            <p className="text-white/60 text-sm mb-5">
              <EditableText fieldKey="page_terms_cta_text" label="Terms CTA text" fallback="If you have any questions about these Terms, please reach out before starting a project." type="textarea" />
            </p>
            <Link to={liveEditor.value('page_terms_cta_url', '/contact')}
              className="inline-block gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all">
              <EditableText fieldKey="page_terms_cta_button_text" label="Terms CTA button text" fallback="Contact Us" relatedFields={[{ key: 'page_terms_cta_url', label: 'Terms CTA button URL', type: 'url' }]} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
