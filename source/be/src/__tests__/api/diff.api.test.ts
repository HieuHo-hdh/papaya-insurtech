import { describe, it, expect, beforeAll } from '@jest/globals'
import { api, getToken, TENANT_IDS } from './helpers'

describe('Diff API', () => {
  let token: string

  beforeAll(async () => {
    token = await getToken()
  })

  const auth = () => ({ Authorization: `Bearer ${token}` })

  describe('GET /api/diff', () => {
    it('T61: returns diffs between two different tenants', async () => {
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}&b=${TENANT_IDS.healthfirst}`)
        .set(auth())
      expect(res.body.code).toBe(200)
      expect(res.body.data.diffs.length).toBeGreaterThan(0)
    })

    it('T62: diff response includes tenantA and tenantB with name and id', async () => {
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}&b=${TENANT_IDS.healthfirst}`)
        .set(auth())
      expect(res.body.data.tenantA).toHaveProperty('name', 'SafeGuard')
      expect(res.body.data.tenantB).toHaveProperty('name', 'HealthFirst')
      expect(res.body.data.tenantA).toHaveProperty('id')
    })

    it('T63: each diff entry has path, valueA, valueB, and section', async () => {
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}&b=${TENANT_IDS.healthfirst}`)
        .set(auth())
      const diff = res.body.data.diffs[0]
      expect(diff).toHaveProperty('path')
      expect(diff).toHaveProperty('valueA')
      expect(diff).toHaveProperty('valueB')
      expect(diff).toHaveProperty('section')
    })

    it('T64: sections are valid ConfigSection values', async () => {
      const VALID_SECTIONS = ['branding', 'claimTypes', 'approvalRules', 'notifications', 'sla', 'customFields']
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}&b=${TENANT_IDS.healthfirst}`)
        .set(auth())
      const sections = res.body.data.diffs.map((d: { section: string }) => d.section)
      sections.forEach((s: string) => expect(VALID_SECTIONS).toContain(s))
    })

    it('T65: same tenant vs itself returns 0 diffs', async () => {
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}&b=${TENANT_IDS.safeguard}`)
        .set(auth())
      expect(res.body.code).toBe(200)
      expect(res.body.data.diffs).toHaveLength(0)
    })

    it('T66: returns 404 when tenant A does not exist', async () => {
      const res = await api
        .get(`/api/diff?a=nonexistent&b=${TENANT_IDS.healthfirst}`)
        .set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T67: returns 404 when tenant B does not exist', async () => {
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}&b=nonexistent`)
        .set(auth())
      expect(res.body.code).toBe(404)
    })

    it('T68: returns 400 when tenant B param is missing', async () => {
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}`)
        .set(auth())
      expect(res.body.code).toBe(400)
    })

    it('T69: returns 400 when both params are missing', async () => {
      const res = await api.get('/api/diff').set(auth())
      expect(res.body.code).toBe(400)
    })

    it('T70: returns 401 without token', async () => {
      const res = await api
        .get(`/api/diff?a=${TENANT_IDS.safeguard}&b=${TENANT_IDS.healthfirst}`)
      expect(res.body.code).toBe(401)
    })
  })
})
