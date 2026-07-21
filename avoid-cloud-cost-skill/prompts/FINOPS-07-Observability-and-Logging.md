# FINOPS-07 — Observability & Logging

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 7** — it
covers both the logging-configuration checks and the observability cost smells
(logging/metrics/tracing spend is commonly 10–30 % of cloud cost in large
environments). Grade it 1–5 on the `FINOPS-00` rubric, cite `file:line`, and map
each smell to a `FINOPS-00` severity.

## Checks

- Log level — debug/verbose NOT enabled by default in prod; env-configurable
  levels.
- Logging volume — per-request and object-dump logging; logging in loops /
  high-frequency code paths.
- Log retention — bounded retention / archival policies.
- Metric cardinality — labels that create a time series per value.
- Tracing — sampling rate and payload capture on spans.

## What to look for (evidence)

- `Debug` / `Verbose` default log levels in production config; log level driven
  by env/config vs. hardcoded.
- **Excessive logging:** `log.info(objectMapper.writeValueAsString(order))` on
  every request — **cost impact:** logging-platform ingestion cost balloons.
- **Debug logs enabled:** `logging.level.root=DEBUG` in a production profile —
  **cost impact:** massive ingestion volume.
- **High-cardinality metrics:** a metric label such as `userId=12345` — every
  user creates a new time series — **cost impact:** explodes monitoring costs.
- **Excessive tracing:** 100 % sampling and large payload capture on spans —
  **cost impact:** tracing platforms get costly very quickly.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Structured logs at sane env-driven levels, bounded retention, bounded-cardinality
metrics, sampled tracing → 4–5. Some verbose logging or a few high-cardinality
labels → 3. Debug logging on by default in prod or per-request object dumps → 2.
100 % tracing + full-payload logging at scale (High/Blocker), or
expected-but-**Not Evident** → 1.
