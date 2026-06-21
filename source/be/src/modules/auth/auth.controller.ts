import type { Request, Response } from 'express'
import * as authService from './auth.service'
import { success } from '@/utils/response'

export const login = async (req: Request, res: Response): Promise<void> => {
  const token = await authService.login(req.body.email, req.body.password)
  res.json(success({ token }))
}

export const logout = (_req: Request, res: Response): void => {
  res.json(success(null, 'Logged out'))
}
