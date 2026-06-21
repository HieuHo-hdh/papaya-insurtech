import { Router } from 'express'
import { validate } from '@/middleware/validate'
import { asyncHandler } from '@/utils/asyncHandler'
import { LoginSchema } from '@/shared/schemas'
import * as authController from './auth.controller'

const router = Router()

router.post('/login', validate(LoginSchema), asyncHandler(authController.login))
router.post('/logout', authController.logout)

export default router
