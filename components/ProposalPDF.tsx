'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 30 },
  title: { fontSize: 22, bold: true, marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, bold: true, marginBottom: 8, backgroundColor: '#f0f0f0', padding: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontSize: 10, color: '#666', width: 140 },
  value: { fontSize: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 12 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center' },
  highlight: { backgroundColor: '#e8f0fe', padding: 8, marginBottom: 8 },
  highlightText: { fontSize: 11, bold: true },
})

interface Proposal {
  id: string
  premium_inr: number
  sum_assured_inr: number
  term_years: number
  status: string
  created_at: string
  customers: {
    full_name: string
    email: string
    phone: string
    dob: string
    annual_income_inr: number
    city: string
  }
  products: {
    name: string
    code: string
    type: string
    term_years: number
    sum_assured_inr: number
    indicative_premium_inr: number
  }
}

export function ProposalPDF({ proposal }: { proposal: Proposal }) {
  const customer = proposal.customers
  const product = proposal.products

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Insurance Proposal</Text>
          <Text style={styles.subtitle}>Prepared on {new Date(proposal.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{customer.full_name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{customer.email}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{customer.phone}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date of Birth</Text><Text style={styles.value}>{customer.dob}</Text></View>
          <View style={styles.row}><Text style={styles.label}>City</Text><Text style={styles.value}>{customer.city}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Annual Income</Text><Text style={styles.value}>Rs {Number(customer.annual_income_inr).toLocaleString('en-IN')}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.row}><Text style={styles.label}>Product</Text><Text style={styles.value}>{product.name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Type</Text><Text style={styles.value}>{product.type}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Policy Term</Text><Text style={styles.value}>{product.term_years} years</Text></View>
          <View style={styles.row}><Text style={styles.label}>Sum Assured</Text><Text style={styles.value}>Rs {Number(product.sum_assured_inr).toLocaleString('en-IN')}</Text></View>
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>Premium: Rs {Number(proposal.premium_inr).toLocaleString('en-IN')} per year for {proposal.term_years} years</Text>
          <Text style={styles.highlightText}>Total Coverage: Rs {Number(proposal.sum_assured_inr).toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>
          This is a proposal document only. It does not constitute a binding insurance contract. 
          The final policy issuance is subject to underwriting approval and payment of premium.
        </Text>

        <Text style={styles.footer}>
          Insurance Agent Platform — Demo MVP — Not an IRDAI-approved document
        </Text>
      </Page>
    </Document>
  )
}

export default ProposalPDF
