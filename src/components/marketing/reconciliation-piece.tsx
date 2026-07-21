'use client';

import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/animations/gsap';

/**
 * Signature piece — "The Reconciliation".
 * Levier: la donnée-comme-beauté + le produit qui se démontre.
 * Sens produit: cet effet montre l'écriture comptable que le moteur exécute
 * sur chaque relevé — sommer, casser, corriger, certifier.
 * A pinned, scroll-driven ledger entry: rows print, the identity assembles,
 * the mismatch breaks it in red, the correction closes it, the stamp lands.
 * Perf: CSS transitions on opacity/transform only; one ScrollTrigger.
 * Mobile/reduced-motion: static stamped composition, nothing lost.
 */

const ROWS: Array<[string, string, string]> = [
  ['01 Jun', 'Acme Consulting Ltd — invoice 0142', '+1,850.00'],
  ['03 Jun', 'HMRC VAT', '−742.10'],
  ['09 Jun', 'Tesco', '−68.44'],
  ['12 Jun', 'Stripe payout', '+923.40'],
  ['30 Jun', 'Bank charges', '−23.38'],
];

const STEPS: Array<{ kicker: string; label: string; note: string }> = [
  { kicker: '01', label: 'Record', note: 'Every row, exactly as printed.' },
  { kicker: '02', label: 'Sum', note: 'Credits and debits, integer pence.' },
  { kicker: '03', label: 'Break', note: 'The identity refuses to close.' },
  { kicker: '04', label: 'Correct', note: 'One cell, re-run live.' },
  { kicker: '05', label: 'Certify', note: 'Zero issues. The stamp lands.' },
];

