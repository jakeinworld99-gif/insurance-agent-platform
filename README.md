# Insurance Agent Platform

A public MVP that lets an insurance agent run the full sales motion for a small Indian life-insurance book in one browser tab.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 App Router on Vercel |
| Database + Auth | Supabase (Postgres + Auth + RLS) |
| Email | Resend, sender `onboarding@resend.dev` |
| PDF render | `@react-pdf/renderer` in a Node.js route handler |
| WhatsApp | `wa.me` deep links |
| Payments | In-app demo page at `/pay/[token]`, no real gateway |

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd insurance-agent-platform
npm install
```

### 2. Supabase setup

1. Create a Supabase project at https://supabase.com
2. Note your project ref, anon key, and service role key
3. Run the schema migration in `supabase/migrations/0001_init.sql`
4. Run the seed data in `supabase/seed.sql` (pass your Resend account-owner email as `psql ... --variable demo_email='owner@example.com' -f supabase/seed.sql` so the confirmation email lands in your inbox; the seed inserts one demo agent and one demo customer tied to that agent)

> No storage bucket is required. The proposal PDF is rendered server-side in
> the Node route handler and streamed back to the browser. There is no
> Supabase Storage upload anywhere in this build.

### 3. Resend setup

1. Create an account at https://resend.com
2. Create an API key
3. Note your sender email (use `onboarding@resend.dev` on the free tier)

### 4. Environment variables

Create a `.env.local` file in the project root (never commit this file):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### 6. GitHub + Vercel deploy

1. Push to a new GitHub repo named `insurance-agent-platform`
2. Import the repo into Vercel
3. Set all the environment variables above in the Vercel project settings
4. Vercel deploys on push to the linked branch

## Demo flow

1. Open the live URL and click **Sign Up**
2. Create an account as an insurance agent
3. On the dashboard, click **+ New Customer** and fill in the form
4. Open the customer, see eligible products
5. Click **Generate Proposal PDF** to render and download the PDF
6. Click **Share on WhatsApp** to open the wa.me deep link
7. Click **Generate Payment Link** to create a demo payment URL
8. Open the payment URL, click **Pay (demo)** to simulate payment
9. Check the customer's email for the confirmation email

## Architecture

See `architecture.md` for the full technical design including the Supabase schema, RLS policies, API routes, and PDF approach.

## What is missing

- No real payment gateway (Razorpay, Stripe, etc.)
- No KYC, e-sign, or IRDAI compliance
- No tests
- No SMS or WhatsApp Business API
- No multi-tenant support

## Credentials

Demo credentials after running `supabase/seed.sql --variable demo_email=<address>`:
- email: `<address>` (the Resend account-owner email)
- password: `demo1234`

If you did not run the seed, sign up live via `/signup`.