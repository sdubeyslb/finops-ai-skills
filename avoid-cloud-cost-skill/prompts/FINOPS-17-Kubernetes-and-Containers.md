# FINOPS-17 — Kubernetes & Containers

Apply the shared method in `FINOPS-00-Shared-Context.md`. This is **topic 17**.
Grade it 1–5 on the `FINOPS-00` rubric, cite `file:line`, and map each smell to a
`FINOPS-00` severity. If the repo contains Helm / YAML / Terraform, review these
closely — find manifest/IaC patterns that waste cluster capacity. Complements
§3 Autoscaling and §11 Infrastructure as Code.

## Checks

- Requests vs limits — pods reserving their maximum size.
- Oversized defaults — memory/CPU larger than the workload needs.
- Autoscaling — missing `HorizontalPodAutoscaler` (or KEDA / cluster autoscaler).
- Service sprawl — too many microservices for the work performed.

## What to look for (evidence)

- **Requests = Limits:** `requests.cpu: 4` with `limits.cpu: 4` — every pod
  reserves its maximum size — **cost impact:** cluster waste (stranded
  capacity).
- **Oversized defaults:** `memory: 8Gi` for a lightweight service — **cost
  impact:** larger nodes than needed.
- **No autoscaling:** a missing HPA/KEDA/cluster autoscaler — **cost impact:**
  paying for peak capacity at all times.
- **Too many microservices:** 20 services executing 5 API operations between
  them — **cost impact:** containers, network, storage, and monitoring all
  multiplied.

## Grading criteria

Apply the `FINOPS-00` 1–5 rubric. For this topic:

Right-sized requests < limits, HPA present, consolidated services → 4–5.
Oversized defaults OR missing HPA on some workloads → 3. requests == limits and
no autoscaling → 2. Oversized + no autoscaling + service sprawl across the
cluster, or expected-but-**Not Evident** → 1.
