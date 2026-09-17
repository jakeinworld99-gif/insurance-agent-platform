// @ts-nocheck - react-pdf types are unavailable at build time
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

export const runtime = 'nodejs'
export const maxDuration = 30

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  title: { fontSize: 20, bold: true, marginBottom: 20 },
  section: { marginBottom: 12 },
  label: { fontSize: 9, color: '#666' },
  value: { fontSize: 12, marginBottom: 4 },
  box: { border: '1px solid #ddd', padding: 12, marginBottom: 12, borderRadius: 4 },
  bold: { fontSize: 12, bold: true },
})

interface ProposalData {
  customer: any
  product: any
  proposal: any
  agent?: any
}

const ProposalDocument = ({ customer, product, proposal, agent }: ProposalData) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Insurance Proposal</Text>
      <View style={styles.box}>
        <Text style={styles.label}>CUSTOMER DETAILS</Text>
        <Text style={styles.value}>{customer.full_name}</Text>
        <Text style={styles.value}>{customer.email} - {customer.phone}</Text>
        <Text style={styles.value}>DOB: {customer.dob}</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.label}>PRODUCT</Text>
        <Text style={styles.bold}>{product.name} ({product.code})</Text>
        <Text style={styles.value}>Type: {product.type}</Text>
        <Text style={styles.value}>Term: {product.term_years} years</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.label}>COVERAGE & PREMIUM</Text>
        <Text style={styles.value}>Sum Assured: Rs {Number(product.sum_assured_inr).toLocaleString()}</Text>
        <Text style={styles.value}>Indicative Annual Premium: Rs {Number(product.indicative_premium_inr).toLocaleString()}</Text>
      </View>
      <Text style={styles.label}>This is a demo proposal. Not a regulated insurance document.</Text>
    </Page>
  </Document>
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Public route — the proposal UUID is unguessable and the PDF contains demo
  // data only, so the WhatsApp share link works without the customer being
  // logged in. We use the service-role client to bypass RLS for this read.
  const supabase = createServiceClient()

  // Light sanity check on the id so we don't waste a DB roundtrip.
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, customers(*), products(*), agents(*)')
    .eq('id', params.id)
    .single()

  if (!proposal) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(ProposalDocument, {
        customer: proposal.customers,
        product: proposal.products,
        proposal,
        agent: proposal.agents,
      })
    )
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="proposal-${params.id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF render error:', err)
    return NextResponse.json({ error: 'PDF generation failed', detail: String(err) }, { status: 500 })
  }
}