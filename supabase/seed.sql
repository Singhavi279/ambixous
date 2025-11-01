-- Seed event categories
with upsert_community as (
  insert into public.event_categories (key, label, display_order)
  values ('community', 'Community', 1)
  on conflict (key) do update set label = excluded.label, display_order = excluded.display_order
  returning id
),
upsert_corporate as (
  insert into public.event_categories (key, label, display_order)
  values ('corporate', 'Corporate', 2)
  on conflict (key) do update set label = excluded.label, display_order = excluded.display_order
  returning id
)
select 1;

-- Helper CTE to read category ids
with community as (
  select id from public.event_categories where key = 'community'
),
corporate as (
  select id from public.event_categories where key = 'corporate'
)
-- Upcoming events
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  registration_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  is_featured,
  published_at
)
select
  'disrupting-the-funnel',
  'Disrupting the Funnel',
  'AdTech innovators on taking a brand from 0 → 1.',
  'Disrupting the Funnel is an afternoon of candid insights, proven playbooks, and pitfalls to avoid from AdTech innovators and growth leaders on taking a brand from 0 → 1.',
  corporate.id,
  'in_person',
  'Noida',
  'India',
  'https://www.commudle.com/communities/ambixous/events/disrupting-the-funnel-the-future-of-adtech-brand-marketing',
  100,
  'closed',
  true,
  timestamptz '2025-09-13 13:00:00+05:30',
  timestamptz '2025-09-13 17:00:00+05:30',
  'Asia/Kolkata',
  true,
  now()
from corporate
where not exists (select 1 from public.events where slug = 'disrupting-the-funnel');

with community as (
  select id from public.event_categories where key = 'community'
)
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  registration_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  is_featured,
  published_at
)
select
  'skillup-bootcamp',
  'SkillUp Bootcamp',
  'High-impact learning experience to upskill with industry experts.',
  'A high-impact learning experience for developers, designers, and tech professionals to upskill through live sessions with experts from Google, Deloitte, Policy Bazaar, and Nagarro.',
  community.id,
  'in_person',
  'Noida',
  'India',
  'https://www.commudle.com/communities/ambixous/events/skillup-bootcamp',
  200,
  'closed',
  true,
  timestamptz '2025-08-02 10:30:00+05:30',
  timestamptz '2025-08-02 16:00:00+05:30',
  'Asia/Kolkata',
  true,
  now()
from community
where not exists (select 1 from public.events where slug = 'skillup-bootcamp');

-- Past events
with corporate as (
  select id from public.event_categories where key = 'corporate'
)
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  recap_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  published_at
)
select
  'fusion-forum-2025',
  'Fusion Forum',
  'Corporate networking event bringing together startups and established companies for collaboration.',
  'Corporate networking event bringing together startups and established companies for collaboration.',
  corporate.id,
  'in_person',
  'Noida',
  'India',
  'https://reskilll.com/event/devconnect',
  80,
  'closed',
  true,
  timestamptz '2025-07-19 10:00:00+05:30',
  timestamptz '2025-07-19 16:00:00+05:30',
  'Asia/Kolkata',
  now()
from corporate
where not exists (select 1 from public.events where slug = 'fusion-forum-2025');

with community as (
  select id from public.event_categories where key = 'community'
)
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  recap_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  published_at
)
select
  'ai-for-social-good-2025',
  'AI for Social Good',
  'Collaborative workshop with Google WTM exploring AI applications for social impact and community development.',
  'Collaborative workshop with Google WTM exploring AI applications for social impact and community development.',
  community.id,
  'in_person',
  'Noida',
  'India',
  'https://www.commudle.com/communities/ambixous/events/ai-for-social-good-wtm-google-x-ambixous',
  200,
  'closed',
  true,
  timestamptz '2025-04-05 10:00:00+05:30',
  timestamptz '2025-04-05 17:00:00+05:30',
  'Asia/Kolkata',
  now()
from community
where not exists (select 1 from public.events where slug = 'ai-for-social-good-2025');

with community as (
  select id from public.event_categories where key = 'community'
)
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  recap_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  published_at
)
select
  'ambitious-women-live-2025',
  'The Ambitious Women: LIVE',
  'International Women''s Day celebration featuring inspiring stories from women leaders across industries.',
  'International Women''s Day celebration featuring inspiring stories from women leaders across industries.',
  community.id,
  'in_person',
  'Noida',
  'India',
  'https://www.commudle.com/communities/ambixous/events/the-ambitious-women-real-stories-real-empowerment',
  300,
  'closed',
  true,
  timestamptz '2025-03-08 10:00:00+05:30',
  timestamptz '2025-03-08 18:00:00+05:30',
  'Asia/Kolkata',
  now()
