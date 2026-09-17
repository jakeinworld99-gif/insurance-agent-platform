import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: proposal } = await supabase
    .from('proposals').select('*, customers(*), products(*)').eq('id', params.id).eq('agent_id', user.id).single()

  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: existing } = await supabase
    .from('payments').select('*').eq('proposal_id', params.id).eq('status', 'pending').single()

  if (existing) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.json({ url: `${appUrl}/pay/${existing.token}`, token: existing.token })
  }

  const token = `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const { data: payment, error } = await supabase.from('payments').insert({
    proposal_id: params.id,
    token,
    amount_inr: proposal.premium_inr,
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return NextResponse.json({ url: `${appUrl}/pay/${token}`, token })
}
