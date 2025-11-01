-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Event categories
create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Core events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  summary text,
  description text,
  category_id uuid not null references public.event_categories(id) on delete restrict,
  format text not null default 'in_person',
  venue_name text,
  venue_address text,
  venue_city text,
  venue_state text,
  venue_country text,
  registration_url text,
  recap_url text,
  expected_attendees integer,
  status text not null default 'draft' check (status in ('draft', 'published', 'limited', 'closed', 'cancelled', 'archived')),
  is_published boolean not null default false,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Asia/Kolkata',
  hero_media_url text,
  display_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- People attached to an event
create table if not exists public.event_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  title text,
  organization text,
  bio text,
  headshot_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Event outcome metrics powering the highlights section
create table if not exists public.event_metrics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  actual_attendees integer,
  impact_summary text,
  highlight_metrics jsonb,
  satisfaction_score numeric(5,2),
  revenue numeric(12,2),
  testimonials jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Media associated with an event (images, recordings, decks)
create table if not exists public.event_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  asset_type text not null,
  storage_path text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Helper to update timestamps
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.enforce_event_dates()
returns trigger as $$
begin
  if new.end_at < new.start_at then
    raise exception 'end_at must be greater than or equal to start_at';
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.auto_close_events()
returns trigger as $$
begin
  if new.end_at < now() and new.status = 'published' then
    new.status = 'closed';
  end if;
  if new.status in ('published', 'limited', 'closed', 'archived') then
    new.is_published = true;
  else
    new.is_published = false;
  end if;
  return new;
end;
$$ language plpgsql;

-- Attach triggers
create trigger trg_events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create trigger trg_events_enforce_dates
before insert or update on public.events
for each row
execute function public.enforce_event_dates();

create trigger trg_events_auto_close
before insert or update on public.events
for each row
execute function public.auto_close_events();

-- Materialized speaker list for faster reads (used by the views)
create or replace view public.view_event_speakers as
select
  e.id as event_id,
  coalesce(json_agg(es.full_name order by es.sort_order) filter (where es.id is not null), '[]'::json) as speakers
from public.events e
left join public.event_speakers es on es.event_id = e.id
group by e.id;

-- Upcoming events view consumed by Next.js
create or replace view public.view_upcoming_events as
select
  e.id,
  e.slug,
  e.title,
  e.summary,
  e.description,
  e.start_at,
  e.end_at,
  e.timezone,
  ec.label as type_label,
  ec.key as type_key,
  e.venue_name,
  e.venue_city,
  e.venue_country,
  e.registration_url,
  e.expected_attendees,
  e.status,
  vs.speakers
from public.events e
left join public.event_categories ec on ec.id = e.category_id
left join public.view_event_speakers vs on vs.event_id = e.id
where coalesce(e.is_published, false) = true
  and e.end_at >= now()
  and e.status in ('published', 'limited', 'closed')
order by e.start_at asc;

-- Past events view that powers the highlights and CMS
create or replace view public.view_past_events as
select
  e.id,
  e.slug,
  e.title,
  e.summary,
  e.description,
  e.start_at,
  e.end_at,
  e.timezone,
  ec.label as type_label,
  ec.key as type_key,
  e.venue_city,
  e.venue_country,
  e.registration_url,
  e.recap_url,
  e.expected_attendees,
  em.actual_attendees,
  em.impact_summary,
  vs.speakers
from public.events e
left join public.event_categories ec on ec.id = e.category_id
left join public.event_metrics em on em.event_id = e.id
left join public.view_event_speakers vs on vs.event_id = e.id
where coalesce(e.is_published, false) = true
  and e.end_at < now()
  and e.status in ('published', 'closed', 'archived')
order by e.end_at desc;

-- Basic Row Level Security
alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.event_speakers enable row level security;
alter table public.event_metrics enable row level security;
alter table public.event_assets enable row level security;

-- Public read-only access for published data
create policy if not exists "Public read event categories" on public.event_categories
for select
using (true);

create policy if not exists "Public read events" on public.events
for select
using (coalesce(is_published, false) = true);

create policy if not exists "Public read event speakers" on public.event_speakers
for select
using (exists (
  select 1 from public.events e
  where e.id = event_id and coalesce(e.is_published, false) = true
));

create policy if not exists "Public read event metrics" on public.event_metrics
for select
using (exists (
  select 1 from public.events e
  where e.id = event_id and coalesce(e.is_published, false) = true
));

create policy if not exists "Public read event assets" on public.event_assets
for select
using (exists (
  select 1 from public.events e
  where e.id = event_id and coalesce(e.is_published, false) = true
));

-- Admin-only CRUD powered by Google OAuth email match
create policy if not exists "Admin manage event categories" on public.event_categories
for all to authenticated
using (auth.email() = 't20avnish@gmail.com')
with check (auth.email() = 't20avnish@gmail.com');

create policy if not exists "Admin manage events" on public.events
for all to authenticated
using (auth.email() = 't20avnish@gmail.com')
with check (auth.email() = 't20avnish@gmail.com');

create policy if not exists "Admin manage event speakers" on public.event_speakers
for all to authenticated
using (auth.email() = 't20avnish@gmail.com')
with check (auth.email() = 't20avnish@gmail.com');

create policy if not exists "Admin manage event metrics" on public.event_metrics
for all to authenticated
using (auth.email() = 't20avnish@gmail.com')
with check (auth.email() = 't20avnish@gmail.com');

create policy if not exists "Admin manage event assets" on public.event_assets
for all to authenticated
using (auth.email() = 't20avnish@gmail.com')
with check (auth.email() = 't20avnish@gmail.com');

-- Supabase realtime publications
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.event_speakers;
alter publication supabase_realtime add table public.event_metrics;
alter publication supabase_realtime add table public.event_assets;
