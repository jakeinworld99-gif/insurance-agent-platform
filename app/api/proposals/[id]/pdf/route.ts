// @ts-nocheck — react-pdf types are unavailable at build time
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { ProposalPDF } from '@/components/ProposalPDF'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, customers(*), products(*)')
    .eq('id', params.id)
    .single()

  if (!proposal) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(ProposalPDF, { proposal })
    )
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="proposal-${proposal.id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF render error:', err)
    return NextResponse.json({ error: 'PDF generation failed', detail: String(err) }, { status: 500 })
  }
}
