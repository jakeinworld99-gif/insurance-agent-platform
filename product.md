# Insurance Agent Platform — product

## What this is

A public, browser-based MVP that lets an insurance agent run the full sales motion for a small Indian life-insurance book without leaving the page: see the catalogue, pick a product for a customer, generate a personalised proposal PDF, share it on WhatsApp, take a payment, and confirm by email.

It is a demo, not a regulated product. No KYC, no real claims, no IRDAI certification. The numbers are seed data. The goal is to show the agent-customer-payment loop in one click-through.

## Who uses it

One role in this demo: **agent**. Single tenant. The agent signs up with email and password, sees only their own customers and proposals. There is no separate customer login in this build. The "customer" is a record the agent creates, and the customer's email is where the confirmation lands.

## The 12-step agent flow

1. Agent opens the public landing page (`/`).
2. Agent clicks "Sign up", creates an account with email and password (Supabase Auth).
3. Agent lands on the dashboard (`/dashboard`) showing their customer list (empty initially) and a "New customer" button.
4. Agent clicks "New customer", fills name, email, phone (E.164, e.g. `919876543210`), date of birth, annual income, and city. Customer is created with `created_by` set to the agent.
5. Agent opens the customer, sees a list of eligible products filtered by the customer's profile (age band, income band, smoker/non-smoker flag — default non-smoker in the demo).
6. Agent picks one product (for example, a 20-year term plan with Rs 1 crore cover). The product detail page shows the recommended sum-assured, term, and the indicative annual premium.
7. Agent clicks "Generate proposal". The server creates a `proposals` row and renders a PDF via `@react-pdf/renderer` server-side, returning a stable URL.
8. Agent sees the PDF inline and a "Share on WhatsApp" button. The button opens `https://wa.me/<customer_phone>?text=<encoded message + PDF URL>` in a new tab.
9. Agent clicks "Generate payment link". The server creates a `payments` row with a token, returns a URL `/pay/<token]`.
10. Agent copies the payment URL (or the demo auto-fills it). The customer-facing `/pay/[token]` page shows the premium, the customer name, and a clearly labelled "Pay (demo)" button.
11. Agent (or anyone with the link) clicks Pay. The server flips the payment to `paid`, creates a `policies` row, and writes the policy number.
12. Resend sends a confirmation email to the customer's address with the policy number, the PDF URL, and a thank-you. The dashboard shows the new policy in the customer's timeline.

## Demo product catalogue (seeded)

Three products, illustrative numbers, in INR. Seeded by `seed.sql` in the repo.

| Code | Name | Type | Min age | Max age | Term | Sum assured (Rs) | Indicative annual premium (Rs) |
|---|---|---|---|---|---|---|---|
| TERM-20-1CR | SecureLife Term 20 | Term life | 18 | 55 | 20 years | 1,00,00,000 | 12,500 |
| ENDOW-15-10L | GrowEasy Endowment 15 | Endowment | 21 | 50 | 15 years | 10,00,000 | 18,200 |
| HEALTH-1L | CarePlus Hospital Cash | Health | 18 | 65 | 1 year, renewable | 1,00,000 cash/day | 4,800 |

Premium is a flat seed value, not a calc engine. Real underwriting is out of scope.

## Scope (in)

- Agent auth, agent-scoped read/write.
- Customer CRUD by the agent.
- Product catalogue read-only (seeded).
- Eligibility filter (age band, income band).
- Proposal generation (server-side PDF render).
- WhatsApp share via `wa.me` deep link.
- Demo payment page, no real gateway.
- Confirmation email via Resend.
- One agent, one demo account.

## Out of scope

- Real payment gateway (Razorpay, Stripe, etc.).
- WhatsApp Business API (we use `wa.me` deep links only).
- SMS, KYC, e-sign, Aadhaar, PAN validation.
- Mobile native, offline, push.
- Underwriting engine, premium calc, medical tests.
- Multi-tenant / multi-agent-org.
- Claims, renewals, refunds, cancellations.
- Audit log beyond Supabase defaults.
- Real IRDAI registration or compliance.

## Acceptance for the demo

A first-time visitor signs up as an agent, creates a customer, generates a proposal, shares the WhatsApp link, completes the demo payment, and receives the confirmation email, in under two minutes, with no console errors.