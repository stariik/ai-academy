-- ============================================================
-- Account-sharing guard: distinct-IP tracking per auth user.
--
-- Rule (enforced by middleware via register_user_ip RPC):
--   • every authed request records the caller's IP (throttled by cookie)
--   • from the 5th distinct IP in a rolling 30-day window → warn
--   • past 7 distinct IPs → requests from NEW IPs are blocked;
--     already-registered IPs keep working
--
-- 30-day window (not all-time) because mobile carriers rotate IPs —
-- a hard lifetime cap would lock out every legitimate phone user.
-- Rows never need manual cleanup: stale IPs age out of the count.
-- ============================================================

create table if not exists user_ips (
  user_id uuid not null references auth.users(id) on delete cascade,
  ip text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, ip)
);

comment on table user_ips is 'Distinct IPs per account for the anti-sharing limit (warn at 5, block new IPs past 7, 30-day rolling window).';

alter table user_ips enable row level security;

-- Locked down: clients never touch this table. Writes go through the
-- SECURITY DEFINER RPC below; admin reads use the service role.
drop policy if exists "user_ips deny all" on user_ips;
create policy "user_ips deny all" on user_ips
  for all using (false) with check (false);

-- ============================================================
-- register_user_ip(p_ip)
--
-- Returns one row: status ('ok' | 'warn' | 'blocked') + ip_count.
--   • known IP        → refresh last_seen, report count
--   • new IP, < 7     → register it
--   • new IP, >= 7    → 'blocked' (do NOT register)
-- Count = distinct IPs seen in the last 30 days.
-- ============================================================
create or replace function register_user_ip(p_ip text)
returns table (status text, ip_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count int;
begin
  if v_user is null or p_ip is null or length(trim(p_ip)) = 0 then
    return query select 'ok'::text, 0;
    return;
  end if;

  update user_ips set last_seen = now()
  where user_id = v_user and ip = p_ip;

  if not found then
    select count(*) into v_count from user_ips
    where user_id = v_user and last_seen > now() - interval '30 days';

    if v_count >= 7 then
      return query select 'blocked'::text, v_count;
      return;
    end if;

    insert into user_ips (user_id, ip) values (v_user, p_ip)
    on conflict (user_id, ip) do update set last_seen = now();
  end if;

  select count(*) into v_count from user_ips
  where user_id = v_user and last_seen > now() - interval '30 days';

  return query select (case when v_count >= 5 then 'warn' else 'ok' end)::text, v_count;
end;
$$;

revoke all on function register_user_ip(text) from public;
grant execute on function register_user_ip(text) to authenticated;

comment on function register_user_ip(text) is 'Record caller IP for the account-sharing limit. warn from 5 distinct IPs, blocked past 7 (30-day rolling window).';
