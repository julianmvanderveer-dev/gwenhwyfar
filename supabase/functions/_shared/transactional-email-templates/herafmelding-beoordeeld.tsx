import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BengCert Auditplatform"
const SITE_URL = "https://www.bengaudit.nl"

interface Props {
  adviseurNaam?: string
  projectnaam?: string
  projectId?: string
  goedgekeurd?: boolean
  reden?: string
}

const HerafmeldingBeoordeeldEmail = ({ adviseurNaam, projectnaam, projectId, goedgekeurd, reden }: Props) => {
  const auditUrl = projectId ? `${SITE_URL}/project/${projectId}` : SITE_URL
  return (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>
      {goedgekeurd ? 'Herafmelding goedgekeurd' : 'Herafmelding afgekeurd'}: {projectnaam ?? 'project'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {goedgekeurd ? 'Herafmelding goedgekeurd' : 'Herafmelding afgekeurd'}
        </Heading>
        <Text style={text}>Beste {adviseurNaam ?? 'adviseur'},</Text>
        {goedgekeurd ? (
          <Text style={text}>
            De auditor heeft het nieuwe label voor project <strong>{projectnaam ?? 'onbekend'}</strong> goedgekeurd.
            De audit is hiermee afgerond.
          </Text>
        ) : (
          <Text style={text}>
            De auditor heeft het aangeleverde label voor project <strong>{projectnaam ?? 'onbekend'}</strong> afgekeurd.
            U kunt een nieuw bewijs van afmelding uploaden.
          </Text>
        )}
        {reden ? <Text style={text}><strong>Toelichting auditor:</strong> {reden}</Text> : null}
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
  component: HerafmeldingBeoordeeldEmail,
  subject: (data: Record<string, any>) =>
    `${data.goedgekeurd ? 'Herafmelding goedgekeurd' : 'Herafmelding afgekeurd'}: ${data.projectnaam ?? 'project'}`,
  displayName: 'Herafmelding beoordeeld (adviseur)',
  previewData: { adviseurNaam: 'Jan de Vries', projectnaam: '1234AB_10', projectId: '00000000-0000-0000-0000-000000000000', goedgekeurd: true },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '580px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a5f', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#5AAF2D', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
