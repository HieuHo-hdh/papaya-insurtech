export type ClaimType = 'OUTPATIENT' | 'INPATIENT' | 'DENTAL' | 'MATERNITY' | 'OPTICAL'

export type NotificationEvent = 'claim_submitted' | 'approved' | 'rejected' | 'payment_sent'
export type NotificationChannel = 'email' | 'sms' | 'webhook'
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
export type CustomFieldType = 'text' | 'text_area' | 'number' | 'date_time' | 'boolean' | 'select'

export interface Branding {
  companyName: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
}

export interface ClaimTypeConfig {
  enabled: boolean
  requiredDocuments: string[]
  optionalDocuments: string[]
}

export interface ApprovalTier {
  tier: string
  greaterThan?: number
  smallerThan?: number
  isPrimary?: boolean
}

export interface ApprovalRules {
  autoApprovalThreshold: number
  approvalTiers: ApprovalTier[]
}

export interface NotificationTemplate {
  channel: NotificationChannel
  template?: string
}

export interface NotificationConfig {
  event: NotificationEvent
  channels: NotificationTemplate[]
}

export interface SlaConfig {
  timezone: string
  weekdays: Weekday[]
  holidays: string[]
  perClaimType: Partial<Record<ClaimType, number>>
  escalationContacts: string[]
}

export interface CustomField {
  name: string
  label: string
  required: boolean
  type: CustomFieldType
  maxLength?: number   // text, text_area
  min?: number         // number
  max?: number         // number
  options?: string[]   // select
}

export interface TenantConfig {
  branding: Branding
  claimTypes: Partial<Record<ClaimType, ClaimTypeConfig>>
  approvalRules: ApprovalRules
  notifications: NotificationConfig[]
  sla: SlaConfig
  customFields: CustomField[]
}

export interface ClaimData {
  claimType: ClaimType
  amount: number
  customFields: Record<string, string>
}

export interface ProcessClaimResult {
  requiredDocuments: string[]
  approvalTiers: { tier: string }[]
  notifications: { event: NotificationEvent; channels: string[]; template?: string }[]
  slaDeadline: string        // ISO string, calculated in tenant timezone via dayjs
  customFieldsRequired: CustomField[]
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export type ConfigSection = 'branding' | 'claimTypes' | 'approvalRules' | 'notifications' | 'sla' | 'customFields'

export interface DiffEntry {
  section: ConfigSection
  path: string
  valueA: unknown
  valueB: unknown
}

export interface DiffResponse {
  tenantA: { id: string; name: string; config: TenantConfig }
  tenantB: { id: string; name: string; config: TenantConfig }
  diffs: DiffEntry[]
}
