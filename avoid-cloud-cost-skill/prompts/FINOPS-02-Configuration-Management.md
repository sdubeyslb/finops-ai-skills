# FINOPS-02 — Configuration Management

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 2**.

## Checks

- Detect any hardcoded instance sizes or resource configurations.
- Ensure environment-specific configuration files are present.
- Confirm usage of variables/config files instead of static values.

## What to look for (evidence)

- Environment variables, `.env` / config files per environment.
- Hardcoded URLs, connection strings, instance sizes, replica counts.
- Centralised config vs. magic literals scattered through code.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when sizing/endpoints come from variables and per-environment
config exists. Anti-pattern only (2) when sizes/secrets/endpoints are
hardcoded inline. **Not Evident** (1) when no configuration surface is found.
