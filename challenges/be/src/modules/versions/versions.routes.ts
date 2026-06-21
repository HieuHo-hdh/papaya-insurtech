import { Router } from 'express'
import { asyncHandler } from '@/utils/asyncHandler'
import * as versionsController from './versions.controller'

const router = Router({ mergeParams: true })

router.get('/', asyncHandler(versionsController.listVersions))
router.get('/:versionId', asyncHandler(versionsController.getVersion))

export default router
