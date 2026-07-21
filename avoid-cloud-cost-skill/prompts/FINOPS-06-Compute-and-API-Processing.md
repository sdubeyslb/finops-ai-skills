# FINOPS-06 — Compute & API Processing

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 6** — it
covers both the design/processing checks and the compute cost smells. Grade it
1–5 on the `FINOPS-00` rubric, cite `file:line`, and map each smell to a `FINOPS-00`
severity.

## Checks

- CPU efficiency — inefficient algorithms, nested loops on large datasets,
  repeated calculations, large in-memory transformations.
- Processing model — tight polling loops vs. event-driven design; paid-API calls
  inside loops.
- Batching & compression — bulk/batch endpoints; compression for heavy transfer.
- Background jobs — scheduled jobs, cron jobs, polling services.
- Thread over-provisioning — executor services, thread pools, async workers.

## What to look for (evidence)

- Busy-wait / short-interval polling loops; paid-API calls inside loops.
- Event-driven triggers (queues, webhooks, pub/sub) vs. fan-out without
  back-pressure.
- Bulk/batch endpoints; gzip / compression on heavy payloads.
- **O(N²) load:** a loop over a collection that re-streams/filters another
  collection per element (e.g.
  `for (customer : customers) { orders.stream().filter(...).collect(...) }`) —
  **cost impact:** more vCPUs, bigger containers, higher autoscaling expense.
- **Background job explosion:** `every 30s: scan entire database` instead of
  event-driven — **cost impact:** compute consumption 24×7.
- **Thread over-provisioning:** `FixedThreadPool(500)` with low actual workload
  — **cost impact:** larger instances than business demand requires.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Event-driven, efficient algorithms, batched/compressed, right-sized pools → 4–5.
Some polling or an oversized pool → 3. O(N²) hot paths, tight polling, or
DB-scanning schedulers → 2. Unbounded paid-API loops / runaway compute
(Blocker), or expected-but-**Not Evident** → 1.
