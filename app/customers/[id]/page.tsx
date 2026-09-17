'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [customer, setCustomer] = useState<any>(null)
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const id = params.id as string
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: cust } = await supabase.from('customers').select('*').eq('id', id).eq('agent_id', user.id).single()
      if (!cust) { router.push('/dashboard'); return }
      setCustomer(cust)

      const [{ data: prods }, { data: pols }, { data: props }] = await Promise.all([
        supabase.from('products').select('*').eq('active', true),
        supabase.from('policies').select('*, products(*)').eq('customer_id', id).eq('agent_id', user.id),
        supabase.from('proposals').select('*, products(*)').eq('customer_id', id).eq('agent_id', user.id),
      ])
      setPolicies(pols || [])
      setProposals(props || [])

      if (cust) {
        const age = new Date().getFullYear() - new Date(cust.dob).getFullYear()
        const eligible = (prods || []).filter((p: any) => age >= p.min_age && age <= p.max_age)
        setEligibleProducts(eligible)
      }
      setLoading(false)
    })
  }, [params.id])

  const createProposal = async (productId: string) => {
    setCreating(true)
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: params.id, product_id: productId }),
    })
    const data = await res.json()
    if (data.id) {
      router.push(`/proposals/${data.id}`)
    } else {
      alert('Failed to create proposal')
      setCreating(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 p-10 text-gray-500">Loading...</div>
  if (!customer) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">← Back to Dashboard</button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
          <p className="text-gray-500 mt-1">{customer.email} · {customer.phone}</p>
          <p className="text-gray-400 text-sm mt-1">DOB: {customer.dob} · Income: Rs {customer.annual_income_inr?.toLocaleString()} · City: {customer.city}</p>
        </div>

        {proposals.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposals</h2>
            <div className="space-y-3">
              {proposals.map((prop) => (
                <Link key={prop.id} href={`/proposals/${prop.id}`} className="block border rounded-xl p-4 hover:border-blue-400 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{prop.products?.name}</p>
                      <p className="text-gray-500 text-sm">Rs {Number(prop.premium_inr).toLocaleString()}/yr · {prop.term_years} yrs</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${prop.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{prop.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Eligible Products</h2>
          {eligibleProducts.length === 0 ? (
            <p className="text-gray-500">No eligible products for this customer profile.</p>
          ) : (
            <div className="grid gap-4">
              {eligibleProducts.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <p className="text-gray-500 text-sm">{p.type} · {p.term_years} years · Sum: Rs {Number(p.sum_assured_inr).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">Rs {Number(p.indicative_premium_inr).toLocaleString()}/yr</p>
                    </div>
                  </div>
                  <button
                    onClick={() => createProposal(p.id)}
                    disabled={creating}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Proposal'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {policies.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Policies</h2>
            <div className="grid gap-4">
              {policies.map((pol) => (
                <div key={pol.id} className="border border-green-200 bg-green-50 rounded-xl p-5">
                  <p className="font-semibold text-gray-900">{pol.products?.name}</p>
                  <p className="text-gray-600 text-sm font-mono">Policy #{pol.policy_number}</p>
                  <p className="text-gray-500 text-sm">Premium: Rs {Number(pol.premium_inr).toLocaleString()}/yr · Issued: {new Date(pol.issued_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
