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
    <Preview>Laatste waarschuwing: zonder reactie kan het label voor {projectnaam ?? 'project'} ingetrokken worden</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Laatste waarschuwing — intrekking label aanstaande</Heading>
        <Text style={text}>Beste {adviseurNaam ?? 'adviseur'},</Text>
        <Text style={text}>
          De reactietermijn voor project <strong>{projectnaam ?? 'onbekend'}</strong> is inmiddels <strong>drie weken</strong> verstreken. Dit is een laatste waarschuwing.
        </Text>
        <Text style={text}>
          Indien wij binnen <strong>één week</strong> geen reactie van u ontvangen, kan worden overgegaan tot het intrekken van het label voor dit project.
        </Text>
        <Text style={text}>
          Wij verzoeken u met klem om per direct in te loggen en alsnog te reageren.
        </Text>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Laatste waarschuwing: intrekking label aanstaande — ${data.projectnaam ?? 'project'}`,
  displayName: 'Reactie-eindwaarschuwing (3 weken te laat)',
  previewData: { adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#b00020', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }