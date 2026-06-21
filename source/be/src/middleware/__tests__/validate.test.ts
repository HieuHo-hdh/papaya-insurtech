/**
 * TL Sample — validate middleware (Zod request body guard)
 *
 * FE contract for 400 responses:
 *   { code: 400, message: "Validation failed", details: { fieldName: string[] } }
 */
import { validate } from '../validate'
import { z } from 'zod'
import { AppError } from '@/utils/AppError'
import type { Request, Response, NextFunction } from 'express'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// ── Test schema ───────────────────────────────────────────────────────────────

const TestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be ≥ 0'),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeReq = (body: unknown): Request => ({ body } as unknown as Request)
const res = {} as Response
const next = jest.fn() as unknown as NextFunction

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('validate middleware', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('throws AppError 400 when body does not match schema', () => {
    expect(() => validate(TestSchema)(makeReq({}), res, next)).toThrow(
      expect.objectContaining({ statusCode: 400, message: 'Validation failed' })
    )
  })

  it('includes per-field error details in the thrown AppError', () => {
    let caught: AppError | undefined
    try {
      validate(TestSchema)(makeReq({}), res, next)
    } catch (e) {
      caught = e as AppError
    }
    expect(caught?.details?.name).toBeDefined()
  })

  it('error is an instance of AppError', () => {
    expect(() => validate(TestSchema)(makeReq({}), res, next)).toThrow(AppError)
  })

  it('sets req.body to the parsed output and calls next() on valid input', () => {
    const req = makeReq({ name: 'Alice', age: 30 })
    validate(TestSchema)(req, res, next)

    expect(req.body).toEqual({ name: 'Alice', age: 30 })
    expect(next as jest.Mock).toHaveBeenCalledWith()
  })

  it('strips unknown fields from req.body (Zod default behavior)', () => {
    const req = makeReq({ name: 'Bob', age: 25, extra: 'should-be-removed' })
    validate(TestSchema)(req, res, next)
    expect(req.body).not.toHaveProperty('extra')
  })
})
