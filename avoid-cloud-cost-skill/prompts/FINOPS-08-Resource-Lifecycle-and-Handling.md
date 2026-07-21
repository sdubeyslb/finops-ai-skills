# FINOPS-08 — Resource Lifecycle & Handling

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 8** — it
covers both resource cleanup / leak handling and the wider lifecycle & orphan
(zombie-resource) risk: always-on spend for things nothing uses. Grade it 1–5
on the `FINOPS-00` rubric, cite `file:line`, and map each smell to a `FINOPS-00`
severity.

## Checks

- Resource cleanup & leaks — temp-file/resource cleanup; connection / memory /
  thread / file-handle leaks; connection-pool sizing.
- Compute orphaning — long-lived workers, zombie services, feature orphaning,
  duplicate pipelines.
- Memory orphaning — unbounded caches, unused resident data, session/object
  retention, event-buffer growth.
- Kubernetes / container orphan risk — overprovisioned requests, forgotten
  replicas, idle autoscaling floors, leftover canary/test deployments.
- Infrastructure orphan risk — unused Terraform resources, multiple infra
  versions, environment sprawl.
- Storage orphaning — temp files never deleted, archive tables never archived,
  object-storage hoarding.
- Messaging & queue orphaning — dead queues/topics, unprocessed DLQs.
- Monitoring cost orphans — unused metrics, legacy dashboards, trace-everything.

## What to look for (evidence)

**Resource cleanup & leaks**

- `dispose()` / `defer close()` / `try-with-resources` / context managers.
- Connection-pool sizing; leaked DB connections, file handles, timers, threads.
- Temp-file / scratch cleanup; unbounded caches.

**A. Compute orphaning**

- **Long-lived background workers** — `@Scheduled(...)` jobs: does the schedule
  still serve a business purpose? Is it replacing a retired workflow? Are
  multiple schedulers solving the same problem?
- **Zombie services** — deployed permanently but receiving little/no traffic →
  always-on VMs / containers / reserved CPU.
- **Feature-based orphaning** — deprecated modules, legacy APIs, old
  integrations still deployed (e.g. `CustomerV1Service`, `CustomerLegacyService`,
  `CustomerMigrationService` all live).
- **Duplicate processing pipelines** — `Kafka Consumer A` + `Kafka Consumer B` +
  `Batch Job C` all processing identical data → 3× unnecessary compute.

**B. Memory orphaning**

- **Unbounded caches** — `HashMap`/`ConcurrentHashMap` with no TTL, eviction, or
  size cap → memory retained forever → larger pods/VMs, more GC.
- **Memory-resident data no longer used** — `loadEntireReferenceData()` at
  startup; is it all still needed? can it be lazy-loaded?
- **Session / object retention** — `static Map`, singleton caches, in-memory
  session stores holding objects longer than the business requirement.
- **Event buffer growth** — `List<Event> pendingEvents` with no cap.

**C. Kubernetes / container orphan risk (very common)**

- **Overprovisioned requests** — `requests.cpu: 4 / memory: 8Gi` while actual
  usage is ~5 % CPU / 15 % memory → stranded capacity.
- **Forgotten replica counts** — `replicas: 10` after traffic dropped → zombie
  replicas.
- **Idle autoscaling floors** — `minReplicas: 5` when traffic needs 1 →
  permanent baseline waste.
- **Canary/test deployments not removed** — `app-canary`, `app-blue`,
  `app-green`, `app-test` left in manifests.

**D. Infrastructure orphan risk**

- **Unused Terraform resources** — `resource ...` never referenced elsewhere.
- **Multiple infrastructure versions** — `terraform/`, `terraform-v2/`,
  `terraform-old/` side by side.
- **Environment sprawl** — `dev`, `dev2`, `qa`, `qa-new`, `uat`, `uat2` →
  forgotten environments.

**E. Storage orphaning**

- **Temporary files never deleted** — `createTempFile()` with no cleanup.
- **Archive tables never archived** — `audit_log`, `audit_log_archive`,
  `audit_log_legacy`.
- **Object-storage hoarding** — `uploadDocument()` with no retention/delete
  workflow.

**F. Messaging & queue orphaning**

- **Dead queues / topics** — `customer.events.v2`, `.legacy`, `.old` with
  legacy consumers still attached.
- **Dead-letter queues never processed** — DLQ exists but has no replay/cleanup
  → storage + operational overhead.

**G. Monitoring cost orphans**

- **Metrics no one uses** — hundreds of `meterRegistry.counter(...)`; still on a
  dashboard? still alerted on?
- **Legacy dashboards** — metrics emitted for retired features/services.
- **Trace everything** — `sampling: 100%` even for low-value transactions.

**H. Reliability ↔ FinOps cross-over**

- **Retry storms** — repeated `retry()` with no backoff → compute/DB/network
  cost spikes.
- **Infinite consumers** — `while(true)` without backoff → CPU burn.
- **Orphan threads** — `new Thread(...)` with no lifecycle management → CPU/
  memory leakage.
- **Connection leaks** — `openConnection()` without close → memory/socket
  growth → larger infrastructure.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Resources pooled and deterministically released, with no orphan/zombie waste →
4–5. Some leaks or a few orphaned resources → 3. Evident leaks / unbounded
growth or systemic orphans (idle replicas, zombie services) → 2. Pervasive
always-on waste or leaks at scale (High/Blocker), or expected-but-**Not
Evident** → 1. Zombie resources are frequently the fastest **cost-avoidance**
wins because they can be removed with no user-facing impact.
