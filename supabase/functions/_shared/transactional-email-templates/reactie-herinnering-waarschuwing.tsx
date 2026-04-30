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
    <Preview>Waarschuwing: reactietermijn voor {projectnaam ?? 'project'} is twee weken verstreken</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Waarschuwing: reactietermijn 2 weken verstreken</Heading>
        <Text style={text}>Beste {adviseurNaam ?? 'adviseur'},</Text>
        <Text style={text}>
          De reactietermijn voor project <strong>{projectnaam ?? 'onbekend'}</strong> is inmiddels <strong>twee weken</strong> verstreken. Dit is een serieuze waarschuwing.
        </Text>
        <Text style={text}>
          Wij verzoeken u dringend om binnen één week alsnog te reageren. Indien wij geen reactie ontvangen, volgt een eindwaarschuwing waarin het mogelijk intrekken van het label wordt aangekondigd.
        </Text>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Waarschuwing: reactietermijn 2 weken verstreken — ${data.projectnaam ?? 'project'}`,
  displayName: 'Reactie-waarschuwing (2 weken te laat)',
  previewData: { adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#a04a00', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }