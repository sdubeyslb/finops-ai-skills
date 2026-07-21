# JSON Structure — Design-for-Cost Review

> Reference for **`outcome/design_for_cost/design_for_cost.json`**.
> Owned by `SKILL.md` STEP 7 (Write the equivalent JSON report).
> HTML-equivalent shape lives in **`HTML-STRUCTURE.md`**.

Build the JSON FIRST, then render the HTML from it. The two MUST be
mechanically equivalent — same sections in numeric order (1..14), same
severities, same evidence citations, same maturity score. Counts in
`summary.bySeverity` MUST match the dashboard counts in the HTML.

## Shape

```json
{
  "schemaVersion": "1.0",
  "skill": "avoid-cloud-cost--skill",
  "skillVersion": "[X.Y]",
  "generatedAt": "[ISO-8601 UTC timestamp]",
  "repo": {
    "folder": "[repo folder name]",
    "displayName": "[from config display-name, or folder name]",
    "additionalContext": "[legacy flat additional-context, or null]",
    "promptContext": [
      { "section": 3, "promptId": "FINOPS-03-Autoscaling-Infrastructure-Indicators",
        "additionalContext": "...", "inputs": { "autoscaler": "..." } }
      /* one entry per config prompts: key that matched a FINOPS-* prompt; [] if none */
    ]
  },
  "summary": {
    "costAvoidanceScore": 3.2,
    "costAvoidanceBand": "Defined",
    "topSeverity": "High",
    "totalFindings": 0,
    "bySeverity": { "blocker": 0, "high": 0, "medium": 0, "low": 0, "notEvident": 0 },
    "reconciliation": {
      "comparedTo": "design_for_cost-old.json",
      "previousGeneratedAt": "[ISO-8601 of the prior run, or null]",
      "new": 0, "carried": 0, "reopened": 0,
      "fixedThisRun": 0, "stillFixedCarried": 0, "totalActive": 0
    }
  },
  "executiveSummary": "[2–4 sentences]",
  "scorecard": [
    { "promptId": "FINOPS-06", "title": "Compute & API Processing", "grade": 3, "band": "Defined",
      "smells": ["O(N^2) load in src/report.ts:88"] }
    /* one entry per graded topic — FINOPS-01..FINOPS-20;
       an N/E topic sets grade null, band "N/E", and is excluded from the
       equal-weight summary.costAvoidanceScore mean */
  ],
  "topCostRisks": [
    { "rank": 1, "risk": "...", "section": 3, "evidence": "infra/k8s.yaml:24",
      "severity": "High" }
  ],
  "sections": [
    {
      "id": 1,
      "title": "Repository Structure",
      "score": 4,
      "rows": [
        {
          "aspect": "...",
          "observation": "...",
          "evidence": "src/index.ts:42",
          "costImpact": "...",
          "recommendation": "...",
          "severity": "Medium",
          "notEvident": false,
          "status": "new",
          "firstSeen": "[ISO-8601, set by --reconcile]",
          "resolvedAt": "[ISO-8601, present only when status is \"fixed\"]",
          "regressedAt": "[ISO-8601, present only when status is \"reopened\"]"
        }
      ]
    }
    /* repeat for topics 2..20, in numeric order */
  ],
  "quickWins": [
    { "action": "...", "where": "infra/storage.tf", "impact": "~30% storage cost", "effort": "Low" }
  ],
  "strategicImprovements": [
    { "initiative": "...", "sections": [3, 11], "rationale": "...", "effort": "Medium" }
  ]
}
```

## Mandatory invariants

- **Every finding in the HTML appears in `sections[*].rows[*]`** with the
  same `severity`, `evidence`, and `observation`.
- **All 20 topics present** under `sections[]` (id 1..20), in numeric order,
  even when a topic has no evidence (use a single row with
  `notEvident: true`, `severity: "Not Evident"`).
- **`summary.bySeverity` counts** = sum of `severity` across every row in
  every topic. Must match the dashboard counts rendered in the HTML.
- **`summary.costAvoidanceScore`** matches the chip rendered in the HTML
  metadata block.
- **Unified scorecard (see `Cost-Avoidance-Scorecard.md`).** `scorecard[]`
  carries one entry per **graded topic** — `FINOPS-01`…`FINOPS-20` — as
  `{ promptId, title, grade, band, smells[] }` (grade 1–5,
  5 = leanest; `FINOPS-00` is not graded). `summary.costAvoidanceScore`
  is the **equal-weight** mean of those grades (`Σ grade / count`, N/E prompts
  excluded), and `summary.costAvoidanceBand` its `FINOPS-00` band. It is the single
  headline score and must not contradict the per-topic grades or the evidence.
- **`topCostRisks`** sorted by severity desc (Blocker > High > Medium > Low),
  then topic asc. Capped at 10 entries.
- **No HTML in the JSON** — values are plain strings (no `<span>`, no
  markdown table syntax). Severity is an exact enum: `"Blocker"`,
  `"High"`, `"Medium"`, `"Low"`, `"Not Evident"`.
