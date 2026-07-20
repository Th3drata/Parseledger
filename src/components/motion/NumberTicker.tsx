'use client'

// Compteur qui s'incrémente quand il entre dans l'écran (stats : « 126 chantiers/an », « depuis 1921 »).
// DROP-IN. Dep : gsap. reduced-motion → valeur finale directe. Format FR (espaces milliers).
// ⚠️ Ticker AU-DESSUS de la ligne de flottaison (hero) → passer start="top bottom",
// sinon le seuil par défaut ('top 90%') peut ne jamais se déclencher sans scroll et laisser « 0 ».
import { useRef } from 'react'
import { gsap, useGSAP } from '@/animations/gsap'

export default function NumberTicker({ value, suffix = '', duration = 1.6, className = '', start = 'top 90%' }:
  { value: number; suffix?: string; duration?: number; className?: string; start?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = value.toLocaleString('en-GB') + suffix
      return
    }
    const o = { v: 0 }
    gsap.to(o, {
      v: value, duration, ease: 'power1.out',
      scrollTrigger: { trigger: el, start },
      onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-GB') + suffix },
    })
  }, { scope: ref })
  return <span ref={ref} className={className}>0{suffix}</span>
}
