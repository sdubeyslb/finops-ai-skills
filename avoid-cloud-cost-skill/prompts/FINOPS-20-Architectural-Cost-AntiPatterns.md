# FINOPS-20 — Architectural Cost Anti-Patterns  *(cross-cutting)*

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 20**, a
cross-cutting lens: grade it 1–5 on the `FINOPS-00` rubric, and also fold each
finding into whichever topic prompt it most affects. Cite `file:line` and raise
a `FINOPS-00` severity per finding. Surface the system-level architecture choices
that generate the biggest bills.

## Checks

- Distributed monolith — services that cannot scale/deploy independently.
- Missing cache — repeated DB hits on hot paths with no caching layer.
- Synchronous everything — deep synchronous request chains.
- Data hoarding — "keep everything forever" with no archive strategy.
- Gold-plated reliability — over-engineering for a non-critical workload.

## What to look for (evidence)

- **Distributed Monolith:** many services that cannot scale independently
  (lockstep deploy/release, shared build) — cost increases dramatically vs. a
  true modular design → affects Compute, Network, K8s.
- **Cache Missing:** repeated DB hits on hot paths with no caching layer (look
  for Redis usage, cache annotations, response caching) — often a **major** cost
  driver → affects Database, Compute.
- **Synchronous Everything:** every request traverses `A → B → C → D → E`
  synchronously (look for async/queue/event alternatives) — latency and
  infrastructure cost compound → affects Network, Compute, Scalability.
- **Data Hoarding:** "keep everything forever" with no archive strategy — a
  common source of storage explosion → affects Storage.
- **Gold-Plated Reliability:** over-engineering for a non-critical workload,
  e.g. `5 replicas`, `3 regions`, `4 databases` — huge unnecessary spend →
  affects K8s, Cloud Consumption, Database. Calibrate against any
  criticality/SLO stated in `additional-context` (cite `user config`).

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

No system-level anti-patterns present → 4–5. One moderate anti-pattern → 3. A
dominant anti-pattern (e.g. distributed monolith, missing cache on a hot path)
→ 2. Multiple compounding anti-patterns at scale (High/Blocker) → 1. Each
finding here also caps the affected topic's grade and usually appears as a
High/Blocker in the Top Cost Risks — a distributed monolith or a missing cache
on the hottest path is often the single largest avoidable-spend item.
