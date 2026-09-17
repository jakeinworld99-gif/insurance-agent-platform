import { createClient, getAgentId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const agentId = await getAgentId(supabase)
  if (!agentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}