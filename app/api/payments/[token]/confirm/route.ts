import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = await createClient()

  // Atomic single-shot: only the request that successfully flips a pending row
  // to completed gets back the row. Concurrent or replayed POSTs that find the
  // row already non-pending (completed, failed, expired) see zero rows updated
  // and get a 409 with the current status. This is the Postgres-level guard:
  // we do not need a transaction because the conditional UPDATE is atomic in
  // a single statement.
  const { data: pay, error: flipError } = await supabase
    .from('payments')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('token', params.token)
    .eq('status', 'pending')
    .select('*, proposals(*, customers(*), products(*))')
    .single()

  if (flipError || !pay) {
    const { data: existing } = await supabase
      .from('payments')
      .select('status')
      .eq('token', params.token)
      .single()
    if (!existing) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    return NextResponse.json(
      {
        error: 'Payment already processed',
        status: existing.status,
        replay: true,
      },
      { status: 409 }
    )
  }

  const { error: proposalUpdateErr } = await supabase
    .from('proposals')
    .update({ status: 'paid' })
    .eq('id', pay.proposal_id)

  const proposal = pay.proposals
  const customer = proposal?.customers
  const product = proposal?.products

  const policyNumber = `POL-${Date.now().toString(36).toUpperCase()}`
  const { error: policyErr } = await supabase.from('policies').insert({
    proposal_id: pay.proposal_id,
    customer_id: pay.proposals?.customer_id,
    agent_id: pay.proposals?.agent_id,
    policy_number: policyNumber,
    premium_inr: pay.amount_inr,
    issued_at: new Date().toISOString(),
    status: 'active',
  })

  let email: { sent: boolean; id?: string; error?: string } = { sent: false }
  if (policyErr) {
    email = { sent: false, error: `policy insert failed: ${policyErr.message}` }
  } else if (!customer?.email) {
    email = { sent: false, error: 'customer has no email on file' }
  } else if (!process.env.RESEND_API_KEY) {
    email = { sent: false, error: 'RESEND_API_KEY not configured' }
  } else {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: customer.email,
        subject: `Payment confirmed - Policy ${policyNumber}`,
        html: `<p>Dear ${customer.full_name},</p><p>Your payment of Rs ${pay.amount_inr} has been received. Your policy <strong>${policyNumber}</strong> for ${product?.name} is now active.</p><p>Thank you,</p><p>Your Insurance Agent</p>`,
      })
      if (error) {
        email = { sent: false, error: error.message || String(error) }
      } else {
        email = { sent: true, id: data?.id }
      }
    } catch (e) {
      email = { sent: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  return NextResponse.json({
    success: true,
    policy_number: policyNumber,
    policy_insert_ok: !policyErr,
    proposal_status_synced: !proposalUpdateErr,
    email,
    warnings: [
      proposalUpdateErr ? `proposal status sync failed: ${proposalUpdateErr.message}` : null,
      policyErr ? `policy insert failed: ${policyErr.message}` : null,
    ].filter(Boolean),
  })
}