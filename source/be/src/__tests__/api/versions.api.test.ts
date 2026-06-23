import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { api, getToken, TENANT_IDS, VALID_CONFIG } from './helpers'

describe('Versions API', () => {
  let token: string
  let tenantId: string
  let version1Id: string
  let version2Id: string

  beforeAll(async () => {
    token = await getToken()
    // Create a fresh tenant with 2 versions for testing
    const create = await api
      .post('/api/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Version Test Tenant', config: VALID_CONFIG })
    tenantId = create.body.data.id

    const v1res = await api
      .get(`/api/tenants/${tenantId}/versions`)
      .set('Authorization', `Bearer ${token}`)
    version1Id = v1res.body.data.data[0].id

    // Create version 2
    const cfg2 = { ...VALID_CONFIG, branding: { ...VALID_CONFIG.branding, companyName: 'V2 Corp' } }
    await api
      .put(`/api/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ config: cfg2 })

    const v2res = await api
      .get(`/api/tenants/${tenantId}/versions`)
      .set('Authorization', `Bearer ${token}`)
    const active = v2res.body.data.data.find((v: { isActive: boolean }) => v.isActive)
    version2Id = active.id
  })

  afterAll(async () => {
    await api
      .delete(`/api/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${token}`)
  })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('GET /api/tenants/:id/versions', () => {
    it('T36: returns paginated version list', async () => {
      const res = await api.get(`/api/tenants/${tenantId}/versions`).set(auth())
      expect(res.body.code).toBe(200)
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2)
    })

    it('T37: versions are ordered newest first', async () => {
      const res = await api.get(`/api/tenants/${tenantId}/versions`).set(auth())
      const versions = res.body.data.data.map((v: { version: number }) => v.version)
      expect(versions[0]).toBeGreaterThan(versions[versions.length - 1])
    })

    it('T38: returns 401 without token', async () => {
      const res = await api.get(`/api/tenants/${tenantId}/versions`)
      expect(res.body.code).toBe(401)
    })
  })

  describe('GET /api/tenants/:id/versions/:versionId', () => {
    it('T39: returns specific version config', async () => {
      const res = await api.get(`/api/tenants/${tenantId}/versions/${version1Id}`).set(auth())
      expect(res.body.code).toBe(200)
      expect(res.body.data).toHaveProperty('config')
      expect(res.body.data.version).toBe(1)
    })

    it('T40: returns 404 for non-existent version', async () => {
      const res = await api
        .get(`/api/tenants/${tenantId}/versions/no-such-version`)
        .set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T41: returns 401 without token', async () => {
      const res = await api.get(`/api/tenants/${tenantId}/versions/${version1Id}`)
      expect(res.body.code).toBe(401)
    })
  })

  describe('POST /api/tenants/:id/rollback/:versionId', () => {
    it('T42: rollback creates a new version as copy of target', async () => {
      const before = await api.get(`/api/tenants/${tenantId}/versions`).set(auth())
      const countBefore = before.body.data.data.length

      const res = await api
        .post(`/api/tenants/${tenantId}/rollback/${version1Id}`)
        .set(auth())
      expect(res.body.code).toBe(200)

      const after = await api.get(`/api/tenants/${tenantId}/versions`).set(auth())
      expect(after.body.data.data.length).toBe(countBefore + 1)
    })

    it('T43: rolled-back version has source config content', async () => {
      // v1 had companyName = Test Corp; rollback to v1 should restore it
      const tenant = await api.get(`/api/tenants/${tenantId}`).set(auth())
      const activeConfig = tenant.body.data.configs[0]
      expect(activeConfig.config.branding.companyName).toBe('Test Corp')
    })

    it('T44: returns 404 for non-existent version', async () => {
      const res = await api
        .post(`/api/tenants/${tenantId}/rollback/no-such-version`)
        .set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T45: returns 401 without token', async () => {
      const res = await api.post(`/api/tenants/${tenantId}/rollback/${version1Id}`)
      expect(res.body.code).toBe(401)
    })
  })
})
