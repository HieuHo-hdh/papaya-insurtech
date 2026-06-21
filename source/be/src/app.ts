import express from 'express'
import cors from 'cors'
import { auth } from '@/middleware/auth'
import { errorHandler } from '@/middleware/errorHandler'
import authRoutes from '@/modules/auth/auth.routes'
import tenantRoutes from '@/modules/tenants/tenants.routes'
import versionRoutes from '@/modules/versions/versions.routes'
import claimRoutes from '@/modules/claims/claims.routes'
import diffRoutes from '@/modules/diff/diff.routes'

const app = express()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/auth/login') return next()
  return auth(req, res, next)
})

app.use('/api/auth', authRoutes)
app.use('/api/tenants/:tenantId/versions', versionRoutes)
app.use('/api/tenants/:tenantId/process-claim', claimRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/diff', diffRoutes)

app.use(errorHandler)

export default app
