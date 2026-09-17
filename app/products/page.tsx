'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ProductsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else {
        supabase.from('products').select('*').eq('active', true).then(({ data }) => {
          setProducts(data || [])
          setLoading(false)
        })
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Product Catalogue</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">← Dashboard</button>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow p-6 space-y-3">
                <div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{p.code}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">{p.name}</h3>
                  <p className="text-gray-500 text-sm capitalize">{p.type}</p>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Age: {p.min_age}–{p.max_age} years</p>
                  <p>Term: {p.term_years} years</p>
                  <p>Sum: Rs {Number(p.sum_assured_inr).toLocaleString()}</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xl font-bold text-blue-600">Rs {Number(p.indicative_premium_inr).toLocaleString()}<span className="text-sm font-normal text-gray-400">/yr</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
