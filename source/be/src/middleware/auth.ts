import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '@/config/env'
import { AppError } from '@/utils/AppError'

export const auth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Unauthorized')
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string }
    req.user = payload
    next()
  } catch {
    throw new AppError(401, 'Invalid or expired token')
  }
}
