import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { fadeIn, fadeUp, scaleIn } from '@/utils/motion'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  variant?: 'fadeUp' | 'fadeIn' | 'scaleIn'
}

export default function AnimatedSection({ children, className = '', delay = 0, variant = 'fadeUp' }: Props) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  const variants = variant === 'fadeIn' ? fadeIn : variant === 'scaleIn' ? scaleIn : fadeUp

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  )
}
