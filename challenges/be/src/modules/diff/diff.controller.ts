import type { Request, Response } from 'express'
import { diffConfigs } from './diff.service'
import { AppError } from '@/utils/AppError'
import { success } from '@/utils/response'

export const getDiff = async (req: Request, res: Response): Promise<void> => {
  const { a, b } = req.query as { a?: string; b?: string }
  if (!a || !b) throw new AppError(400, 'Query params a and b are required')
  const result = await diffConfigs(a, b)
  res.json(success(result))
}
