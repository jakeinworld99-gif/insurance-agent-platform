# Insurance Agent Platform — architecture

## Stack

| Concern | Choice | One-line reason |
|---|---|---|
| Framework | Next.js (App Router) on Vercel | One repo, server routes for PDF, edge-friendly, free Hobby tier gives a public URL. |
| Database and auth | Supabase (Postgres + Auth + RLS) | One dashboard for users and tables, free tier is enough for a demo, RLS enforces agent scoping. |
| Transactional email | Resend, sender `onboarding@resend.dev` | Free tier covers demo volume, no DNS setup needed in the sandbox. |
| PDF render | `@react-pdf/renderer` in a Node route handler | React components compile to PDF in-process; no headless Chrome to ship. |
| WhatsApp share | `wa.me` deep link (`https://wa.me/<E.164>?text=...`) | Zero-account, works on phone and desktop, fits the brief. |
| Payment | In-app demo page at `/pay/[token]`, no gateway | Spec says no real gateway. The page is labelled "Demo payment" in copy and a yellow banner. |
| Repo | GitHub, deploys via Vercel git integration | Same flow as the squad's other projects. |

Pricing tiers were not re-verified live during this time-boxed sprint (Atlas flagged a 4-minute budget). The above choices are the same ones the brief already names. Flag this as "Pricing not re-verified" before production deploy.

