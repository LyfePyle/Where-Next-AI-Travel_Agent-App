-- One-time: copy legacy saved_trips into trips (if you used the old save flow)
insert into public.trips (
  id,
  user_id,
  title,
  destination,
  start_date,
  end_date,
  adults,
  kids,
  budget_amount,
  status,
  created_at
)
select
  id,
  user_id,
  coalesce(title, destination, 'Untitled trip'),
  destination,
  start_date,
  end_date,
  coalesce(
    (preferences->'travelers'->>'adults')::int,
    travelers,
    2
  ),
  coalesce((preferences->'travelers'->>'children')::int, 0),
  case when budget_cents is not null then budget_cents::numeric / 100 else null end,
  'saved',
  created_at
from public.saved_trips
where user_id is not null
on conflict (id) do nothing;
