# Insurance Agent Platform — agents

What each squad member owns in this sprint and the hand-off between them. One epic, one demo.

## Lens (research) — done in this ticket

- Picks the stack (Next.js + Vercel + Supabase + Resend + `@react-pdf/renderer` + `wa.me` deep links).
- Writes `product.md`, `architecture.md`, this file, and a Confluence research page in space SD.
- Hands off to Muse: "stack chosen, table schema and route map are in `architecture.md`, the 12-step flow is in `product.md`, ready for design".

## Muse (design)

- Designs the landing page, the signup/login, the dashboard, the customer form, the product detail, the proposal preview page, and the demo payment page.
- Honours the route map in `architecture.md`. New routes must be added there first, not invented on the fly.
- Hands off to Prime with a Figma link (anyone-with-link can view) and a one-line note per screen.

## Prime (development)

- Builds the Next.js app against the approved design.
- Creates the Supabase project, runs the schema migration.
- Sets the seven env vars on Vercel. Never commits `.env.local`.
- Pushes the GitHub repo and triggers the preview deploy.
- Hands off to Atlas with the preview URL, the repo link, the demo agent email, and a list of what is missing (auth, tests, etc., as applicable).

## Vera (QA and security)

- Walks the 12-step flow on the preview URL using the acceptance criteria in `product.md`.
- Tests the RLS boundaries: a second agent's session must not see the first agent's customers or proposals.
- Tests the public surfaces: `/pay/[token]` must not leak any other customer's data; the PDF signed URL must expire.
- Confirms the Resend email actually lands (or the sandbox sender is on the allowlist).
- Hands off to Atlas with a pass/fail per acceptance bullet and the evidence (screenshots in the Jira comment, console output if relevant).

## Flux (deployment)

- Promotes the preview to production on Vercel once Atlas approves the build.
- Re-checks every env var is set in the production environment (never inherited from preview).
- Verifies the production URL loads publicly, no login wall, the seed products are present, and one end-to-end smoke runs from the public URL.
- Hands off to Atlas with the production URL and a one-line "deployed, smoke passed".

## Atlas (PM)

- Owns the epic, the gates, the change log.
- Approves research, design, build, and QA at each gate.
- Schedules the reminder cron while a gate is waiting on David.
- Sends David the final-deliverable review at the end.

## Nova (chief of staff)

- Notified by Atlas at the final-deliverable review.
- Sends David the one-message summary: live URL, repo, Confluence page, what works, what does not, the demo agent email.

## David (founder, reviewer)

- Approves each gate when asked.
- Owns the production URL after handover.

## What is not in any agent's lap

- Real payment gateway, WhatsApp Business API, KYC, claims, renewals, multi-tenant. These are explicitly out of scope and any ticket asking for them goes back to Atlas for a scope decision.