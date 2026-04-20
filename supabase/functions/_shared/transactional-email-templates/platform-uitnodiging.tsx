import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BengCert'
const SITE_URL = 'https://www.bengaudit.nl'
const CONTACT_EMAIL = 'julian@borgch.nl'

interface PlatformUitnodigingProps {
  naam?: string
}

const PlatformUitnodigingEmail = ({ naam }: PlatformUitnodigingProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Welkom bij {SITE_NAME} — maak je account aan</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welkom bij {SITE_NAME}</Heading>
        <Text style={text}>
          Beste {naam ?? 'adviseur'},
        </Text>
        <Text style={text}>
          Je bent toegevoegd aan het {SITE_NAME} platform. Op dit platform worden
          audits van energieprestatie-rapporten beoordeeld en kun je reageren op
          bevindingen die betrekking hebben op jouw projecten.
        </Text>

        <Heading as="h2" style={h2}>Account aanmaken — zo werkt het</Heading>
        <Section style={steps}>
          <Text style={step}><strong>1.</strong> Klik op de knop hieronder om naar het platform te gaan.</Text>
          <Text style={step}><strong>2.</strong> Klik op "Wachtwoord vergeten" en vul je e-mailadres in.</Text>
          <Text style={step}><strong>3.</strong> Volg de instructies in de mail die je dan ontvangt om een wachtwoord in te stellen.</Text>
          <Text style={step}><strong>4.</strong> Log in met je e-mailadres en nieuwe wachtwoord.</Text>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '30px 0' }}>
          <Button style={button} href={SITE_URL}>
            Ga naar {SITE_NAME}
          </Button>
        </Section>

        <Text style={text}>
          Vragen of problemen bij het aanmaken van je account? Neem contact op
          met Julian via <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</Link>.
        </Text>

        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PlatformUitnodigingEmail,
  subject: `Welkom bij ${SITE_NAME} — maak je account aan`,
  displayName: 'Platform-uitnodiging',
  previewData: { naam: 'Rob Harbers' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#28235D', margin: '0 0 20px' }
const h2 = { fontSize: '16px', fontWeight: 'bold' as const, color: '#28235D', margin: '24px 0 12px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const steps = { margin: '0 0 16px', paddingLeft: '4px' }
const step = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 8px' }
const button = { backgroundColor: '#5AAF2D', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const link = { color: '#5AAF2D', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
