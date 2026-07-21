# FINOPS-14 — Security vs Cost Balance

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 14**.

## Checks

- Identify overuse of encryption/logging that increases cost unnecessarily.
- Ensure configurations are secure yet cost-optimized.

## What to look for (evidence)

- Over-provisioned WAF / KMS / private endpoints where evidence doesn't justify them.
- Redundant audit logging / duplicated log sinks driving ingestion cost.
- Security controls scaled to the actual data sensitivity (not blanket-maximum).

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when controls are proportionate to risk and not duplicated.
Anti-pattern only (2) when blanket-maximum security drives avoidable spend.
**Not Evident** (1) when no security-cost trade-off is observable. Never
recommend weakening a control that protects sensitive data purely to save cost.
