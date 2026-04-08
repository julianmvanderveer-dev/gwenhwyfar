import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BengCert Auditplatform"

interface AuditAfgerondProps {
  adviseurNaam?: string
  projectnaam?: string
}

const AuditAfgerondEmail = ({ adviseurNaam, projectnaam }: AuditAfgerondProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Audit afgerond: {projectnaam ?? 'project'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Audit afgerond</Heading>
        <Text style={text}>
          Beste {adviseurNaam ?? 'adviseur'},
        </Text>
        <Text style={text}>
          De audit voor project <strong>{projectnaam ?? 'onbekend'}</strong> is afgerond.
        </Text>
        <Text style={text}>
          Er staan findings klaar die uw reactie vereisen. Log in om de findings te bekijken en te reageren.
        </Text>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AuditAfgerondEmail,
  subject: (data: Record<string, any>) => `Audit afgerond: ${data.projectnaam ?? 'project'}`,
  displayName: 'Audit afgerond',
  previewData: { adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a5f', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
