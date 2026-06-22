import type { NotificationEvent, NotificationChannel } from './types'

export const EVENT_LABELS: Record<NotificationEvent, string> = {
  claim_submitted: 'Claim Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  payment_sent: 'Payment Sent',
}

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: 'Email',
  sms: 'SMS',
  webhook: 'Webhook',
}
