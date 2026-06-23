import { describe, it, expect, beforeAll } from '@jest/globals'
import { api, getToken, TENANT_IDS } from './helpers'

describe('Process Claim API', () => {
  let token: string

  beforeAll(async () => {
    token = await getToken()
  })

  const auth = () => ({ Authorization: `Bearer ${token}` })
  const url = (id: string) => `/api/tenants/${id}/process-claim`

  // ── SafeGuard (autoApproval=20000, 3 tiers) ─────────────────────────────────

  describe('SafeGuard — approval tiers', () => {
    it('T46: amount ≤ 20000 returns empty tiers (auto-approved)', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 20000, customFields: { employee_id: 'E001' },
      })
      expect(res.body.code).toBe(200)
      expect(res.body.data.approvalTiers).toHaveLength(0)
    })

    it('T47: amount in (20000, 50000] → assessor tier', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 30000, customFields: { employee_id: 'E001' },
      })
      expect(res.body.data.approvalTiers).toEqual([{ tier: 'assessor' }])
    })

    it('T48: amount in (50000, 100000] → team_lead tier', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 75000, customFields: { employee_id: 'E001' },
      })
      expect(res.body.data.approvalTiers).toEqual([{ tier: 'team_lead' }])
    })

    it('T49: amount > 100000 → director (primary fallback)', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 200000, customFields: { employee_id: 'E001' },
      })
      expect(res.body.data.approvalTiers).toEqual([{ tier: 'director' }])
    })
  })

  // ── GovHealth (autoApproval=0, all manual) ───────────────────────────────────

  describe('GovHealth — always manual', () => {
    it('T50: any amount → committee (threshold=0)', async () => {
      const res = await api.post(url(TENANT_IDS.govhealth)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 1,
        customFields: { department: 'Finance', budget_code: 'B001' },
      })
      expect(res.body.code).toBe(200)
      expect(res.body.data.approvalTiers).toEqual([{ tier: 'committee' }])
    })

    it('T51: returns 400 when required custom fields are missing', async () => {
      const res = await api.post(url(TENANT_IDS.govhealth)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 1, customFields: {},
      })
      expect(res.body.code).toBe(400)
    })
  })

  // ── Cross-tenant differentiation ─────────────────────────────────────────────

  describe('Cross-tenant: same claim → different outputs', () => {
    const CLAIM = { claimType: 'OUTPATIENT', amount: 10000 }

    it('T52: SafeGuard returns different docs than GovHealth for OUTPATIENT', async () => {
      const sg = await api.post(url(TENANT_IDS.safeguard)).set(auth())
        .send({ ...CLAIM, customFields: { employee_id: 'E1' } })
      const gov = await api.post(url(TENANT_IDS.govhealth)).set(auth())
        .send({ ...CLAIM, customFields: { department: 'IT', budget_code: 'B9' } })

      expect(sg.body.data.requiredDocuments).not.toEqual(gov.body.data.requiredDocuments)
    })

    it('T53: SafeGuard auto-approves (10000 < 20000) but HealthFirst sends to assessor (10000 > 5000)', async () => {
      const sg = await api.post(url(TENANT_IDS.safeguard)).set(auth())
        .send({ ...CLAIM, customFields: { employee_id: 'E1' } })
      const hf = await api.post(url(TENANT_IDS.healthfirst)).set(auth())
        .send({ ...CLAIM, customFields: {} })

      expect(sg.body.data.approvalTiers).toHaveLength(0)   // auto-approved
      expect(hf.body.data.approvalTiers.length).toBeGreaterThan(0) // manual
    })
  })

  // ── Required documents ───────────────────────────────────────────────────────

  describe('Required documents', () => {
    it('T54: returns correct required docs for claim type', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 5000, customFields: { employee_id: 'E1' },
      })
      expect(Array.isArray(res.body.data.requiredDocuments)).toBe(true)
      expect(res.body.data.requiredDocuments.length).toBeGreaterThan(0)
    })

    it('T55: returns 400 for disabled claim type (MATERNITY in SafeGuard)', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'MATERNITY', amount: 5000, customFields: { employee_id: 'E1' },
      })
      expect(res.body.code).toBe(400)
    })
  })

  // ── SLA deadline ─────────────────────────────────────────────────────────────

  describe('SLA deadline', () => {
    it('T56: slaDeadline is a future ISO date string', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'OUTPATIENT', amount: 5000, customFields: { employee_id: 'E1' },
      })
      const deadline = res.body.data.slaDeadline
      expect(typeof deadline).toBe('string')
      expect(new Date(deadline).getTime()).toBeGreaterThan(Date.now())
    })
  })

  // ── Validation ───────────────────────────────────────────────────────────────

  describe('Input validation', () => {
    it('T57: returns 400 for invalid claimType', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        claimType: 'INVALID', amount: 5000, customFields: { employee_id: 'E1' },
      })
      expect(res.body.code).toBe(400)
    })

    it('T58: returns 400 when claimType is missing', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).set(auth()).send({
        amount: 5000, customFields: { employee_id: 'E1' },
      })
      expect(res.body.code).toBe(400)
    })

    it('T59: returns 404 for deleted tenant', async () => {
      // Use a known-deleted id (QA Tenant deleted in earlier test run)
      const res = await api.post('/api/tenants/nonexistent-deleted/process-claim').set(auth()).send({
        claimType: 'OUTPATIENT', amount: 1000, customFields: {},
      })
      expect(res.body.code).toBe(404)
    })

    it('T60: returns 401 without token', async () => {
      const res = await api.post(url(TENANT_IDS.safeguard)).send({
        claimType: 'OUTPATIENT', amount: 5000, customFields: { employee_id: 'E1' },
      })
      expect(res.body.code).toBe(401)
    })
  })
})
