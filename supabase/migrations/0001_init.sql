-- Insurance Agent Platform — schema migration 0001
-- Run this against the Supabase project

create extension if not exists "pgcrypto";

-- Agents table (extends Supabase auth.users)
create table public.agents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique not null references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  agency_name text,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Products
create table public.products (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,
  name                  text not null,
  type                  text not null,
  min_age               integer not null,
  max_age               integer not null,
  term_years            integer not null,
  sum_assured_inr       bigint not null,
  indicative_premium_inr bigint not null,
  active                boolean default true,
  created_at            timestamptz default now()
);

-- Customers
create table public.customers (
  id                  uuid primary key default gen_random_uuid(),
  agent_id            uuid not null references public.agents(id) on delete cascade,
  full_name           text not null,
  email               text,
  phone               text,
  dob                 date,
  smoker              boolean default false,
  annual_income_inr   bigint,
  city                text,
  occupation          text,
  created_at          timestamptz default now()
);

-- Proposals
create table public.proposals (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers(id) on delete cascade,
  product_id        uuid not null references public.products(id),
  agent_id          uuid not null references public.agents(id),
  pdf_path          text,
  pdf_url           text,
  status            text default 'draft',
  premium_inr       bigint,
  sum_assured_inr   bigint,
  term_years        integer,
  created_at        timestamptz default now()
);

-- Payments
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references public.proposals(id) on delete cascade,
  token           text unique not null,
  amount_inr      bigint not null,
  status          text default 'pending',
  paid_at         timestamptz,
  created_at      timestamptz default now()
);

-- Policies
create table public.policies (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid references public.proposals(id),
  customer_id     uuid references public.customers(id),
  agent_id        uuid references public.agents(id),
  policy_number   text unique not null,
  premium_inr     bigint,
  issued_at       timestamptz,
  status          text default 'active',
  created_at      timestamptz default now()
);

-- Row Level Security
alter table public.agents          enable row level security;
alter table public.customers       enable row level security;
alter table public.proposals       enable row level security;
alter table public.payments        enable row level security;
alter table public.policies        enable row level security;
alter table public.products        enable row level security;

-- Agents: user manages their own row
create policy "agents_select" on public.agents for select using (auth.uid() = user_id);
create policy "agents_insert" on public.agents for insert with check (auth.uid() = user_id);
create policy "agents_update" on public.agents for update using (auth.uid() = user_id);

-- Customers: agents see/manage only their own
create policy "customers_select" on public.customers for select using (
  exists (select 1 from public.agents where agents.id = customers.agent_id and agents.user_id = auth.uid())
);
create policy "customers_insert" on public.customers for insert with check (
  exists (select 1 from public.agents where agents.id = customers.agent_id and agents.user_id = auth.uid())
);
create policy "customers_update" on public.customers for update using (
  exists (select 1 from public.agents where agents.id = customers.agent_id and agents.user_id = auth.uid())
);

-- Proposals: agents manage only their own
create policy "proposals_select" on public.proposals for select using (
  exists (select 1 from public.agents where agents.id = proposals.agent_id and agents.user_id = auth.uid())
);
create policy "proposals_insert" on public.proposals for insert with check (
  exists (select 1 from public.agents where agents.id = proposals.agent_id and agents.user_id = auth.uid())
);
create policy "proposals_update" on public.proposals for update using (
  exists (select 1 from public.agents where agents.id = proposals.agent_id and agents.user_id = auth.uid())
);

-- Payments: agents see payments on their proposals
create policy "payments_select" on public.payments for select using (
  exists (select 1 from public.proposals where proposals.id = payments.proposal_id
    and exists (select 1 from public.agents where agents.id = proposals.agent_id and agents.user_id = auth.uid()))
);

-- Policies: agents see their own
create policy "policies_select" on public.policies for select using (
  exists (select 1 from public.agents where agents.id = policies.agent_id and agents.user_id = auth.uid())
);
create policy "policies_insert" on public.policies for insert with check (
  exists (select 1 from public.agents where agents.id = policies.agent_id and agents.user_id = auth.uid())
);

-- Products: public read
create policy "products_select" on public.products for select using (true);

-- Enable triggers for auto-creating agents row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.agents (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
