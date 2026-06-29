import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Code2, Heart, Zap, Users, Camera } from 'lucide-react'
import AnimatedSection from '@/components/shared/AnimatedSection'
import { staggerContainer, fadeUp } from '@/utils/motion'
import { publicApi } from '@/api/public'
import { EditableImage, EditableSection, EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'
import EditableSocialLinks from '@/components/shared/EditableSocialLinks'

const values = [
  { icon: Zap, title: 'Speed & Performance', desc: 'Every project is built for speed — fast load times, clean code, optimized assets.' },
  { icon: Heart, title: 'Client-First Approach', desc: 'Your goals are my goals. I stay involved until every detail is exactly right.' },
  { icon: Code2, title: 'Quality Code', desc: 'Clean, maintainable, scalable code that stands the test of time.' },
  { icon: Users, title: 'Long-Term Partnership', desc: 'I build lasting relationships, not just one-off projects.' },
]

const skills = [
  'React / Next.js', 'Laravel / PHP', 'WordPress', 'Tailwind CSS', 'SEO Optimization',
  'E-Commerce (WooCommerce/Shopify)', 'UI/UX Design (Figma)', 'Digital Marketing',
  'AI Integration', 'MySQL / PostgreSQL',
]

export default function About() {
  const [profilePhoto, setProfilePhoto] = useState('')
  const liveEditor = useLiveEditor()

  useEffect(() => {
    publicApi.settings().then(r => {
      const d = r.data?.data || {}
      if (d.about_profile_photo) setProfilePhoto(d.about_profile_photo)
    }).catch(() => {})
  }, [])

  const liveProfilePhoto = liveEditor.value('about_profile_photo', profilePhoto)
  const editableValues = values.map((value, index) => ({
    ...value,
    title: liveEditor.value(`page_about_value_${index}_title`, value.title),
    desc: liveEditor.value(`page_about_value_${index}_desc`, value.desc),
    titleKey: `page_about_value_${index}_title`,
    descKey: `page_about_value_${index}_desc`,
  }))
  const editableSkills = skills.map((skill, index) => ({
    text: liveEditor.value(`page_about_skill_${index}`, skill),
    key: `page_about_skill_${index}`,
  }))

  return (
    <div className="flex flex-col pb-24">
      {/* Hero */}
      <EditableSection sectionKey="page_about_hero_section" label="About hero">
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-36 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <EditableText fieldKey="page_about_hero_eyebrow" label="About hero eyebrow" fallback="About Me" as="p" className="text-primary text-sm font-semibold uppercase tracking-wider mb-3" />
              <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground dark:text-white mb-5 leading-tight">
                <EditableText fieldKey="page_about_hero_title_prefix" label="About hero title prefix" fallback="Hi, I'm" /> <EditableText fieldKey="page_about_hero_title_name" label="About hero highlighted name" fallback="Amir Nazir" as="span" className="gradient-text" />
              </h1>
              <p className="text-muted-foreground dark:text-white/60 text-lg leading-relaxed mb-6">
                <EditableText fieldKey="page_about_hero_intro" label="About hero intro" fallback="A passionate digital services professional with 5+ years of experience helping businesses establish a powerful online presence through web design, development, SEO, and digital marketing." type="textarea" />
              </p>
              <p className="text-muted-foreground/80 dark:text-white/50 leading-relaxed mb-8">
                <EditableText fieldKey="page_about_hero_description" label="About hero description" fallback="I specialize in building clean, fast, and high-converting websites paired with data-driven marketing strategies that actually move the needle for your business." type="textarea" />
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={liveEditor.value('page_about_hero_btn1_url', '/portfolio')} className="gradient-brand text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 justify-center">
                  <EditableText fieldKey="page_about_hero_btn1_text" label="About hero primary button text" fallback="View My Work" relatedFields={[{ key: 'page_about_hero_btn1_url', label: 'About hero primary button URL', type: 'url' }]} /> <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to={liveEditor.value('page_about_hero_btn2_url', '/contact')} className="bg-foreground/5 dark:bg-white/8 border border-foreground/15 dark:border-white/15 text-foreground dark:text-white font-semibold px-6 py-3 rounded-xl hover:bg-foreground/10 dark:hover:bg-white/12 transition-all text-center">
                  <EditableText fieldKey="page_about_hero_btn2_text" label="About hero secondary button text" fallback="Get In Touch" relatedFields={[{ key: 'page_about_hero_btn2_url', label: 'About hero secondary button URL', type: 'url' }]} />
                </Link>
              </div>
              <div className="mt-7">
                <EditableText fieldKey="page_about_social_heading" label="About social heading" fallback="Find me online" as="p" className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-white/40" />
                <EditableSocialLinks />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="flex justify-center">
              <div className="relative">
                {/* Glow effect behind photo */}
                <div className="absolute inset-0 rounded-3xl gradient-brand opacity-25 blur-2xl scale-105" />

                {/* Profile photo or placeholder */}
                <div className="relative w-64 h-72 sm:w-80 sm:h-96 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl shadow-primary/30">
                  {liveProfilePhoto ? (
                    <EditableImage
                      fieldKey="about_profile_photo"
                      label="About profile photo"
                      fallback={liveProfilePhoto}
                      alt="Amir Nazir"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // Placeholder — update via Admin Builder → About → Settings tab
                    <button
                      type="button"
                      onClick={(event) => {
                        if (!liveEditor.editMode) return
                        event.preventDefault()
                        event.stopPropagation()
                        liveEditor.select({ key: 'about_profile_photo', label: 'About profile photo', type: 'image' })
                      }}
                      className={`w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex flex-col items-center justify-center gap-4 ${liveEditor.editMode ? 'cursor-pointer outline outline-2 outline-dashed outline-blue-400 outline-offset-[-6px]' : ''}`}
                    >
                      <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-primary/60" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-white/40 text-sm font-medium">Profile Photo</p>
                        <p className="text-white/20 text-xs mt-1">Upload via Builder → About → Settings</p>
                      </div>
                      <div className="text-4xl font-heading font-bold text-white/10">AN</div>
                    </button>
                  )}
                </div>

                {/* Experience badge */}
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-xl border border-slate-100 dark:border-slate-700">
                  <EditableText fieldKey="page_about_experience_value" label="Experience badge value" fallback="5+ Years" as="p" className="font-bold text-foreground text-base" />
                  <EditableText fieldKey="page_about_experience_label" label="Experience badge label" fallback="Experience" as="p" className="text-muted-foreground text-xs" />
                </div>

                {/* Available badge */}
                <div className="absolute -top-3 -left-3 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <EditableText fieldKey="page_about_available_label" label="Availability badge label" fallback="Available" as="p" className="text-white text-xs font-semibold" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* Values */}
      <EditableSection sectionKey="page_about_values_section" label="About values">
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <EditableText fieldKey="page_about_values_title" label="About values title" fallback="What I Stand For" as="h2" className="font-heading font-bold text-3xl" />
          </AnimatedSection>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {editableValues.map((v, i) => (
              <motion.div key={v.title} variants={fadeUp} custom={i}
                className="p-6 rounded-2xl bg-muted/40 border border-border hover:border-primary/20 hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-white" />
                </div>
                <EditableText fieldKey={v.titleKey} label={`About value ${i + 1} title`} fallback={v.title} as="h3" className="font-semibold text-base mb-2" />
                <EditableText fieldKey={v.descKey} label={`About value ${i + 1} description`} fallback={v.desc} as="p" type="textarea" className="text-muted-foreground text-sm leading-relaxed" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </EditableSection>

      {/* Skills */}
      <EditableSection sectionKey="page_about_skills_section" label="About skills">
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <AnimatedSection className="text-center mb-10">
            <EditableText fieldKey="page_about_skills_title" label="About skills title" fallback="Skills & Technologies" as="h2" className="font-heading font-bold text-3xl mb-3" />
            <EditableText fieldKey="page_about_skills_subtitle" label="About skills subtitle" fallback="The tools and technologies I use to build exceptional digital experiences." as="p" className="text-muted-foreground" type="textarea" />
          </AnimatedSection>
          <AnimatedSection delay={1} className="flex flex-wrap gap-3 justify-center">
            {editableSkills.map((s, index) => (
              <span key={s.key} className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary inline mr-1.5" /><EditableText fieldKey={s.key} label={`Skill ${index + 1}`} fallback={s.text} />
              </span>
            ))}
          </AnimatedSection>
        </div>
      </section>
      </EditableSection>

      {/* CTA */}
      <EditableSection sectionKey="page_about_cta_section" label="About CTA">
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <EditableText fieldKey="page_about_cta_title" label="About CTA title" fallback="Ready to work together?" as="h2" className="font-heading font-bold text-3xl mb-4" />
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              <EditableText fieldKey="page_about_cta_subtitle" label="About CTA subtitle" fallback="Let's discuss your project and create something amazing for your business." type="textarea" />
            </p>
            <Link to={liveEditor.value('page_about_cta_btn_url', '/contact')} className="gradient-brand text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2">
              <EditableText fieldKey="page_about_cta_btn_text" label="About CTA button text" fallback="Start a Conversation" relatedFields={[{ key: 'page_about_cta_btn_url', label: 'About CTA button URL', type: 'url' }]} /> <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
      </EditableSection>
    </div>
  )
}
