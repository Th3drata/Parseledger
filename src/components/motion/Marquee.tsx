'use client'

// Bandeau défilant infini (certifications, logos partenaires, mots-clés, avis courts). DROP-IN. CSS pur.
// reduced-motion → figé. Pause au survol. Passer les éléments en children :
//   <Marquee><span>Qualibat RGE</span><span>Garantie décennale</span>…</Marquee>
import { type ReactNode } from 'react'

export default function Marquee({ children, speed = 28, reverse = false, className = '' }:
  { children: ReactNode; speed?: number; reverse?: boolean; className?: string }) {
  return (
    <div className={`group flex overflow-hidden ${className}`}>
      <style>{`@keyframes smk-marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.smk-track{animation:none}}`}</style>
      <div className="smk-track flex shrink-0 items-center gap-12 pr-12 group-hover:[animation-play-state:paused]"
        style={{ animation: `smk-marq ${speed}s linear infinite`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        {children}{children}
      </div>
    </div>
  )
}
