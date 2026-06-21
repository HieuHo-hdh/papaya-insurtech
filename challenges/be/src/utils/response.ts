import type { ApiResponse, PaginatedResponse } from '@/shared/types'

export const success = <T>(data: T, message = 'OK'): ApiResponse<T> => ({
  code: 200,
  message,
  data,
})

export const paginated = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): ApiResponse<PaginatedResponse<T>> =>
  success({ data, total, page, pageSize })
