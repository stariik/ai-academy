-- ============================================================
-- Payments (Bank of Georgia e-commerce checkout)
--
-- One row per checkout attempt. Created when the user clicks "Buy",
-- updated by the BOG server-to-server callback. A 'paid' row is what
-- justifies the matching enrollments row (source='purchase').
--
-- Writes happen only with the service-role key (checkout + callback
-- routes). RLS lets a signed-in user read their own payments.
-- ============================================================

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  bog_order_id text unique,                 -- BOG's order id (set after order creation)
  amount_cents int not null check (amount_cents > 0),  -- snapshot of price at checkout, tetri
  currency text not null default 'GEL',
  status text not null default 'created'
    check (status in ('created', 'pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_idx on payments (user_id);
create index if not exists payments_order_idx on payments (bog_order_id);

comment on table payments is 'BOG e-commerce checkout attempts. status=paid backs a source=purchase enrollment.';

alter table payments enable row level security;

drop policy if exists "payments read own" on payments;
create policy "payments read own" on payments
  for select using (auth.uid() = user_id);
