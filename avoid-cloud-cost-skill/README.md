# Design-for-Cost (FinOps) Evaluator — Claude Code Skill

Evidence-based FinOps / cloud-cost-optimisation review of a software
repository. The authoritative criteria live as one Markdown prompt per topic
under `prompts/` (`FINOPS-00-Shared-Context.md` plus the 20 topics
`FINOPS-01`…`FINOPS-20`, spanning repository structure, config, compute, observability,
resource lifecycle, storage, database, network, Kubernetes, scalability, cloud
consumption, and architectural anti-patterns). Each opted-in repo can feed
per-topic context into those prompts via its own
`skill-config/avoid-cloud-cost-config.yaml`.

Each topic is graded 1–5 on the canonical `FINOPS-00` rubric. The root-level
**`Cost-Avoidance-Scorecard.md`** gathers every graded topic **equal weight**
into a single **Cost Avoidance Score** (1–5, 5 = leanest).

Per opted-in repo the skill produces **two side-by-side artefacts**:

| File | Purpose |
|---|---|
| `outcome/design_for_cost/<repo>/design_for_cost.html` | Self-contained HTML report — all CSS inlined, system fonts only |
| `outcome/design_for_cost/<repo>/design_for_cost.json` | Machine-readable equivalent — same findings, scores, citations |

No external stylesheet, no images, no embedded fonts, no `.scan-*.json`
evidence inventory. Every finding cites `file:line` in the repo or is
explicitly marked **Not Evident**.

## Opt-in via `skill-config/avoid-cloud-cost-config.yaml`

A repo is included in analysis **only when it contains a
`skill-config/avoid-cloud-cost-config.yaml` (or `.yml` / `.json`)
at its root**:

```
<your-repo>/
└── skill-config/
    └── avoid-cloud-cost-config.yaml
```

Repos without this file are skipped entirely — including in multi-repo runs.

Starter templates live in the marketplace `skill-config/level-0|1|2/`
folders. Run `node index.js --scaffold-config` from a repo to drop one in,
then edit it. The config has two parts — a `display-name` and a `prompts:`
map keyed by prompt filename (without extension):

```yaml
# Human-friendly project / repo name used in report titles and metadata.
# Falls back to the folder name when empty.
display-name: ""

# Per-prompt context. Each key must match a prompts/FINOPS-*.md filename.
# `additional_context` is free text; `inputs` are structured facts the
# evaluator treats as authoritative.
prompts:
  "FINOPS-03-Autoscaling-Infrastructure-Indicators":
    additional_context: |
      Baseline capacity is reserved; batch runs on Spot and scales to zero.
    inputs:
      autoscaler: "KEDA on Service Bus depth"
      scale_to_zero: true
```

> A legacy flat `additional-context:` scalar is still accepted and is
> attached to the shared-context prompt (`FINOPS-00`).

## The 20 cost topics

| # | Topic |
|---|---|
| 1  | Repository Structure |
| 2  | Configuration Management |
| 3  | Autoscaling & Infrastructure Indicators |
| 4  | Cost-Sensitive Defaults |
| 5  | Feature Flags |
| 6  | Compute & API Processing |
| 7  | Observability & Logging |
| 8  | Resource Lifecycle & Handling |
| 9  | Dependencies |
| 10 | CI/CD |
| 11 | Infrastructure as Code (IaC) |
| 12 | Tagging & Metadata |
| 13 | Storage |
| 14 | Security vs Cost Balance |
| 15 | Database |
| 16 | Network |
| 17 | Kubernetes & Containers |
| 18 | Scalability |
| 19 | Cloud Service Consumption |
| 20 | Architectural Cost Anti-Patterns |

Per topic, the report shows Observations, Risks (cost impact),
Recommendations, and a Severity pill. Topics without evidence carry a
single **Not Evident** row.

## Cost Maturity Scoring (1–5)

