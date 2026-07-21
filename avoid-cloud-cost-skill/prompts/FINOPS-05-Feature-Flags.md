# FINOPS-05 — Feature Flags

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 5**.

## Checks

- Check if feature flags are implemented.
- Ensure expensive features can be toggled off.
- Validate environment-based feature control.

## What to look for (evidence)

- LaunchDarkly / Unleash / config flags / env toggles for cost-controlled paths.
- Ability to disable expensive features (heavy analytics, premium integrations).
- Per-environment flag defaults.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when expensive paths are flag-gated and environment-controlled.
Anti-pattern only (2) when expensive features are always-on with no toggle.
**Not Evident** (1) when no feature-flag mechanism is found.