- **Pretty-print** with 2-space indent and a trailing newline so diffs
  read cleanly between runs.

## Reconciliation fields (owned by `--reconcile`, NOT the model)

On a re-run the skill archives the prior report to `design_for_cost-old.json`
and, after you write the fresh `design_for_cost.json`, runs
`node "${SKILL_DIR}/index.js" --reconcile` to merge the two. The model writes
rows **without** a `status` field; `--reconcile` adds these:

- **`status`** — one of:
  - `"new"` — finding present this run, absent from `-old` (appended under its
    section).
  - `"carried"` — finding present in both runs.
  - `"reopened"` — finding that had been `"fixed"` and has reappeared.
  - `"fixed"` — finding present in `-old` but ABSENT this run; carried forward
    as a resolved-history row (with `resolvedAt`).
- **`firstSeen`** / **`resolvedAt`** / **`regressedAt`** — ISO-8601 stamps.
- **Matching** is tiered: `section + aspect + evidence(no :line) + observation`,
  falling back to `section + aspect + evidence(no :line)`, then
  `section + aspect + observation`. Line-number-only shifts still match.

Recomputed by `--reconcile`, so leave the rest as you built it:

- **`summary.bySeverity` and `summary.totalFindings` count ACTIVE rows only**
  (`new` / `carried` / `reopened`); `fixed` rows are excluded.
- **`summary.reconciliation`** carries the per-status counts (see shape above).
- `costAvoidanceScore`, `scorecard[]`, section `score`s, `topCostRisks`,
  `quickWins`, and `strategicImprovements` are left untouched — fixed history
  rows must not inflate scores or top risks.
- On the **first run** (no `-old.json`) `--reconcile` is a no-op: rows keep no
  `status` and no `summary.reconciliation` block is added.

## Portfolio Roll-up JSON (DFC standard, multi-repo only)

> Reference for **`outcome/design_for_cost/design_for_cost-rollup.json`**.
> Owned by `SKILL.md` STEP — WRITE THE CROSS-REPO ROLL-UP. HTML twin lives in
> **`HTML-STRUCTURE.md`** → "Portfolio Roll-up".

**Model-authored** (no CLI generator). Emitted **ONLY on multi-repo runs**
(>= 2 opted-in repos), written **flat at the outcome root** as the sibling of
`design_for_cost-rollup.html`. Numbers are **carried forward / trivially
aggregated** from the per-repo `design_for_cost.json` reports — never recomputed
from evidence. The JSON MUST be mechanically equivalent to the roll-up HTML.

```json
{
  "schemaVersion": "1.0",
  "skill": "avoid-cloud-cost--skill",
  "skillVersion": "[X.Y]",
  "generatedAt": "[ISO-8601 UTC timestamp]",
  "kind": "rollup",
  "scope": "[platform / product scope]",
  "reposEvaluated": 6,
  "reposExcluded": [
    { "name": "arch-docs", "reason": "no skill-config opt-in" }
  ],
  "fleetAverages": {
    "costMaturityScoreMean": 1.83,
    "costAvoidanceScoreMean": 2.35
  },
  "aggregateBySeverity": { "blocker": 1, "high": 16, "medium": 27, "low": 38, "notEvident": 15 },
  "aggregateTotalFindings": 97,
  "repos": [
    {
      "repo": "[repo folder name]",
      "costMaturityScore": 2,
      "costMaturityBand": "Initial",
      "costAvoidanceScore": 2.6,
      "costAvoidanceBand": "Initial",
      "topSeverity": "High",
      "totalFindings": 16
    }
    /* one entry per opted-in repo, carried forward from its per-repo report */
  ],
  "crossCuttingThemes": [
    {
      "theme": "Autoscaling disabled with a fixed single replica",
      "affects": "combo, corrosion, scale, gateway-status, control-workflow",
      "evidence": "kubernetes/values.yaml:28 (each service)",
      "severity": "High",
      "note": "HPA blocks exist but enabled:false; pays peak capacity 24x7."
    }
  ],
  "topPlatformActions": [
    {
      "action": "Add a pooled, shared HTTP transport + reusable logging client in chemadvisor-common",
      "estimatedImpact": "Removes per-call handshake and per-log client cost across all 5 services",
      "effort": "Medium"
    }
  ]
}
```

### Roll-up invariants

- **Aggregation only, never recomputation.** `fleetAverages`,
  `aggregateBySeverity`, `aggregateTotalFindings`, and every `repos[]` row are
  carried forward / trivially aggregated from the per-repo reports.
- **Mechanical equivalence with the HTML** — the metadata chips, the severity
  pill row, the Per-Repository Scorecard, Cross-Cutting Cost Themes, and Top
  Platform Actions tables all render from these fields.
- **Severity** is the same exact enum as the per-repo report: `"Blocker"`,
  `"High"`, `"Medium"`, `"Low"`, `"Not Evident"`.
- **No HTML in the JSON** — plain strings only. Pretty-print with 2-space
  indent and a trailing newline.
