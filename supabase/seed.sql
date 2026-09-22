-- Seed data for Insurance Agent Platform v2 (fresh schema)
-- Run AFTER migration 0001_init.sql.
--
-- Demo: 3 products covering Term / Health / Vehicle, 2 demo agents,
-- 1 demo customer whose email is the Resend account-owner email
-- so the confirmation email actually delivers.
--
-- Parameter: pass demo_email at psql command line:
--   psql "$DATABASE_URL" \
--     --variable demo_email='owner@example.com' \
--     -f supabase/seed.sql
--
-- Demo credentials after this seed runs:
--   agent 1: <demo_email> / demo1234
--   agent 2: agent2-<demo_email> / demo1234
--   customer: same email as agent 1 (Resend owner)

-- 1. Products across Term / Health / Vehicle (at least three, one per type).
insert into public.products (code, name, type, min_age, max_age, term_years, sum_assured_inr, indicative_premium_inr) values
('TERM-25-LIFE',  'Term Life Cover 25L',     'term',    18, 55, 15,  2500000, 12000),
('HEALTH-10-FAM',  'Family Health 10L',       'health',  18, 60, 1,   1000000,  9500),
('VEHICLE-CAR',   'Comprehensive Car Cover', 'vehicle', 18, 70, 1,   1500000,  6500)
on conflict (code) do nothing;

-- 2. Two demo agents (auth.users rows; trigger inserts the public.agents rows).
--    Fixed UUIDs so the seed is re-runnable and customer FKs are deterministic.
do $$
declare
  v_email text := coalesce(nullif(:'demo_email', ''), 'demo-owner@example.com');
  v_agent1_id uuid := '00000000-0000-0000-0000-000000000001';
  v_agent2_id uuid := '00000000-0000-0000-0000-000000000002';
  v_agents_id1 uuid;
  v_agents_id2 uuid;
begin
  -- Agent 1
  insert into auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  values (
    v_agent1_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    v_email, crypt('demo1234', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Demo Agent One'),
    now(), now(), '', '', '', ''
  )
  on conflict (id) do nothing;

  select id into v_agents_id1 from public.agents where user_id = v_agent1_id;
  if v_agents_id1 is null then
    insert into public.agents (user_id, full_name, phone, agency_name)
    values (v_agent1_id, 'Demo Agent One', '+91-98000-00001', 'Demo Agency')
    returning id into v_agents_id1;
  end if;

  -- Agent 2 (separate email so it's a distinct account)
  insert into auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  values (
    v_agent2_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'agent2+' || split_part(v_email, '@', 1) || '@' || split_part(v_email, '@', 2),
    crypt('demo1234', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Demo Agent Two'),
    now(), now(), '', '', '', ''
  )
  on conflict (id) do nothing;

  select id into v_agents_id2 from public.agents where user_id = v_agent2_id;
  if v_agents_id2 is null then
    insert into public.agents (user_id, full_name, phone, agency_name)
    values (v_agent2_id, 'Demo Agent Two', '+91-98000-00002', 'Demo Agency Two')
    returning id into v_agents_id2;
  end if;

  -- 3. One demo customer owned by agent 1, using the Resend owner email
  -- so the confirmation email delivers.
  if not exists (
    select 1 from public.customers
    where agent_id = v_agents_id1 and email = v_email
  ) then
    insert into public.customers (agent_id, full_name, email, phone, dob, annual_income_inr, city, smoker, occupation)
    values (
      v_agents_id1,
      'Demo Customer',
      v_email,
      '+91-98000-00099',
      '1990-01-01',
      800000,
      'Mumbai',
      false,
      'Software Engineer'
    );
  end if;
end $$;