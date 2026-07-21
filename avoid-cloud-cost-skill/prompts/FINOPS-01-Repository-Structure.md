# FINOPS-01 — Repository Structure

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **section 1**
of the Detailed Section-wise Review.

## Checks

- Check for clear separation of environments (dev / test / prod configs).
- Verify infra, app code, and configs are well organized.
- Identify duplicate or unnecessary code.

## What to look for (evidence)

- Environment folders / overlays (`environments/`, `overlays/`, `dev|test|prod`).
- Clean separation of `infra/`, `src/`, `config/`.
- Copy-pasted modules, dead code, vendored duplicates.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this section:

Strong (4–5) when environments and concerns are cleanly separated with no
duplication. Anti-pattern only (2) when everything is mixed in one tree or
duplicated per environment. **Not Evident** (1) when structure can't be assessed.
