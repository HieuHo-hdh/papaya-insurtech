# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

All confirmed design decisions (data model, API contracts, validation rules, processClaim logic) are in **`documents/planning/architecture.md`**. Read it before implementing anything.

## Coding Standards

Folder structure, naming conventions, component rules, and patterns are in **`documents/planning/coding-standards.md`**. Follow these strictly — no raw HTML for text/layout on FE, no business logic in controllers on BE.

## Project Overview

This is a **Multi-Tenant Insurance Configuration Platform** — a coding challenge. The system lets an ops team configure claim processing behavior per insurance company (tenant) without code changes.

**Tech stack:** Next.js 16 + TypeScript + Ant Design 5 + Tailwind CSS + Zod (FE) | Node.js + Express + TypeScript + Prisma + PostgreSQL (BE)

Two main surfaces:
1. **Admin UI** — CRUD for tenant configs, preview mode, config diff, version history + rollback
2. **Runtime** — `processClaim(tenantId, claimData)` that returns approval routing, required docs, notifications, SLA deadline, and custom field validation — driven entirely by config

## Tenant Configuration Schema

Each tenant config contains:
- **Branding**: company name, logo URL, primary/secondary colors
- **Claim Types**: enabled types (OUTPATIENT, INPATIENT, DENTAL, MATERNITY, OPTICAL) with required/optional documents per type
- **Approval Rules**: auto-approval threshold + tiered approver roles mapped to amount ranges
- **Notifications**: events (claim_submitted, approved, rejected, payment_sent) × channels (email, SMS, webhook) × optional custom templates
- **SLA**: target business days per claim type + escalation contacts on breach
- **Custom Fields**: tenant-specific required fields with validation (e.g. Employee ID, Department)

## Seed Data (3 tenants)

| Tenant | Types | Auto-approve | Approval tiers | Notifications | SLA | Custom fields |
|--------|-------|-------------|----------------|---------------|-----|---------------|
| SafeGuard (Corporate) | OUT, IN, DENTAL | 20,000 | 3-tier (assessor → team lead → director) | email | 5d out / 10d in | Employee ID (required) |
| HealthFirst (Retail) | all 5 | 5,000 | 2-tier (assessor → manager) | email + SMS | 7d all | none |
| GovHealth (Government) | OUT, IN | 0 (all manual) | 1-tier (committee) | email + webhook | 15d all | Department + Budget Code (required) |

## Key Architectural Constraint

Adding a 4th tenant must require **zero code changes** — only UI configuration. This means all processing logic must be data-driven with no hardcoded tenant branches.

## Runtime processClaim Contract

```
processClaim(tenantId, claimData) → {
  requiredDocuments: string[],
  approvalTier: { role: string, level: number },
  notifications: { event: string, channels: string[], template?: string }[],
  slaDeadline: Date,
  customFieldsRequired: { name: string, required: boolean }[],
}
```

## Admin UI Requirements

- CRUD for tenant configs with validation (threshold ≥ 0, ≥ 1 claim type enabled, SLA > 0)
- **Preview mode**: select tenant + sample claim → show approval tier, required docs, notifications, SLA deadline
- **Config diff**: side-by-side comparison of two tenants highlighting all differences
- **Config history**: every save creates a version — view history, rollback to any version

## Evaluation Criteria

- All 3 tenants produce different processing output for the same claim input
- Admin UI validates config and blocks invalid saves
- Preview mode accurately predicts runtime output
- Config diff correctly identifies all differences between two tenants
- Config history and rollback work correctly
- 4th tenant onboarding requires zero code changes — only UI config
- `processClaim` returns correct results for each tenant
- Code is modular — adding a new config dimension requires minimal changes

## Submission Requirements

- GitHub repo (public)
- Deployed live URL for the Admin UI
- Demo script: create tenant → configure → process claims against all tenants → compare configs

## Response Logging (MANDATORY)

At the end of **every** response, you MUST append a summary to `.claude/logs/prompts.txt` using Bash. Format:

```
AI Response Summary:
- <bullet 1>
- <bullet 2>
...
----------
```

Run this exact command (fill in the bullets):
```bash
cat >> .claude/logs/prompts.txt << 'LOGEOF'
AI Response Summary:
- <your bullet points here>
----------

LOGEOF
```

Keep bullets concise (max 5), covering what was done or answered. This is non-negotiable — always run this Bash command as the final action of every response.
