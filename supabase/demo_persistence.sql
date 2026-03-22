create table if not exists public.demo_bounties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  title text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.demo_submissions (
  id uuid primary key default gen_random_uuid(),
  admin_id text not null unique,
  researcher_submission_id text not null unique,
  owner_id uuid references auth.users (id) on delete set null,
  researcher_user_id uuid not null references auth.users (id) on delete cascade,
  bounty_slug text not null,
  bounty_name text not null,
  title text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.demo_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('CRITICAL', 'SUBMISSION', 'PAYOUT', 'DISPUTE')),
  title text not null,
  description text not null,
  unread boolean not null default true,
  action_label text,
  action_href text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.demo_treasury_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  bounty_slug text not null,
  type text not null check (type in ('DEPOSIT', 'PAYOUT', 'YIELD')),
  amount numeric not null,
  description text not null,
  tx_hash text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.demo_bounties enable row level security;
alter table public.demo_submissions enable row level security;
alter table public.demo_notifications enable row level security;
alter table public.demo_treasury_transactions enable row level security;

create or replace function public.handle_demo_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_demo_bounties_updated on public.demo_bounties;
create trigger on_demo_bounties_updated
before update on public.demo_bounties
for each row
execute procedure public.handle_demo_updated_at();

drop trigger if exists on_demo_submissions_updated on public.demo_submissions;
create trigger on_demo_submissions_updated
before update on public.demo_submissions
for each row
execute procedure public.handle_demo_updated_at();

drop trigger if exists on_demo_notifications_updated on public.demo_notifications;
create trigger on_demo_notifications_updated
before update on public.demo_notifications
for each row
execute procedure public.handle_demo_updated_at();

drop trigger if exists on_demo_treasury_transactions_updated on public.demo_treasury_transactions;
create trigger on_demo_treasury_transactions_updated
before update on public.demo_treasury_transactions
for each row
execute procedure public.handle_demo_updated_at();

drop policy if exists "Public can read demo bounties" on public.demo_bounties;
create policy "Public can read demo bounties"
on public.demo_bounties
for select
to anon, authenticated
using (true);

drop policy if exists "Owners can manage own demo bounties" on public.demo_bounties;
create policy "Owners can manage own demo bounties"
on public.demo_bounties
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Researchers can read own demo submissions" on public.demo_submissions;
create policy "Researchers can read own demo submissions"
on public.demo_submissions
for select
to authenticated
using ((select auth.uid()) = researcher_user_id);

drop policy if exists "Researchers can create own demo submissions" on public.demo_submissions;
create policy "Researchers can create own demo submissions"
on public.demo_submissions
for insert
to authenticated
with check ((select auth.uid()) = researcher_user_id);

drop policy if exists "Owners can read queue submissions" on public.demo_submissions;
create policy "Owners can read queue submissions"
on public.demo_submissions
for select
to authenticated
using (((select auth.uid()) = owner_id) or owner_id is null);

drop policy if exists "Owners can update queue submissions" on public.demo_submissions;
create policy "Owners can update queue submissions"
on public.demo_submissions
for update
to authenticated
using (((select auth.uid()) = owner_id) or owner_id is null)
with check (((select auth.uid()) = owner_id) or owner_id is null);

drop policy if exists "Owners can manage own notifications" on public.demo_notifications;
create policy "Owners can manage own notifications"
on public.demo_notifications
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can manage own treasury transactions" on public.demo_treasury_transactions;
create policy "Owners can manage own treasury transactions"
on public.demo_treasury_transactions
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
