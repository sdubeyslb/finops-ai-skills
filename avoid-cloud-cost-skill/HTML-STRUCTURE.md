# HTML Structure — Design-for-Cost Review

> Reference for **`outcome/design_for_cost/design_for_cost.html`**.
> Owned by `SKILL.md` STEP 6 (Generate the self-contained HTML report).
> JSON-equivalent shape lives in **`JSON-STRUCTURE.md`**.

The HTML is rendered from the JSON manifest produced in STEP 7. Build the
JSON first, render this from it. The HTML and the JSON MUST be mechanically
equivalent — same section order (1..14), same severities, same evidence
citations, same maturity score. Anything shown in the HTML must be
reproducible from the JSON alone.

## 1. Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design-for-Cost Review — [displayName]</title>
  <style>
    /* 1. Paste the canonical stylesheet here verbatim:
            node "${SKILL_DIR}/index.js" --read-style-css
       2. Then the design-for-cost helper tokens + rules below. */
    :root { /* paste palette tokens from §2 here */ }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 2rem; color: var(--text); background: var(--bg);
           font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
                        Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
           line-height: 1.55; }
    h1, h2, h3 { color: var(--accent); margin-top: 0;
                 font-weight: 700; letter-spacing: -0.01em; }
    h2 { font-size: 1.35rem; border-bottom: 1px solid var(--border);
         padding-bottom: 0.4rem; margin-top: 2rem; }
    /* Facebook-style cards: white surface, rounded corners, subtle shadow */
    .metadata, .dfc-section {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    .dfc-section { break-inside: avoid; }
    table.findings { border-collapse: collapse; width: 100%; font-size: 0.9rem; margin: 0.6rem 0; }
    table.findings th, table.findings td { border: 1px solid var(--border);
                                           padding: 0.45rem 0.6rem; text-align: left;
                                           vertical-align: top; }
    table.findings th { background: var(--surface-2); }
    code { background: var(--surface-2); padding: 1px 4px; border-radius: 3px;
           font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
           font-size: 0.85rem; }
    .pill { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px;
            font-size: 0.72rem; font-weight: 600; color: #ffffff;
            letter-spacing: 0.04em; text-transform: uppercase; }
    .pill.low         { background: var(--sev-low); }
    .pill.medium      { background: var(--sev-medium); }
    .pill.high        { background: var(--sev-high); }
    .pill.blocker     { background: var(--sev-blocker); }
    .pill.not-evident { background: var(--sev-not-evident); }
    /* reconciliation status pills (see JSON row.status) */
    .pill.status-new      { background: var(--status-new); }
    .pill.status-carried  { background: var(--status-carried); }
    .pill.status-reopened { background: var(--status-reopened); }
    .pill.status-fixed    { background: var(--status-fixed); }
    tr.row-fixed td       { color: var(--text-muted); }
    tr.row-fixed td:first-child { text-decoration: line-through; }
    .recon-note { background: var(--surface-2); border: 1px solid var(--border);
                  border-radius: 6px; padding: 0.6rem 0.9rem; margin: 0.6rem 0;
                  font-size: 0.88rem; color: var(--text-muted); }
    .maturity-score   { display: inline-block; min-width: 64px; text-align: center;
                        background: var(--maturity); color: #ffffff;
                        padding: 6px 14px; font-size: 1.1rem; font-weight: 700;
                        border-radius: 6px; }
    .dfc-footer { margin-top: 2rem; padding-top: 0.8rem;
                  border-top: 1px solid var(--border);
                  color: var(--text-muted); font-size: 0.85rem; text-align: center; }
  </style>
</head>
<body>
  <main>
    <!-- 1. Metadata block -->
    <!-- 4. Detailed Topic-wise Review (one block per topic 1..20) -->
  </main>

  <footer class="dfc-footer">
    Design-for-Cost Review · Generated [YYYY-MM-DD] · avoid-cloud-cost--skill v[X.Y]
  </footer>
</body>
</html>
```

## 2. Palette tokens (design-for-cost helpers)

The base look comes from the canonical stylesheet embedded above. Drop
these helper tokens into the inlined `<style>` `:root` block to give the report
a **Facebook look and feel** — Facebook blue accents, the `#f0f2f5` page
background, white rounded cards, and Facebook's neutral text/border grays — plus
the severity pills, maturity chip, and findings tables (concepts the base sheet
doesn't define). Do not introduce black or any purple / violet hue — see
`SKILL.md` STEP 6A for the full exclusion rules.

```css
--bg:           #f0f2f5   /* Facebook page background (light gray) */
--surface:      #ffffff   /* white card / section background */
--surface-2:    #f0f2f5   /* alt card / table header background */
--text:         #1c1e21   /* Facebook primary text (near-black, NOT #000) */
--text-muted:   #65676b   /* Facebook secondary text */
--border:       #ced0d4   /* Facebook divider / card border */
--accent:       #1877f2   /* Facebook blue — section headers, links */
--accent-2:     #166fe5   /* Facebook blue (darker/hover) — secondary accent */

/* severity / maturity */
--sev-low:      #31a24c   /* Facebook green */
--sev-medium:   #b26a00   /* accessible amber */
--sev-high:     #c4460a   /* burnt orange */
--sev-blocker:  #c42b1c   /* Facebook red (accessible) */
--sev-not-evident: #8a8d91 /* Facebook gray */

/* maturity-score chip background */
--maturity:     #1877f2   /* Facebook blue */

/* reconciliation status pills (re-run diff) */
--status-new:      #1877f2   /* Facebook blue — first seen this run */
--status-carried:  #65676b   /* Facebook gray — present in both runs */
--status-reopened: #b26a00   /* amber — was fixed, has regressed */
--status-fixed:    #31a24c   /* Facebook green — resolved since last run */
```

## 3. Metadata block

```html
<div class="metadata">
  <strong>Project:</strong> [displayName from config]<br>
  <strong>Repo Folder:</strong> [folder name]<br>
  <strong>Document Type:</strong> Design-for-Cost (FinOps) Review — 20 topics<br>
  <strong>Skill Version:</strong> v[X.Y]<br>
  <strong>Generated Time:</strong> [YYYY-MM-DD HH:MM:SS (TZ)]<br>
  <strong>Cost Avoidance Score:</strong> <span class="maturity-score">[N.N]/5</span> ([band], gathered equal-weight from every graded prompt)<br>
  <strong>Top Severity:</strong> <span class="pill [class]">[LABEL]</span>
  <!-- include this block ONLY when the config supplied any context -->
  <hr>
  <strong>Repo-supplied context (from skill-config/avoid-cloud-cost-config.yaml):</strong>
  <p>[legacy flat additional-context, rendered verbatim, when present]</p>
  <!-- per-prompt context: list each section that had additional_context / inputs -->
  <ul>
    <li><strong>§[N] [section]:</strong> [one-line gist of that prompt's additional_context / inputs]</li>
  </ul>
</div>
```

## 4. Executive Summary + Top 10 Cost Risks

```html
<section class="dfc-section">
  <h2>Executive Summary</h2>
  <p>[2–4 sentences: overall posture, biggest cost drivers, fastest savings
  opportunities. Cite the cost maturity score and tie it to the most material
  findings.]</p>

  <!-- Render ONLY when summary.reconciliation is present (i.e. a re-run).
       Numbers come straight from summary.reconciliation. -->
  <p class="recon-note">
    <strong>Since the last review ([previousGeneratedAt]):</strong>
    [fixedThisRun] resolved · [new] new · [carried] carried · [reopened] reopened.
    Resolved items are listed in their section tables with a
    <span class="pill status-fixed">Fixed</span> pill and are excluded from the
    severity totals above.
  </p>
</section>

<section class="dfc-section">
  <h2>Top 10 Cost Risks</h2>
  <table class="findings">
    <thead><tr><th>#</th><th>Risk</th><th>Section</th><th>Evidence</th><th>Severity</th></tr></thead>
    <tbody>
      <!-- Sorted by severity desc (Blocker > High > Medium > Low) then section asc -->
      <tr><td>1</td><td>[risk]</td><td>§[N]</td>
          <td><code>[file:line]</code></td>
          <td><span class="pill high">High</span></td></tr>
    </tbody>
  </table>
</section>
```

## 4B. FinOps Scorecard (unified — see `Cost-Avoidance-Scorecard.md`)

The unified scorecard: one row per **graded topic** (`FINOPS-01`…`FINOPS-20`) plus the
single Cost Avoidance Score, which is the **equal-weight mean** of every graded
topic's grade. `Grade (/5)` uses the `FINOPS-00` rubric (5 = leanest); reuse the
maturity/severity helper tokens for colour — no black, no purple, no images.

```html
<section class="dfc-section" id="cost-domain-scorecard">
  <h2>FinOps Scorecard</h2>
  <p><strong>Cost Avoidance Score:</strong>
     <span class="maturity-score">[N.N]/5</span> — [band] (equal-weight mean of
     every graded topic)</p>
  <table class="findings">
    <thead><tr><th>Prompt</th><th>What it grades</th><th>Grade</th><th>Band</th><th>Key Cost Smells</th></tr></thead>
    <tbody>
      <!-- one row per graded topic: FINOPS-01..FINOPS-20.
           N/E topics show "N/E" and are excluded from the mean. -->
      <tr><td>FINOPS-06</td><td>Compute &amp; API Processing</td><td>[N]/5</td><td>[band]</td>
          <td>[named smells, or "—"]</td></tr>
      <!-- repeat for every remaining graded topic -->
    </tbody>
  </table>
</section>
```

## 5. Detailed Topic-wise Review (one block per topic 1..20)

```html
<section class="dfc-section">
  <h2>Detailed Topic-wise Review</h2>

  <h3>1. Repository Structure</h3>
  <table class="findings">
    <thead><tr><th style="width:18%">Aspect</th><th>Observation</th><th>Risk (cost impact)</th><th>Recommendation</th><th style="width:90px">Severity</th><th style="width:90px">Status</th></tr></thead>
    <tbody>
      <tr>
        <td>[aspect]</td>
        <td>[observation — cite <code>file:line</code>]</td>
        <td>[cost impact in $ / cycle terms]</td>
        <td>[concrete action]</td>
        <td><span class="pill medium">Medium</span></td>
        <td><span class="pill status-new">New</span></td>
      </tr>
      <!-- Status pill maps to JSON row.status: New / Carried / Reopened / Fixed.
           Add class="row-fixed" on <tr> for status "fixed" rows, and list them
           last within the section. Omit the Status column entirely on a first
           run (no summary.reconciliation). -->
      <!-- If section has no evidence, single row:
           Observation = "Not Evident", pill class = "not-evident" -->
    </tbody>
  </table>

  <!-- repeat §2..§14 in numeric order, same shape -->
</section>
```

## 6. Quick Wins + Strategic Improvements

```html
<section class="dfc-section">
  <h2>Quick Wins (immediate savings)</h2>
  <table class="findings">
    <thead><tr><th>Action</th><th>Where</th><th>Estimated impact</th><th>Effort</th></tr></thead>
    <tbody>
      <tr><td>[action]</td><td><code>[file]</code></td>
          <td>[~30% storage cost]</td><td>Low</td></tr>
    </tbody>
  </table>
</section>

<section class="dfc-section">
  <h2>Strategic Improvements (long-term optimisation)</h2>
  <table class="findings">
    <thead><tr><th>Initiative</th><th>Sections impacted</th><th>Rationale</th><th>Effort</th></tr></thead>
    <tbody>
      <tr><td>[initiative]</td><td>§3, §11</td>
          <td>[why this is structural]</td><td>Medium</td></tr>
    </tbody>
  </table>
</section>
```

## Portfolio Roll-up (DFC standard, multi-repo only)

> Reference for **`outcome/design_for_cost/design_for_cost-rollup.html`**.
> Owned by `SKILL.md` STEP — WRITE THE CROSS-REPO ROLL-UP. JSON twin lives in
> **`JSON-STRUCTURE.md`** → "Portfolio Roll-up JSON".

This is the canonical, cross-repository roll-up contract. Reproduce it
**verbatim** — identical wording is used across every skill that emits a
roll-up.

- **Model-authored** (no CLI generator). Emitted **ONLY on multi-repo runs**
  (>= 2 opted-in repos). Written **flat at the outcome root**:
  `outcome/design_for_cost/design_for_cost-rollup.html` + `.json`, siblings of
  the per-repo subfolders. Numbers are **carried forward / trivially
  aggregated** from the per-repo reports — never recomputed from evidence.
- **HTML is fully SELF-CONTAINED**: exactly one inline `<style>` = the canonical
  master stylesheet **verbatim** (from `node index.js --read-style-css`)
  FOLLOWED BY this DFC helper-token override block, pasted verbatim:

```
:root{--bg:#f0f2f5;--surface:#ffffff;--surface-2:#f0f2f5;--text:#1c1e21;--text-muted:#65676b;
--border:#ced0d4;--accent:#1877f2;--accent-2:#166fe5;--sev-low:#31a24c;--sev-medium:#b26a00;
--sev-high:#c4460a;--sev-blocker:#c42b1c;--sev-not-evident:#8a8d91;--maturity:#1877f2;}
*{box-sizing:border-box;}
body{margin:0;padding:2rem;color:var(--text);background:var(--bg);
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";line-height:1.55;}
main{max-width:1200px;margin:0 auto;}
h1,h2,h3{color:var(--accent);margin-top:0;font-weight:700;letter-spacing:-0.01em;} h1{font-size:1.7rem;}
h2{font-size:1.35rem;border-bottom:1px solid var(--border);padding-bottom:0.4rem;margin-top:2rem;}
.metadata,.dfc-section{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1rem 1.25rem;margin:1rem 0;box-shadow:0 1px 2px rgba(0,0,0,0.1);}
table.findings{border-collapse:collapse;width:100%;font-size:0.9rem;margin:0.6rem 0;}
table.findings th,table.findings td{border:1px solid var(--border);padding:0.45rem 0.6rem;text-align:left;vertical-align:top;}
table.findings th{background:var(--surface-2);}
code{background:var(--surface-2);padding:1px 4px;border-radius:3px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.85rem;}
.pill{display:inline-block;padding:0.15rem 0.55rem;border-radius:999px;font-size:0.72rem;font-weight:600;color:#fff;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;}
.pill.low{background:var(--sev-low);} .pill.medium{background:var(--sev-medium);} .pill.high{background:var(--sev-high);}
.pill.blocker{background:var(--sev-blocker);} .pill.not-evident{background:var(--sev-not-evident);}
.maturity-score{display:inline-block;min-width:64px;text-align:center;background:var(--maturity);color:#fff;padding:6px 14px;font-size:1.1rem;font-weight:700;border-radius:6px;}
.dfc-footer{margin-top:2rem;padding-top:0.8rem;border-top:1px solid var(--border);color:var(--text-muted);font-size:0.85rem;text-align:center;}
```

- **HTML body**: `<main>` →
  - `<h1>Design-for-Cost (FinOps) Review — Platform Rollup</h1>`
  - `<div class="metadata">` — Scope · Document Type
    `"Cross-repository FinOps rollup (aggregate of N per-repo reviews)"` ·
    Repos Evaluated / Excluded · Skill Version · Generated Time · fleet-mean
    scores as `.maturity-score` chips: **Fleet Mean Cost Maturity** /5 and
    **Fleet Mean Cost Avoidance** /5.
  - Five `<section class="dfc-section">` cards, each with an `<h2>`:
    1. **Executive Summary** — prose.
    2. **Aggregate Findings by Severity** — a row of severity `.pill`s with
       counts + total.
    3. **Per-Repository Scorecard** — `table.findings`, cols
       Repository(`<code>`) / Cost Maturity / Band / Cost Avoidance / Band /
       Top Severity(`.pill`) / Findings.
    4. **Cross-Cutting Cost Themes** — `table.findings`, cols Theme / Affects /
       Evidence(`<code>`) / Severity(`.pill`) / Note.
    5. **Top Platform Actions** — `table.findings`, cols Action /
       Estimated impact / Effort.
  - `<footer class="dfc-footer">…Platform Rollup · Generated <date> · avoid-cloud-cost--skill v<X.Y></footer>`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design-for-Cost Platform Rollup — [Scope]</title>
  <style>
    /* 1. Canonical stylesheet verbatim (node index.js --read-style-css)
       2. Then the DFC helper-token override block above, pasted verbatim. */
  </style>
</head>
<body>
  <main>
    <h1>Design-for-Cost (FinOps) Review — Platform Rollup</h1>

    <div class="metadata">
      <strong>Scope:</strong> [platform / product scope]<br>
      <strong>Document Type:</strong> Cross-repository FinOps rollup (aggregate of [N] per-repo reviews)<br>
      <strong>Repos Evaluated:</strong> [N] &nbsp; <strong>Excluded:</strong> [name (reason), …]<br>
      <strong>Skill Version:</strong> v[X.Y]<br>
      <strong>Generated Time:</strong> [ISO-8601]<br>
      <strong>Fleet Mean Cost Maturity:</strong> <span class="maturity-score">[N.N]/5</span>
      &nbsp; <strong>Fleet Mean Cost Avoidance:</strong> <span class="maturity-score">[N.N]/5</span>
    </div>

    <section class="dfc-section">
      <h2>Executive Summary</h2>
      <p>[platform-level posture, recurring themes, the single biggest lever]</p>
    </section>

    <section class="dfc-section">
      <h2>Aggregate Findings by Severity</h2>
      <p><span class="pill blocker">Blocker [n]</span> <span class="pill high">High [n]</span>
         <span class="pill medium">Medium [n]</span> <span class="pill low">Low [n]</span>
         <span class="pill not-evident">Not Evident [n]</span>
         &nbsp;&nbsp;<strong>Total active findings across fleet:</strong> [n]</p>
    </section>

    <section class="dfc-section">
      <h2>Per-Repository Scorecard</h2>
      <table class="findings">
        <thead><tr><th>Repository</th><th>Cost Maturity</th><th>Band</th><th>Cost Avoidance</th><th>Band</th><th>Top Severity</th><th>Findings</th></tr></thead>
        <tbody>
          <tr><td><code>[repo]</code></td><td>[N]/5</td><td>[band]</td><td>[N.N]/5</td><td>[band]</td>
              <td><span class="pill high">High</span></td><td>[n]</td></tr>
        </tbody>
      </table>
    </section>

    <section class="dfc-section">
      <h2>Cross-Cutting Cost Themes</h2>
      <table class="findings">
        <thead><tr><th>Theme</th><th>Affects</th><th>Evidence</th><th>Severity</th><th>Note</th></tr></thead>
        <tbody>
          <tr><td>[theme]</td><td>[repos affected]</td><td><code>[file:line]</code></td>
              <td><span class="pill high">High</span></td><td>[why it matters fleet-wide]</td></tr>
        </tbody>
      </table>
    </section>

    <section class="dfc-section">
      <h2>Top Platform Actions</h2>
      <table class="findings">
        <thead><tr><th>Action</th><th>Estimated impact</th><th>Effort</th></tr></thead>
        <tbody>
          <tr><td>[action]</td><td>[impact across the fleet]</td><td>Medium</td></tr>
        </tbody>
      </table>
    </section>
  </main>

  <footer class="dfc-footer">
    Design-for-Cost Review · Platform Rollup · Generated [YYYY-MM-DD] · avoid-cloud-cost--skill v[X.Y]
  </footer>
</body>
</html>
```
