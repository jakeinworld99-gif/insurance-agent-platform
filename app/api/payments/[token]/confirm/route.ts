import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = await createClient()

  const { data: pay } = await supabase
    .from('payments').select('*, proposals(*, customers(*), products(*)').eq('token', params.token).single()

  if (!pay || pay.status !== 'pending') {
    return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('payments').update({ status: 'completed', paid_at: new Date().toISOString() }).eq('token', params.token)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('proposals').update({ status: 'paid' }).eq('id', pay.proposal_id)

  const proposal = pay.proposals
  const customer = proposal?.customers
  const product = proposal?.products

  const policyNumber = `POL-${Date.now().toString(36).toUpperCase()}`
  await supabase.from('policies').insert({
    proposal_id: pay.proposal_id,
    customer_id: pay.proposals?.customer_id,
    agent_id: pay.proposals?.agent_id,
    policy_number: policyNumber,
    premium_inr: pay.amount_inr,
    issued_at: new Date().toISOString(),
    status: 'active',
  })

  if (customer?.email) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: customer.email,
        subject: `Payment confirmed — Policy ${policyNumber}`,
        html: `<p>Dear ${customer.full_name},</p><p>Your payment of Rs ${pay.amount_inr} has been received. Your policy <strong>${policyNumber}</strong> for ${product?.name} is now active.</p><p>Thank you,</p><p>Your Insurance Agent</p>`,
      })
    } catch {}
  }

  return NextResponse.json({ success: true, policy_number: policyNumber })
}
