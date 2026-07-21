'use client'

// ScrambleText — décodage caractère par caractère au survol (pill de nav, lien,
// CTA secondaire). Un mot ou une courte étiquette, jamais un paragraphe.
// Pattern extrait d'un produit premium analysé (SynapseX) — vérifié et reporté
// sur notre socle.
import { useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

type Props = {
  text: string
  isHovered: boolean
  className?: string
}

export default function ScrambleText({ text, isHovered, className }: Props) {
  const [display, setDisplay] = useState(text)
  const frameRef = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduce) return
    const stop = () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (!isHovered) {
      stop()
      setDisplay(text)
      return
    }
    frameRef.current = 0
    const totalFrames = text.length * 4 + 4
    intervalRef.current = window.setInterval(() => {
      frameRef.current += 1
      const frame = frameRef.current
      let out = ''
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') { out += ' '; continue }
        out += frame >= i * 4 ? text[i] : CHARS[Math.floor(Math.random() * CHARS.length)]
      }
      setDisplay(out)
      if (frame >= totalFrames) stop()
    }, 25)
    return stop
  }, [isHovered, text, reduce])

  return <span className={className}>{display}</span>
}
