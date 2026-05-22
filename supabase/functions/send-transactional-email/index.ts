import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const FROM_ADDRESS = 'BengCert <noreply@bengaudit.nl>'

// Tijdens de testfase ontvangt dit adres een kopie van elke verstuurde e-mail.
// Stopt automatisch op 1 augustus 2026.
const TEST_CC = 'julian@borgch.nl'
const TEST_CC_UNTIL = new Date('2026-08-01T00:00:00Z')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let templateName: string
  let recipientEmail: string
  let templateData: Record<string, any> = {}
  let cc: string[] | undefined
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
    if (body.cc) {
      cc = Array.isArray(body.cc) ? body.cc : [body.cc]
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!templateName) {
    return new Response(
      JSON.stringify({ error: 'templateName is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    return new Response(
      JSON.stringify({
        error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const effectiveRecipient = template.to || recipientEmail
  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({ error: 'recipientEmail is required (unless the template defines a fixed recipient)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Check suppression list
  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', effectiveRecipient.toLowerCase())
    .maybeSingle()

  if (suppressionError) {
    console.error('Suppression check failed', { error: suppressionError })
    return new Response(
      JSON.stringify({ error: 'Failed to verify suppression status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (suppressed) {
    await supabase.from('email_send_log').insert({
      message_id: crypto.randomUUID(),
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Render template
  const html = await renderAsync(React.createElement(template.component, templateData))
  const plainText = await renderAsync(
    React.createElement(template.component, templateData),
    { plainText: true }
  )

  const resolvedSubject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  const messageId = crypto.randomUUID()

  // Voeg testfase-kopie toe (case-insensitive dedupe t.o.v. ontvanger en bestaande cc)
  let effectiveCc: string[] | undefined = cc ? [...cc] : undefined
  if (new Date() < TEST_CC_UNTIL) {
    const lower = TEST_CC.toLowerCase()
    const recipLower = effectiveRecipient.toLowerCase()
    const existing = (effectiveCc ?? []).map((a) => a.toLowerCase())
    if (recipLower !== lower && !existing.includes(lower)) {
      effectiveCc = [...(effectiveCc ?? []), TEST_CC]
    }
  }

  // Send via Resend API
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [effectiveRecipient],
        ...(effectiveCc && effectiveCc.length > 0 ? { cc: effectiveCc } : {}),
        subject: resolvedSubject,
        html,
        text: plainText,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error', { status: resendResponse.status, data: resendData })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: JSON.stringify(resendData).slice(0, 1000),
      })
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'sent',
    })

    console.log('Email sent via Resend', { templateName, effectiveRecipient, resendId: resendData.id })

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Failed to send email', { error: errorMsg })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: errorMsg.slice(0, 1000),
    })
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
