# FINOPS-13 — Storage

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 13** — it
covers both storage-usage hygiene and the storage cost smells (spend that grows
without bound). Grade it 1–5 on the `FINOPS-00` rubric, cite `file:line`, and map
each smell to a `FINOPS-00` severity.

## Checks

- Storage class / tier — hot vs. cool vs. archive, `gp3` vs `io2`; configurable,
  not an implicit premium-SSD assumption.
- Lifecycle — retention / archival rules; soft-delete bloat; oversized volumes.
- Data retention — log retention, audit retention, cache persistence.
- Duplicate data — same data across multiple tables, or the same payload stored
  in both the DB and object storage.
- Large objects in the database — images, PDFs, videos, attachments.

## What to look for (evidence)

- Storage class / tier configurable? Implicit premium-SSD assumptions; oversized
  volumes.
- Lifecycle / retention / archival rules; soft-delete bloat.
- **No retention policy:** `saveAuditEvent()` with no cleanup / archival policy
  — **cost impact:** storage grows forever.
- **Duplicate data:** multiple copies of identical datasets — **cost impact:**
  storage × N.
- **Blobs in the DB:** a `BLOB` stored in a transactional database —
  **better:** store in blob/object storage; keep only a reference in the DB.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Configurable tier with lifecycle/retention rules, tiering, references not blobs →
4–5. Missing retention on some stores → 3. Premium SSD assumed with no lifecycle
policy, large blobs in the transactional DB, or duplicated datasets → 2.
Unbounded, forever-growing storage on the primary datastore, or
expected-but-**Not Evident** → 1.
