-- ============================================================
-- Payment logs — run in the Supabase SQL Editor
--
-- One row per interaction with Bank of Georgia, so every payment has a
-- readable trail of what we sent and what came back:
--
--   token          — OAuth client_credentials fetch
--   create_order   — POST /ecommerce/orders (checkout)
--   status_lookup  — GET /receipt/:order_id (reconcile fallback)
--   refund         — POST /payment/refund/:order_id (admin refund)
--   callback       — inbound BOG webhook, including the ones we reject
--
-- `payments` stores the final state; this table stores how it got there.
-- Successes are logged as well as failures — the point is being able to
-- reconstruct a disputed payment months later.
--
-- Secrets are stripped before insert (src/lib/payment-log.ts): the OAuth
-- access token and the Basic auth header never reach this table.
--
-- Written only with the service-role key. RLS denies everyone else; the
-- admin panel reads it through the service client behind getAdminUser().
-- ============================================================

create table if not exists payment_logs (
  id uuid primary key default uuid_generate_v4(),

  -- Null when we can't tie the event to a payment: a callback whose
  -- signature failed, or one naming an order we have no row for. Those are
  -- exactly the events worth keeping, so they are never dropped.
  -- `set null` (not cascade) so deleting a user keeps the money trail.
  payment_id uuid references payments(id) on delete set null,
  bog_order_id text,

  event text not null
    check (event in ('token', 'create_order', 'status_lookup', 'refund', 'callback')),
  ok boolean not null default true,
  http_status int,

  request jsonb,   -- what we sent (or, for callbacks, what arrived)
  response jsonb,  -- what came back (or our verdict on a callback)
  error text,
  duration_ms int,

  created_at timestamptz not null default now()
);

create index if not exists payment_logs_payment_idx on payment_logs (payment_id, created_at desc);
create index if not exists payment_logs_order_idx on payment_logs (bog_order_id);
create index if not exists payment_logs_created_idx on payment_logs (created_at desc);
-- Partial index: "show me what broke" is the common admin query.
create index if not exists payment_logs_failures_idx on payment_logs (created_at desc) where not ok;

comment on table payment_logs is
  'Audit trail of every Bank of Georgia request/response and inbound webhook. Secrets redacted at write time.';

alter table payment_logs enable row level security;

-- Deny-all: no anon/authenticated policy. Service role bypasses RLS.
drop policy if exists "payment_logs deny all" on payment_logs;
create policy "payment_logs deny all" on payment_logs for select using (false);
