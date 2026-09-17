-- Seed data for Insurance Agent Platform
-- Run AFTER migration 0001_init.sql
--
-- Parameter: --variable demo_email=<address>
--   The Resend account can only deliver to the email address that owns the
--   Resend account, so the demo agent signs up with that same address and the
--   demo customer also uses it. Pass it at the psql command line:
--
--     psql "$DATABASE_URL" \
--       --variable demo_email='owner@example.com' \
--       -f supabase/seed.sql
--
--   If you forget to pass it, the script falls back to a clearly-fake
--   placeholder so the failure is obvious instead of silent.
--
-- Demo credentials after this seed runs:
--   email:    <demo_email>
--   password: demo1234
--
-- The trigger public.handle_new_user (from migration 0001) creates the
-- matching public.agents row automatically when this auth.users insert lands.

-- 1. Demo products (re-runnable)
insert into public.products (code, name, type, min_age, max_age, term_years, sum_assured_inr, indicative_premium_inr) values
('TERM-10-LIFE', 'Term Life Insurance 10L', 'term', 18, 50, 10, 10000000, 12000),
('TERM-25-LIFE', 'Term Life Insurance 25L', 'term', 18, 55, 15, 25000000, 28000),
('TERM-50-LIFE', 'Term Life Insurance 50L', 'term', 18, 45, 20, 50000000, 55000),
('SAVINGS-10', 'Endowment Savings Plan 10L', 'endowment', 18, 40, 10, 10000000, 85000),
('SAVINGS-25', 'Endowment Savings Plan 25L', 'endowment', 18, 35, 15, 25000000, 180000),
('CHILD-10', 'Child Education Plan 10L', 'child', 18, 45, 15, 10000000, 65000),
('RETIRE-50', 'Pension Plan 50K/month', 'pension', 25, 45, 20, 0, 96000)
on conflict (code) do nothing;

-- 2. Demo agent (auth.users row; trigger inserts the public.agents row).
-- Fixed UUID so the customer FK below is deterministic and the seed is
-- re-runnable without duplicating rows.
do $$
declare
  v_email text := coalesce(nullif(:'demo_email', ''), 'demo-owner@example.com');
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_agent_id uuid;
begin
  insert into auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    v_email, crypt('demo1234', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Demo Agent'),
    now(), now(), '', '', '', ''
  )
  on conflict (id) do nothing;

  -- The handle_new_user trigger inserts the public.agents row keyed by user_id.
  -- Fetch the resulting agents.id so we can attach the demo customer to it.
  select id into v_agent_id
    from public.agents
    where user_id = v_user_id;

  -- Fallback for re-runs where the trigger didn't run (e.g. trigger installed
  -- after the auth.users row already existed). Insert directly.
  if v_agent_id is null then
    insert into public.agents (user_id, full_name, phone, agency_name)
    values (v_user_id, 'Demo Agent', '+91999900001', 'Demo Agency')
    returning id into v_agent_id;
  end if;

  -- 3. Demo customer tied to that agent.
  -- customers has no unique constraint, so re-runs would duplicate. Guard by
  -- checking existence first.
  if not exists (
    select 1 from public.customers
    where agent_id = v_agent_id and email = v_email
  ) then
    insert into public.customers (agent_id, full_name, email, phone, dob, annual_income_inr, city, smoker, occupation)
    values (
      v_agent_id,
      'Demo Customer',
      v_email,
      '+91999900002',
      '1990-01-01',
      800000,
      'Mumbai',
      false,
      'Software Engineer'
    );
  end if;
end $$;