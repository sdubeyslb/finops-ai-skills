# FINOPS-12 — Tagging & Metadata

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 12**.

## Checks

- Check if a tagging strategy is defined.
- Validate enforcement of required tags in code/pipeline.

## What to look for (evidence)

- `Environment`, `CostCenter`, `Owner`, `Project` tags applied consistently.
- Tag enforcement via policy (Azure Policy, AWS SCP/Config, OPA) or pipeline checks.
- Default tags wired into IaC providers/modules.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when required cost-allocation tags are defined and enforced.
Anti-pattern only (2) when tags are ad-hoc or absent on billable resources.
**Not Evident** (1) when no tagging surface is found.
