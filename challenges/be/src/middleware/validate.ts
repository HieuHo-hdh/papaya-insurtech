import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { AppError } from '@/utils/AppError'

export const validate = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      throw new AppError(
        400,
        'Validation failed',
        result.error.flatten().fieldErrors as Record<string, string[]>,
      )
    }
    req.body = result.data
    next()
  }
