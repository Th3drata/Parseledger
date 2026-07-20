-- better-auth schema for the Postgres (Kysely) adapter.
-- Hand-written from better-auth 1.6 core table definitions
-- (@better-auth/core/db get-tables) because @better-auth/cli is not installed.
-- Column names are camelCase and MUST be quoted: better-auth quotes every
-- identifier, so unquoted lowercase columns would not match.
--
-- Passkeys are intentionally omitted (the passkey plugin ships in a separate
-- package that is not installed). emailAndPassword only.
--
-- Apply this AFTER db/schema.sql on the same database.

create table if not exists "user" (
  "id"            text primary key,
  "name"          text not null,
  "email"         text not null unique,
  "emailVerified" boolean not null default false,
  "image"         text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

create table if not exists "session" (
  "id"        text primary key,
  "userId"    text not null references "user"("id") on delete cascade,
  "token"     text not null unique,
  "expiresAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "account" (
  "id"                    text primary key,
  "userId"                text not null references "user"("id") on delete cascade,
  "accountId"             text not null,
  "providerId"            text not null,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope"                 text,
  "password"              text,
  "createdAt"             timestamptz not null default now(),
  "updatedAt"             timestamptz not null default now()
);

create table if not exists "verification" (
  "id"         text primary key,
  "identifier" text not null,
  "value"      text not null,
  "expiresAt"  timestamptz not null,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);

create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");
