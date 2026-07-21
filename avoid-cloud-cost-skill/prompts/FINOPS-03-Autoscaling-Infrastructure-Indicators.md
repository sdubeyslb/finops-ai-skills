# FINOPS-03 — Autoscaling & Infrastructure Indicators

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 3**.

## Checks

- Identify autoscaling configurations (HPA / KEDA / ASG).
- Flag fixed-size infrastructure definitions without justification.
- Check if scale-to-zero capability exists where applicable.

## What to look for (evidence)

- HPA, KEDA `ScaledObject`, App Service auto-scale, AWS ASG / target tracking.
- `replicas: <fixed>` with no autoscaler (anti-pattern).
- Lambda concurrency / provisioned concurrency; scale-to-zero on idle workloads.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when autoscaling (and scale-to-zero where apt) is in place.
Anti-pattern only (2) when capacity is fixed with no justification.
**Not Evident** (1) when no scaling configuration is present and the workload
would benefit from it.
