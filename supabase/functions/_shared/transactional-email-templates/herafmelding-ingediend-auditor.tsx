import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BengCert Auditplatform"

interface Props {
  auditorNaam?: string
  adviseurNaam?: string
  projectnaam?: string
  bestandsnaam?: string
}

const HerafmeldingIngediendAuditorEmail = ({ auditorNaam, adviseurNaam, projectnaam, bestandsnaam }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Herafmelding ingediend voor {projectnaam ?? 'project'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Herafmelding ingediend</Heading>
        <Text style={text}>Beste {auditorNaam ?? 'collega'},</Text>
        <Text style={text}>
          {adviseurNaam ? <>EP-adviseur <strong>{adviseurNaam}</strong></> : <>De EP-adviseur</>} heeft een herafmelding
          ingediend voor project <strong>{projectnaam ?? 'onbekend'}</strong>
          {bestandsnaam ? <> (bestand: <strong>{bestandsnaam}</strong>)</> : null}.
          De herafmelding wacht op jouw beoordeling.
        </Text>
        <Text style={text}>Log in op het platform om de herafmelding te beoordelen.</Text>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: HerafmeldingIngediendAuditorEmail,
  subject: (data: Record<string, any>) => `Herafmelding ingediend: ${data.projectnaam ?? 'project'}`,
  displayName: 'Herafmelding ingediend (auditor)',
  previewData: { auditorNaam: 'Pieter', adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10', bestandsnaam: 'energielabel.pdf' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1B2A4A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
