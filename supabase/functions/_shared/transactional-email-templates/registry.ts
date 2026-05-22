/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as auditAfgerond } from './audit-afgerond.tsx'
import { template as nietAkkoord } from './niet-akkoord.tsx'
import { template as platformUitnodiging } from './platform-uitnodiging.tsx'
import { template as reactieHerinneringPre } from './reactie-herinnering-pre.tsx'
import { template as reactieHerinneringOverdue } from './reactie-herinnering-overdue.tsx'
import { template as reactieHerinneringWaarschuwing } from './reactie-herinnering-waarschuwing.tsx'
import { template as reactieHerinneringEindwaarschuwing } from './reactie-herinnering-eindwaarschuwing.tsx'
import { template as reactieOntvangenAuditor } from './reactie-ontvangen-auditor.tsx'
import { template as auditAfgerondAuditor } from './audit-afgerond-auditor.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'audit-afgerond': auditAfgerond,
  'niet-akkoord': nietAkkoord,
  'platform-uitnodiging': platformUitnodiging,
  'reactie-herinnering-pre': reactieHerinneringPre,
  'reactie-herinnering-overdue': reactieHerinneringOverdue,
  'reactie-herinnering-waarschuwing': reactieHerinneringWaarschuwing,
  'reactie-herinnering-eindwaarschuwing': reactieHerinneringEindwaarschuwing,
  'reactie-ontvangen-auditor': reactieOntvangenAuditor,
  'audit-afgerond-auditor': auditAfgerondAuditor,
}
