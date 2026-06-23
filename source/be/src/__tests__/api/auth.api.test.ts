import { describe, it, expect, beforeAll } from '@jest/globals'
import { api, ADMIN, getToken } from './helpers'

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('T1: returns 200 and token with valid credentials', async () => {
      const res = await api.post('/api/auth/login').send(ADMIN)
      expect(res.status).toBe(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data).toHaveProperty('token')
      expect(typeof res.body.data.token).toBe('string')
    })

    it('T2: returns 401 with wrong password', async () => {
      const res = await api.post('/api/auth/login').send({ email: ADMIN.email, password: 'wrongpass' })
      expect(res.body.code).toBe(401)
    })

    it('T3: returns 401 with non-existent email', async () => {
      const res = await api.post('/api/auth/login').send({ email: 'nobody@x.com', password: 'pass' })
      expect(res.body.code).toBe(401)
    })

    it('T4: returns 400 when email is missing', async () => {
      const res = await api.post('/api/auth/login').send({ password: ADMIN.password })
      expect(res.body.code).toBe(400)
    })

    it('T5: returns 400 when password is missing', async () => {
      const res = await api.post('/api/auth/login').send({ email: ADMIN.email })
      expect(res.body.code).toBe(400)
    })

    it('T6: returns 400 with invalid email format', async () => {
      const res = await api.post('/api/auth/login').send({ email: 'notanemail', password: 'pass' })
      expect(res.body.code).toBe(400)
    })
  })

  describe('Protected routes — auth guard', () => {
    it('T7: returns 401 with no token', async () => {
      const res = await api.get('/api/tenants')
      expect(res.body.code).toBe(401)
    })

    it('T8: returns 401 with invalid token', async () => {
      const res = await api.get('/api/tenants').set('Authorization', 'Bearer invalid.token.here')
      expect(res.body.code).toBe(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('T9: returns 200 with valid token (stateless)', async () => {
      const token = await getToken()
      const res = await api.post('/api/auth/logout').set('Authorization', `Bearer ${token}`)
      expect(res.body.code).toBe(200)
    })
  })
})
