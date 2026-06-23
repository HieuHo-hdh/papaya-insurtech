import { describe, it, expect, beforeAll } from '@jest/globals'
import { api, getToken, TENANT_IDS, VALID_CONFIG } from './helpers'

describe('Tenants API', () => {
  let token: string
  let createdTenantId: string

  beforeAll(async () => {
    token = await getToken()
  })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  // ── List ────────────────────────────────────────────────────────────────────

  describe('GET /api/tenants', () => {
    it('T10: returns 200 with paginated list of active tenants', async () => {
      const res = await api.get('/api/tenants').set(auth())
      expect(res.body.code).toBe(200)
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(3)
      expect(res.body.data).toHaveProperty('total')
    })

    it('T11: respects page and pageSize query params', async () => {
      const res = await api.get('/api/tenants?page=1&pageSize=1').set(auth())
      expect(res.body.code).toBe(200)
      expect(res.body.data.data).toHaveLength(1)
    })

    it('T12: showDeleted=true includes soft-deleted tenants', async () => {
      const all = await api.get('/api/tenants?showDeleted=true').set(auth())
      const active = await api.get('/api/tenants').set(auth())
      expect(all.body.data.total).toBeGreaterThanOrEqual(active.body.data.total)
    })

    it('T13: returns 401 without token', async () => {
      const res = await api.get('/api/tenants')
      expect(res.body.code).toBe(401)
    })
  })

  // ── Create ──────────────────────────────────────────────────────────────────

  describe('POST /api/tenants', () => {
    it('T14: creates tenant with valid config', async () => {
      const res = await api
        .post('/api/tenants')
        .set(auth())
        .send({ name: 'Jest QA Tenant', config: VALID_CONFIG })
      expect(res.status).toBe(201)
      expect(res.body.code).toBe(200)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.name).toBe('Jest QA Tenant')
      createdTenantId = res.body.data.id
    })

    it('T15: returns 400 when name is missing', async () => {
      const res = await api.post('/api/tenants').set(auth()).send({ config: VALID_CONFIG })
      expect(res.body.code).toBe(400)
    })

    it('T16: returns 400 when no claim types enabled', async () => {
      const cfg = {
        ...VALID_CONFIG,
        claimTypes: {
          OUTPATIENT: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
          INPATIENT: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
          DENTAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
          MATERNITY: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
          OPTICAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
        },
        sla: { ...VALID_CONFIG.sla, perClaimType: {} },
      }
      const res = await api.post('/api/tenants').set(auth()).send({ name: 'Bad', config: cfg })
      expect(res.body.code).toBe(400)
    })

    it('T17: returns 400 with invalid hex color', async () => {
      const cfg = { ...VALID_CONFIG, branding: { ...VALID_CONFIG.branding, primaryColor: 'notacolor' } }
      const res = await api.post('/api/tenants').set(auth()).send({ name: 'Color', config: cfg })
      expect(res.body.code).toBe(400)
    })

    it('T18: returns 400 when SLA days < 1', async () => {
      const cfg = { ...VALID_CONFIG, sla: { ...VALID_CONFIG.sla, perClaimType: { OUTPATIENT: 0 } } }
      const res = await api.post('/api/tenants').set(auth()).send({ name: 'SLA', config: cfg })
      expect(res.body.code).toBe(400)
    })

    it('T19: returns 400 when SLA has key for a claim type not configured in claimTypes', async () => {
      // claimTypes only defines OUTPATIENT — DENTAL is absent (undefined)
      // SLA references DENTAL which is not in claimTypes → should 400
      const cfg = {
        ...VALID_CONFIG,
        claimTypes: {
          OUTPATIENT: { enabled: true, requiredDocuments: ['Receipt'], optionalDocuments: [] },
        },
        sla: { ...VALID_CONFIG.sla, perClaimType: { OUTPATIENT: 5, DENTAL: 3 } },
      }
      const res = await api.post('/api/tenants').set(auth()).send({ name: 'SLAKey', config: cfg })
      expect(res.body.code).toBe(400)
    })

    it('T20: returns 400 when enabled claim type has 0 required docs', async () => {
      const cfg = {
        ...VALID_CONFIG,
        claimTypes: {
          ...VALID_CONFIG.claimTypes,
          OUTPATIENT: { enabled: true, requiredDocuments: [], optionalDocuments: [] },
        },
      }
      const res = await api.post('/api/tenants').set(auth()).send({ name: 'NoDocs', config: cfg })
      expect(res.body.code).toBe(400)
    })

    it('T21: returns 401 without token', async () => {
      const res = await api.post('/api/tenants').send({ name: 'N', config: VALID_CONFIG })
      expect(res.body.code).toBe(401)
    })
  })

  // ── Get by ID ───────────────────────────────────────────────────────────────

  describe('GET /api/tenants/:id', () => {
    it('T22: returns tenant with active config', async () => {
      const res = await api.get(`/api/tenants/${TENANT_IDS.safeguard}`).set(auth())
      expect(res.body.code).toBe(200)
      expect(res.body.data.name).toBe('SafeGuard')
      expect(res.body.data.configs).toBeDefined()
    })

    it('T23: returns 404 for non-existent id', async () => {
      const res = await api.get('/api/tenants/no-such-id').set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T24: returns 401 without token', async () => {
      const res = await api.get(`/api/tenants/${TENANT_IDS.safeguard}`)
      expect(res.body.code).toBe(401)
    })
  })

  // ── Update ──────────────────────────────────────────────────────────────────

  describe('PUT /api/tenants/:id', () => {
    it('T25: creates new version on update', async () => {
      const updatedConfig = {
        ...VALID_CONFIG,
        branding: { ...VALID_CONFIG.branding, companyName: 'Updated Corp' },
      }
      const res = await api
        .put(`/api/tenants/${createdTenantId}`)
        .set(auth())
        .send({ config: updatedConfig })
      expect(res.body.code).toBe(200)
    })

    it('T26: returns 404 for non-existent tenant', async () => {
      const res = await api
        .put('/api/tenants/nonexistent')
        .set(auth())
        .send({ config: VALID_CONFIG })
      expect(res.body.code).toBe(404)
    })

    it('T27: returns 400 with invalid config', async () => {
      const cfg = { ...VALID_CONFIG, branding: { ...VALID_CONFIG.branding, primaryColor: 'bad' } }
      const res = await api
        .put(`/api/tenants/${createdTenantId}`)
        .set(auth())
        .send({ config: cfg })
      expect(res.body.code).toBe(400)
    })

    it('T28: returns 401 without token', async () => {
      const res = await api.put(`/api/tenants/${createdTenantId}`).send({ config: VALID_CONFIG })
      expect(res.body.code).toBe(401)
    })
  })

  // ── Delete ──────────────────────────────────────────────────────────────────

  describe('DELETE /api/tenants/:id', () => {
    it('T29: soft-deletes tenant', async () => {
      const res = await api.delete(`/api/tenants/${createdTenantId}`).set(auth())
      expect(res.body.code).toBe(200)
    })

    it('T30: deleted tenant not visible in default list', async () => {
      const res = await api.get('/api/tenants').set(auth())
      const ids = res.body.data.data.map((t: { id: string }) => t.id)
      expect(ids).not.toContain(createdTenantId)
    })

    it('T31: deleted tenant visible with showDeleted=true', async () => {
      const res = await api.get('/api/tenants?showDeleted=true').set(auth())
      const found = res.body.data.data.find((t: { id: string }) => t.id === createdTenantId)
      expect(found).toBeDefined()
      expect(found.deletedAt).not.toBeNull()
    })

    it('T32: GET deleted tenant returns 404', async () => {
      const res = await api.get(`/api/tenants/${createdTenantId}`).set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T33: delete already-deleted tenant returns 404', async () => {
      const res = await api.delete(`/api/tenants/${createdTenantId}`).set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T34: delete non-existent tenant returns 404', async () => {
      const res = await api.delete('/api/tenants/no-such-id').set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T35: returns 401 without token', async () => {
      const res = await api.delete(`/api/tenants/${createdTenantId}`)
      expect(res.body.code).toBe(401)
    })
  })
})
