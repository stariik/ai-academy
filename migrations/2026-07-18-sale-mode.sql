-- ============================================================
-- Sale mode (2026-07-18)
--
-- One-click storefront-wide sale: /api/admin/sale-mode snapshots every
-- current price into price_snapshots (one jsonb row), then sets every
-- paid course and every category bundle to 1 tetri (0.01 ₾). Restore
-- reads the latest row, puts the exact prices back, and deletes it —
-- so a row existing means sale mode is active.
--
-- RLS is enabled with no policies: anon/authenticated clients can't
-- touch it; only the service-role client used by the admin API can.
-- ============================================================

create table if not exists price_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prices jsonb not null
);

alter table price_snapshots enable row level security;

comment on table price_snapshots is
  'Pre-sale backup of courses.price_cents + category_images.bundle_price_cents. One row per sale-mode activation; row present = sale active. Service-role writes only.';
