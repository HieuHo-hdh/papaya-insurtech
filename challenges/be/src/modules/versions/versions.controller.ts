import type { Request, Response } from 'express'
import * as versionsService from './versions.service'
import { success, paginated } from '@/utils/response'

export const listVersions = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.max(1, Number(req.query.pageSize) || 20)
  const result = await versionsService.listVersions(req.params.tenantId, page, pageSize)
  res.json(paginated(result.versions, result.total, result.page, result.pageSize))
}

export const getVersion = async (req: Request, res: Response): Promise<void> => {
  const version = await versionsService.getVersion(req.params.tenantId, req.params.versionId)
  res.json(success(version))
}

export const rollback = async (req: Request, res: Response): Promise<void> => {
  const version = await versionsService.rollback(req.params.id, req.params.versionId)
  res.json(success(version))
}
