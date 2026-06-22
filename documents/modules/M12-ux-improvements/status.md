# M12 · ux-improvements — Status

**Status:** in-progress
**Started:** 2026-06-23

## Goal

UX polish and correctness improvements across FE and BE:
- Auto-redirect to login on 401 instead of silently failing
- Show soft-deleted tenants in the admin list with visual indicator
- Human-readable labels for notification events and channels
- SLA perClaimType inputs filtered to only enabled claim types
- Enrich diff API response with tenant identity + section tagging

## Summary of Tasks

| Task | Description | Tags | Size | Status |
|------|-------------|------|------|--------|
| T001 | FE — 401 auto-redirect to login in API client | FE | S | pending |
| T002 | FE+BE — TenantsPage: show deleted tenants with toggle + column | FE+BE | M | pending |
| T003 | FE — Human-readable labels for notification events/channels | FE | S | pending |
| T004 | FE — SLA perClaimType: only render enabled claim types | FE | S | pending |
| T005 | BE+FE — Diff response: tenant identity + section field (Option C) | FE+BE | M | pending |
