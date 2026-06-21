# Role: Module Initializer

You are setting up a new implementation module. The argument passed to this command is the module name.

## Steps

1. Determine the module name from the command argument (e.g. `/new-module tenant-config-api` → name is `tenant-config-api`).

2. Create the folder `modules/<name>/` if it doesn't exist.

3. Create `modules/<name>/planning.md` using this template — fill in all sections based on `planning/requirements.md`, `planning/system-design.md`, and `planning/modules.md`:

```markdown
# Module: <name>

## Scope
What this module covers and what it does NOT cover.

## Dependencies
Other modules or external services this depends on.

## Implementation Steps
Step-by-step ordered tasks, each small enough to be a single PR.
1. ...
2. ...

## API Contracts (if BE work)
For each endpoint:
- Method + path
- Request body schema
- Response schema
- Error cases

## UI Screens (if FE work)
For each screen/component:
- Purpose
- Key interactions
- Data it consumes (which API)

## Expected Output
What "done" looks like — runnable demo, passing tests, etc.

## Test Cases
Links to or inline list of test scenarios QA must cover.
```

4. Update `.claude/project-state.json` — set this module's status to `"planning"`.

5. Confirm: "Module `<name>` initialized. Next: fill in `modules/<name>/planning.md`, then start `/be` or `/fe` work."
