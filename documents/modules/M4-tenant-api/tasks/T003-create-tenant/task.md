# T003: Create Tenant

**Module:** M4 · tenant-api
**Story:** S3
**Tags:** BE
**Status:** pending
**Size:** M

## Description
Implement `POST /api/tenants` — create a tenant + its initial config (version 1, `isActive: true`), validated against `TenantConfigSchema`.

## Detail

### Request body shape
```typescript
{
  name: string           // tenant display name
  config: TenantConfig   // full config object — validated by TenantConfigSchema
}
```

Add `CreateTenantSchema` to `be/src/shared/schemas.ts` (and sync to shared/ and fe/shared/):
```typescript
export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  config: TenantConfigSchema,
})
```

### Service
```typescript
export const create = async (name: string, config: TenantConfig) => {
  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name } })
    await tx.tenantConfig.create({
      data: {
        tenantId: tenant.id,
        version: 1,
        config: config as object,
        isActive: true,
      },
    })
    return tx.tenant.findFirst({
      where: { id: tenant.id },
      include: { configs: { where: { isActive: true }, take: 1 } },
    })
  })
}
```

### Controller
```typescript
export const create = async (req: Request, res: Response): Promise<void> => {
  const tenant = await tenantService.create(req.body.name, req.body.config)
  res.status(201).json(success(tenant))
}
```

### Route
```typescript
router.post('/', validate(CreateTenantSchema), asyncHandler(createController))
```

**Rules:**
- Use `$transaction` — tenant row and config row must be created atomically
- Version always starts at 1 for new tenants
- `isActive: true` on the initial config
- Return 201 (not 200) for resource creation
- `validate(CreateTenantSchema)` handles all validation errors before the controller runs — no manual validation in service

## Expectation
`POST /api/tenants` with a valid name + config creates a new tenant and returns 201. Invalid config (e.g. no enabled claim type) returns 400 with field-level errors.

## Acceptance Criteria
- [ ] Returns 201 with created tenant + embedded active config
- [ ] Invalid `TenantConfigSchema` fields return 400 with `details` field errors
- [ ] Missing `name` returns 400
- [ ] Tenant + config row are both in DB after successful call
- [ ] 4th tenant can be created with zero code changes (data-driven)
- [ ] `tsc --noEmit` passes

## Dependencies
- Depends on: T001, T002
- Blocks: T004, T005, T006

## References
- Architecture: `POST /api/tenants`; Validation Rules; Key Architectural Constraint (zero code changes for 4th tenant)
- Standards: Controller — thin; Service — `$transaction`; Response — 201 for creation
