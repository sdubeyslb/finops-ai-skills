# FINOPS-15 — Database

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 15** —
one of the highest-value FinOps areas. Grade it 1–5 on the `FINOPS-00` rubric, cite
`file:line`, and map each smell to a `FINOPS-00` severity. Find query/access
patterns that force a larger DB tier, more CPU, or more replicas.

## Checks

- N+1 query patterns.
- Missing pagination on APIs returning collections.
- Overfetching in repository methods.
- Missing index strategy on large tables, search APIs, reporting workloads.

## What to look for (evidence)

- **N+1 queries:** `loadCustomers()` then `for each customer: loadOrders(customer)`
  — 1000 customers → 1001 queries — **cost impact:** higher DB CPU, larger DB
  tier, more replicas.
- **Missing pagination:** `SELECT * FROM orders` with no `LIMIT` / cursor —
  **cost impact:** memory + database compute.
- **Overfetching:** `SELECT *` when only 3 columns are needed — **cost
  impact:** more IO, more cache pressure, higher DB resource consumption.
- **Missing indexes:** full-table scans — **cost impact:** force a larger
  database SKU.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Batched/joined queries, pagination, projected columns, indexed access → 4–5.
Occasional overfetch or a missing index → 3. Systemic N+1, `SELECT *`,
unpaginated collections → 2. N+1 / full scans on hot paths driving DB-tier
upsize (High/Blocker), or expected-but-**Not Evident** → 1.
