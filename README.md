# SUBMISSION

A **Multi-Tenant Insurance Configuration Platform** — a coding challenge that lets an ops team configure claim processing behavior per insurance company (tenant) without code changes.

**Tech stack:** React 19 + Vite + React Router v7 + TypeScript + Ant Design + Tailwind v4 | Node.js + Express + TypeScript + Prisma + PostgreSQL

- **GitHub:** https://github.com/HieuHo-hdh/papaya-insurtech
- **Live Demo:** https://papaya-insurtech.vercel.app
- **Quick Demo Record:** https://drive.google.com/file/d/1JR2wUf8gPgnwUt6rsy8swSF28dR5nk1s/view?usp=sharing

---

## LOGICAL QUESTIONS

Personal / behavioural interview questions answered in Vietnamese.

**Location:** [`Logical_Questions/README.md`](./Logical_Questions/README.md)

---

## CODING

### ARCHITECTURE

Full system design: data model, API contracts, validation rules, and `processClaim` logic.

**Location:** [`documents/planning/architecture.md`](./documents/planning/architecture.md)

Supporting planning docs:

| File | Description |
|------|-------------|
| [`documents/planning/coding-standards.md`](./documents/planning/coding-standards.md) | Folder structure, naming conventions, component rules |
| [`documents/planning/system-design.md`](./documents/planning/system-design.md) | High-level system design |
| [`documents/planning/ui-design-guide.md`](./documents/planning/ui-design-guide.md) | UI/UX design decisions |
| [`documents/planning/deployment.md`](./documents/planning/deployment.md) | Step-by-step Vercel + Railway deployment guide |
| [`documents/planning/modules.md`](./documents/planning/modules.md) | Module breakdown and implementation order |

---

## HOW I USE AI

All development was assisted by Claude Code (claude.ai/code) using a role-based prompt system. Each role (BA, SA, BE, FE, QA, TL) has a dedicated slash command that scopes Claude to that responsibility.

### PROMPTS LOGS

Every AI response is auto-logged with a timestamp and summary.

**Location:** [`.claude/logs/prompts.txt`](./.claude/logs/prompts.txt)

### COMMANDS (DIVIDED BY ROLES)

Custom slash commands per engineering role, stored as markdown prompt files.

**Location:** [`.claude/commands/`](./.claude/commands/)

| Command | Role |
|---------|------|
| `/ba` | Business Analyst — clarify requirements |
| `/sa` | Software Architect — design decisions |
| `/be` | Senior Backend Developer — API, DB, logic |
| `/fe` | Senior Frontend Developer — UI, components |
| `/qa-api` | QA Engineer — API test cases |
| `/qa-ui` | QA Engineer — UI test cases |
| `/tl` | Team Lead — code review, standards |
| `/orchestra` | Project Conductor — coordinate across roles |
| `/new-module` | Module Initializer — scaffold new features |
| `/ba-tasks` | BA Task Generator — break down stories into tasks |

---

## DOCUMENTS

Planning and module-level documentation.

**Location:** [`documents/`](./documents/)

- [`documents/planning/`](./documents/planning/) — Architecture, coding standards, deployment, system design
- [`documents/modules/`](./documents/modules/) — Per-module specs (M1 setup → M12 UX improvements)

---

## AI PROMPT MODULES

Each feature module (M1–M12) was built using a structured prompt flow: BA → SA → BE/FE → QA. Module specs live alongside the commands.

**Location:** [`documents/modules/`](./documents/modules/)
