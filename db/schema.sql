-- Parseledger schema (Supabase Postgres, EU region).
-- All money columns are BIGINT integer minor units. Never numeric/float.
--
-- RLS NOTE: auth is better-auth, NOT Supabase Auth, so auth.uid() is useless
-- here. The anon key must NEVER reach this database. All access goes through
-- the Next.js server using the service-role connection; ownership is enforced
-- in application code via owner_id. Keep RLS enabled with no anon policies as
-- a belt-and-braces lockout.

create table clients (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null,            -- better-auth user id
  name        text not null,
  created_at  timestamptz not null default now()
);

create table jobs (
  id            uuid primary key default gen_random_uuid(),
  owner_id      text not null,
  client_id     uuid references clients(id) on delete set null,
  status        text not null default 'processing'
                check (status in ('processing', 'review', 'exported', 'failed')),
  file_name     text not null,
  storage_path  text not null,          -- Supabase Storage object; purged at delete_after
  page_count    int not null default 0,
  delete_after  timestamptz not null,   -- auto-purge deadline (privacy promise)
  created_at    timestamptz not null default now()
);

create table statements (
  id                     uuid primary key default gen_random_uuid(),
  job_id                 uuid not null references jobs(id) on delete cascade,
  bank_name              text not null,
  account_holder         text,
  account_number         text,
  currency               text not null,
  period_start           date,
  period_end             date,
  opening_balance_minor  bigint not null,
  closing_balance_minor  bigint not null,
  verified               boolean not null default false
);

create table transactions (
  id             uuid primary key default gen_random_uuid(),
  statement_id   uuid not null references statements(id) on delete cascade,
  row_index      int not null,
  tx_date        date not null,
  description    text not null,
  amount_minor   bigint not null,       -- signed: credits +, debits −
  balance_minor  bigint,                -- printed running balance, if any
  unique (statement_id, row_index)
);

create table verification_issues (
  id              uuid primary key default gen_random_uuid(),
  statement_id    uuid not null references statements(id) on delete cascade,
  code            text not null,
  row_index       int,                  -- null = statement-level
  message         text not null,
  expected_minor  bigint,
  actual_minor    bigint
);

create table usage_events (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null,
  job_id      uuid references jobs(id) on delete set null,
  pages       int not null,
  created_at  timestamptz not null default now()
);

create table subscriptions (
  owner_id             text primary key,
  stripe_customer_id   text not null,
  tier                 text not null default 'free'
                       check (tier in ('free', 'solo', 'pro', 'practice')),
  payg_pages_balance   int not null default 0,  -- non-expiring top-up pages
  current_period_end   timestamptz,
  updated_at           timestamptz not null default now()
);

create index on jobs (owner_id, created_at desc);
create index on jobs (delete_after);
create index on transactions (statement_id, row_index);
create index on usage_events (owner_id, created_at);

alter table clients enable row level security;
alter table jobs enable row level security;
alter table statements enable row level security;
alter table transactions enable row level security;
alter table verification_issues enable row level security;
alter table usage_events enable row level security;
alter table subscriptions enable row level security;
-- No policies on purpose: only the service role (which bypasses RLS) may read/write.
