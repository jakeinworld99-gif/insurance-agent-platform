import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-blue-900">Insurance Agent Platform</h1>
          <p className="text-xl text-gray-600">
            The all-in-one platform for insurance agents to manage customers,
            generate proposals, share on WhatsApp, and process payments.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Demo Agent Account</h2>
          <p className="text-gray-500">
            Sign up with email and password to explore the full agent flow.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
            >
              Log In
            </Link>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          Built for demonstration purposes only. Not a regulated insurance product.
        </p>
      </div>
    </div>
  )
}
