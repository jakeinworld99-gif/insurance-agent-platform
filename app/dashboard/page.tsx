'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else {
        setUser(user)
        fetchCustomers(user.id)
      }
    })
  }, [])

  const fetchCustomers = async (agentId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900">Insurance Agent Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Customers</h2>
          <Link
            href="/customers/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            + New Customer
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No customers yet.</p>
            <Link href="/customers/new" className="text-blue-600 font-medium hover:underline">
              Add your first customer
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {customers.map((c) => (
              <Link key={c.id} href={`/customers/${c.id}`} className="block">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{c.full_name}</h3>
                      <p className="text-gray-500 text-sm">{c.email} · {c.phone}</p>
                    </div>
                    <span className="text-sm text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
