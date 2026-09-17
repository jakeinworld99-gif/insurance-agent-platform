import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customer_id } = await req.json()
  if (!customer_id) return NextResponse.json({ error: 'Missing customer_id' }, { status: 400 })

  const { data: cust } = await supabase
    .from('customers').select('*').eq('id', customer_id).eq('agent_id', user.id).single()

  if (!cust) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const age = new Date().getFullYear() - new Date(cust.dob).getFullYear()

  const { data } = await supabase
    .from('products').select('*').eq('active', true).lte('min_age', age).gte('max_age', age)

  return NextResponse.json(data || [])
}