export function ReconciliationPiece() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setStep(STEPS.length - 1);
        return;
      }
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        setStep(STEPS.length - 1);
        return;
      }
      setPinned(true);
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const idx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
          setStep((prev) => (prev === idx ? prev : idx));
        },
      });
      return () => st.kill();
    },
    { scope: rootRef },
  );

  const jumpTo = (i: number) => {
    const root = rootRef.current;
    if (!root || !pinned) return;
    const top = window.scrollY + root.getBoundingClientRect().top;
    const span = root.offsetHeight - window.innerHeight;
    gsap.to(window, {
      scrollTo: { y: top + (span * (i + 0.5)) / STEPS.length },
      duration: 0.7,
      ease: 'power2.inOut',
    });
  };

  const corrected = step >= 3;
  const certified = step >= 4;
  const broken = step >= 2 && !corrected;
  const tescoAmount = corrected ? '−64.88' : '−68.44';
  const debits = corrected ? '2,863.49' : '2,867.05';
  const computed = corrected ? '2,975.59' : '2,972.03';

  const show = (from: number) =>
    `transition-all duration-700 ease-out ${
      step >= from ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
    }`;

  return (
    <div ref={rootRef} className="lg:h-[500vh]">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
        <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:py-0">
          {/* Step rail */}
          <div className="hidden lg:block">
            <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
              The ledger entry
            </p>
            <h2 className="mt-4 font-serif text-heading font-normal text-ink">
              What the engine does, in five movements
            </h2>
            <ol className="mt-10">
              {STEPS.map((s, i) => (
                <li key={s.kicker}>
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    aria-current={i === step}
                    className="flex w-full items-baseline gap-3 border-t border-hairline py-3 text-left last:border-b"
                  >
                    <span
                      className={`tnum text-caption transition-colors duration-500 ${
                        i <= step ? 'text-ink' : 'text-ash'
                      }`}
                    >
                      {s.kicker}
                    </span>
                    <span
                      className={`text-body font-medium transition-colors duration-500 ${
                        i === step ? 'text-ink' : 'text-slate'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span
                      className={`ml-auto text-right text-caption transition-opacity duration-500 ${
                        i === step ? 'text-slate opacity-100' : 'opacity-0'
                      }`}
                    >
                      {s.note}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* Mobile heading */}
          <div className="lg:hidden">
            <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
              The ledger entry
            </p>
            <h2 className="mt-4 font-serif text-heading font-normal text-ink">
              What the engine does, in five movements
            </h2>
          </div>

          {/* The sheet */}
          <div className="ruled-paper relative rounded-cards border border-hairline bg-paper p-6 pb-24 sm:p-10 sm:pb-28">
            {/* 01 — rows print */}
            <div className="space-y-0">
              {ROWS.map(([date, desc, amt], i) => (
                <div
                  key={date}
                  className={`flex items-baseline justify-between gap-4 border-b border-hairline py-2 ${show(0)}`}
                  style={{ transitionDelay: step === 0 ? `${i * 90}ms` : '0ms' }}
                >
                  <span className="tnum shrink-0 text-caption text-slate">{date}</span>
                  <span className="min-w-0 flex-1 truncate text-body-sm text-ink-soft">{desc}</span>
                  <span
                    className={`tnum shrink-0 text-figure transition-colors duration-500 ${
                      desc === 'Tesco' && broken
                        ? 'text-flag'
                        : desc === 'Tesco' && corrected
                          ? 'text-reconciled'
                          : 'text-ink'
                    }`}
                  >
                    {desc === 'Tesco' ? tescoAmount : amt}
                  </span>
                </div>
              ))}
              <p className={`tnum pt-2 text-caption text-ash ${show(0)}`}>… 5 more rows</p>
            </div>

            {/* 02 — the identity assembles */}
            <div className={`mt-8 ${show(1)}`}>
              <div className="tnum flex flex-wrap items-end gap-x-4 gap-y-3 text-figure text-ink sm:text-figure-lg">
                <span className="whitespace-nowrap">
                  <span className="block text-caption uppercase tracking-wide text-slate">Opening</span>
                  2,847.12
                </span>
                <span className="whitespace-nowrap">
                  <span className="block text-caption uppercase tracking-wide text-slate">Credits</span>
                  <span className="text-ash">+ </span>2,988.40
                </span>
                <span className="whitespace-nowrap">
                  <span className="block text-caption uppercase tracking-wide text-slate">Debits</span>
                  <span className="text-ash">− </span>
                  <span className={`transition-colors duration-500 ${broken ? 'text-flag' : ''}`}>
                    {debits}
                  </span>
                </span>
                <span className="whitespace-nowrap">
                  <span className="block text-caption uppercase tracking-wide text-slate">Computed</span>
                  <span className="text-ash">= </span>
                  <span className={`transition-colors duration-500 ${broken ? 'text-flag' : certified ? 'text-reconciled' : ''}`}>
                    {computed}
                  </span>
                </span>
              </div>
            </div>

            {/* 03 — the break */}
            <div
              className={`mt-6 border-l-2 py-2 pl-4 transition-all duration-700 ${
                broken
                  ? 'translate-y-0 border-l-flag opacity-100'
                  : corrected
                    ? 'translate-y-0 border-l-reconciled opacity-100'
                    : 'translate-y-3 border-l-hairline opacity-0'
              }`}
            >
              {broken ? (
                <p className="text-body-sm text-flag">
                  Statement prints closing <span className="tnum">2,975.59</span> — off by{' '}
                  <span className="tnum">−3.56</span>. Row 3 (&ldquo;Tesco&rdquo;) flagged: printed
                  balance disagrees.
                </p>
              ) : (
                <p className="text-body-sm text-reconciled">
                  <span className="tnum">68.44</span> corrected to <span className="tnum">64.88</span> —
                  the identity re-ran on the keystroke and closed to the penny.
                </p>
              )}
            </div>

            {/* 05 — the stamp */}
            {certified ? (
              <div className="pointer-events-none absolute bottom-6 right-6 sm:bottom-10 sm:right-10">
                <span className="stamp-in inline-block rounded-tags border-2 border-reconciled px-4 py-2 text-center">
                  <span className="block text-caption font-semibold uppercase tracking-[0.2em] text-reconciled">
                    Verified
                  </span>
                  <span className="tnum block text-caption text-reconciled">to the cent</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
