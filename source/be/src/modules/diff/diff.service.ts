import { PrismaClient } from '@prisma/client'
import type { TenantConfig, DiffEntry, DiffResponse } from '@/shared/types'
import { AppError } from '@/utils/AppError'

const prisma = new PrismaClient()

export const diffConfigs = async (idA: string, idB: string): Promise<DiffResponse> => {
  const [rowA, rowB] = await Promise.all([
    prisma.tenantConfig.findFirst({ where: { tenantId: idA, isActive: true } }),
    prisma.tenantConfig.findFirst({ where: { tenantId: idB, isActive: true } }),
  ])
  if (!rowA) throw new AppError(404, `No active config for tenant ${idA}`)
  if (!rowB) throw new AppError(404, `No active config for tenant ${idB}`)

  const configA = rowA.config as unknown as TenantConfig
  const configB = rowB.config as unknown as TenantConfig

  return {
    tenantA: configA,
    tenantB: configB,
    diffs: flatDiff(configA, configB),
  }
}

function flatDiff(a: unknown, b: unknown, prefix = ''): DiffEntry[] {
  const diffs: DiffEntry[] = []

  if (Array.isArray(a) || Array.isArray(b)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diffs.push({ path: prefix, valueA: a, valueB: b })
    }
    return diffs
  }

  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      const childPath = prefix ? `${prefix}.${key}` : key
      diffs.push(...flatDiff(a[key], b[key], childPath))
    }
    return diffs
  }

  if (a !== b) {
    diffs.push({ path: prefix, valueA: a, valueB: b })
  }
  return diffs
}

const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === 'object' && !Array.isArray(val)
