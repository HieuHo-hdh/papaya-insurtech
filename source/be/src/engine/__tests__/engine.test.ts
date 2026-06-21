import { describe, it, expect } from '@jest/globals'
import { resolveDocuments } from '../resolveDocuments'
import { resolveApprovalTiers } from '../resolveApprovalTiers'
import { resolveNotifications } from '../resolveNotifications'
import { calculateSlaDeadline } from '../calculateSlaDeadline'
import { resolveCustomFields } from '../resolveCustomFields'
import { validateCustomFieldValues } from '../validateCustomFieldValues'
import { safeguardConfig, healthfirstConfig, govhealthConfig } from './fixtures'

// ─── resolveDocuments ─────────────────────────────────────────────────────────

describe('resolveDocuments', () => {
  it('OUTPATIENT on SafeGuard returns correct required/optional docs', () => {
    const result = resolveDocuments(safeguardConfig, 'OUTPATIENT')
    expect(result.requiredDocuments).toEqual(['Medical Report', 'Receipt'])
    expect(result.optionalDocuments).toEqual(['Referral Letter'])
  })

  it('MATERNITY on SafeGuard (disabled) throws AppError 400', () => {
    expect(() => resolveDocuments(safeguardConfig, 'MATERNITY')).toThrow()
    try {
      resolveDocuments(safeguardConfig, 'MATERNITY')
    } catch (e: any) {
      expect(e.statusCode).toBe(400)
    }
  })

  it('MATERNITY on HealthFirst (enabled) returns docs', () => {
    const result = resolveDocuments(healthfirstConfig, 'MATERNITY')
    expect(result.requiredDocuments).toContain('Birth Certificate')
  })
})

// ─── resolveApprovalTiers ─────────────────────────────────────────────────────

describe('resolveApprovalTiers', () => {
  it('SafeGuard amount=0 → [] (auto-approve, ≤ 20000)', () => {
    expect(resolveApprovalTiers(safeguardConfig, 0)).toEqual([])
  })

  it('SafeGuard amount=20000 → [] (at threshold, still auto-approve)', () => {
    expect(resolveApprovalTiers(safeguardConfig, 20000)).toEqual([])
  })

  it('SafeGuard amount=20001 → [{ tier: assessor }]', () => {
    expect(resolveApprovalTiers(safeguardConfig, 20001)).toEqual([{ tier: 'assessor' }])
  })

  it('SafeGuard amount=50000 → [{ tier: assessor }] (boundary: ≤ smallerThan)', () => {
    expect(resolveApprovalTiers(safeguardConfig, 50000)).toEqual([{ tier: 'assessor' }])
  })

  it('SafeGuard amount=50001 → [{ tier: team_lead }]', () => {
    expect(resolveApprovalTiers(safeguardConfig, 50001)).toEqual([{ tier: 'team_lead' }])
  })

  it('SafeGuard amount=150000 → [{ tier: director }] (isPrimary fallback)', () => {
    expect(resolveApprovalTiers(safeguardConfig, 150000)).toEqual([{ tier: 'director' }])
  })

  it('GovHealth amount=0 → [] (autoApprovalThreshold=0, amount ≤ 0)', () => {
    expect(resolveApprovalTiers(govhealthConfig, 0)).toEqual([])
  })

  it('GovHealth amount=1 → [{ tier: committee }] (above threshold, isPrimary)', () => {
    expect(resolveApprovalTiers(govhealthConfig, 1)).toEqual([{ tier: 'committee' }])
  })

  it('HealthFirst amount=5000 → [] (at threshold)', () => {
    expect(resolveApprovalTiers(healthfirstConfig, 5000)).toEqual([])
  })

  it('HealthFirst amount=5001 → [{ tier: assessor }]', () => {
    expect(resolveApprovalTiers(healthfirstConfig, 5001)).toEqual([{ tier: 'assessor' }])
  })
})

// ─── resolveNotifications ─────────────────────────────────────────────────────

describe('resolveNotifications', () => {
  it('SafeGuard claim_submitted → 1 entry, channel email', () => {
    const result = resolveNotifications(safeguardConfig, 'claim_submitted')
    expect(result).toHaveLength(1)
    expect(result[0].channels).toEqual(['email'])
    expect(result[0].event).toBe('claim_submitted')
  })

  it('HealthFirst approved → 2 entries (email + sms)', () => {
    const result = resolveNotifications(healthfirstConfig, 'approved')
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.channels[0])).toContain('email')
    expect(result.map((r) => r.channels[0])).toContain('sms')
  })

  it('GovHealth approved → 2 entries (email + webhook with template)', () => {
    const result = resolveNotifications(govhealthConfig, 'approved')
    expect(result).toHaveLength(2)
    const webhook = result.find((r) => r.channels[0] === 'webhook')
    expect(webhook?.template).toBe('https://gov.webhook/approved')
  })

  it('Template interpolation: {{tenant_name}} replaced correctly', () => {
    const configWithTemplate = {
      ...govhealthConfig,
      notifications: [
        {
          event: 'approved' as const,
          channels: [{ channel: 'webhook' as const, template: 'Hello {{tenant_name}}!' }],
        },
      ],
    }
    const result = resolveNotifications(configWithTemplate, 'approved', { tenant_name: 'GovHealth' })
    expect(result[0].template).toBe('Hello GovHealth!')
  })

  it('Unknown event → []', () => {
    const result = resolveNotifications(safeguardConfig, 'payment_sent')
    expect(result).toHaveLength(1)
    // payment_sent is configured; test truly unknown by using a config with no payment_sent
    const minimalConfig = {
      ...safeguardConfig,
      notifications: [{ event: 'claim_submitted' as const, channels: [{ channel: 'email' as const }] }],
    }
    expect(resolveNotifications(minimalConfig, 'payment_sent')).toEqual([])
  })
})

