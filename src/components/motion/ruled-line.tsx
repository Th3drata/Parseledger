'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/animations/gsap';

/**
 * The ledger's ruled line, drawn: a 1px hairline that scales in from the left
 * as it enters the viewport — the section divider becomes the site's motion
 * signature. Transform-only (60fps), reduced-motion safe.
 */
export function RuledLine({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(el, { scaleX: 1 });
        return;
      }
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.1,
          ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div
      ref={ref}
      aria-hidden
      className={`h-px w-full origin-left bg-hairline ${className}`}
    />
  );
}
