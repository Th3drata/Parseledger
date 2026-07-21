'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ambient hero video, mounted only when it can actually play:
 * desktop + motion-safe. Autoplay is attempted explicitly and, when the
 * browser refuses it (Safari Low Power Mode, strict autoplay policies),
 * retried on the first user gesture. Mobile and reduced-motion never mount
 * the element, so the file is never downloaded there. The still image
 * underneath is always rendered — this only fades in on top once playing.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = window.matchMedia('(min-width: 640px)').matches;
    if (!reduce && desktop) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => {
      v.play().catch(() => {
        /* autoplay refused — the gesture listeners below retry */
      });
    };
    const onPlaying = () => setPlaying(true);
    v.addEventListener('playing', onPlaying);
    tryPlay();
    const onGesture = () => tryPlay();
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('scroll', onGesture, { once: true, passive: true });
    return () => {
      v.removeEventListener('playing', onPlaying);
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('scroll', onGesture);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover object-[25%_center] transition-opacity duration-700 ${
        playing ? 'opacity-100' : 'opacity-0'
      }`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
    >
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  );
}
