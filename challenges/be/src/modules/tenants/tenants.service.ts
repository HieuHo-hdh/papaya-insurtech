import { PrismaClient } from '@prisma/client'
import { AppError } from '@/utils/AppError'
import type { TenantConfig } from '@/shared/types'

const prisma = new PrismaClient()

const ACTIVE_CONFIG = { configs: { where: { isActive: true }, take: 1 } } as const

export const list = async (page: number, pageSize: number) => {
  const where = { deletedAt: null }
  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: ACTIVE_CONFIG,
    }),
    prisma.tenant.count({ where }),
  ])
  return { tenants, total, page, pageSize }
}

export const getById = async (id: string) => {
  const tenant = await prisma.tenant.findFirst({
    where: { id, deletedAt: null },
    include: ACTIVE_CONFIG,
  })
  if (!tenant) throw new AppError(404, 'Tenant not found')
  return tenant
}

export const create = async (name: string, config: TenantConfig) => {
  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name } })
    await tx.tenantConfig.create({
      data: { tenantId: tenant.id, version: 1, config: config as object, isActive: true },
    })
    return tx.tenant.findFirst({
      where: { id: tenant.id },
      include: ACTIVE_CONFIG,
    })
  })
}

export const update = async (id: string, config: TenantConfig) => {
  const tenant = await prisma.tenant.findFirst({ where: { id, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')

  return prisma.$transaction(async (tx) => {
    const latest = await tx.tenantConfig.findFirst({
      where: { tenantId: id },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    await tx.tenantConfig.updateMany({ where: { tenantId: id, isActive: true }, data: { isActive: false } })
    await tx.tenantConfig.create({
      data: { tenantId: id, version: nextVersion, config: config as object, isActive: true },
    })

    return tx.tenant.findFirst({ where: { id }, include: ACTIVE_CONFIG })
  })
}

export const remove = async (id: string): Promise<void> => {
  const tenant = await prisma.tenant.findFirst({ where: { id, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')
  await prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } })
}
