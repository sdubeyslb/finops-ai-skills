# From One FinOps Expert to Every Team: We Turned a Manual Cost Review Into an AI Skill

*A ~2-minute read on Finops-AI-Skills — and a look inside every prompt that powers it.*

## Last year, this was a person's full-time job

For most of last year, cloud-cost optimisation looked like one thing: a FinOps expert with a calendar full of meetings. They'd connect with team after team, review each team's **infrastructure and repositories**, and manually assess where the money was going — over-provisioned compute, premium SKUs in non-prod, fixed replica counts, untagged resources, paid API calls buried in loops.

It worked. But one expert against dozens of teams and hundreds of repos meant the waiting list *was* the bottleneck.

## The 50% insight

Looking back across a year of reviews, one pattern stood out: roughly **half of the optimisation parameters were manageable right at the repository level** — in the code and config the engineering team already owned. Not in a billing console. Not in a quarterly finance meeting. In the repo.

That half was exactly the part we could capture and hand back to teams.

## So we turned the expert into a skill

We encoded the expert's review method — the checklist, the evidence patterns, the grading rubric — into **Finops-AI-Skills**, an AI skill any team can run on its own repo. It grades a repository across **20 cost topics (1–5)**, rolls them into a single **Cost Avoidance Score**, and cites a `file:line` for every finding (or marks it *Not Evident* — no guessing).

The intelligence lives in a set of Markdown prompts, one per topic. Here's what each does and *why it matters for cost*.

## The prompt files and their FinOps rationale

**FINOPS-00 — Shared Context.** The preamble every topic inherits: the 1–5 rubric, the severity enum (Blocker→Low), the per-finding fields, and the output contract. *Rationale: one consistent, evidence-only grading language so scores are comparable across teams.*

| File | What it checks | Why it costs money |
|---|---|---|
| **01 Repository Structure** | Env separation, clean infra/src/config, duplication | Duplicated-per-env trees multiply everything downstream |
| **02 Configuration Management** | Hardcoded sizes/endpoints vs. per-env variables | Hardcoded SKUs can't be right-sized without a code change |
| **03 Autoscaling** | HPA/KEDA/ASG, scale-to-zero, fixed replicas | Fixed capacity = paying for peak 24×7 |
| **04 Cost-Sensitive Defaults** | Economical defaults, non-prod cheaper than prod | Premium-by-default SKUs quietly inflate every environment |
| **05 Feature Flags** | Expensive paths gated + env-controlled | No toggle means you can't switch off costly features |
| **06 Compute & API Processing** | O(N²) loops, tight polling, paid-API-in-loop, thread pools | Drives bigger containers and autoscaling spend |
| **07 Observability & Logging** | Debug-in-prod, log volume, metric cardinality, tracing | Logging/metrics are often 10–30% of cloud cost |
| **08 Resource Lifecycle** | Leaks, zombie services, idle replicas, orphans | Zombie resources are the fastest no-impact savings |
| **09 Dependencies** | Lean, pinned, justified libraries | Heavyweight/unused deps bloat build and runtime |
| **10 CI/CD** | Build caching, ephemeral runners, test scope | Wasted runner minutes on every commit add up |
| **11 Infrastructure as Code** | Parameterised sizing, per-env tfvars | Hardcoded large SKUs enforce waste at deploy time |
| **12 Tagging & Metadata** | Environment/CostCenter/Owner tags, enforcement | No tags = no cost allocation, no accountability |
| **13 Storage** | Tiering, lifecycle/retention, blobs-in-DB | Storage grows forever without retention rules |
| **14 Security vs Cost** | Controls proportionate to risk, no duplicate sinks | Blanket-maximum security drives avoidable spend |
| **15 Database** | N+1, pagination, overfetch, indexes | Query patterns force a larger DB tier and replicas |
| **16 Network** | Chatty services, cross-region, large payloads | Data transfer and gateway charges compound |
| **17 Kubernetes & Containers** | Requests=limits, oversized defaults, HPA, sprawl | Stranded cluster capacity and peak-sized nodes |
| **18 Scalability** | Stateless design, session state, cost curve | In-memory state forces expensive vertical scaling |
| **19 Cloud Service Consumption** | Repeated storage APIs, event storms, serverless sizing | Per-operation charges scale with sloppy code |
| **20 Architectural Anti-Patterns** | Distributed monolith, missing cache, sync-everything, data hoarding | System-level choices generate the biggest bills |

*(The root `Cost-Avoidance-Scorecard.md` then averages all 20 grades, equal-weight, into the headline score.)*

## What changed

The expert used to be the bottleneck; now they're the multiplier. Teams run the skill themselves, get evidence-backed findings with exact citations, and fix the repo-level 50% before the invoice arrives — freeing the human to focus on the deeper infrastructure half that genuinely needs them.

Cloud cost stops being a scheduled review and becomes a design decision every team can check for itself.

---

*Run it with the Claude Code CLI: add a config to your repo, invoke the skill, read the report.*
