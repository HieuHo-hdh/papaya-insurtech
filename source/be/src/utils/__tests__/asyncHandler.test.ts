/**
 * TL Sample — asyncHandler
 *
 * Wraps async handlers so rejected Promises flow into Express error pipeline.
 */
import { asyncHandler } from '../asyncHandler'
import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { describe, it, expect, jest } from '@jest/globals'

const makeCtx = () => ({
  req: {} as Request,
  res: {} as Response,
  next: jest.fn() as unknown as NextFunction,
})

describe('asyncHandler', () => {
  it('invokes the wrapped handler with (req, res, next)', async () => {
    const fn = jest.fn().mockResolvedValue(undefined as never) as unknown as RequestHandler
    const { req, res, next } = makeCtx()

    asyncHandler(fn)(req, res, next)
    await new Promise((r) => setImmediate(r))

    expect(fn).toHaveBeenCalledWith(req, res, next)
  })

  it('calls next(err) when the handler rejects — keeps error pipeline intact', async () => {
    const err = new Error('boom')
    const fn = jest.fn().mockRejectedValue(err as never) as unknown as RequestHandler
    const { req, res, next } = makeCtx()

    asyncHandler(fn)(req, res, next)
    await new Promise((r) => setImmediate(r))

    expect(next as jest.Mock).toHaveBeenCalledWith(err)
  })
})