from community
where not exists (select 1 from public.events where slug = 'ambitious-women-live-2025');

with corporate as (
  select id from public.event_categories where key = 'corporate'
)
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  recap_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  published_at
)
select
  'brb-boring-replaced-by-bots-2024',
  'BRB : Boring Replaced by Bots',
  'A live event where top creatives explore AI''s impact on design, answer questions, and spark collaboration.',
  'A live event where top creatives explore AI''s impact on design, answer questions, and spark collaboration.',
  corporate.id,
  'in_person',
  'Noida',
  'India',
  'https://www.commudle.com/communities/ambixous/events/brb-boring-replaced-by-bots',
  40,
  'closed',
  true,
  timestamptz '2024-03-01 11:00:00+05:30',
  timestamptz '2024-03-01 15:00:00+05:30',
  'Asia/Kolkata',
  now()
from corporate
where not exists (select 1 from public.events where slug = 'brb-boring-replaced-by-bots-2024');

with community as (
  select id from public.event_categories where key = 'community'
)
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  recap_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  published_at
)
select
  'innovators-meetup-2025',
  'Innovator''s Meetup',
  'Expert insights, job readiness, and thought leadership in tech and design.',
  'An opportunity to gain expert insights, boost job readiness, expand your network, and showcase thought leadership in tech and design.',
  community.id,
  'in_person',
  'Noida',
  'India',
  'https://www.commudle.com/communities/ambixous/events/innovator-s-meetup',
  150,
  'closed',
  true,
  timestamptz '2025-02-09 10:00:00+05:30',
  timestamptz '2025-02-09 16:00:00+05:30',
  'Asia/Kolkata',
  now()
from community
where not exists (select 1 from public.events where slug = 'innovators-meetup-2025');

with corporate as (
  select id from public.event_categories where key = 'corporate'
)
insert into public.events (
  slug,
  title,
  summary,
  description,
  category_id,
  format,
  venue_city,
  venue_country,
  recap_url,
  expected_attendees,
  status,
  is_published,
  start_at,
  end_at,
  timezone,
  published_at
)
select
  'founders-day-meetup-2025',
  'Founder’s Day Meetup',
  'A celebration of Ambixous’s milestones empowering women in tech.',
  'A celebration of Ambixous’s milestones, fostering networking, inspiring tech leaders, and driving innovation with a focus on empowering women in tech.',
  corporate.id,
  'in_person',
  'Noida',
  'India',
  'https://www.commudle.com/communities/ambixous/events/founder-s-day-meetup',
  500,
  'closed',
  true,
  timestamptz '2025-01-18 10:00:00+05:30',
  timestamptz '2025-01-18 18:00:00+05:30',
  'Asia/Kolkata',
  now()
from corporate
where not exists (select 1 from public.events where slug = 'founders-day-meetup-2025');

-- Speakers for upcoming events
insert into public.event_speakers (event_id, full_name, sort_order)
select e.id, payload.speaker_name, payload.sort_order
from (
  values
    ('disrupting-the-funnel', 1, 'Ms.Shaweta Berry'),
    ('disrupting-the-funnel', 2, 'Rohit Kaul'),
    ('disrupting-the-funnel', 3, 'Rachita Gupta'),
    ('disrupting-the-funnel', 4, 'Sayantan Dasgupta'),
    ('skillup-bootcamp', 1, 'Varedh Nigam'),
    ('skillup-bootcamp', 2, 'Nitasha Dhingra'),
    ('skillup-bootcamp', 3, 'Sneha Swaroop'),
    ('skillup-bootcamp', 4, 'Satendra Kumar')
) as payload(slug, sort_order, speaker_name)
join public.events e on e.slug = payload.slug
where not exists (
  select 1 from public.event_speakers es
  where es.event_id = e.id and es.full_name = payload.speaker_name
);

-- Impact metrics for past events
insert into public.event_metrics (event_id, actual_attendees, impact_summary)
select e.id, payload.actual_attendees, payload.impact
from (
  values
    ('fusion-forum-2025', 80, '12 partnerships formed'),
    ('ai-for-social-good-2025', 200, '5 social projects launched'),
    ('ambitious-women-live-2025', 300, '50+ mentorship connections'),
    ('brb-boring-replaced-by-bots-2024', 40, '10+ mentorship connections'),
    ('innovators-meetup-2025', 150, '15+ mentorship connections'),
    ('founders-day-meetup-2025', 500, '70+ mentorship connections')
) as payload(slug, actual_attendees, impact)
join public.events e on e.slug = payload.slug
where not exists (
  select 1 from public.event_metrics em
  where em.event_id = e.id
);
