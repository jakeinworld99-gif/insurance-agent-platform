import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Insurance Agent Platform',
  description: 'Insurance sales platform for agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
