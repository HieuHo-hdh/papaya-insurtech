import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { asyncHandler } from '@/utils/asyncHandler'
import { ClaimDataSchema } from '@/shared/schemas'
import * as claimsController from './claims.controller'

const router = Router({ mergeParams: true })

router.post('/', validate(ClaimDataSchema), asyncHandler(claimsController.processClaimHandler))

export default router