## Environment variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, never exposed
RESEND_API_KEY=
RESEND_FROM=onboarding@resend.dev
NEXT_PUBLIC_DEMO_AGENT_EMAIL=       # shown on the landing page
NEXT_PUBLIC_APP_URL=                # https://<project>.vercel.app
```

## Supabase tables

All tables have `created_at` (default `now()`) and `updated_at` (default `now()`, trigger to bump). Row Level Security is on everywhere except `products` (read-public).

### `agents`
Extends `auth.users` with profile fields. One row per sign-up, created by a Supabase trigger on `auth.users` insert.

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| user_id | uuid unique | = `auth.users.id` |
| full_name | text | required, from sign-up form |
| phone | text | optional, E.164 |
| agency_name | text | optional |
| active | boolean | default true |
| created_at | timestamptz | |

RLS: agent can read and update only their own row (`user_id = auth.uid()`).

### `customers`

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| agent_id | uuid FK -> agents.id | the owning agent |
| full_name | text | required |
| email | text | required, used for confirmation |
| phone | text | required, E.164 with country code, no `+` |
| dob | date | required, drives age band |
| annual_income_inr | numeric | required, drives income band |
| city | text | optional |
| smoker | boolean | default false |
| occupation | text | optional |
| created_at | timestamptz | |

RLS: agent can do anything to rows where the owning agent's `user_id = auth.uid()` (joined through `agents`).

### `products` (seeded, read-only for the agent)

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| code | text unique | e.g. `TERM-20-1CR` |
| name | text | |
| type | text | `term`, `endowment`, `health` |
| min_age | int | |
| max_age | int | |
| term_years | int | |
| sum_assured_inr | numeric | |
| indicative_premium_inr | numeric | flat seed value |
| active | boolean | default true |

RLS: read for `anon` and `authenticated`. No writes from the client.

Seed rows: `TERM-10-LIFE`, `TERM-25-LIFE`, `TERM-50-LIFE`, `SAVINGS-10`, `SAVINGS-25`, `CHILD-10`, `RETIRE-50` from `seed.sql`.

### `proposals`

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| agent_id | uuid FK -> agents.id | |
| customer_id | uuid FK -> customers.id | |
| product_id | uuid FK -> products.id | |
| premium_inr | numeric | snapshot from product at the time |
| sum_assured_inr | numeric | snapshot |
| term_years | int | snapshot |
| pdf_path | text | path in Supabase Storage bucket `proposals` |
| status | text | `draft`, `shared`, `paid`, `expired` |
| created_at | timestamptz | |

RLS: agent-scoped via `agents.user_id = auth.uid()` (joined through `agents`).

### `payments`

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| proposal_id | uuid FK -> proposals.id | one payment per proposal |
| token | text unique | the URL slug for `/pay/[token]`, 32 chars |
| amount_inr | numeric | = proposal premium |
| status | text | `pending`, `paid`, `expired` |
| paid_at | timestamptz | null until paid |
| created_at | timestamptz | |

RLS:
- agent can read payments where the underlying proposal is theirs.
- `anon` can read a single payment row by `token` (used by the demo pay page). This is the only `anon` write surface and it is server-side only.

### `policies`

| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| agent_id | uuid FK -> agents.id | |
| customer_id | uuid FK -> customers.id | |
| product_id | uuid FK -> products.id | |
| proposal_id | uuid FK -> proposals.id | unique, one policy per proposal |
| policy_number | text unique | generated as `POL-<base36 timestamp>` |
| premium_inr | numeric | snapshot |
| sum_assured_inr | numeric | snapshot |
| term_years | int | snapshot |
| issued_at | timestamptz | default `now()` |

RLS: agent-scoped.

## Public vs auth-private split

- Public: `/`, `/login`, `/signup`, `/pay/[token]`, `/api/payments/[token]/confirm`, `/api/proposals/[id]/pdf` (signed URL redirect).
- Authenticated (Supabase session cookie): `/dashboard`, `/customers`, `/customers/[id]`, `/products`, `/products/[id]`, `/api/customers`, `/api/customers/[id]`, `/api/proposals`, `/api/proposals/[id]/share`, `/api/proposals/[id]/payment-link`.
- Server-only: any route that touches `SUPABASE_SERVICE_ROLE_KEY` or calls Resend.

## Route map

```
/                                  public landing
/login                             public, Supabase email+password
/signup                            public, creates auth.users row
/dashboard                         auth, customer list + KPIs
/customers/new                     auth, form
/customers/[id]                    auth, customer detail + eligible products
/products                          auth, catalogue
/products/[code]                   auth, product detail
/proposals/[id]                    auth, proposal + inline PDF + share buttons
/api/customers                     POST, auth
/api/customers/[id]                GET, auth
/api/products                      GET, auth (reads from public.products)
/api/products/eligible             POST auth, body: customer_id
/api/proposals                     POST auth, body: customer_id + product_id, returns {id, pdf_url}
/api/proposals/[id]/pdf            GET auth, returns a 302 to a signed URL
/api/proposals/[id]/share          GET auth, returns the wa.me URL
/api/proposals/[id]/payment-link   POST auth, returns {token, url}
/pay/[token]                       public, demo payment page
/api/payments/[token]/confirm      POST public, flips status to paid, creates policy, fires Resend
```

## PDF approach

- React component `ProposalPDF` lives in `components/ProposalPDF.tsx`. It uses `Document`, `Page`, `Text`, `View`, `StyleSheet`, and `Font.register` for one Indian-friendly font (Noto Sans, served from Google Fonts CDN with a fallback).
- Server route `app/api/proposals/route.ts` calls `import('@react-pdf/renderer').then(m => m.renderToBuffer(<ProposalPDF ... />))`, uploads to `proposals/<id>.pdf`, sets `proposals.pdf_path`, returns `{ id, pdf_url }`.
- The PDF must be renderable in a Node runtime. `export const runtime = 'nodejs'` on the route file. `@react-pdf/renderer` does not work on the Edge runtime.

## WhatsApp share

Server returns a string, the button is a plain `<a target="_blank">`:

```
https://wa.me/919876543210?text=<URL-encoded message>
```

Message template:

```
Hi <customer first name>, here is your insurance proposal from <agent name>.
Proposal: <product name>
Sum assured: Rs <sum_assured formatted>
Annual premium: Rs <premium formatted>
View PDF: <NEXT_PUBLIC_APP_URL>/api/proposals/<id>/pdf
```

Phone must be E.164 without the `+`. The seed customers use `91...` so the wa.me link works without a country-code picker in the demo.

## Demo payment page

`/pay/[token]` is public. The page shows:

- "Demo payment" banner at the top (yellow, full width).
- Customer name, product name, sum assured, premium.
- One button: "Pay Rs <amount> (demo)".
- On click, POST `/api/payments/<token>/confirm`. The server:
  1. Atomically flips `payments.status` from `pending` to `paid` in a single conditional UPDATE (replays return 409).
  2. Creates the `policies` row with a fresh `policy_number`.
  3. Updates the linked proposal to `status = 'paid'`.
  4. Calls Resend to send the confirmation email; any failure is returned in the response body (`email.sent=false, email.error=...`) instead of being swallowed.
  5. Returns `{ success: true, policy_number, email }`.
- The page then shows a success state with the policy number and a "Done" link back to `/` (the agent does not need to log in to see this; the agent sees it on their dashboard on next refresh).

## Resend

- Sender: `onboarding@resend.dev` (Resend's sandbox, works on the free tier without DNS).
- Recipient in the demo: the customer's email from the customer record.
- Email body: plain HTML, includes the customer's name, the policy number, the product, the premium.
- API key lives only in the server runtime env. Never `NEXT_PUBLIC_`.
- Free tier: 100 emails/day, 3,000/month. Demo will not exceed this.
- If `RESEND_API_KEY` is not set, the route returns `email: { sent: false, error: 'RESEND_API_KEY not configured' }` so the demo operator sees the failure immediately.

## Seed data

`supabase/seed.sql` inserts:
- Seven product rows (`TERM-10-LIFE`, `TERM-25-LIFE`, `TERM-50-LIFE`, `SAVINGS-10`, `SAVINGS-25`, `CHILD-10`, `RETIRE-50`).
- One auth.users row (fixed UUID `00000000-0000-0000-0000-000000000001`, password `demo1234`). The `handle_new_user` trigger then inserts the `public.agents` row keyed by `user_id`.
- One `public.customers` row tied to that agent. Re-runnable via `ON CONFLICT` (products) and an existence check (customer).

The demo email is passed via `psql --variable demo_email='owner@example.com' -f supabase/seed.sql` so the confirmation email lands in the Resend account owner's inbox.

## Things Prime needs to create

1. Supabase project, run the schema migration `supabase/migrations/0001_init.sql`.
2. Trigger `on_auth_user_created` to insert into `agents` on `auth.users` insert (already part of the migration).
3. Resend account, one API key.
4. Vercel project, link to the GitHub repo, set the seven env vars above.
5. README in repo root with run steps, env vars, demo agent email, and the seed creds.

## Open questions for Atlas

- Pricing tier for Supabase: free pauses after 7 days inactivity. Confirm "Pro" or accept the demo will pause if left alone for a week.
- Real custom domain on Resend? Out of scope for this sprint; sandbox sender is fine for the demo.
- Real custom domain on Vercel? Default `<project>.vercel.app` is acceptable for the demo.