# FINOPS-04 — Cost-Sensitive Defaults

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 4**.

## Checks

- Verify default configs use smaller/efficient instance types.
- Ensure non-prod configs are cheaper than production.
- Identify expensive services enabled by default.

## What to look for (evidence)

- Premium SKU defaults (`Standard_D8s_v3` in non-prod, dedicated App Service plans).
- `gp3` vs `gp2`, `Standard_LRS` vs `Premium_LRS`.
- Always-on / premium services switched on by default in every environment.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when defaults are economical and non-prod is demonstrably cheaper
than prod. Anti-pattern only (2) when premium SKUs are the default everywhere.
**Not Evident** (1) when no default sizing is expressed.
