import type { Request, Response, NextFunction } from 'express'
import { AppError } from '@/utils/AppError'

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      ...(err.details && { details: err.details }),
    })
    return
  }
  console.error(err)
  res.status(500).json({ code: 500, message: 'Internal server error' })
}
