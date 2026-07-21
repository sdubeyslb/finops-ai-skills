# FINOPS-10 — CI/CD

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 10** — it
covers both CI/CD integration hygiene and the pipeline cost smells (wasted
runner minutes and build infrastructure). Grade it 1–5 on the `FINOPS-00` rubric,
cite `file:line`, and map each smell to a `FINOPS-00` severity.

## Checks

- Pipeline efficiency — redundant/repeated builds and dependency downloads.
- Build caching — Maven / Gradle / NPM caching configuration.
- Runners — always-on / self-hosted runner pools vs. ephemeral; oversized build
  matrices.
- Test scope — full regression vs. impact-based / affected-only test selection.
- Ephemeral resources — untagged PR resources cleaned up.

## What to look for (evidence)

- CI config (`.github/workflows`, `azure-pipelines.yml`, `.gitlab-ci.yml`, etc.).
- Oversized build matrices; idle / always-on self-hosted runner pools.
- **Inefficient pipelines:** `build … build … test … build` (rebuilding the same
  artefact multiple times) — **cost impact:** more runner consumption.
- **No build caching:** no Maven/Gradle/NPM cache configured — **cost impact:**
  longer execution time on every run.
- **Full regression on every commit:** running all 10,000 tests on every PR —
  **better:** test-impact analysis / affected-only test selection.
- Redundant rebuilds; untagged ephemeral PR resources.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Cached deps, single build reused across stages, right-sized ephemeral runners,
impact-based tests → 4–5. Missing cache OR full regression per PR → 3. Repeated
rebuilds, no caching, or always-on runners → 2. Heavy matrix rebuilds + full
regression on every commit at scale, or expected-but-**Not Evident** → 1.
