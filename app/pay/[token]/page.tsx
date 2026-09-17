'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PayPage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(false)
  const [policyNumber, setPolicyNumber] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: pay } = await supabase.from('payments').select('*, proposals(*, customers(*), products(*))').eq('token', token).single()
      if (!pay || pay.status !== 'pending') { setLoading(false); return }
      setPayment(pay)
      setLoading(false)
    }
    load()
  }, [token])

  const handlePay = async () => {
    setPaying(true)
    setError('')
    try {
      const res = await fetch(`/api/payments/${token}/confirm`, { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPolicyNumber(data.policy_number)
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  if (!payment) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><h1 className="text-2xl font-bold text-gray-900">Payment not found</h1><a href="/" className="text-blue-600 hover:underline mt-4 block">Go home</a></div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-green-800">Payment Successful!</h1>
        <div className="bg-green-50 rounded-xl p-5 text-left space-y-2">
          <p className="text-gray-700"><strong>Policy Number:</strong> <span className="font-mono text-green-700">{policyNumber}</span></p>
          <p className="text-gray-700"><strong>Customer:</strong> {payment.proposals?.customers?.full_name}</p>
          <p className="text-gray-700"><strong>Product:</strong> {payment.proposals?.products?.name}</p>
          <p className="text-gray-700"><strong>Amount:</strong> Rs {Number(payment.amount_inr).toLocaleString()}</p>
        </div>
        <p className="text-gray-500 text-sm">A confirmation email has been sent to {payment.proposals?.customers?.email}</p>
        <a href="/" className="block text-blue-600 font-medium hover:underline">Back to home</a>
      </div>
    </div>
  )

  const customer = payment.proposals?.customers
  const product = payment.proposals?.products

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-400 text-yellow-900 text-center py-3 text-sm font-semibold">
        DEMO PAYMENT — No real money is being collected
      </div>
      <div className="max-w-md mx-auto px-8 py-12 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insurance Premium Payment</h1>
            <p className="text-gray-500 mt-1">Demo payment page</p>
          </div>
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium">{customer?.full_name}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-500">Product</span>
              <span className="font-medium">{product?.name}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-500">Sum Assured</span>
              <span className="font-medium">Rs {Number(product?.sum_assured_inr).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Amount Due</span>
              <span className="text-xl font-bold text-blue-600">Rs {Number(payment.amount_inr).toLocaleString()}</span>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {paying ? 'Processing...' : `Pay Rs ${Number(payment.amount_inr).toLocaleString()} (demo)`}
          </button>
          <p className="text-center text-gray-400 text-xs">This is a demonstration. No actual payment will be processed.</p>
        </div>
      </div>
    </div>
  )
}
