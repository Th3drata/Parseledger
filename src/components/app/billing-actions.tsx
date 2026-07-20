'use client';

import { useState } from 'react';

export interface CheckoutOption {
  label: string;
  priceId: string;
  quantity?: number;
}

async function postJson(url: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  if (data && typeof data === 'object' && 'url' in data && typeof data.url === 'string') {
    return data.url;
  }
  return null;
}

export function BillingActions({
  options,
  paygOption,
  hasCustomer,
}: {
  options: CheckoutOption[];
  paygOption: CheckoutOption | null;
  hasCustomer: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function checkout(opt: CheckoutOption) {
    setBusy(true);
    const url = await postJson('/api/billing/checkout', {
      priceId: opt.priceId,
      quantity: opt.quantity,
    });
    if (url) window.location.href = url;
    else setBusy(false);
  }

  async function portal() {
    setBusy(true);
    const url = await postJson('/api/billing/portal', {});
    if (url) window.location.href = url;
    else setBusy(false);
  }

  return (
    <div className="space-y-4">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={`${opt.priceId}`}
              type="button"
              disabled={busy}
              onClick={() => void checkout(opt)}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {paygOption && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout(paygOption)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {paygOption.label}
          </button>
        )}
        {hasCustomer && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void portal()}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            Manage billing
          </button>
        )}
      </div>
    </div>
  );
}
