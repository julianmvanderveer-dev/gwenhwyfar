import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BengCert Auditplatform"
const SITE_URL = "https://www.bengaudit.nl"

interface NietAkkoordProps {
  adviseurNaam?: string
  projectnaam?: string
  projectId?: string
}

const NietAkkoordEmail = ({ adviseurNaam, projectnaam, projectId }: NietAkkoordProps) => {
  const auditUrl = projectId ? `${SITE_URL}/project/${projectId}` : SITE_URL
  return (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Actie vereist: {projectnaam ?? 'project'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Beoordeling: niet akkoord</Heading>
        <Text style={text}>
          Beste {adviseurNaam ?? 'adviseur'},
        </Text>
        <Text style={text}>
          Uw reactie op een finding in project <strong>{projectnaam ?? 'onbekend'}</strong> is beoordeeld als <strong>niet akkoord</strong>.
        </Text>
        <Text style={text}>
          De finding is heropend. Klik op de knop hieronder om direct naar de audit te gaan en uw reactie aan te passen.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
          <Button style={button} href={auditUrl}>Bekijk de audit</Button>
        </Section>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: NietAkkoordEmail,
  subject: (data: Record<string, any>) => `Actie vereist: ${data.projectnaam ?? 'project'}`,
  displayName: 'Niet akkoord',
  previewData: { adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10', projectId: '00000000-0000-0000-0000-000000000000' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a5f', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#5AAF2D', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
