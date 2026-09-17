import Link from 'next/link'

export default function PaySuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-green-800">Payment Successful!</h1>
        <p className="text-gray-500">Your policy has been confirmed. Check your email for details.</p>
        <Link href="/" className="block text-blue-600 font-medium hover:underline">Back to home</Link>
      </div>
    </div>
  )
}
