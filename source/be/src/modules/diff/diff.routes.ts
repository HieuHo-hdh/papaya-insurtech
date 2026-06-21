import { Router } from 'express'
import { asyncHandler } from '@/utils/asyncHandler'
import * as diffController from './diff.controller'

const router = Router()

router.get('/', asyncHandler(diffController.getDiff))

export default router
