'use client'

// ScrambleIn — titre display qui se décode à l'entrée dans le viewport (et se
// redécode à l'envers en sortant si `dissolveOnLeave`, pour un titre de hero
// qui se dissout au premier scroll). Un seul moteur d'animation (GSAP ticker) :
// pas de rAF maison à côté de ScrollTrigger.
// Deps: gsap
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'

type Props = {
  text: string
  className?: string
  delay?: number // ms avant le déclenchement, pour échelonner plusieurs titres
  dissolveOnLeave?: boolean // hero : le titre se dissout quand on quitte le haut de page
  durationIn?: number // ms
  durationOut?: number // ms
}

export default function ScrambleIn({
  text,
  className,
  delay = 0,
  dissolveOnLeave = false,
  durationIn = 900,
  durationOut = 700,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(() => ' '.repeat(text.length))
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduce || !ref.current) {
      setDisplay(text)
      return
    }
    const proxy = { t: 0 }
    let tween: gsap.core.Tween | null = null

    const render = (t: number, dir: 'in' | 'out') => {
      let out = ''
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') { out += ' '; continue }
        const at = i / text.length
        if (dir === 'in') {
          out += t >= at + 0.15 ? text[i] : t >= at - 0.1 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : ' '
        } else {
          out += t >= at + 0.2 ? ' ' : t >= at - 0.05 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : text[i]
        }
      }
      setDisplay(out)
    }

    const scrambleIn = () => {
      tween?.kill()
      proxy.t = 0
      tween = gsap.to(proxy, {
        t: 1,
        duration: durationIn / 1000,
        delay: delay / 1000,
        ease: 'none',
        onUpdate: () => render(proxy.t, 'in'),
        onComplete: () => setDisplay(text),
      })
    }
    const scrambleOut = () => {
      tween?.kill()
      proxy.t = 0
      tween = gsap.to(proxy, {
        t: 1,
        duration: durationOut / 1000,
        ease: 'none',
        onUpdate: () => render(proxy.t, 'out'),
        onComplete: () => setDisplay(' '.repeat(text.length)),
      })
    }

    // reset instantané (pas d'animation) : l'élément quitte le viewport par le
    // haut, prêt à rejouer le scramble-in la prochaine fois qu'il redescend
    const resetHidden = () => {
      tween?.kill()
      setDisplay(' '.repeat(text.length))
    }

    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 85%',
      end: dissolveOnLeave ? 'top 20%' : undefined,
      onEnter: scrambleIn,
      onEnterBack: scrambleIn,
      onLeaveBack: resetHidden,
      onLeave: dissolveOnLeave ? scrambleOut : undefined,
    })

    return () => {
      tween?.kill()
      st.kill()
    }
  }, [text, delay, dissolveOnLeave, durationIn, durationOut, reduce])

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block' }}>
      {display}
    </span>
  )
}
