import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BengCert Auditplatform"

interface Props {
  afzenderNaam?: string
  afzenderEmail?: string
  typeLabel?: string
  bericht?: string
  pagina?: string
  datum?: string
}

const FeedbackOntvangenEmail = ({ afzenderNaam, afzenderEmail, typeLabel, bericht, pagina, datum }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Nieuwe feedback van {afzenderNaam ?? 'een gebruiker'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nieuwe feedback ontvangen</Heading>
        <Text style={text}>
          <strong>{afzenderNaam ?? 'Een gebruiker'}</strong>
          {afzenderEmail ? <> ({afzenderEmail})</> : null} heeft feedback gegeven op het {SITE_NAME}.
        </Text>
        <Text style={text}>
          <strong>Type:</strong> {typeLabel ?? 'Opmerking'}<br />
          <strong>Pagina:</strong> {pagina ?? 'onbekend'}<br />
          <strong>Datum:</strong> {datum ?? 'onbekend'}
        </Text>
        <Text style={berichtStyle}>{bericht ?? ''}</Text>
        <Text style={text}>Log in op het platform (Instellingen → Feedback) om de feedback te bekijken en te verwerken.</Text>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FeedbackOntvangenEmail,
  subject: (data: Record<string, any>) => `Nieuwe feedback (${data.typeLabel ?? 'opmerking'}): ${data.afzenderNaam ?? 'gebruiker'}`,
  displayName: 'Feedback ontvangen (beheer)',
  previewData: {
    afzenderNaam: 'Frank Nijsse',
    afzenderEmail: 'frank@borgch.nl',
    typeLabel: 'Opmerking',
    bericht: 'Als ik terugkijk in de audit tabbladen wordt mijn laatst ingevoerde input gewist.',
    pagina: '/project/abc123',
    datum: '3-7-2026, 12:40',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1B2A4A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const berichtStyle = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px', padding: '12px 16px', backgroundColor: '#f4f6f8', borderLeft: '3px solid #7AB929', borderRadius: '4px', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
