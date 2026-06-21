/**
 * Unit tests for Zod schemas and validateCustomFieldValues.
 * Covers refinement branches and all field type validations.
 */
import {
  ApprovalTierSchema,
  ApprovalRulesSchema,
  CustomFieldSchema,
  TenantConfigSchema,
  validateCustomFieldValues,
} from '../schemas'
import { describe, it, expect } from '@jest/globals'
import type { CustomField } from '../types'

// ─── ApprovalTierSchema ───────────────────────────────────────────────────────

describe('ApprovalTierSchema', () => {
  it('accepts valid tier without range', () => {
    expect(ApprovalTierSchema.safeParse({ tier: 'manager', isPrimary: true }).success).toBe(true)
  })

  it('rejects when greaterThan >= smallerThan', () => {
    const result = ApprovalTierSchema.safeParse({ tier: 'x', greaterThan: 5000, smallerThan: 5000 })
    expect(result.success).toBe(false)
  })

  it('accepts when greaterThan < smallerThan', () => {
    const result = ApprovalTierSchema.safeParse({ tier: 'x', greaterThan: 100, smallerThan: 5000 })
    expect(result.success).toBe(true)
  })
})

// ─── ApprovalRulesSchema ──────────────────────────────────────────────────────

describe('ApprovalRulesSchema', () => {
  const base = {
    autoApprovalThreshold: 1000,
    approvalTiers: [{ tier: 'manager', isPrimary: true }],
  }

  it('accepts valid rules', () => {
    expect(ApprovalRulesSchema.safeParse(base).success).toBe(true)
  })

  it('rejects when no tier is primary', () => {
    const result = ApprovalRulesSchema.safeParse({
      ...base,
      approvalTiers: [{ tier: 'assessor', isPrimary: false }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when greaterThan does not exceed autoApprovalThreshold', () => {
    const result = ApprovalRulesSchema.safeParse({
      autoApprovalThreshold: 5000,
      approvalTiers: [
        { tier: 'assessor', greaterThan: 3000, isPrimary: false },
        { tier: 'manager', isPrimary: true },
      ],
    })
    expect(result.success).toBe(false)
  })
})

// ─── CustomFieldSchema ────────────────────────────────────────────────────────

describe('CustomFieldSchema', () => {
  const base: CustomField = { name: 'field', label: 'Field', required: true, type: 'text' }

  it('rejects select type with no options', () => {
    const result = CustomFieldSchema.safeParse({ ...base, type: 'select', options: [] })
    expect(result.success).toBe(false)
  })

  it('accepts select type with options', () => {
    const result = CustomFieldSchema.safeParse({ ...base, type: 'select', options: ['A', 'B'] })
    expect(result.success).toBe(true)
  })

  it('rejects number type when min >= max', () => {
    const result = CustomFieldSchema.safeParse({ ...base, type: 'number', min: 10, max: 10 })
    expect(result.success).toBe(false)
  })

  it('accepts number type when min < max', () => {
    const result = CustomFieldSchema.safeParse({ ...base, type: 'number', min: 0, max: 100 })
    expect(result.success).toBe(true)
  })
})

// ─── TenantConfigSchema claimTypes refinement ─────────────────────────────────

describe('TenantConfigSchema — claimTypes', () => {
  const claimEntry = (enabled: boolean) => ({ enabled, requiredDocuments: [], optionalDocuments: [] })
  const makeConfig = (enabled: boolean) => ({
    branding: { companyName: 'X', primaryColor: '#000000', secondaryColor: '#ffffff' },
    claimTypes: {
      OUTPATIENT: claimEntry(enabled),
      INPATIENT: claimEntry(false),
      DENTAL: claimEntry(false),
      MATERNITY: claimEntry(false),
      OPTICAL: claimEntry(false),
    },
    approvalRules: { autoApprovalThreshold: 0, approvalTiers: [{ tier: 'manager', isPrimary: true }] },
    notifications: [],
    sla: { timezone: 'UTC', weekdays: ['MON'], holidays: [], perClaimType: { OUTPATIENT: 5 }, escalationContacts: [] },
    customFields: [],
  })

  it('rejects config where all claim types are disabled', () => {
    const result = TenantConfigSchema.safeParse(makeConfig(false))
    expect(result.success).toBe(false)
  })

  it('accepts config with at least one enabled claim type', () => {
    const result = TenantConfigSchema.safeParse(makeConfig(true))
    expect(result.success).toBe(true)
  })
})

// ─── validateCustomFieldValues ────────────────────────────────────────────────

describe('validateCustomFieldValues', () => {
  const field = (type: CustomField['type'], extra: Partial<CustomField> = {}): CustomField => ({
    name: 'f', label: 'F', required: false, type, ...extra,
  })

  it('returns {} for empty definitions', () => {
    expect(validateCustomFieldValues({}, [])).toEqual({})
  })

  it('reports required field when missing', () => {
    const errs = validateCustomFieldValues({}, [field('text', { name: 'emp', required: true })])
    expect(errs.emp).toBeDefined()
  })

  it('skips optional field when value is empty', () => {
    const errs = validateCustomFieldValues({ f: '' }, [field('text')])
    expect(errs.f).toBeUndefined()
  })

  it('text: reports error when value exceeds maxLength', () => {
    const errs = validateCustomFieldValues({ f: 'hello' }, [field('text', { maxLength: 3 })])
    expect(errs.f).toBeDefined()
  })

  it('text_area: reports error when value exceeds maxLength', () => {
    const errs = validateCustomFieldValues({ f: 'toolong' }, [field('text_area', { maxLength: 4 })])
    expect(errs.f).toBeDefined()
  })

  it('number: reports error when value is not a number', () => {
    const errs = validateCustomFieldValues({ f: 'abc' }, [field('number')])
    expect(errs.f).toContain('Must be a valid number')
  })

  it('number: reports error when below min', () => {
    const errs = validateCustomFieldValues({ f: '5' }, [field('number', { min: 10 })])
    expect(errs.f).toBeDefined()
  })

  it('number: reports error when above max', () => {
    const errs = validateCustomFieldValues({ f: '200' }, [field('number', { max: 100 })])
    expect(errs.f).toBeDefined()
  })

  it('date_time: reports error for invalid date', () => {
    const errs = validateCustomFieldValues({ f: 'not-a-date' }, [field('date_time')])
    expect(errs.f).toBeDefined()
  })

  it('date_time: accepts valid ISO string', () => {
    const errs = validateCustomFieldValues({ f: '2024-01-15' }, [field('date_time')])
    expect(errs.f).toBeUndefined()
  })

  it('boolean: reports error for non-boolean string', () => {
    const errs = validateCustomFieldValues({ f: 'yes' }, [field('boolean')])
    expect(errs.f).toBeDefined()
  })

  it('boolean: accepts "true" and "false"', () => {
    expect(validateCustomFieldValues({ f: 'true' }, [field('boolean')]).f).toBeUndefined()
    expect(validateCustomFieldValues({ f: 'false' }, [field('boolean')]).f).toBeUndefined()
  })

  it('select: reports error when value not in options', () => {
    const errs = validateCustomFieldValues({ f: 'Z' }, [field('select', { options: ['A', 'B'] })])
    expect(errs.f).toBeDefined()
  })

  it('select: accepts value in options', () => {
    const errs = validateCustomFieldValues({ f: 'A' }, [field('select', { options: ['A', 'B'] })])
    expect(errs.f).toBeUndefined()
  })
})