| Score | Band | Meaning |
|---|---|---|
| 5 | Optimised | Cost is a first-class engineering concern |
| 4 | Managed   | Most topics have controls; a few quick wins available |
| 3 | Defined   | Basic cost hygiene; several material gaps |
| 2 | Initial   | Significant hardcoding, weak tagging, default-premium SKUs |
| 1 | Ad-hoc    | Likely 2–5× overspend vs. an optimised baseline |

## Visual Style — Facebook look and feel

The report is themed after **Facebook's design language**: Facebook blue
(`#1877f2`) accents, the `#f0f2f5` page background, white cards with rounded
corners and a subtle shadow, and Facebook's neutral text/border grays
(`#1c1e21` / `#65676b` / `#ced0d4`). Severity pills, the maturity chip, and
status colours use a Facebook-cohesive, contrast-safe palette.

The skill is **self-contained**: it ships its own stylesheet at
`assets/style.css` (fetched via `--read-style-css`) which is embedded inline
inside a single `<style>` block in `<head>`. That sheet already carries the
Facebook-themed palette tokens and every helper rule (severity pills, maturity
chip, findings tables) — no external assets are needed. The palette explicitly
**excludes pure black (`#000000`) and any purple / violet hue**. The report uses
system fonts only (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
Arial, …`) — no embedded `@font-face`, no `data:font/...` URIs, no external
stylesheet, and **no images** (the report is text-only; no icon library is
bundled).

## Quick Start

```bash
# 1. Add a skill-config/avoid-cloud-cost-config.yaml to each repo
cd ./my-repo
node ~/.claude/skills/avoid-cloud-cost-skill/index.js --scaffold-config
# then edit ./my-repo/skill-config/avoid-cloud-cost-config.yaml

# 2. From the parent directory (or a single repo), invoke the skill
cd /path/containing/your/repos
claude
/avoid-cloud-cost--skill
```

## CLI helper

| Command | Description |
|---|---|
| `node index.js --scan-repos` | Detect repos under CWD, parse each `skill-config/avoid-cloud-cost-config.yaml`, emit deterministic JSON (`included[]` vs `excluded[]`) |
| `node index.js --list-prompts` | List the `prompts/FINOPS-*.md` files as JSON |
| `node index.js --read-prompts [--repo=<path>]` | Print every prompt concatenated, merging per-prompt `additional_context` / `inputs` from the repo config |
| `node index.js --read-config [--repo=<path>]` | Emit the resolved config (displayName, per-prompt entries) as JSON |
| `node index.js --read-style-css` | Print the canonical stylesheet (for inline embedding in the HTML) |
| `node index.js --scaffold-config [--force]` | Copy a template config into `skill-config/` |
| `node index.js --setup [--repo=<name>]` | Scaffold `outcome/design_for_cost/[<repo>/]` |
| `node index.js --validate [--repo=<name>]` | Verify the output directory contains only the expected files |
| `node index.js` | Inventory generated `.html` / `.json` files as a JSON report |
| `node index.js --help` | Show usage |

## Output Layout

Single-repo invocation (no sub-repos detected):

```
outcome/design_for_cost/
├── design_for_cost.html
└── design_for_cost.json
```

Multi-repo invocation:

```
outcome/design_for_cost/
├── service-a/
│   ├── design_for_cost.html
│   └── design_for_cost.json
└── service-b/
    ├── design_for_cost.html
    └── design_for_cost.json
```

## Non-Negotiable Constraints

- Repos without `skill-config/avoid-cloud-cost-config.yaml` are excluded — no exceptions
- Every Observation cites `file:line` or is explicitly marked **Not Evident**
- HTML is fully self-contained — canonical stylesheet embedded inline, no external CSS, no images, no embedded fonts
- No pure black or purple / violet hues anywhere
- HTML and JSON contain the SAME findings — counts, IDs, severities match

## Requirements

- Node.js >= 16.0.0
- Claude Code CLI

## Versioning

This skill follows [Semantic Versioning](https://semver.org/). Current version: **1.0.0**.

## License

Released under the [MIT License](./LICENSE) — © 2026 sdubeyslb.
