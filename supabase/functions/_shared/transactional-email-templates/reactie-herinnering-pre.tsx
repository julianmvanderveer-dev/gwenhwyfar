import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BengCert Auditplatform"

interface Props {
  adviseurNaam?: string
  projectnaam?: string
}

const Email = ({ adviseurNaam, projectnaam }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Uw reactietermijn voor {projectnaam ?? 'project'} verloopt morgen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Herinnering: reactietermijn verloopt morgen</Heading>
        <Text style={text}>Beste {adviseurNaam ?? 'adviseur'},</Text>
        <Text style={text}>
          Dit is een vriendelijke herinnering dat uw reactietermijn voor project <strong>{projectnaam ?? 'onbekend'}</strong> morgen verloopt.
        </Text>
        <Text style={text}>
          Log in om uw reactie tijdig in te dienen.
        </Text>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Herinnering: reactietermijn verloopt morgen — ${data.projectnaam ?? 'project'}`,
  displayName: 'Reactie-herinnering (vóór deadline)',
  previewData: { adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a5f', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }