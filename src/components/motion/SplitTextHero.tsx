'use client'

// SplitTextHero — titre display révélé mot par mot / lettre par lettre au scroll
// (pattern fame-estate : capitales serrées, reveal masqué, power4.out ~1.1s).
// Pas de plugin SplitText payant : découpage manuel en spans masqués.
// Deps: gsap @gsap/react
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Props = {
  text: string
  mode?: 'words' | 'chars'
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  stagger?: number
  duration?: number
}

export default function SplitTextHero({
  text,
  mode = 'words',
  className,
  as: Tag = 'h1',
  stagger,
  duration = 1.1,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const targets = ref.current?.querySelectorAll<HTMLElement>('[data-split]')
      if (!targets?.length) return
      gsap.from(targets, {
        yPercent: 112,
        duration,
        ease: 'power4.out',
        stagger: stagger ?? (mode === 'chars' ? 0.018 : 0.06),
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      })
    },
    { scope: ref },
  )

  const words = text.split(' ')
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
          {mode === 'chars' ? (
            word.split('').map((ch, ci) => (
              <span key={ci} data-split style={{ display: 'inline-block', willChange: 'transform' }}>
                {ch}
              </span>
            ))
          ) : (
            <span data-split style={{ display: 'inline-block', willChange: 'transform' }}>
              {word}
            </span>
          )}
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
