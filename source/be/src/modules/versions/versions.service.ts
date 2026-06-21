import { PrismaClient } from '@prisma/client'
import { AppError } from '@/utils/AppError'

const prisma = new PrismaClient()

const requireTenant = async (tenantId: string) => {
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')
  return tenant
}

export const listVersions = async (tenantId: string, page: number, pageSize: number) => {
  await requireTenant(tenantId)
  const where = { tenantId }
  const [versions, total] = await Promise.all([
    prisma.tenantConfig.findMany({
      where,
      orderBy: { version: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tenantConfig.count({ where }),
  ])
  return { versions, total, page, pageSize }
}

export const getVersion = async (tenantId: string, versionId: string) => {
  await requireTenant(tenantId)
  const version = await prisma.tenantConfig.findFirst({ where: { id: versionId, tenantId } })
  if (!version) throw new AppError(404, 'Version not found')
  return version
}

export const rollback = async (tenantId: string, versionId: string) => {
  await requireTenant(tenantId)
  const target = await prisma.tenantConfig.findFirst({ where: { id: versionId, tenantId } })
  if (!target) throw new AppError(404, 'Version not found')

  return prisma.$transaction(async (tx) => {
    const latest = await tx.tenantConfig.findFirst({
      where: { tenantId },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    await tx.tenantConfig.updateMany({ where: { tenantId, isActive: true }, data: { isActive: false } })

    return tx.tenantConfig.create({
      data: { tenantId, version: nextVersion, config: target.config as object, isActive: true },
    })
  })
}
