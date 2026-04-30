ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS reminder_pre_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_overdue_1w_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_overdue_2w_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_overdue_3w_sent boolean NOT NULL DEFAULT false;

UPDATE public.projects
SET reactie_deadline = now() + interval '14 days',
    reminder_pre_sent = false,
    reminder_overdue_1w_sent = false,
    reminder_overdue_2w_sent = false,
    reminder_overdue_3w_sent = false
WHERE status = 'wacht_op_reactie';