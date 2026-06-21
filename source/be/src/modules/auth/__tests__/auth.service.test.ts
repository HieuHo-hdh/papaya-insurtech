import jwt from 'jsonwebtoken'

// ── Mocks (must be declared before imports that trigger module init) ──────────

const mockFindUnique = jest.fn()
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: mockFindUnique },
  })),
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

jest.mock('@/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-at-least-16-chars',
    PORT: 3001,
    NODE_ENV: 'test',
  },
}))

// ── Subject under test ────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs'
import { login } from '../auth.service'
import { AppError } from '@/utils/AppError'

const mockCompare = jest.mocked(bcrypt.compare)

const FAKE_USER = {
  id: 'user-uuid-123',
  email: 'admin@papaya.dev',
  passwordHash: '$2b$10$hashed',
  createdAt: new Date(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('auth.service.login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws 401 when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(login('nobody@example.com', 'any')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  })

  it('throws 401 when password does not match', async () => {
    mockFindUnique.mockResolvedValue(FAKE_USER)
    mockCompare.mockResolvedValue(false as never)

    await expect(login(FAKE_USER.email, 'wrong')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  })

  it('uses the same error message for missing user and wrong password (no enumeration)', async () => {
    mockFindUnique.mockResolvedValue(null)
    const err1 = await login('nobody@x.com', 'x').catch((e) => e)

    mockFindUnique.mockResolvedValue(FAKE_USER)
    mockCompare.mockResolvedValue(false as never)
    const err2 = await login(FAKE_USER.email, 'wrong').catch((e) => e)

    expect(err1.message).toBe(err2.message)
  })

  it('returns a signed JWT on valid credentials', async () => {
    mockFindUnique.mockResolvedValue(FAKE_USER)
    mockCompare.mockResolvedValue(true as never)

    const token = await login(FAKE_USER.email, 'Admin@1234')

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('JWT payload contains id and email', async () => {
    mockFindUnique.mockResolvedValue(FAKE_USER)
    mockCompare.mockResolvedValue(true as never)

    const token = await login(FAKE_USER.email, 'Admin@1234')
    const payload = jwt.decode(token) as Record<string, unknown>

    expect(payload.id).toBe(FAKE_USER.id)
    expect(payload.email).toBe(FAKE_USER.email)
  })

  it('JWT expires in ~24h', async () => {
    mockFindUnique.mockResolvedValue(FAKE_USER)
    mockCompare.mockResolvedValue(true as never)

    const before = Math.floor(Date.now() / 1000)
    const token = await login(FAKE_USER.email, 'Admin@1234')
    const payload = jwt.decode(token) as Record<string, number>

    const ttl = payload.exp - payload.iat
    expect(ttl).toBeCloseTo(86400, -2) // ±100s tolerance
  })

  it('throws AppError (not generic Error)', async () => {
    mockFindUnique.mockResolvedValue(null)

    const err = await login('x@x.com', 'x').catch((e) => e)
    expect(err).toBeInstanceOf(AppError)
  })
})
