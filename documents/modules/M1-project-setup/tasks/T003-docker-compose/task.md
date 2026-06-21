# T003: Docker Compose — PostgreSQL + BE Service

**Module:** M1 · project-setup
**Story:** S3
**Tags:** DevOps
**Status:** pending
**Size:** S

## Description
Add a `docker-compose.yml` at `source/` that runs PostgreSQL and the BE service together for local development.

## Detail
Create/update `source/docker-compose.yml` with two services:
- `db`: `postgres:16-alpine`, port `5432:5432`, env vars `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (values from `.env` via `env_file`), named volume `pgdata`
- `be`: builds from `source/be/Dockerfile`, depends on `db`, port `3001:3001`, `env_file: ./be/.env`, mounts `./be:/app` for hot reload in dev

Add `source/be/Dockerfile` (multi-stage is optional for now — single-stage dev image is fine):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

Add `source/be/.env.example`:
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/papaya
PORT=3001
JWT_SECRET=changeme
```

The `db` service alone must work without the BE service (for running migrations locally against the containerized DB).

## Expectation
`docker-compose up db` starts PostgreSQL accessible on localhost:5432. `docker-compose up` starts both services with BE connecting to DB.

## Acceptance Criteria
- [ ] `docker-compose up db` starts PostgreSQL with no errors
- [ ] `docker-compose up` starts both `db` and `be` with no errors
- [ ] BE container connects to DB (logs show no connection error)
- [ ] `source/be/Dockerfile` exists and builds successfully
- [ ] `source/be/.env.example` exists with all required vars documented

## Dependencies
- Depends on: T002
- Blocks: none

## References
- Architecture: Deploy section (Railway targets, but Docker Compose for local)
- Standards: Backend config/ folder (env vars)
