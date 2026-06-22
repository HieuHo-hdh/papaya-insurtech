import { PrismaClient } from '@prisma/client'
import type { TenantConfig, DiffEntry, DiffResponse, ConfigSection } from '@/shared/types'
import { AppError } from '@/utils/AppError'

const prisma = new PrismaClient()

const requireTenant = async (tenantId: string) => {
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } })
  if (!tenant) throw new AppError(404, 'Tenant not found')
  return tenant
}

export const diffConfigs = async (idA: string, idB: string): Promise<DiffResponse> => {
  await requireTenant(idA)
  await requireTenant(idB)

  const [rowA, rowB] = await Promise.all([
    prisma.tenantConfig.findFirst({
      where: { tenantId: idA, isActive: true },
      include: { tenant: true },
    }),
    prisma.tenantConfig.findFirst({
      where: { tenantId: idB, isActive: true },
      include: { tenant: true },
    }),
  ])
  if (!rowA) throw new AppError(404, `No active config for tenant ${idA}`)
  if (!rowB) throw new AppError(404, `No active config for tenant ${idB}`)

  const configA = rowA.config as unknown as TenantConfig
  const configB = rowB.config as unknown as TenantConfig

  return {
    tenantA: { id: idA, name: rowA.tenant.name, config: configA },
    tenantB: { id: idB, name: rowB.tenant.name, config: configB },
    diffs: flatDiff(configA, configB),
  }
}

function flatDiff(a: unknown, b: unknown, prefix = '', section = ''): DiffEntry[] {
  const diffs: DiffEntry[] = []
  const currentSection = (section || prefix) as ConfigSection

  if (Array.isArray(a) || Array.isArray(b)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diffs.push({ section: currentSection, path: prefix, valueA: a, valueB: b })
    }
    return diffs
  }

  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      const childPath = prefix ? `${prefix}.${key}` : key
      const childSection = section || key
      diffs.push(...flatDiff(a[key], b[key], childPath, childSection))
    }
    return diffs
  }

  if (a !== b) {
    diffs.push({ section: currentSection, path: prefix, valueA: a, valueB: b })
  }
  return diffs
}

const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === 'object' && !Array.isArray(val)
