'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewCustomerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    annual_income_inr: '',
    city: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { error } = await supabase.from('customers').insert({
      agent_id: user.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone.replace(/^\+/, ''),
      dob: form.dob,
      annual_income_inr: parseFloat(form.annual_income_inr),
      city: form.city,
      smoker: false,
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-8 py-10">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 mb-6">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">New Customer</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-8 space-y-5">
          {[
            { label: 'Full Name', key: 'full_name', type: 'text', required: true },
            { label: 'Email', key: 'email', type: 'email', required: true },
            { label: 'Phone (E.164, e.g. 919876543210)', key: 'phone', type: 'tel', required: true },
            { label: 'Date of Birth', key: 'dob', type: 'date', required: true },
            { label: 'Annual Income (INR)', key: 'annual_income_inr', type: 'number', required: true },
            { label: 'City', key: 'city', type: 'text', required: false },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                required={f.required}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          ))}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Customer'}
          </button>
        </form>
      </div>
    </div>
  )
}
