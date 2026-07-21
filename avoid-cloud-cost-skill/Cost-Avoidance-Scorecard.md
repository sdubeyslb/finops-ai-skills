# Cost Avoidance Scorecard

The **aggregation step** for the Design-for-Cost review. It is *not* a prompt /
check and is *not* loaded by `--read-prompts`; run it **after every graded
prompt has been scored** (`SKILL.md` → STEP 5). It gathers the 1–5 grade from
each graded prompt file in `prompts/` and combines them into a **single unified
Cost Avoidance Score**.

Grades and bands use the **canonical grading criteria (1–5) defined in
`prompts/FINOPS-00-Shared-Context.md`** (5 = leanest / most cost-optimised). Base
every grade only on repository evidence; cite `file:line` for the smells.

## 1. Gather each topic's grade

Collect one row per **graded** topic prompt — `FINOPS-01`…`FINOPS-20`. `FINOPS-00`
(shared context) defines the method/rubric and is **not** graded.

| Prompt | What it grades | Grade (/5) | Band | Key cost smells |
|--------|----------------|-----------|------|-----------------|
| `FINOPS-01` | Repository Structure | `grade` | band | smells found |
| `FINOPS-02` | Configuration Management | … | … | … |
| `FINOPS-03` | Autoscaling & Infrastructure Indicators | … | … | … |
| `FINOPS-04` | Cost-Sensitive Defaults | … | … | … |
| `FINOPS-05` | Feature Flags | … | … | … |
| `FINOPS-06` | Compute & API Processing | … | … | … |
| `FINOPS-07` | Observability & Logging | … | … | … |
| `FINOPS-08` | Resource Lifecycle & Handling | … | … | … |
| `FINOPS-09` | Dependencies | … | … | … |
| `FINOPS-10` | CI/CD | … | … | … |
| `FINOPS-11` | Infrastructure as Code | … | … | … |
| `FINOPS-12` | Tagging & Metadata | … | … | … |
| `FINOPS-13` | Storage | … | … | … |
| `FINOPS-14` | Security vs Cost Balance | … | … | … |
| `FINOPS-15` | Database | … | … | … |
| `FINOPS-16` | Network | … | … | … |
| `FINOPS-17` | Kubernetes & Containers | … | … | … |
| `FINOPS-18` | Scalability | … | … | … |
| `FINOPS-19` | Cloud Service Consumption | … | … | … |
| `FINOPS-20` | Architectural Cost Anti-Patterns | … | … | … |

- **Grade (/5)** is that prompt's grade from the `FINOPS-00` grading criteria
  (5 = leanest). A Blocker/High smell on a hot path caps the grade at 1–2.
- **Band** is the `FINOPS-00` band for that grade (5 Optimised … 1 Ad-hoc).
- A prompt with no scorable evidence shows **N/E** and is dropped from the
  average (see below).

## 2. Unified Cost Avoidance Score (equal weight per topic)

Every graded prompt counts **equally** — there is no per-domain weighting:

```
CostAvoidanceScore = round(
    Σ( grade[p] ) / count(p)      over graded prompts with a numeric grade
  , 1 )      # 1–5, higher = leaner ; N/E prompts excluded from Σ and count
```

Map the rounded score to the `FINOPS-00` bands, read as cost-avoidance:

| Score | Band | Meaning |
|-------|------|---------|
| 5 | Optimised | Cost designed out; little avoidable spend |
| 4 | Managed | Mostly lean; a few quick wins |
| 3 | Defined | Basic hygiene; several material cost gaps |
| 2 | Initial | Significant waste patterns present |
| 1 | Ad-hoc | Likely 20–50 % avoidable cloud spend |

## 3. Where it appears

- **HTML** — render the per-topic scorecard table and a single Cost Avoidance
  Score tile in the FinOps Scorecard section (see `HTML-STRUCTURE.md`). Reuse the
  severity/maturity helper tokens (Optimised → green … Ad-hoc → deep red); no
  black, no purple, no images.
- **JSON** — populate `summary.costAvoidanceScore` + `summary.costAvoidanceBand`
  (the single unified score) and a `scorecard[]` array of
  `{ promptId, title, grade, band, smells[] }` (see `JSON-STRUCTURE.md`).

The unified score is the report's single headline grade; it must not contradict
the per-topic grades in the Detailed Review or the cited evidence.
