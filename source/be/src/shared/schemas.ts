import { z } from 'zod'

export const ClaimTypeEnum = z.enum(['OUTPATIENT', 'INPATIENT', 'DENTAL', 'MATERNITY', 'OPTICAL'])
export const NotificationEventEnum = z.enum(['claim_submitted', 'approved', 'rejected', 'payment_sent'])
export const NotificationChannelEnum = z.enum(['email', 'sms', 'webhook'])
export const WeekdayEnum = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
export const CustomFieldTypeEnum = z.enum(['text', 'text_area', 'number', 'date_time', 'boolean', 'select'])

// ─── Branding ────────────────────────────────────────────────────────────────

export const BrandingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
})

// ─── Claim types ─────────────────────────────────────────────────────────────

export const ClaimTypeConfigSchema = z
  .object({
    enabled: z.boolean().optional().default(false),
    requiredDocuments: z.array(z.string().min(1)).default([]),
    optionalDocuments: z.array(z.string().min(1)).optional().default([]),
  })
  .superRefine((ct, ctx) => {
    if (ct.enabled && ct.requiredDocuments.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one required document needed when claim type is enabled',
        path: ['requiredDocuments'],
      })
    }
  })

// ─── Approval rules ───────────────────────────────────────────────────────────

export const ApprovalTierSchema = z
  .object({
    tier: z.string().min(1, 'Tier name is required'),
    greaterThan: z.number().min(0).optional(),
    smallerThan: z.number().min(0).optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine((t) => !t.greaterThan || !t.smallerThan || t.greaterThan < t.smallerThan, {
    message: 'greaterThan must be less than smallerThan',
  })

export const ApprovalRulesSchema = z
  .object({
    autoApprovalThreshold: z.number().min(0, 'Threshold must be ≥ 0'),
    approvalTiers: z.array(ApprovalTierSchema).min(1, 'At least one approval tier is required'),
  })
  .refine((r) => r.approvalTiers.some((t) => t.isPrimary), {
    message: 'At least one tier must be marked as primary (catch-all)',
  })
  .refine(
    (r) =>
      r.approvalTiers.every(
        (t) => t.greaterThan === undefined || t.greaterThan > r.autoApprovalThreshold,
      ),
    { message: 'All tier greaterThan values must exceed autoApprovalThreshold' },
  )

// ─── Notifications ────────────────────────────────────────────────────────────

export const NotificationTemplateSchema = z.object({
  channel: NotificationChannelEnum,
  template: z.string().optional(),
})

export const NotificationConfigSchema = z.object({
  event: NotificationEventEnum,
  channels: z.array(NotificationTemplateSchema).min(1, 'At least one channel required'),
})

// ─── SLA ─────────────────────────────────────────────────────────────────────

export const SlaConfigSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  weekdays: z.array(WeekdayEnum).min(1, 'At least one weekday required'),
  holidays: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'))
    .optional()
    .default([]),
  perClaimType: z.record(z.string(), z.number().int().min(1, 'SLA must be at least 1 business day')),
  escalationContacts: z.array(z.string().email('Must be a valid email')).default([]),
})

// ─── Custom fields ────────────────────────────────────────────────────────────

export const CustomFieldSchema = z
  .object({
    name: z.string().min(1, 'Field name is required'),
    label: z.string().min(1, 'Field label is required'),
    required: z.boolean(),
    type: CustomFieldTypeEnum,
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(z.string().min(1)).optional(),
  })
  .superRefine((field, ctx) => {
    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'select type requires at least one option',
        path: ['options'],
      })
    }
    if (
      field.type === 'number' &&
      field.min !== undefined &&
      field.max !== undefined &&
      field.min >= field.max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min must be less than max',
        path: ['min'],
      })
    }
  })

// ─── Tenant config ────────────────────────────────────────────────────────────

export const TenantConfigSchema = z
  .object({
    branding: BrandingSchema,
    // Partial record: not all 5 enum keys required, but at least 1 must be present and enabled
    // Zod 4: z.record(enum, schema) creates an exhaustive record — use .optional() values for partial
    claimTypes: z
      .record(ClaimTypeEnum, ClaimTypeConfigSchema.optional())
      .refine((ct) => Object.values(ct).filter(Boolean).length > 0, {
        message: 'At least one claim type must be configured',
      })
      .refine((ct) => Object.values(ct).filter(Boolean).some((v) => v!.enabled), {
        message: 'At least one claim type must be enabled',
      }),
    approvalRules: ApprovalRulesSchema,
    // Option B: any configured event must have ≥1 channel; events can be omitted entirely
    notifications: z.array(NotificationConfigSchema),
    sla: SlaConfigSchema,
    customFields: z.array(CustomFieldSchema).optional().default([]),
  })
  .superRefine((config, ctx) => {
    // perClaimType keys must be a subset of DEFINED claim type keys
    const knownKeys = new Set(
      Object.entries(config.claimTypes)
        .filter(([, v]) => v !== undefined)
        .map(([k]) => k),
    )
    for (const key of Object.keys(config.sla.perClaimType)) {
      if (!knownKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `SLA entry "${key}" has no matching claim type in claimTypes`,
          path: ['sla', 'perClaimType', key],
        })
      }
    }
  })

// ─── Tenant CRUD ─────────────────────────────────────────────────────────────

export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  config: TenantConfigSchema,
})

// PUT /api/tenants/:id — full config replacement (creates a new version)
// Fields that are optional in TenantConfigSchema (logoUrl, primaryColor, etc.) can be omitted.
// If a section is included, all required sub-fields within it must be valid.
export const UpdateTenantSchema = z.object({
  config: TenantConfigSchema,
})

// ─── Claim data + custom field value validation ───────────────────────────────

import type { CustomField, TenantConfig } from './types'
import dayjs from 'dayjs'

export const ClaimDataSchema = z.object({
  claimType: ClaimTypeEnum,
  amount: z.number().min(0, 'Amount must be ≥ 0'),
  customFields: z.record(z.string(), z.string()),
})

export function validateCustomFieldValues(
  values: Record<string, string>,
  definitions: CustomField[],
): Record<string, string[]> {
  const errors: Record<string, string[]> = {}

  for (const field of definitions) {
    const value = values[field.name]

    if (field.required && (value === undefined || value === '')) {
      errors[field.name] = ['This field is required']
      continue
    }

    if (value === undefined || value === '') continue

    const fieldErrors: string[] = []

    switch (field.type) {
      case 'text':
      case 'text_area':
        if (field.maxLength && value.length > field.maxLength) {
          fieldErrors.push(`Must be at most ${field.maxLength} characters`)
        }
        break

      case 'number': {
        const num = Number(value)
        if (isNaN(num)) {
          fieldErrors.push('Must be a valid number')
        } else {
          if (field.min !== undefined && num < field.min) fieldErrors.push(`Must be ≥ ${field.min}`)
          if (field.max !== undefined && num > field.max) fieldErrors.push(`Must be ≤ ${field.max}`)
        }
        break
      }

      case 'date_time':
        if (!dayjs(value).isValid()) {
          fieldErrors.push('Must be a valid date/time')
        }
        break

      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          fieldErrors.push('Must be "true" or "false"')
        }
        break

      case 'select':
        if (field.options && !field.options.includes(value)) {
          fieldErrors.push(`Must be one of: ${field.options.join(', ')}`)
        }
        break
    }

    if (fieldErrors.length > 0) errors[field.name] = fieldErrors
  }

  return errors
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
})

// ─── Env ──────────────────────────────────────────────────────────────────────

export const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  PORT: z.string().optional(),
})
