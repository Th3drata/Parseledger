'use client'

// Reveal baseline : fade + montée au scroll. DROP-IN → copier dans src/components/ (aucune modif).
// Props : delay (s), y (px de départ), as (balise). reduced-motion safe.
import { useRef, type ReactNode, type ElementType } from 'react'
import { gsap, useGSAP } from '@/animations/gsap'

type Props = { children: ReactNode; as?: ElementType; className?: string; delay?: number; y?: number }

export default function Reveal({ children, as: Tag = 'div', className, delay = 0, y = 24 }: Props) {
  const ref = useRef<HTMLElement>(null)
  useGSAP(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { gsap.set(el, { opacity: 1, y: 0 }); return }
    gsap.fromTo(el, { opacity: 0, y },
      { opacity: 1, y: 0, duration: 0.7, delay, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
  }, { scope: ref })
  return <Tag ref={ref} className={className}>{children}</Tag>
}
