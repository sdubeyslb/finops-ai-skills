# FINOPS-11 — Infrastructure as Code (IaC)

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 11**.

## Checks

- Ensure use of variables (avoid hardcoding).
- Verify environment-specific config files (tfvars/yaml/json).
- Detect large instance types enforced by default.

## What to look for (evidence)

- Terraform / Bicep / CloudFormation / Pulumi present?
- Variables for size / count vs. hardcoded SKUs; `*.tfvars` per environment.
- Large instance types enforced as the default.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when IaC is parameterised with per-environment values. Anti-pattern
only (2) when large SKUs are hardcoded. **Not Evident** (1) when no IaC exists.
