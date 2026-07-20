'use client';

import { Children, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/animations/gsap';

export interface TourStep {
  kicker: string;
  title: string;
  body: string;
  note: string;
}

/**
 * Mercury-grammar sticky product tour: a pinned viewport where the left rail
 * is an accordion of steps and the right panel swaps the product artifact as
 * you scroll. CSS `sticky` does the pinning (robust under Lenis); a single
 * ScrollTrigger maps scroll progress over the tall outer container to the
 * active step. Below lg and under reduced motion it degrades to a stacked
 * static narrative — same content, no machinery.
 */
export function ProductTour({ steps, children }: { steps: TourStep[]; children: React.ReactNode }) {
  const panels = Children.toArray(children);
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
          setActive((prev) => (prev === idx ? prev : idx));
        },
      });
      return () => st.kill();
    },
    { scope: rootRef },
  );

  const jumpTo = (i: number) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const span = root.offsetHeight - window.innerHeight;
    gsap.to(window, {
      scrollTo: { y: top + (span * (i + 0.5)) / steps.length },
      duration: 0.8,
      ease: 'power2.inOut',
    });
  };

  return (
    <>
      {/* ——— Desktop: pinned tour ——— */}
      <div ref={rootRef} className="hidden lg:block" style={{ height: `${steps.length * 100}vh` }}>
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-16 px-6">
            {/* Left rail — accordion */}
            <div>
              {steps.map((step, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => jumpTo(i)}
                    aria-current={isActive}
                    className="block w-full border-t border-hairline py-5 text-left last:border-b"
                  >
                    <span className="flex items-baseline gap-3">
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 shrink-0 self-center rounded-full transition-colors duration-500 ${
                          isActive ? 'bg-ink' : 'bg-transparent'
                        }`}
                      />
                      <span className="tnum text-caption text-ash">{step.kicker}</span>
                      <span
                        className={`text-body-lg font-medium transition-colors duration-500 ${
                          isActive ? 'text-ink' : 'text-slate'
                        }`}
                      >
                        {step.title}
                      </span>
                    </span>
                    <span
                      className={`grid transition-all duration-500 ease-out ${
                        isActive ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <span className="overflow-hidden">
                        <span className="block pl-[18px] text-body-sm leading-relaxed text-ink-soft">
                          {step.body}
                        </span>
                        <span className="mt-2 block pl-[18px] text-caption text-slate">{step.note}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Right panel — swapping artifact */}
            <div className="relative">
              {panels.map((panel, i) => (
                <div
                  key={i}
                  aria-hidden={i !== active}
                  className={`transition-all duration-700 ease-out ${
                    i === active
                      ? 'relative translate-y-0 opacity-100'
                      : 'pointer-events-none absolute inset-0 translate-y-4 opacity-0'
                  }`}
                >
                  {panel}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ——— Mobile / reduced-motion: stacked narrative ——— */}
      <div className="space-y-16 lg:hidden">
        {steps.map((step, i) => (
          <div key={step.title}>
            <p className="tnum text-caption uppercase tracking-[0.14em] text-slate">{step.kicker}</p>
            <h3 className="mt-2 text-subheading font-medium text-ink">{step.title}</h3>
            <p className="mt-3 text-body text-ink-soft">{step.body}</p>
            <p className="mt-2 text-body-sm text-slate">{step.note}</p>
            <div className="mt-6">{panels[i]}</div>
          </div>
        ))}
      </div>
    </>
  );
}
