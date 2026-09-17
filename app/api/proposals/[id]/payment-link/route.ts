import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const proposalId = params.id
  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .eq('agent_id', user.id)
    .single()

  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const pdfUrl = `${appUrl}/api/proposals/${proposalId}/pdf`

  if (!proposal.pdf_url) {
    await supabase.from('proposals').update({ pdf_url: pdfUrl }).eq('id', proposalId)
  }

  const { data: existing } = await supabase
    .from('payments').select('*').eq('proposal_id', proposalId).single()

  if (existing) {
    return NextResponse.json({ token: existing.token, url: `${appUrl}/pay/${existing.token}`, pdf_url: pdfUrl })
  }

  const payToken = crypto.randomUUID().replace(/-/g, '').slice(0, 32)
  const { data: payment } = await supabase
    .from('payments')
    .insert({ proposal_id: proposalId, token: payToken, amount_inr: proposal.premium_inr, status: 'pending' })
    .select().single()

  return NextResponse.json({ token: payToken, url: `${appUrl}/pay/${payToken}`, pdf_url: pdfUrl })
}
