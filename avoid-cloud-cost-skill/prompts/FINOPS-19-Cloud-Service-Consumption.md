# FINOPS-19 — Cloud Service Consumption

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 19**.
Grade it 1–5 on the `FINOPS-00` rubric, cite `file:line`, and map each smell to a
`FINOPS-00` severity. Find per-operation cloud-service charges (object-storage
APIs, messaging, serverless) driven by code patterns.

## Checks

- Storage APIs — repeated per-operation object/blob reads.
- Messaging — Kafka / SQS / EventHub / Service Bus usage and fan-out.
- Serverless — Lambda / Azure Functions sizing and provisioned concurrency.

## What to look for (evidence)

- **Repeated storage APIs:** `loadFile(); loadFile(); loadFile();` within the
  same transaction instead of reading once — **cost impact:** per-operation API
  cost.
- **Event storm:** a single business event fans out to ~50 downstream events —
  **cost impact:** message charges and downstream execution costs.
- **Serverless over-sizing:** a tiny event handler configured with `1024MB`
  memory (or high provisioned concurrency) it never needs — **cost impact:**
  unnecessary per-invocation execution cost.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Cached/batched reads, bounded fan-out, right-sized functions → 4–5. Some
repeated reads or an oversized function → 3. Event storms or per-transaction
repeated blob reads → 2. Fan-out storms + oversized serverless at scale
(High/Blocker), or expected-but-**Not Evident** → 1.
