# Parseledger — architecture contract

Read this before writing any code. It is the integration contract between
work streams. The product spec lives in the build brief (README handoff);
tagline: **"Verified to the cent."**

## Non-negotiables

- TypeScript **strict**, no `any`, no `@ts-ignore`, no type assertions to dodge errors.
- **Money is ALWAYS integer minor units** (`number`, integer). Any float touching money is a bug.
  Use `parseMoneyToMinor` / `formatMinor` from `@/money`.
- `reconcileStatement()` from `@/verification` is the single source of truth for
  verification. Never re-implement its checks. The `VerificationResult` it returns
  drives: row highlighting, the "Verified to the cent" badge (`verified === true`
  ONLY), and export gating.
- Server components by default; `"use client"` only where interaction demands it.
- Kebab-case component files, camelCase utilities. Tailwind 4 utilities only —
  tokens are defined in `src/app/globals.css` (achromatic + one green accent).
  Money renders with class `tnum`.
- Review-before-you-rely: export is gated behind the review step. Unverified
  export must be an explicit "Export unverified" action.

## Layout

```
src/types.ts            Domain types (ExtractedStatement, VerificationResult…)
src/money.ts            parseMoneyToMinor / formatMinor
src/verification.ts     reconcileStatement()
src/extraction.ts       ExtractionProvider + AnthropicExtractionProvider + router
src/lib/store.ts        Job store (in-memory now; Postgres behind same interface later)
src/lib/demo.ts         Sample statements for demo mode / demo widget
src/export/             M2 exporters: csv.ts, xlsx.ts, qbo.ts, xero.ts (+ tests)
src/app/(marketing)/    Landing, pricing, security, /convert/[slug], hubs
src/app/app/            The product: upload, job list, review screen
src/app/api/            Route handlers
src/components/app/     Product UI components
src/components/marketing/  Marketing components (incl. demo widget)
```

## Contracts

- **Exporters** (`src/export/`): each takes `(stmt: ExtractedStatement)` and
  returns file content (`string` for CSV/QBO/Xero, `Buffer`/`Uint8Array` for
  xlsx). Pure functions, no I/O, unit-tested with `node:test`.
- **Job store** (`src/lib/store.ts`): `createJob`, `getJob`, `updateJob`,
  `listJobs`. A Job holds `{ id, fileName, status, statement, result, createdAt }`
  where `result = reconcileStatement(statement)` recomputed on every edit.
- **Extraction API** (`src/app/api/jobs/route.ts`): POST multipart file →
  creates job, runs extraction (or demo fallback when `ANTHROPIC_API_KEY` is
  absent — use `src/lib/demo.ts`), reconciles, stores. Client polls or receives
  the job id and navigates to `/app/jobs/[id]`.
- **Live re-verify**: the review table edits amounts/balances client-side and
  re-runs `reconcileStatement` locally (it is pure and isomorphic) for instant
  feedback; persistence of edits goes through PATCH `/api/jobs/[id]`.

## Voice

Sober, precise, confidence through proof — never hype. UK/IE bookkeeper
audience. No exclamation marks. The green badge is earned, not decorative.
