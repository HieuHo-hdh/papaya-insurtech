import type { Request, Response } from 'express'
import { processClaim } from '@/engine/processClaim'
import { success } from '@/utils/response'

export const processClaimHandler = async (req: Request, res: Response): Promise<void> => {
  const result = await processClaim(req.params.tenantId, req.body)
  res.json(success(result))
}
