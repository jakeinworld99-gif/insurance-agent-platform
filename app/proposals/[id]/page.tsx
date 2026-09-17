'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id as string
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('proposals')
        .select('*, customers(*), products(*), payments(*)')
        .eq('id', id)
        .eq('agent_id', user.id)
        .single()
      setProposal(data)
      setLoading(false)
    })
  }, [params.id])

  const generatePaymentLink = async () => {
    const res = await fetch(`/api/proposals/${params.id}/payment-link`, { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.prompt('Share this payment link with your customer:', data.url)
      window.location.reload()
    }
  }

  const shareWhatsApp = async () => {
    if (!proposal) return
    const customer = proposal.customers
    const product = proposal.products
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const msg = `Hi ${customer.full_name.split(' ')[0]}, here is your insurance proposal from your agent.\n\nProposal: ${product.name}\nSum assured: Rs ${Number(product.sum_assured_inr).toLocaleString()}\nAnnual premium: Rs ${Number(product.indicative_premium_inr).toLocaleString()}\n\nView PDF: ${appUrl}/api/proposals/${params.id}/pdf`
    window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return <div className="min-h-screen bg-gray-50 p-10 text-gray-500">Loading...</div>
  if (!proposal) return <div className="min-h-screen bg-gray-50 p-10 text-gray-500">Proposal not found</div>

  const customer = proposal.customers
  const product = proposal.products
  const payment = proposal.payments?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">← Back</button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900">Proposal for {customer?.full_name}</h1>
          <p className="text-gray-500 mt-1">{product?.name}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Sum Assured:</span> <strong>Rs {Number(proposal.sum_assured_inr).toLocaleString()}</strong></div>
            <div><span className="text-gray-500">Premium:</span> <strong>Rs {Number(proposal.premium_inr).toLocaleString()}/yr</strong></div>
            <div><span className="text-gray-500">Term:</span> <strong>{proposal.term_years} years</strong></div>
            <div><span className="text-gray-500">Status:</span> <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{proposal.status}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <a
              href={`/api/proposals/${params.id}/pdf`}
              target="_blank"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              View PDF
            </a>
            <button
              onClick={shareWhatsApp}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              Share on WhatsApp
            </button>
            {proposal.status === 'draft' && (
              <button
                onClick={generatePaymentLink}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                Generate Payment Link
              </button>
            )}
          </div>
          {payment && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-purple-700">
                Payment link already generated. Token: <code className="bg-purple-100 px-1 rounded">{payment.token}</code>
              </p>
              <a href={`/pay/${payment.token}`} target="_blank" className="text-purple-600 text-sm hover:underline mt-1 block">
                Open payment page
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
