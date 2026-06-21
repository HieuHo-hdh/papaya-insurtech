/**
 * TL Sample — response helpers
 *
 * success() and paginated() are the only response shapes the API returns.
 * FE devs can use these tests as a contract reference for what to expect.
 *
 * Contract:
 *   success  → { code: 200, message, data }
 *   paginated → { code: 200, message: 'OK', data: { data[], total, page, pageSize } }
 */
import { success, paginated } from '../response'
import { describe, it, expect } from '@jest/globals'

describe('success()', () => {
  it('returns code 200, default message "OK", and the provided data', () => {
    const result = success({ id: 'abc' })
    expect(result).toEqual({ code: 200, message: 'OK', data: { id: 'abc' } })
  })

  it('accepts a custom message (e.g. "Tenant deleted")', () => {
    const result = success(null, 'Tenant deleted')
    expect(result.message).toBe('Tenant deleted')
  })

  it('works with null data (used on DELETE responses)', () => {
    expect(success(null).data).toBeNull()
  })

  it('works with string, number, and array data', () => {
    expect(success('ok').data).toBe('ok')
    expect(success(42).data).toBe(42)
    expect(success([1, 2]).data).toEqual([1, 2])
  })
})

describe('paginated()', () => {
  it('wraps array in paginated envelope inside success()', () => {
    const items = [{ id: '1' }, { id: '2' }]
    const result = paginated(items, 50, 2, 10)

    expect(result.code).toBe(200)
    expect(result.data).toEqual({ data: items, total: 50, page: 2, pageSize: 10 })
  })

  it('returns total=0 and empty data array when there are no records', () => {
    const result = paginated([], 0, 1, 20)
    expect(result.data?.total).toBe(0)
    expect(result.data?.data).toHaveLength(0)
  })
})
