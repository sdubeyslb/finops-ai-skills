# FINOPS-16 — Network

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 16**.
Grade it 1–5 on the `FINOPS-00` rubric, cite `file:line`, and map each smell to a
`FINOPS-00` severity. Find traffic patterns that drive data-transfer,
load-balancer, and gateway charges.

## Checks

- Chatty services — service-to-service call fan-out.
- Cross-region traffic — region-specific endpoints and external dependencies.
- Large payloads — API request/response sizes.

## What to look for (evidence)

- **Chatty services:** `Web → Service A → Service B → Service C → Service D` per
  request — **cost impact:** network transfer cost, load balancers,
  service-mesh overhead.
- **Cross-region traffic:** a US service calling a Europe database on the hot
  path — **cost impact:** cross-region transfer charges.
- **Large payloads:** a 50 MB JSON payload — **cost impact:** network egress
  and API-gateway costs.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Coarse-grained calls, same-region data paths, compact payloads → 4–5. Some
chatty flows or a large payload → 3. Deep synchronous call chains or routine
cross-region hops → 2. Cross-region hot paths / huge payloads at scale
(High/Blocker), or expected-but-**Not Evident** → 1.
