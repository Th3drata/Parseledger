/**
 * Static product artifacts for the marketing narrative — the product shown,
 * not described. Server components, no images: the UI itself is the imagery,
 * framed in hairline cards per the design reference.
 */

function Frame({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure>
      <div className="overflow-hidden rounded-cards bg-paper shadow-artifact">{children}</div>
      <figcaption className="mt-3 text-caption text-ash">{caption}</figcaption>
    </figure>
  );
}

/** A scanned statement resolving into structured rows. */
export function ExtractArtifact() {
  return (
    <Frame caption="A Barclays PDF and a phone photo of the same page produce the same structured rows.">
      <div className="grid sm:grid-cols-2">
        <div className="border-b border-hairline bg-ledger p-5 sm:border-b-0 sm:border-r">
          <p className="text-caption uppercase text-ash">Source — page 2 of 4</p>
          <div className="tnum mt-3 space-y-1.5 text-[11px] leading-relaxed text-slate">
            <p>03 Jun HMRC VAT QTR ending 31 May 742.10 D</p>
            <p>05 Jun WEWORK LONDON REF 8841 450.00 D</p>
            <p>09 Jun TESCO STORES 6642 64.88 D</p>
            <p>12 Jun STRIPE PAYOUT ST-K92 923.40 C</p>
            <p className="text-ash">— fold crease, slight skew, 200dpi —</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-caption uppercase text-ash">Extracted</p>
          <table className="mt-3 w-full text-[12px]">
            <tbody>
              {[
                ['2026-06-03', 'HMRC VAT', '−742.10'],
                ['2026-06-05', 'WeWork — office', '−450.00'],
                ['2026-06-09', 'Tesco', '−64.88'],
                ['2026-06-12', 'Stripe payout', '+923.40'],
              ].map(([d, desc, amt]) => (
                <tr key={d} className="border-b border-hairline last:border-0">
                  <td className="tnum py-1.5 pr-3 text-slate">{d}</td>
                  <td className="py-1.5 pr-3 text-ink">{desc}</td>
                  <td className="tnum py-1.5 text-right text-ink">{amt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Frame>
  );
}

/** The identity check catching a misread digit. */
export function VerifyArtifact() {
  return (
    <Frame caption="A single transposed digit — 68.44 for 64.88 — and the equation refuses to close.">
      <div className="border-l-2 border-l-flag p-5">
        <div className="tnum flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-ink">
          <span className="text-caption uppercase text-slate">Opening</span> 2,847.12
          <span className="text-ash">+</span>
          <span className="text-caption uppercase text-slate">Credits</span> 2,988.40
          <span className="text-ash">−</span>
          <span className="text-caption uppercase text-slate">Debits</span> 2,863.49
          <span className="text-ash">=</span>
          <span className="text-flag">2,972.03</span>
          <span className="font-sans text-caption text-slate">computed, but the statement prints</span>
          <span>2,975.59</span>
        </div>
        <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4 text-body-sm text-flag">
          <li>Row 4 (&ldquo;Tesco&rdquo;): computed running balance £3,436.58 ≠ printed balance £3,440.14</li>
          <li>Closing balance is off by −£3.56</li>
        </ul>
      </div>
    </Frame>
  );
}

/** The review table with one flagged row mid-correction. */
export function ReviewArtifact() {
  const rows: Array<[string, string, string, string, boolean]> = [
    ['2026-06-05', 'WeWork — office', '−450.00', '3,505.02', false],
    ['2026-06-09', 'Tesco', '68.44', '3,440.14', true],
    ['2026-06-12', 'Stripe payout', '+923.40', '4,363.54', false],
  ];
  return (
    <Frame caption="Flags point at the row, not the statement. Edit the cell and the equation re-runs as you type.">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-iron bg-ledger text-left">
            <th className="px-4 py-2 text-caption font-semibold uppercase text-slate">Date</th>
            <th className="px-4 py-2 text-caption font-semibold uppercase text-slate">Description</th>
            <th className="px-4 py-2 text-right text-caption font-semibold uppercase text-slate">Amount</th>
            <th className="px-4 py-2 text-right text-caption font-semibold uppercase text-slate">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([d, desc, amt, bal, flagged]) => (
            <tr
              key={d}
              className={`border-b border-hairline last:border-0 ${
                flagged ? 'border-l-2 border-l-flag bg-flag-wash' : ''
              }`}
            >
              <td className="tnum px-4 py-2 text-slate">{d}</td>
              <td className="px-4 py-2 text-ink">{desc}</td>
              <td className="tnum px-4 py-2 text-right">
                {flagged ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="rounded-inputs bg-paper px-1.5 py-0.5 text-flag ring-1 ring-iron">
                      {amt}
                    </span>
                    <span className="rounded-buttons bg-ink px-1.5 py-0.5 text-[10px] text-paper">Save</span>
                  </span>
                ) : (
                  <span className="text-ink">{amt}</span>
                )}
              </td>
              <td className="tnum px-4 py-2 text-right text-slate">{bal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

/** Export gated behind the badge. */
export function ExportArtifact() {
  const files = [
    ['monzo-2026-06-30.csv', 'CSV'],
    ['monzo-2026-06-30.xlsx', 'Excel'],
    ['monzo-2026-06-30.qbo', 'QuickBooks'],
    ['monzo-2026-06-30-xero.csv', 'Xero'],
  ];
  return (
    <Frame caption="Four formats from one verified statement. Unverified exports require an explicit, logged choice.">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <span className="text-body-sm text-slate">Ready to export</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-reconciled-wash px-3 py-1 text-[12px] font-medium text-reconciled">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified to the cent
        </span>
      </div>
      <ul>
        {files.map(([name, label]) => (
          <li key={name} className="flex items-center justify-between border-b border-hairline px-5 py-2.5 last:border-0">
            <span className="tnum text-[12px] text-ink">{name}</span>
            <span className="text-caption uppercase text-slate">{label}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
