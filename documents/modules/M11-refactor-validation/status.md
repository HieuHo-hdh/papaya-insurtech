# M11 · refactor-validation — Status

**Status:** in-progress
**Started:** 2026-06-23

## Goal

Refactor and harden validation across the tenant config, version history, and diff page surfaces:
- Align BE Zod schemas so `UpdateTenantSchema` accepts partial claimTypes records
- Tighten cross-field rules (requiredDocs conditional on enabled, perClaimType ⊆ claimTypes keys)
- Replace FE `safeParse` calls with Ant Design form rules as the single validation source
- Add sentinel `Form.Item` pattern for complex cross-field checks (enabled claim type, required docs, isPrimary tier)
- Guard diff service against soft-deleted tenants
- Version history: config preview before rollback
- Diff page: tenant summary cards + cross-exclude dropdown options

## Summary of Tasks

| Task | Description | Tags | Size | Status |
|------|-------------|------|------|--------|
| T001 | Update validation schemas — BE + FE tenant config rules | FE+BE | L | done |
| T002 | BE — diff.service: add requireTenant guards for both IDs | BE | S | done |
| T003 | FE — VersionHistory: config preview drawer before rollback | FE | M | done |
| T004 | FE — DiffPage: tenant summary cards + cross-exclude dropdowns | FE | M | done |
