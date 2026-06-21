import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { asyncHandler } from '@/utils/asyncHandler'
import { CreateTenantSchema, UpdateTenantSchema } from '@/shared/schemas'
import * as tenantsController from './tenants.controller'
import * as versionsController from '@/modules/versions/versions.controller'

const router = Router()

router.get('/', asyncHandler(tenantsController.list))
router.post('/', validate(CreateTenantSchema), asyncHandler(tenantsController.create))
router.get('/:id', asyncHandler(tenantsController.getById))
router.put('/:id', validate(UpdateTenantSchema), asyncHandler(tenantsController.update))
router.delete('/:id', asyncHandler(tenantsController.remove))
router.post('/:id/rollback/:versionId', asyncHandler(versionsController.rollback))

export default router
