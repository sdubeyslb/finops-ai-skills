# FINOPS-09 — Dependencies

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 9**.

## Checks

- Identify unused or unnecessary dependencies.
- Prefer lightweight libraries.
- Ensure dependency versions are controlled and optimized.

## What to look for (evidence)

- Manifest/lockfile (`package.json`, `requirements.txt`, `go.mod`, etc.).
- Heavyweight packages where a lighter alternative exists; unused imports.
- Pinned vs. floating versions; transitive bloat.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when dependencies are lean, pinned, and justified. Anti-pattern
only (2) when heavy/unused libs and unpinned versions dominate.
**Not Evident** (1) when no dependency manifest is present.
