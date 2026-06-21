/**
 * TL Sample — AppError
 *
 * AppError is the single error contract across the entire API.
 * Every service and middleware throws this — the errorHandler reads statusCode
 * and details to build the HTTP response. Test every public property.
 */
import { AppError } from '../AppError'
import { describe, it, expect } from '@jest/globals'

describe('AppError', () => {
  it('stores statusCode and message', () => {
    const err = new AppError(404, 'Not found')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Not found')
  })

  it('is instanceof Error (so try/catch and instanceof Error checks work)', () => {
    expect(new AppError(400, 'Bad request')).toBeInstanceOf(Error)
  })

  it('name is "AppError" (distinguishable from generic Error in error handler)', () => {
    expect(new AppError(500, 'Oops').name).toBe('AppError')
  })

  it('details is undefined when not provided', () => {
    expect(new AppError(400, 'Fail').details).toBeUndefined()
  })

  it('stores details when provided (used for field-level validation errors)', () => {
    const details = { email: ['Must be a valid email'], name: ['Required'] }
    const err = new AppError(400, 'Validation failed', details)
    expect(err.details).toEqual(details)
  })
})
