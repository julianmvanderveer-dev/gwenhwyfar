import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  naam?: string
  titel?: string
  inhoud?: string
  soortLabel?: string
  evenement?: string
  url?: string
}

// Enters en opsommingen behouden: elke regel krijgt een eigen <br />, lege regels worden witruimte
const regels = (tekst: string) =>
  tekst.replace(/\r\n/g, '\n').split('\n').map((r, i) => (
    <React.Fragment key={i}>
      {i > 0 ? <br /> : null}
      {r.trim() === '' ? '\u00A0' : r}
    </React.Fragment>
  ))

const BerichtEmail = ({ naam, titel, inhoud, soortLabel, evenement, url }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>{titel ?? 'Nieuw bericht van BengCert'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={label}>{soortLabel ?? 'Bericht'}</Text>
        <Heading style={h1}>{titel ?? 'Nieuw bericht van BengCert'}</Heading>
        <Text style={text}>Beste {naam ?? 'adviseur'},</Text>
        {evenement ? <Text style={text}><strong>Wanneer / waar:</strong> {evenement}</Text> : null}
        <Text style={berichtStyle}>{inhoud ?? ''}</Text>
        {url ? <Button href={url} style={button}>Bekijk op het platform</Button> : null}
        {url ? <Text style={small}>Of open: {url}</Text> : null}
        <Text style={footer}>Met vriendelijke groet,<br />BengCert</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BerichtEmail,
  subject: (data: Record<string, any>) => `BengCert: ${data.titel ?? 'nieuw bericht'}`,
  displayName: 'Bericht van BengCert (adviseur)',
  previewData: {
    naam: 'Mourad Malek', titel: 'Intervisiebijeenkomst 12 november', soortLabel: 'Intervisie',
    inhoud: 'Graag nodigen wij u uit voor de volgende intervisie.', evenement: '12-11-2026 14:00, Utrecht',
    url: 'https://www.bengaudit.nl/inbox',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const label = { fontSize: '12px', color: '#7AB929', fontWeight: 'bold' as const, textTransform: 'uppercase' as const, margin: '0 0 4px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1B2A4A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const small = { fontSize: '12px', color: '#666666', margin: '8px 0 16px', wordBreak: 'break-all' as const }
const berichtStyle = { ...text, padding: '12px 16px', backgroundColor: '#f4f6f8', borderLeft: '3px solid #7AB929', borderRadius: '4px', whiteSpace: 'pre-wrap' as const }
const button = { backgroundColor: '#1B2A4A', color: '#ffffff', padding: '10px 18px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
