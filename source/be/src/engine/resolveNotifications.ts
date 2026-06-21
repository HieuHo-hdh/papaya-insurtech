import type { TenantConfig, NotificationEvent } from '@/shared/types'

type TemplateVars = Partial<Record<
  'claimant_name' | 'claim_id' | 'claim_type' | 'amount' | 'sla_deadline' | 'tenant_name' | 'status',
  string
>>

export const resolveNotifications = (
  config: TenantConfig,
  event: NotificationEvent,
  vars: TemplateVars = {},
): { event: NotificationEvent; channels: string[]; template?: string }[] => {
  const notifConfig = config.notifications.find((n) => n.event === event)
  if (!notifConfig) return []

  return notifConfig.channels.map((ch) => ({
    event,
    channels: [ch.channel],
    ...(ch.template ? { template: interpolate(ch.template, vars) } : {}),
  }))
}

const interpolate = (template: string, vars: TemplateVars): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key as keyof TemplateVars] ?? `{{${key}}}`)
