import type { Request, Response } from 'express'
import * as tenantService from './tenants.service'
import { success, paginated } from '@/utils/response'

export const list = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.max(1, Number(req.query.pageSize) || 20)
  const showDeleted = req.query.showDeleted === 'true'
  const result = await tenantService.list(page, pageSize, showDeleted)
  res.json(paginated(result.tenants, result.total, result.page, result.pageSize))
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  const tenant = await tenantService.getById(req.params.id)
  res.json(success(tenant))
}

export const create = async (req: Request, res: Response): Promise<void> => {
  const tenant = await tenantService.create(req.body.name, req.body.config)
  res.status(201).json(success(tenant))
}

export const update = async (req: Request, res: Response): Promise<void> => {
  const tenant = await tenantService.update(req.params.id, req.body.config)
  res.json(success(tenant))
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  await tenantService.remove(req.params.id)
  res.json(success(null, 'Tenant deleted'))
}
