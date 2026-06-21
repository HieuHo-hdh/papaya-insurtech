# T005: BE Env Config

**Module:** M1 · project-setup
**Story:** S5
**Tags:** BE
**Status:** pending
**Size:** S

## Description
Add `.env.example` and a Zod-validated `config/env.ts` that validates all environment variables on BE startup and fails fast if any are missing.

## Detail
Create `source/be/src/config/env.ts`:
```typescript
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(16),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = EnvSchema.parse(process.env)
```

This file must be imported at the top of `be/src/index.ts` (before anything else) so the process exits with a clear error if any required var is missing.

Update `source/be/.env.example` (or create it if T003 hasn't done so yet):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/papaya
PORT=3001
JWT_SECRET=supersecretkey_at_least_16_chars
NODE_ENV=development
```

All other BE files that need env vars must import from `@/config/env` (e.g. `env.DATABASE_URL`), never from `process.env` directly.

## Expectation
Starting the BE with a missing `JWT_SECRET` or `DATABASE_URL` prints a Zod parse error and exits with code 1. With valid `.env`, startup succeeds.

## Acceptance Criteria
- [ ] `be/src/config/env.ts` exports a typed `env` object
- [ ] Missing `DATABASE_URL` or `JWT_SECRET` causes startup failure with descriptive error
- [ ] `be/src/index.ts` imports `env` before any other app code
- [ ] `be/.env.example` documents all required variables
- [ ] No `process.env` references outside `config/env.ts`

## Dependencies
- Depends on: T002, T004
- Blocks: none

## References
- Architecture: Tech Stack
- Standards: General rules (env vars via config/env.ts on BE)
