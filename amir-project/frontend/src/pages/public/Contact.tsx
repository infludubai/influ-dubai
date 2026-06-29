import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, CheckCircle2, MessageSquare } from 'lucide-react'
import AnimatedSection from '@/components/shared/AnimatedSection'
import { publicApi } from '@/api/public'
import toast from 'react-hot-toast'
import { fadeUp } from '@/utils/motion'
import { EditableSection, EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'
import EditableSocialLinks from '@/components/shared/EditableSocialLinks'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const liveEditor = useLiveEditor()

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await publicApi.contact(form)
      setSent(true)
      toast.success('Message sent! We\'ll reply within 24 hours.')
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errs: Record<string, string> = {}
        Object.entries(err.response.data.errors).forEach(([k, v]: any) => { errs[k] = v[0] })
        setErrors(errs)
      } else {
        toast.error('Failed to send. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col pb-24">
      <EditableSection sectionKey="page_contact_hero_section" label="Contact hero">
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-32 pb-20 text-center">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <EditableText fieldKey="page_contact_hero_eyebrow" label="Contact hero eyebrow" fallback="Let's Connect" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
            <EditableText fieldKey="page_contact_hero_title" label="Contact hero title" fallback="Get In Touch" as="h1" className="font-heading font-bold text-5xl text-foreground dark:text-white mb-4" />
            <p className="text-muted-foreground dark:text-white/60 text-lg max-w-xl mx-auto">
              <EditableText fieldKey="page_contact_hero_subtitle" label="Contact hero subtitle" fallback="Have a project in mind? Looking for a quote? Or just want to say hi? I'd love to hear from you." type="textarea" />
            </p>
          </motion.div>
        </div>
      </section>
      </EditableSection>

      <EditableSection sectionKey="page_contact_content_section" label="Contact form">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Info */}
          <AnimatedSection className="lg:col-span-2">
            <EditableText fieldKey="page_contact_info_title" label="Contact information title" fallback="Contact Information" as="h2" className="font-heading font-bold text-2xl mb-6" />
            <div className="space-y-5">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-muted/40 border border-border">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <EditableText fieldKey="page_contact_email_label" label="Email label" fallback="Email" as="p" className="font-semibold text-sm mb-0.5" />
                  <a href={`mailto:${liveEditor.value('page_contact_email_address', 'info@a-mir.com')}`} className="text-primary text-sm hover:underline">
                    <EditableText fieldKey="page_contact_email_address" label="Email address" fallback="info@a-mir.com" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-muted/40 border border-border">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <EditableText fieldKey="page_contact_response_label" label="Response time label" fallback="Response Time" as="p" className="font-semibold text-sm mb-0.5" />
                  <EditableText fieldKey="page_contact_response_text" label="Response time text" fallback="Within 24 hours on business days" as="p" className="text-muted-foreground text-sm" />
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/10">
              <EditableText fieldKey="page_contact_quote_title" label="Contact quote box title" fallback="Prefer a custom quote?" as="h3" className="font-semibold text-sm mb-2" />
              <EditableText fieldKey="page_contact_quote_text" label="Contact quote box text" fallback="Use the form and select Custom Quote as the subject, or visit the pricing page and use the Request Quote button." as="p" className="text-muted-foreground text-sm mb-3" type="textarea" />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <EditableText fieldKey="page_contact_social_heading" label="Contact social heading" fallback="Social Links" as="h3" className="mb-3 font-semibold text-sm" />
              <EditableSocialLinks tone="light" />
            </div>
          </AnimatedSection>

          {/* Form */}
          <AnimatedSection delay={1} className="lg:col-span-3">
            {sent ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/40 rounded-2xl border border-border">
                <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <EditableText fieldKey="page_contact_success_title" label="Contact success title" fallback="Message Sent!" as="h3" className="font-heading font-bold text-xl mb-2" />
                <EditableText fieldKey="page_contact_success_text" label="Contact success text" fallback="Thank you for reaching out. I'll get back to you within 24 hours." as="p" className="text-muted-foreground" />
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                  className="mt-6 text-primary text-sm font-medium hover:underline">
                  <EditableText fieldKey="page_contact_success_button" label="Contact success button" fallback="Send another message" />
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 bg-card p-5 sm:p-8 rounded-2xl border border-border shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    ['name', liveEditor.value('page_contact_form_name_label', 'Full Name'), 'text', liveEditor.value('page_contact_form_name_placeholder', 'John Smith')],
                    ['email', liveEditor.value('page_contact_form_email_label', 'Email Address'), 'email', liveEditor.value('page_contact_form_email_placeholder', 'you@email.com')],
                  ].map(([k, l, t, ph]) => (
                    <div key={k} className="space-y-1.5">
                      <label className="text-sm font-medium">
                        <EditableText fieldKey={`page_contact_form_${k}_label`} label={`${l} field label`} fallback={l} relatedFields={[{ key: `page_contact_form_${k}_placeholder`, label: `${l} placeholder`, type: 'text' }]} />
                      </label>
                      <input type={t} required value={form[k as keyof typeof form]} onChange={(e) => set(k, e.target.value)} placeholder={ph}
                        className={`w-full h-11 px-3.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60 ${errors[k] ? 'border-destructive' : 'border-input'}`} />
                      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
                    </div>
                  ))}
                </div>
                {[
                  ['phone', liveEditor.value('page_contact_form_phone_label', 'Phone (optional)'), 'tel', liveEditor.value('page_contact_form_phone_placeholder', '+1 234 567 8900')],
                  ['subject', liveEditor.value('page_contact_form_subject_label', 'Subject'), 'text', liveEditor.value('page_contact_form_subject_placeholder', 'How can I help you?')],
                ].map(([k, l, t, ph]) => (
                  <div key={k} className="space-y-1.5">
                    <label className="text-sm font-medium">
                      <EditableText fieldKey={`page_contact_form_${k}_label`} label={`${l} field label`} fallback={l} relatedFields={[{ key: `page_contact_form_${k}_placeholder`, label: `${l} placeholder`, type: 'text' }]} />
                    </label>
                    <input type={t} value={form[k as keyof typeof form]} onChange={(e) => set(k, e.target.value)} placeholder={ph}
                      className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60" />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    <EditableText fieldKey="page_contact_form_message_label" label="Message field label" fallback="Message" relatedFields={[{ key: 'page_contact_form_message_placeholder', label: 'Message placeholder', type: 'text' }]} />
                  </label>
                  <textarea required value={form.message} onChange={(e) => set('message', e.target.value)} rows={5} placeholder={liveEditor.value('page_contact_form_message_placeholder', 'Tell me about your project...')}
                    className={`w-full px-3.5 py-3 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60 resize-none ${errors.message ? 'border-destructive' : 'border-input'}`} />
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full h-11 gradient-brand text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all">
                  {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> <EditableText fieldKey="page_contact_form_submit_text" label="Contact submit button text" fallback="Send Message" /></>}
                </button>
              </form>
            )}
          </AnimatedSection>
        </div>
      </div>
      </EditableSection>
    </div>
  )
}