// ─── calculateSlaDeadline ─────────────────────────────────────────────────────

describe('calculateSlaDeadline', () => {
  it('SafeGuard OUTPATIENT (5 days, Mon-Fri): submitted Monday → deadline Monday +7 calendar days', () => {
    // 2024-01-01 is a Monday
    const result = calculateSlaDeadline(safeguardConfig, 'OUTPATIENT', new Date('2024-01-01T09:00:00Z'))
    // 5 business days from Monday: Tue, Wed, Thu, Fri, Mon → Jan 8 (next Monday)
    expect(result).toContain('2024-01-08')
  })

  it('GovHealth OUTPATIENT (15 days, Mon-Fri): submitted Monday → 3 weeks later', () => {
    // 2024-01-01 is Monday; 15 business days = 3 weeks = Jan 22 (Monday)
    const result = calculateSlaDeadline(govhealthConfig, 'OUTPATIENT', new Date('2024-01-01T09:00:00Z'))
    expect(result).toContain('2024-01-22')
  })

  it('Holiday exclusion: if holiday falls in window, adds extra day', () => {
    const configWithHoliday = {
      ...safeguardConfig,
      sla: {
        ...safeguardConfig.sla,
        holidays: ['2024-01-02'], // Tuesday in the 5-day window
      },
    }
    const result = calculateSlaDeadline(configWithHoliday, 'OUTPATIENT', new Date('2024-01-01T09:00:00Z'))
    // Without holiday: Jan 8. With Tue Jan 2 as holiday, need to skip it → Jan 9
    expect(result).toContain('2024-01-09')
  })

  it('Missing perClaimType entry throws AppError 400', () => {
    expect(() => calculateSlaDeadline(safeguardConfig, 'MATERNITY', new Date())).toThrow()
    try {
      calculateSlaDeadline(safeguardConfig, 'MATERNITY', new Date())
    } catch (e: any) {
      expect(e.statusCode).toBe(400)
    }
  })

  it('Returns string in ISO format', () => {
    const result = calculateSlaDeadline(safeguardConfig, 'OUTPATIENT', new Date('2024-01-01T09:00:00Z'))
    expect(typeof result).toBe('string')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

// ─── resolveCustomFields ──────────────────────────────────────────────────────

describe('resolveCustomFields', () => {
  it('SafeGuard → 1 field (employee_id)', () => {
    const result = resolveCustomFields(safeguardConfig)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('employee_id')
  })

  it('HealthFirst → 0 fields', () => {
    expect(resolveCustomFields(healthfirstConfig)).toHaveLength(0)
  })

  it('GovHealth → 2 fields (department + budget_code)', () => {
    const result = resolveCustomFields(govhealthConfig)
    expect(result).toHaveLength(2)
    expect(result.map((f) => f.name)).toContain('department')
    expect(result.map((f) => f.name)).toContain('budget_code')
  })
})

// ─── validateCustomFieldValues ────────────────────────────────────────────────

describe('validateCustomFieldValues', () => {
  const defs = safeguardConfig.customFields

  it('Required field missing → error', () => {
    const errors = validateCustomFieldValues({}, defs)
    expect(errors['employee_id']).toBeDefined()
  })

  it('Text maxLength exceeded → error', () => {
    const errors = validateCustomFieldValues({ employee_id: 'A'.repeat(21) }, defs)
    expect(errors['employee_id']).toBeDefined()
  })

  it('Number out of range → error', () => {
    const numDefs = [{ name: 'age', label: 'Age', required: false, type: 'number' as const, min: 18, max: 65 }]
    const errors = validateCustomFieldValues({ age: '10' }, numDefs)
    expect(errors['age']).toBeDefined()
  })

  it('Invalid select option → error', () => {
    const selectDefs = [{ name: 'status', label: 'Status', required: false, type: 'select' as const, options: ['active', 'inactive'] }]
    const errors = validateCustomFieldValues({ status: 'unknown' }, selectDefs)
    expect(errors['status']).toBeDefined()
  })

  it('Valid values → {} (no errors)', () => {
    const errors = validateCustomFieldValues({ employee_id: 'EMP001' }, defs)
    expect(errors).toEqual({})
  })
})

// ─── Key invariant — different outputs per tenant ─────────────────────────────

describe('Invariant: same claim input produces different results per tenant', () => {
  it('same claim input produces different results for all 3 tenants', () => {
    const sg = {
      docs: resolveDocuments(safeguardConfig, 'OUTPATIENT'),
      tiers: resolveApprovalTiers(safeguardConfig, 30000),
    }
    const hf = {
      docs: resolveDocuments(healthfirstConfig, 'OUTPATIENT'),
      tiers: resolveApprovalTiers(healthfirstConfig, 30000),
    }
    const gh = {
      docs: resolveDocuments(govhealthConfig, 'OUTPATIENT'),
      tiers: resolveApprovalTiers(govhealthConfig, 30000),
    }

    // SafeGuard: assessor tier; HealthFirst: assessor tier; GovHealth: committee tier
    expect(sg.tiers[0].tier).toBe('assessor')
    expect(hf.tiers[0].tier).toBe('assessor')
    expect(gh.tiers[0].tier).toBe('committee')

    // Docs differ between tenants
    expect(sg.docs.requiredDocuments).not.toEqual(gh.docs.requiredDocuments)
  })
})
