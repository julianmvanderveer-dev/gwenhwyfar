import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BengCert Auditplatform"

interface Props {
  adviseurNaam?: string
  projectnaam?: string
  dropboxLink?: string | null
  opmerking?: string | null
}

const DossierIncompleetEmail = ({ adviseurNaam, projectnaam, dropboxLink, opmerking }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Dossier {projectnaam ?? ''} is niet compleet</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Dossier niet compleet</Heading>
        <Text style={text}>Beste {adviseurNaam ?? 'adviseur'},</Text>
        <Text style={text}>
          Bij de interne audit van project <strong>{projectnaam ?? 'onbekend'}</strong> is vastgesteld dat het dossier
          onvoldoende informatie bevat om de audit goed uit te voeren.
        </Text>
        {opmerking ? <Text style={text}><strong>Toelichting:</strong> {opmerking}</Text> : null}
        <Text style={text}>
          Wij verzoeken u de ontbrekende bestanden zelf te uploaden in Dropbox. Zorg dat alle stukken erin zitten en
          overzichtelijk geordend zijn. Meld daarna op het platform dat het dossier is aangevuld.
        </Text>
        <Text style={text}>
          Zolang het dossier niet compleet is, wordt de audit als kritiek (KT) beoordeeld. Dit vervalt pas wanneer de
          audit op basis van de aangevulde stukken opnieuw is uitgevoerd.
        </Text>
        <Text style={footer}>Met vriendelijke groet,<br />Het {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DossierIncompleetEmail,
  subject: (data: Record<string, any>) => `Dossier niet compleet: ${data.projectnaam ?? 'project'}`,
  displayName: 'Dossier niet compleet (EP-adviseur)',
  previewData: { adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10', dropboxLink: 'https://www.dropbox.com/', opmerking: 'Tekeningen ontbreken' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1B2A4A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#7AB929', color: '#ffffff', padding: '10px 18px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
