'use client'

// Bridge GSAP + plugins + useGSAP. DROP-IN → copier dans src/animations/gsap.ts (aucune modif).
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP)

export { gsap, ScrollTrigger, ScrollToPlugin, useGSAP }

export function scrollTo(target: string) {
  gsap.to(window, { scrollTo: { y: target, offsetY: 80 }, duration: 0.8, ease: 'power2.inOut' })
}
