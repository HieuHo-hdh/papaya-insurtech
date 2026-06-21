/**
 * Unit tests for individual engine resolver functions.
 * Covers edge-case branches not reachable through the processClaim integration tests.
 */
import { resolveApprovalTiers } from '../resolveApprovalTiers'
import { resolveNotifications } from '../resolveNotifications'
import { describe, it, expect } from '@jest/globals'
import type { TenantConfig } from '@/shared/types'

const makeConfig = (overrides: Partial<TenantConfig> = {}): TenantConfig => ({
  branding: { companyName: 'Test', primaryColor: '#000000', secondaryColor: '#ffffff' },
  claimTypes: { OUTPATIENT: { enabled: true, requiredDocuments: [], optionalDocuments: [] } },
  approvalRules: { autoApprovalThreshold: 0, approvalTiers: [{ tier: 'manager', isPrimary: true }] },
  notifications: [],
  sla: { timezone: 'UTC', weekdays: ['MON'], holidays: [], perClaimType: { OUTPATIENT: 5 }, escalationContacts: [] },
  customFields: [],
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────────────────

describe('resolveApprovalTiers', () => {
  it('returns [] when no primary tier exists and no range tiers match', () => {
    const config = makeConfig({
      approvalRules: {
        autoApprovalThreshold: 0,
        approvalTiers: [{ tier: 'bounded', isPrimary: false, greaterThan: 1000, smallerThan: 2000 }],
      },
    })
    // amount=500 → exceeds threshold (0), no range tier matches (500 ≤ 1000), no isPrimary
    const result = resolveApprovalTiers(config, 500)
    expect(result).toEqual([])
  })

  it('returns primary tier when matched array is empty but primary exists', () => {
    const config = makeConfig({
      approvalRules: {
        autoApprovalThreshold: 0,
        approvalTiers: [
          { tier: 'bounded', isPrimary: false, greaterThan: 1000, smallerThan: 2000 },
          { tier: 'manager', isPrimary: true },
        ],
      },
    })
    const result = resolveApprovalTiers(config, 500)
    expect(result).toEqual([{ tier: 'manager' }])
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('resolveNotifications', () => {
  it('falls back to {{key}} placeholder when template key is absent from vars', () => {
    const config = makeConfig({
      notifications: [{
        event: 'claim_submitted',
        channels: [{ channel: 'email', template: 'Hello {{claimant_name}}, claim {{claim_id}} received.' }],
      }],
    })
    const result = resolveNotifications(config, 'claim_submitted', {})
    expect(result[0].template).toBe('Hello {{claimant_name}}, claim {{claim_id}} received.')
  })

  it('interpolates known vars and leaves unknown as-is', () => {
    const config = makeConfig({
      notifications: [{
        event: 'approved',
        channels: [{ channel: 'sms', template: 'Hi {{claimant_name}}, status: {{status}}' }],
      }],
    })
    const result = resolveNotifications(config, 'approved', { claimant_name: 'Alice' })
    expect(result[0].template).toBe('Hi Alice, status: {{status}}')
  })

  it('returns [] when event has no matching notification config', () => {
    const config = makeConfig({ notifications: [] })
    expect(resolveNotifications(config, 'approved')).toEqual([])
  })
})
