# FINOPS-18 — Scalability

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 18**.
Grade it 1–5 on the `FINOPS-00` rubric, cite `file:line`, and map each smell to a
`FINOPS-00` severity. Determine whether the design scales out cheaply or forces
expensive vertical scaling.

## Checks

- Horizontal scalability — whether the service can scale out.
- Session state — where session/user state is held.
- Cost curve — whether caching / batching / async break the linear cost growth.

## What to look for (evidence)

- **Inefficient scaling pattern:** a stateful singleton service — **cost
  impact:** needs larger machines instead of more cheap instances.
- **Session state in memory:** `Map<String, Session>` held in process memory —
  **cost impact:** prevents scale-out (sticky sessions / vertical scaling only).
- **Linear (or worse) scaling:** traffic doubles → cost doubles (or more), with
  no caching, batching, or async processing to break the curve — **cost
  impact:** spend grows in lockstep with load.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Stateless services, externalised sessions, caching/batching/async present →
4–5. Partially stateless, or missing one of caching/batching/async → 3. Session
state in memory or a stateful singleton on the hot path → 2. Vertical-scale-only
design with linear cost growth and no mitigations, or expected-but-**Not
Evident** → 1.
