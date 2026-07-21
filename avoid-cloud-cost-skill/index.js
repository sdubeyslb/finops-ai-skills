#!/usr/bin/env node

/**
 * Design-for-Cost Evaluator — CLI helper.
 *
 * Produces a self-contained FinOps / cost-optimisation report. Output layout:
 *
 *   Single-repo (flat — the common case):
 *     outcome/design_for_cost/design_for_cost.html   ← self-contained HTML
 *     outcome/design_for_cost/design_for_cost.json   ← same data, machine-readable
 *
 *   Multi-repo (one subdir per eligible repo):
 *     outcome/design_for_cost/<repo-name>/design_for_cost.html
 *     outcome/design_for_cost/<repo-name>/design_for_cost.json
 *
 * The HTML is fully self-contained — its <style> block embeds the skill's
 * bundled stylesheet (assets/style.css) inline. No external stylesheet is
 * linked or copied; no images, no embedded fonts.
 *
 * PROMPTS — the authoritative FinOps criteria live as one Markdown file per
 * cost topic under `prompts/`:
 *
 *   FINOPS-00-Shared-Context.md            role, method, grading rubric, output contract
 *   FINOPS-01-Repository-Structure.md  ..  FINOPS-20-Architectural-Cost-AntiPatterns.md
 *
 * The 20 topic prompts (FINOPS-01..FINOPS-20) are each graded 1–5 on the FINOPS-00
 * rubric; `Cost-Avoidance-Scorecard.md` (skill root, NOT a prompt) gathers
 * every graded topic equal-weight into the single Cost Avoidance Score.
 * The filename stem (e.g. `FINOPS-03-Autoscaling-Infrastructure-Indicators`) is
 * the key a repo's config matches against to inject per-topic context.
 *
 * Opt-in is gated by `skill-config/avoid-cloud-cost-config.yaml` (placed
 * inside a `skill-config/` folder at the root of each repo). Repos without
 * this file are SKIPPED entirely. The config supplies:
 *
 *   display-name:   Human-friendly repo label (falls back to folder name)
 *   prompts:        Per-prompt map keyed by prompt filename (without ext);
 *                   each entry may carry `additional_context` (free text) and
 *                   `inputs` (structured facts, treated as authoritative).
 *
 * A legacy flat `additional-context:` scalar is still honoured for back-compat
 * and is attached to the shared-context prompt (FINOPS-00).
 *
 * Operations:
 *   --scan-repos       Detect repos under CWD, read each config, emit deterministic JSON
 *   --list-prompts     Emit JSON listing prompt files under <skill>/prompts/
 *   --read-prompts     Print every prompt concatenated, merging per-prompt config additions
 *   --read-prompt      Deprecated alias of --read-prompts
 *   --read-config      Read the target repo's config and emit JSON (displayName + per-prompt)
 *   --read-style-css   Print the canonical stylesheet to stdout
 *   --scaffold-config  Copy a level template into the target repo's skill-config/
 *   --setup            Scaffold outcome/design_for_cost/ (flat single-repo, or per-repo subdirs)
 *   --validate         Verify the output directory contains only the expected files
 *   (no command)       Inventory generated files as a JSON report
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const pkg = require('./package.json');

const SKILL_DIR     = __dirname;
const SKILL_NAME    = 'avoid-cloud-cost--skill';
const SKILL_TAG     = '[design_for_cost]';
// Output folder name (sits under `outcome/`). Kept short and stable so
// downstream tooling and docs can refer to it directly.
const OUTCOME_SHORT = 'design_for_cost';

const PROJECT_ROOT = process.cwd();
// Base output folder. Default is `outcome/`; `--new` redirects to
// `output-new/` so a fresh run can be staged separately from the
// canonical (reconciled) report before the skill's reconcile step merges
// it back into `outcome/`. Detected straight from argv so the constant is
// ready before the CLI option loop below runs.
const OUTCOME_BASE = process.argv.slice(2).includes('--new') ? 'output-new' : 'outcome';
// Output: <base>/design_for_cost/. Flat layout when only one
// eligible repo is in scope (HTML+JSON directly under OUTCOME_ROOT);
// per-repo subdirs when multiple. The --repo=<name> option still
// targets a named subdirectory explicitly when callers want it.
const OUTCOME_ROOT = path.join(PROJECT_ROOT, OUTCOME_BASE, OUTCOME_SHORT);
const PROMPTS_DIR  = path.join(SKILL_DIR, 'prompts');

// Canonical report artefact names and their archived (`-old`) counterparts.
// Before a fresh run, any existing report is renamed to the `-old` variant so
// the reconcile step can diff the previous review against the new one.
const REPORT_HTML = `${OUTCOME_SHORT}.html`;        // design_for_cost.html
const REPORT_JSON = `${OUTCOME_SHORT}.json`;        // design_for_cost.json
const OLD_HTML    = `${OUTCOME_SHORT}-old.html`;    // design_for_cost-old.html
const OLD_JSON    = `${OUTCOME_SHORT}-old.json`;    // design_for_cost-old.json

const resolveOutcomeDir = repoName =>
  repoName ? path.join(OUTCOME_ROOT, repoName) : OUTCOME_ROOT;

const log = msg => process.stderr.write(`${SKILL_TAG} ${msg}\n`);
const die = msg => { process.stderr.write(`${SKILL_TAG} ERROR: ${msg}\n`); process.exit(1); };

// ── Optional Architecture-Standards resolution (legacy fallback only) ─────
// The skill is self-contained; this sibling lookup remains only so an existing
// Architecture-Standards install keeps working. It is not required.
function resolveStandardsDir() {
  const candidates = [
    path.resolve(SKILL_DIR, '..', 'Architecture-Standards'),
    path.resolve(SKILL_DIR, '..', '..', 'Architecture-Standards'),
    path.resolve(SKILL_DIR, '..', '..', '..', 'Architecture-Standards'),
  ];
  return candidates.find(c => fs.existsSync(c)) || null;
}
const STANDARDS_DIR = resolveStandardsDir();

// ── Resolve the canonical style.css ──────────────────────────────────────────
//
// The HTML report embeds this stylesheet INLINE inside a single <style> block.
// No style.css file is ever copied next to the report and no <link> tag is
// emitted. Source of truth is the skill-bundled assets/style.css.
function resolveStyleCss() {
  // Self-contained: the stylesheet ships inside this skill at assets/style.css.
  // A sibling Architecture-Standards install is still honoured as a legacy
  // fallback, but is no longer required.
  const local = path.join(SKILL_DIR, 'assets', 'style.css');
  if (fs.existsSync(local)) {
    return { path: local, source: 'skill' };
  }
  if (STANDARDS_DIR) {
    const masterCss = path.join(STANDARDS_DIR, 'assets', 'style.css');
    if (fs.existsSync(masterCss)) {
      return { path: masterCss, source: 'standards' };
    }
  }
  return { path: null, source: 'missing' };
}

// ── icon library (optional) ──────────────────────────────────────────────
//
// The self-contained skill ships no icons — the report is text-only by design
// (labels stand alone when no icon matches). These helpers resolve icons only
// if an assets/ subtree happens to provide them (e.g. a legacy
// Architecture-Standards install); otherwise they return nothing.

const ICON_EXTENSIONS = new Set(['.png', '.svg', '.jpg', '.jpeg', '.gif']);
const ICON_MIME = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
};

function resolveAssetsDir() {
  // Prefer the skill-local assets/ folder (self-contained). Fall back to a
  // sibling Architecture-Standards install if one is present (legacy).
  const local = path.join(SKILL_DIR, 'assets');
  if (fs.existsSync(local)) return local;
  return STANDARDS_DIR ? path.join(STANDARDS_DIR, 'assets') : null;
}

function listIcons(subpath) {
  const assets = resolveAssetsDir();
  if (!assets) return [];
  const root = subpath ? path.join(assets, subpath) : assets;
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(assets))) return [];
  if (!fs.existsSync(resolved)) return [];
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (ICON_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        out.push(path.relative(assets, full).split(path.sep).join('/'));
      }
    }
  };
  if (fs.statSync(resolved).isDirectory()) walk(resolved);
  else if (ICON_EXTENSIONS.has(path.extname(resolved).toLowerCase())) {
    out.push(path.relative(assets, resolved).split(path.sep).join('/'));
  }
  return out.sort();
}

function readIconInline(relPath) {
  const assets = resolveAssetsDir();
  if (!assets) return null;
  const full = path.resolve(path.join(assets, relPath));
  if (!full.startsWith(path.resolve(assets))) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  const ext = path.extname(full).toLowerCase();
  if (!ICON_EXTENSIONS.has(ext)) return null;
  if (ext === '.svg') return fs.readFileSync(full, 'utf8');
  const data = fs.readFileSync(full).toString('base64');
  return `data:${ICON_MIME[ext]};base64,${data}`;
}

// ── Prompt discovery (DYNAMIC — re-read on every invocation) ─────────────────
//
// The prompts folder is the single source of truth for which prompts exist.
// Adding a file makes it visible; removing one drops it. Sorted lexically so
// FINOPS-00 (shared context) leads and FINOPS-01..FINOPS-20 (the cost topics) follow.

const PROMPT_EXTENSIONS = ['.md', '.markdown', '.txt'];

function discoverPrompts() {
  if (!fs.existsSync(PROMPTS_DIR)) return [];
  const files = fs.readdirSync(PROMPTS_DIR)
    .filter(f => PROMPT_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort();
  return files.map(file => {
    const ext  = path.extname(file);
    const base = path.basename(file, ext);
    return { id: base, file, ext, absPath: path.join(PROMPTS_DIR, file) };
  });
}

// ── Repo detection ───────────────────────────────────────────────────────────

const REPO_SIGNAL_FILES = [
  '.git',
  'package.json', 'pyproject.toml', 'requirements.txt', 'Pipfile', 'setup.py',
  'pom.xml', 'build.gradle', 'build.gradle.kts',
  'go.mod', 'Cargo.toml',
  'composer.json', 'Gemfile', 'mix.exs',
  'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  'Chart.yaml', 'serverless.yml', 'mta.yaml',
  'main.tf', 'main.bicep',
  'README.md', 'README.rst',
];

const REPO_SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'outcome', '.venv', 'venv',
  '__pycache__', 'target', 'vendor', '.idea', '.vscode', '.next',
  '.nuxt', '.cache', 'coverage', '.gradle', '.terraform',
]);

// Config lives inside the per-repo `skill-config/` folder. The config file is
// `avoid-cloud-cost-config.yaml` (or `.yml` / `.json`) at the repo root.
const CONFIG_DIR          = 'skill-config';
const CONFIG_FILE         = 'avoid-cloud-cost-config.yaml';
const CONFIG_REL_PATH     = `${CONFIG_DIR}/${CONFIG_FILE}`;
const CONFIG_EXAMPLE_FILE = 'avoid-cloud-cost-config.example.yaml';
const CONFIG_RELATIVE_PATHS = [
  `${CONFIG_DIR}/avoid-cloud-cost-config.yaml`,
  `${CONFIG_DIR}/avoid-cloud-cost-config.yml`,
  `${CONFIG_DIR}/avoid-cloud-cost-config.json`,
];

const MAX_CONFIG_FILE_BYTES = 64 * 1024;

function detectRepoSignals(dir) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch (_) { return []; }
  const set = new Set(entries);
  return REPO_SIGNAL_FILES.filter(s => set.has(s));
}

// ── YAML subset parser (nested maps, lists, block scalars, comments) ─────────
//
// Dependency-free. Supported:
//   - `key: value`            (string / number / boolean / null)
//   - `key:` followed by an indented map
//   - `key: |` / `|-` / `|+`  block scalar (preserves newlines)
//   - lists `- item` (scalars only)
//   - `#` line / inline comments
//   - quoted strings: "..." and '...'
//   - flow empty map `{}` and empty list `[]`
// NOT supported: anchors/aliases, non-empty flow style, tags, multi-doc.

function stripInlineComment(s) {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === '#' && !inSingle && !inDouble) {
      if (i === 0 || /\s/.test(s[i - 1])) return s.slice(0, i).trimEnd();
    }
  }
  return s;
}

function coerceScalar(raw) {
  let v = raw.trim();
  if (v === '') return '';
  if (v === '{}') return {};
  if (v === '[]') return [];
  if (/^"(.*)"$/.test(v)) return v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"');
  if (/^'(.*)'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
  if (/^(true|yes|on)$/i.test(v)) return true;
  if (/^(false|no|off)$/i.test(v)) return false;
  if (/^(null|~)$/i.test(v)) return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

function getIndent(line) {
  const m = line.match(/^( *)/);
  return m ? m[1].length : 0;
}

function parseYaml(text) {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => {
    if (/^\s*#/.test(l) || /^\s*$/.test(l)) return l;
    return stripInlineComment(l);
  });

  const root = {};
  const stack = [{ indent: -1, container: root, type: 'map' }];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) { i++; continue; }

    const indent = getIndent(line);
    const content = line.slice(indent);

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const ctx = stack[stack.length - 1];

    if (content.startsWith('- ')) {
      if (!Array.isArray(ctx.container)) {
        throw new Error(`YAML: unexpected list item at line ${i + 1}`);
      }
      ctx.container.push(coerceScalar(content.slice(2).trim()));
      i++;
      continue;
    }

    const mQuoted = content.match(/^"((?:[^"\\]|\\.)*)"\s*:\s*(.*)$/)
                 || content.match(/^'((?:[^'\\]|\\.)*)'\s*:\s*(.*)$/);
    const m = mQuoted || content.match(/^([^:]+?)\s*:\s*(.*)$/);
    if (!m) throw new Error(`YAML: cannot parse line ${i + 1}: ${JSON.stringify(line)}`);

    const key = mQuoted
      ? m[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
      : m[1].trim();
    const value = m[2];

    if (!ctx.container || Array.isArray(ctx.container)) {
      throw new Error(`YAML: key at line ${i + 1} appears inside a list, which is not supported`);
    }

    if (value === '') {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        const nextIndent = getIndent(lines[j]);
        const nextContent = lines[j].slice(nextIndent);
        if (nextIndent > indent && nextContent.startsWith('- ')) {
          const arr = [];
          ctx.container[key] = arr;
          stack.push({ indent, container: arr, type: 'list' });
          i++;
          continue;
        }
      }
      const obj = {};
      ctx.container[key] = obj;
      stack.push({ indent, container: obj, type: 'map' });
      i++;
      continue;
    }

    if (value === '|' || value === '|-' || value === '|+') {
      const blockLines = [];
      let blockIndent = null;
      i++;
      while (i < lines.length) {
        const bl = rawLines[i];
        if (!bl.trim()) { blockLines.push(''); i++; continue; }
        const bIndent = getIndent(bl);
        if (bIndent <= indent) break;
        if (blockIndent === null) blockIndent = bIndent;
        blockLines.push(bl.slice(blockIndent));
        i++;
      }
      let block = blockLines.join('\n');
      if (value === '|-') block = block.replace(/\n+$/, '');
      else if (!block.endsWith('\n')) block = block + '\n';
      ctx.container[key] = block;
      continue;
    }

    ctx.container[key] = coerceScalar(value);
    i++;
  }

  return root;
}

// ── Per-repo config reading ──────────────────────────────────────────────────

function findConfigFile(repoAbsPath) {
  for (const rel of CONFIG_RELATIVE_PATHS) {
    const candidate = path.join(repoAbsPath, rel);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function readConfigFile(repoRoot) {
  const configPath = findConfigFile(repoRoot);
  if (!configPath) {
    return { configPath: path.join(repoRoot, CONFIG_REL_PATH), exists: false, raw: null, parsed: null };
  }
  let stat;
  try { stat = fs.statSync(configPath); }
  catch (err) { die(`Could not stat ${CONFIG_REL_PATH} at ${configPath}: ${err.message}`); }
  if (stat.size > MAX_CONFIG_FILE_BYTES) {
    die(`${CONFIG_REL_PATH} exceeds ${MAX_CONFIG_FILE_BYTES}-byte cap (size: ${stat.size})`);
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  let parsed;
  if (configPath.toLowerCase().endsWith('.json')) {
    try { parsed = JSON.parse(raw); }
    catch (err) { die(`Failed to parse ${CONFIG_REL_PATH} (JSON) at ${configPath}: ${err.message}`); }
  } else {
    try { parsed = parseYaml(raw); }
    catch (err) { die(`Failed to parse ${CONFIG_REL_PATH} at ${configPath}: ${err.message}`); }
  }
  return { configPath, exists: true, raw, parsed: parsed || {} };
}

// Resolve the human-friendly project name surfaced in report titles, HTML
// headers, and JSON `repo.displayName`. Reads `display-name` (kebab) or
// `displayName` (camel); falls back to the repo folder name.
function getDisplayName(parsedConfig, repoRoot) {
  const fallback = path.basename(repoRoot || PROJECT_ROOT);
  if (!parsedConfig || typeof parsedConfig !== 'object') return fallback;
  const candidate = parsedConfig['display-name'] != null
    ? parsedConfig['display-name']
    : parsedConfig['displayName'];
  if (typeof candidate !== 'string') return fallback;
  const trimmed = candidate.trim();
  return trimmed ? trimmed : fallback;
}

function hasDisplayName(parsedConfig) {
  if (!parsedConfig || typeof parsedConfig !== 'object') return false;
  const c = parsedConfig['display-name'] != null ? parsedConfig['display-name'] : parsedConfig['displayName'];
  return typeof c === 'string' && c.trim().length > 0;
}

// Back-compat: a flat top-level `additional-context:` scalar (old config
// shape). Returned as a string or null.
function getFlatAdditionalContext(parsedConfig) {
  if (!parsedConfig || typeof parsedConfig !== 'object') return null;
  const c = parsedConfig['additional-context'] != null
    ? parsedConfig['additional-context']
    : parsedConfig['additionalContext'];
  if (typeof c !== 'string') return null;
  const t = c.trim();
  return t ? t : null;
}

// Map a prompt id to its entry in the parsed config's `prompts:` map.
// Matches are case-insensitive against the prompt filename (without ext).
function resolveConfigForPrompt(parsedConfig, prompt) {
  if (!parsedConfig) return null;
  const promptsSection = parsedConfig.prompts && typeof parsedConfig.prompts === 'object'
    ? parsedConfig.prompts
    : null;
  if (!promptsSection) return null;
  const wantId = prompt.id.toLowerCase();
  for (const k of Object.keys(promptsSection)) {
    if (k.toLowerCase() === wantId) return promptsSection[k];
  }
  return null;
}

function countPromptOverrides(parsedConfig) {
  if (!parsedConfig || typeof parsedConfig.prompts !== 'object' || parsedConfig.prompts === null) return 0;
  return Object.keys(parsedConfig.prompts).length;
}

function formatConfigAdditions(promptId, configEntry, extraContext) {
  const parts = [];
  if (configEntry && typeof configEntry === 'object') {
    if (configEntry.additional_context) {
      parts.push(`Additional context (from ${CONFIG_REL_PATH}):\n${String(configEntry.additional_context).trim()}`);
    }
    if (configEntry.inputs && typeof configEntry.inputs === 'object') {
      const lines = Object.entries(configEntry.inputs).map(([k, v]) => {
        const rendered = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `  - ${k}: ${rendered}`;
      });
      if (lines.length) {
        parts.push(`User-supplied inputs (treat as authoritative):\n${lines.join('\n')}`);
      }
    }
  }
  if (extraContext) {
    parts.push(`Repo-wide context (from ${CONFIG_REL_PATH} additional-context):\n${String(extraContext).trim()}`);
  }
  if (parts.length === 0) return '';
  return `\n\n---- USER CONFIG FOR ${promptId} ----\n\n${parts.join('\n\n')}\n`;
}

// ── Read & concatenate the discovered prompts (with config additions) ────────
function readPrompts(repoRoot) {
  const prompts = discoverPrompts();
  const { parsed: parsedConfig, exists: configExists, configPath } =
    readConfigFile(repoRoot || PROJECT_ROOT);

  if (configExists) log(`Per-repo config loaded: ${configPath}`);
  else log(`No ${CONFIG_REL_PATH} found under ${repoRoot || PROJECT_ROOT} (continuing without per-prompt overrides)`);

  if (prompts.length === 0) {
    log(`No prompt files found under ${PROMPTS_DIR} — nothing to print.`);
    return '';
  }

  const flatContext = getFlatAdditionalContext(parsedConfig);
  const sharedId = prompts.find(p => /shared-context/i.test(p.id))?.id || null;

  return prompts.map(p => {
    const body  = fs.readFileSync(p.absPath, 'utf-8');
    // Attach the legacy flat additional-context to the shared-context prompt only.
    const extra = (flatContext && p.id === sharedId) ? flatContext : null;
    const adds  = formatConfigAdditions(p.id, resolveConfigForPrompt(parsedConfig, p), extra);
    return `\n\n========== PROMPT: ${p.id} ==========\n\n${body}${adds}`;
  }).join('\n');
}

// ── Repo annotation + scanning ───────────────────────────────────────────────

function annotateRepoWithConfig(repo) {
  const { configPath, exists, parsed } = readConfigFile(repo.absPath);
  const relFile = exists
    ? path.relative(repo.absPath, configPath).replace(/\\/g, '/')
    : null;

  const enabled = exists === true;
  const displayName = getDisplayName(parsed, repo.absPath);
  const displayNameSource = hasDisplayName(parsed) ? 'config:display-name' : 'repo-folder-name';
  const reason = enabled
    ? `avoid-cloud-cost config present under ${CONFIG_DIR}/ at repo root`
    : `avoid-cloud-cost config file not present under ${CONFIG_DIR}/ at repo root`;

  return Object.assign({}, repo, {
    avoidCloudCostConfig: {
      found: enabled,
      file: relFile,
      reason,
      promptOverrideCount: countPromptOverrides(parsed),
      additionalContext: getFlatAdditionalContext(parsed),
    },
    displayName,
    displayNameSource,
    additionalContext: getFlatAdditionalContext(parsed),
    promptOverrideCount: countPromptOverrides(parsed),
    enabled,
    exclusionReason: enabled ? null : reason,
  });
}

function scanRepos(rootDir) {
  let entries;
  try { entries = fs.readdirSync(rootDir, { withFileTypes: true }); }
  catch (_) { entries = []; }

  const repos = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (REPO_SKIP_DIRS.has(e.name)) continue;
    if (e.name.startsWith('.')) continue;
    const full = path.join(rootDir, e.name);
    const signals = detectRepoSignals(full);
    if (signals.length === 0) continue;
    repos.push({
      name: e.name,
      path: e.name,
      absPath: full,
      signals,
      isGitRepo: signals.includes('.git'),
    });
  }
  repos.sort((a, b) => a.name.localeCompare(b.name));

  // Single-repo fallback: no sub-folder looks like a repo → treat CWD itself
  // as the candidate repo so single-repo invocations keep working.
  if (repos.length === 0) {
    const ownSignals = detectRepoSignals(rootDir);
    repos.push({
      name: path.basename(rootDir),
      path: '.',
      absPath: rootDir,
      signals: ownSignals,
      isGitRepo: ownSignals.includes('.git'),
    });
  }

  const annotated = repos.map(annotateRepoWithConfig);
  const included = annotated.filter(r => r.enabled);
  const excluded = annotated.filter(r => !r.enabled);

  return {
    scannedRoot: rootDir,
    configFile: CONFIG_REL_PATH,
    repoCount: annotated.length,
    singleRepoFallback: repos.length === 1 && repos[0].path === '.',
    includedCount: included.length,
    excludedCount: excluded.length,
    repos: annotated,
    included,
    excluded,
  };
}

// ── Report archiving + reconciliation ────────────────────────────────────────
//
// A re-run of the skill must not silently discard the previous review.
//
//   • archiveExisting()  — before generating a fresh report, rename any current
//     design_for_cost.{html,json} to design_for_cost-old.{html,json}. Runs
//     automatically as part of --setup and is exposed as --archive.
//   • reconcileReports() — after the new JSON is written, merge the archived
//     report into it (--reconcile):
//        - an issue present in -old but ABSENT from the new report is carried
//          across and marked status:"fixed" (resolved since the last run);
//        - an issue present in the new report but ABSENT from -old is marked
//          status:"new";
//        - an issue present in both is marked status:"carried";
//        - an issue that was previously fixed but reappears is marked
//          status:"reopened".
//     Fixed rows are excluded from the active severity totals.

function archiveExisting(outcomeDir) {
  const archived = [];
  for (const [cur, old] of [[REPORT_JSON, OLD_JSON], [REPORT_HTML, OLD_HTML]]) {
    const curPath = path.join(outcomeDir, cur);
    const oldPath = path.join(outcomeDir, old);
    if (fs.existsSync(curPath) && fs.statSync(curPath).isFile()) {
      // fs.renameSync won't overwrite an existing destination on Windows.
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      fs.renameSync(curPath, oldPath);
      archived.push({ from: cur, to: old });
    }
  }
  return archived;
}

// Normalise free text for cross-run matching: lowercase, collapse whitespace.
function normText(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
}

// Drop a trailing :line or :line-range so a finding that merely shifted lines
// between runs still matches on its file path.
function evidenceStem(e) {
  return normText(String(e == null ? '' : e).replace(/:\d+(?:-\d+)?\s*$/, ''));
}

// A "real finding" is an actionable row — not a Not-Evident placeholder.
function isRealFinding(row) {
  if (!row || typeof row !== 'object') return false;
  if (row.notEvident === true) return false;
  return normText(row.severity) !== 'not evident';
}

// Tiered identity keys for a finding, most specific first.
function findingKeys(sectionId, row) {
  const a  = normText(row.aspect);
  const ev = evidenceStem(row.evidence);
  const ob = normText(row.observation);
  return {
    exact: `${sectionId}${a}${ev}${ob}`,
    byEv:  ev ? `${sectionId}${a}${ev}` : null,
    byObs: ob ? `${sectionId}${a}${ob}` : null,
  };
}

// Copy an old row forward as a resolved-history row (status:"fixed").
function toFixedRow(row, { resolvedAt, firstSeen } = {}) {
  const out = Object.assign({}, row);
  delete out.__consumed;
  out.status = 'fixed';
  if (resolvedAt && !out.resolvedAt) out.resolvedAt = resolvedAt;
  if (firstSeen && !out.firstSeen)   out.firstSeen  = firstSeen;
  return out;
}

function reconcileReports(outcomeDir) {
  const newPath = path.join(outcomeDir, REPORT_JSON);
  const oldPath = path.join(outcomeDir, OLD_JSON);

  if (!fs.existsSync(newPath)) {
    die(`No new report to reconcile at ${path.relative(PROJECT_ROOT, newPath)}. ` +
        `Write ${REPORT_JSON} first, then run --reconcile.`);
  }
  let neu;
  try { neu = JSON.parse(fs.readFileSync(newPath, 'utf-8')); }
  catch (err) { die(`Failed to parse new ${REPORT_JSON}: ${err.message}`); }
  if (!Array.isArray(neu.sections)) die(`New ${REPORT_JSON} has no sections[] array.`);

  if (!fs.existsSync(oldPath)) {
    log(`No ${OLD_JSON} present — first run, nothing to reconcile.`);
    process.stdout.write(JSON.stringify({
      reconciled: false,
      reason: 'no-previous-report',
      counts: { new: 0, carried: 0, reopened: 0, fixed: 0, stillFixed: 0 },
    }, null, 2) + '\n');
    return;
  }
  let old;
  try { old = JSON.parse(fs.readFileSync(oldPath, 'utf-8')); }
  catch (err) { die(`Failed to parse ${OLD_JSON}: ${err.message}`); }

  const newGeneratedAt = neu.generatedAt || null;
  const oldGeneratedAt = old.generatedAt || null;

  // Index every new real finding for consume-once matching.
  const newIndex = { exact: new Map(), byEv: new Map(), byObs: new Map() };
  const pushIdx = (map, key, entry) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  };
  for (const section of neu.sections) {
    if (!Array.isArray(section.rows)) section.rows = [];
    for (const row of section.rows) {
      if (!isRealFinding(row)) continue;
      row.__consumed = false;
      const k = findingKeys(section.id, row);
      pushIdx(newIndex.exact, k.exact, { row });
      pushIdx(newIndex.byEv,  k.byEv,  { row });
      pushIdx(newIndex.byObs, k.byObs, { row });
    }
  }
  const takeMatch = keys => {
    for (const tier of ['exact', 'byEv', 'byObs']) {
      const bucket = keys[tier] && newIndex[tier].get(keys[tier]);
      const hit = bucket && bucket.find(e => !e.row.__consumed);
      if (hit) { hit.row.__consumed = true; return hit.row; }
    }
    return null;
  };

  // Classify each old finding against the new report.
  const sectionsById = new Map(neu.sections.map(s => [s.id, s]));
  const counts = { new: 0, carried: 0, reopened: 0, fixed: 0, stillFixed: 0 };
  const historyRows = []; // fixed rows to append: { sectionId, row }

  for (const section of (Array.isArray(old.sections) ? old.sections : [])) {
    const sid  = section.id;
    const rows = Array.isArray(section.rows) ? section.rows : [];
    for (const row of rows) {
      const wasFixed = normText(row.status) === 'fixed';
      if (!isRealFinding(row) && !wasFixed) continue;
      const match = takeMatch(findingKeys(sid, row));
      if (match) {
        if (wasFixed) { match.status = 'reopened'; match.regressedAt = newGeneratedAt; counts.reopened++; }
        else          { match.status = 'carried';  match.firstSeen  = row.firstSeen || oldGeneratedAt; counts.carried++; }
      } else if (wasFixed) {
        // Previously fixed and still gone → carry the history row forward.
        historyRows.push({ sectionId: sid, row: toFixedRow(row) });
        counts.stillFixed++;
      } else {
        // Active last run, absent now → fixed this run.
        historyRows.push({ sectionId: sid, row: toFixedRow(row, {
          resolvedAt: newGeneratedAt, firstSeen: row.firstSeen || oldGeneratedAt,
        }) });
        counts.fixed++;
      }
    }
  }

  // Unmatched new real findings are genuinely new.
  for (const section of neu.sections) {
    for (const row of section.rows) {
      if (!isRealFinding(row)) continue;
      if (!row.status) { row.status = 'new'; row.firstSeen = newGeneratedAt; counts.new++; }
      delete row.__consumed;
    }
  }

  // Append the fixed / history rows into their sections, then re-sort.
  for (const { sectionId, row } of historyRows) {
    let section = sectionsById.get(sectionId);
    if (!section) {
      section = { id: sectionId, title: `Section ${sectionId}`, score: null, rows: [] };
      neu.sections.push(section);
      sectionsById.set(sectionId, section);
    }
    if (!Array.isArray(section.rows)) section.rows = [];
    section.rows.push(row);
  }
  neu.sections.sort((a, b) => (a.id || 0) - (b.id || 0));

  // Recompute active severity totals (fixed rows excluded).
  const bySeverity = { blocker: 0, high: 0, medium: 0, low: 0, notEvident: 0 };
  let totalActive = 0;
  for (const section of neu.sections) {
    for (const row of (section.rows || [])) {
      if (normText(row.status) === 'fixed') continue;
      if (row.notEvident === true || normText(row.severity) === 'not evident') {
        bySeverity.notEvident++;
        continue;
      }
      const sev = normText(row.severity);
      if      (sev === 'blocker') bySeverity.blocker++;
      else if (sev === 'high')    bySeverity.high++;
      else if (sev === 'medium')  bySeverity.medium++;
      else if (sev === 'low')     bySeverity.low++;
      totalActive++;
    }
  }
  neu.summary = neu.summary || {};
  neu.summary.bySeverity = bySeverity;
  neu.summary.totalFindings = totalActive;
  neu.summary.reconciliation = {
    comparedTo: OLD_JSON,
    previousGeneratedAt: oldGeneratedAt,
    new: counts.new,
    carried: counts.carried,
    reopened: counts.reopened,
    fixedThisRun: counts.fixed,
    stillFixedCarried: counts.stillFixed,
    totalActive,
  };

  fs.writeFileSync(newPath, JSON.stringify(neu, null, 2) + '\n');
  log(`Reconciled ${REPORT_JSON}: ${counts.new} new, ${counts.carried} carried, ` +
      `${counts.reopened} reopened, ${counts.fixed} fixed this run, ` +
      `${counts.stillFixed} still-fixed carried.`);
  process.stdout.write(JSON.stringify({
    reconciled: true,
    comparedTo: OLD_JSON,
    counts: { ...counts, totalActive },
    bySeverity,
  }, null, 2) + '\n');
}

// ── CLI parsing ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {
  help: false, version: false, getSkillPath: false,
  setup: false, validate: false, scanRepos: false,
  listPrompts: false, readPrompts: false, readPrompt: false,
  readConfig: false, readStyleCss: false, scaffoldConfig: false, force: false,
  archive: false, reconcile: false,
  new: false, output: null, repo: null,
};

for (const arg of args) {
  if      (arg === '--help' || arg === '-h')    opts.help = true;
  else if (arg === '--version' || arg === '-v') opts.version = true;
  else if (arg === '--get-skill-path')          opts.getSkillPath = true;
  else if (arg === '--read-style-css')          opts.readStyleCss = true;
  else if (arg === '--list-icons')              opts.listIcons = '';
  else if (arg.startsWith('--list-icons='))     opts.listIcons = arg.slice('--list-icons='.length);
  else if (arg.startsWith('--read-icon='))      opts.readIcon = arg.slice('--read-icon='.length);
  else if (arg === '--list-prompts')            opts.listPrompts = true;
  else if (arg === '--read-prompts')            opts.readPrompts = true;
  else if (arg === '--read-prompt')             opts.readPrompt = true;   // deprecated alias
  else if (arg === '--setup')                   opts.setup = true;
  else if (arg === '--archive')                 opts.archive = true;
  else if (arg === '--reconcile')               opts.reconcile = true;
  else if (arg === '--validate')                opts.validate = true;
  else if (arg === '--scan-repos')              opts.scanRepos = true;
  else if (arg === '--read-config')             opts.readConfig = true;
  else if (arg === '--scaffold-config')         opts.scaffoldConfig = true;
  else if (arg === '--force')                   opts.force = true;
  else if (arg === '--new')                     opts.new = true;
  else if (arg.startsWith('--output='))         opts.output = arg.slice('--output='.length);
  else if (arg.startsWith('--repo='))           opts.repo = arg.slice('--repo='.length);
  else die(`Unknown option: ${arg}\nRun '${SKILL_NAME} --help' for usage.`);
}

// --repo may be a simple subdir name (outcome scoping) OR a path to a repo root
// (config/prompt reading). Path-bearing values are resolved against CWD.
const repoIsPath = opts.repo && /[\\/]/.test(opts.repo);
if (opts.repo && !repoIsPath && !/^[A-Za-z0-9._-]+$/.test(opts.repo)) {
  die(`Invalid --repo value: ${JSON.stringify(opts.repo)}\nMust match /^[A-Za-z0-9._-]+$/ or be a path.`);
}

// Resolve the repo root that config-reading commands (--read-config,
// --read-prompts) operate on. Defaults to the CWD.
function resolveRepoRoot() {
  if (!opts.repo) return PROJECT_ROOT;
  const resolved = path.resolve(PROJECT_ROOT, opts.repo);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    die(`--repo path is not a directory: ${resolved}`);
  }
  return resolved;
}

if (opts.help) {
  process.stdout.write([
    `${pkg.name} v${pkg.version}`,
    '',
    'Usage: node index.js [command] [options]',
    '',
    'Commands:',
    `  --scan-repos         Detect repos under CWD, parse each ${CONFIG_REL_PATH},`,
    `                       and emit deterministic JSON (included vs excluded)`,
    '  --list-prompts       Emit JSON listing prompt files under <skill>/prompts/',
    '  --read-prompts       Print every prompt under <skill>/prompts/ concatenated,',
    `                       merging per-prompt additions from ${CONFIG_REL_PATH} in the target repo`,
    '  --read-prompt        Deprecated alias of --read-prompts',
    `  --read-config        Read the target repo's ${CONFIG_REL_PATH} and emit JSON`,
    '                       (resolved displayName, displayNameSource, per-prompt entries)',
    '  --read-style-css     Print the canonical style.css to stdout (for inline embedding)',
    '  --list-icons[=<sub>] List icons under assets/<sub> (default: all). One path per line.',
    '  --read-icon=<path>   Emit a single icon inline (PNG/JPG/GIF → data URI, SVG → raw markup)',
    `  --scaffold-config    Copy a level template into the target repo at ${CONFIG_REL_PATH}`,
    `                       (creating ${CONFIG_DIR}/ if needed; no overwrite unless --force)`,
    `  --setup              Create <base>/${OUTCOME_SHORT}/ (flat single-repo, or per-repo subdirs).`,
    `                       Base is outcome/ by default, or output-new/ with --new.`,
    `                       Archives any prior ${REPORT_JSON}/.html to ${OLD_JSON}/.html first.`,
    `                       SKIPS repos missing ${CONFIG_REL_PATH} (opt-in gate).`,
    `  --archive            Rename any existing ${REPORT_JSON}/.html to ${OLD_JSON}/.html`,
    '                       (no-op on first run). Folded into --setup; exposed for manual use.',
    `  --reconcile          Merge ${OLD_JSON} into the freshly written ${REPORT_JSON}:`,
    '                       old-only issues -> status:"fixed", new-only -> "new", both -> "carried".',
    '                       Recomputes active severity counts and adds summary.reconciliation.',
    '  --validate           Verify the output directory exists and contains only .html + .json',
    '  --get-skill-path     Print the absolute path of this skill',
    '  (no command)         Inventory generated files as a JSON report',
    '',
    'Options:',
    '  --output=<path>      Write the JSON report to a specific path',
    `  --repo=<name|path>   Subdir name to scope --setup/--validate/inventory, OR a repo-root`,
    '                       path for --read-config / --read-prompts (defaults to CWD)',
    '  --force              Override opt-in gates (--scaffold-config overwrite; --setup proceed)',
    '  --new                Stage output under output-new/ instead of outcome/ (fresh run before reconcile)',
    '  -h, --help           Show this message',
    '  -v, --version        Print the skill version',
    '',
  ].join('\n'));
  process.exit(0);
}

if (opts.version)      { process.stdout.write(`${pkg.version}\n`); process.exit(0); }
if (opts.getSkillPath) { process.stdout.write(`${SKILL_DIR}\n`);   process.exit(0); }

if (opts.listIcons !== undefined) {
  const list = listIcons(opts.listIcons);
  for (const p of list) process.stdout.write(p + '\n');
  process.exit(list.length ? 0 : 1);
}

if (opts.readIcon) {
  const content = readIconInline(opts.readIcon);
  if (content == null) process.exit(1);
  process.stdout.write(content);
  process.exit(0);
}

if (opts.readStyleCss) {
  const css = resolveStyleCss();
  if (!css.path) {
    die('style.css not found. Expected it at assets/style.css inside the skill ' +
        '— the skill embeds this stylesheet inline in the HTML report.');
  }
  log(`style.css: ${css.path} (${css.source})`);
  process.stdout.write(fs.readFileSync(css.path, 'utf-8'));
  process.exit(0);
}

if (opts.scanRepos) {
  process.stdout.write(JSON.stringify(scanRepos(PROJECT_ROOT), null, 2) + '\n');
  process.exit(0);
}

if (opts.listPrompts) {
  const prompts = discoverPrompts().map(p => ({ id: p.id, file: p.file, ext: p.ext, absPath: p.absPath }));
  process.stdout.write(JSON.stringify({
    skill: SKILL_NAME,
    version: pkg.version,
    promptsDir: PROMPTS_DIR,
    promptCount: prompts.length,
    promptExtensions: PROMPT_EXTENSIONS,
    prompts,
  }, null, 2) + '\n');
  process.exit(0);
}

if (opts.readPrompts || opts.readPrompt) {
  if (opts.readPrompt && !opts.readPrompts) {
    log('--read-prompt is deprecated; use --read-prompts (prints all FINOPS-* prompts).');
  }
  process.stdout.write(readPrompts(resolveRepoRoot()));
  process.exit(0);
}

if (opts.readConfig) {
  const repoRoot = resolveRepoRoot();
  const { configPath, exists, parsed } = readConfigFile(repoRoot);
  const prompts = discoverPrompts();
  const perPrompt = prompts.map(p => ({
    promptId: p.id,
    config:   resolveConfigForPrompt(parsed, p),
  }));
  process.stdout.write(JSON.stringify({
    skill: SKILL_NAME,
    version: pkg.version,
    configFile: CONFIG_REL_PATH,
    configPath,
    exists,
    displayName: getDisplayName(parsed, repoRoot),
    displayNameSource: hasDisplayName(parsed) ? 'config:display-name' : 'repo-folder-name',
    additionalContext: getFlatAdditionalContext(parsed),
    promptOverrideCount: countPromptOverrides(parsed),
    parsed: parsed || null,
    perPrompt,
  }, null, 2) + '\n');
  process.exit(0);
}

if (opts.scaffoldConfig) {
  // Resolve the example (first match wins). The minimal level-0 template in
  // the marketplace `skill-config/` is the preferred source — the canonical
  // opt-in-only shape (display-name + empty prompts). Heavier templates and
  // the legacy skill-bundled example are fallbacks.
  const exampleCandidates = [
    path.resolve(SKILL_DIR, '..', CONFIG_DIR, 'level-0', CONFIG_FILE),
    path.resolve(SKILL_DIR, '..', CONFIG_DIR, 'level-1', CONFIG_FILE),
    path.resolve(SKILL_DIR, '..', CONFIG_DIR, 'level-2', CONFIG_FILE),
    path.join(SKILL_DIR, CONFIG_EXAMPLE_FILE),
    path.resolve(SKILL_DIR, '..', CONFIG_DIR, CONFIG_EXAMPLE_FILE),
  ];
  const examplePath = exampleCandidates.find(p => fs.existsSync(p));
  if (!examplePath) {
    die(`Example config not found. Looked in:\n  - ${exampleCandidates.join('\n  - ')}\n`
      + `The skill installation is incomplete.`);
  }

  const targetDir  = path.join(PROJECT_ROOT, CONFIG_DIR);
  const targetPath = path.join(targetDir, CONFIG_FILE);
  if (fs.existsSync(targetPath) && !opts.force) {
    die(`${CONFIG_REL_PATH} already exists at ${targetPath}. Re-run with --force to overwrite.`);
  }
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(examplePath, targetPath);
  log(`Copied example config -> ${targetPath}`);
  log(`Source: ${examplePath}`);
  log(`Edit ${CONFIG_REL_PATH} and re-run --read-prompts / --setup to apply.`);
  process.exit(0);
}

if (opts.archive) {
  const outcomeDir = resolveOutcomeDir(opts.repo);
  if (!fs.existsSync(outcomeDir)) {
    log(`No output directory yet (${path.relative(PROJECT_ROOT, outcomeDir)}); nothing to archive.`);
    process.exit(0);
  }
  const archived = archiveExisting(outcomeDir);
  if (archived.length === 0) log(`No prior report in ${path.relative(PROJECT_ROOT, outcomeDir)} — first run, nothing to archive.`);
  else archived.forEach(a => log(`Archived ${a.from} -> ${a.to}`));
  process.exit(0);
}

if (opts.reconcile) {
  reconcileReports(resolveOutcomeDir(opts.repo));
  process.exit(0);
}

if (opts.setup) {
  // ELIGIBILITY GATE — the skill MUST NOT evaluate a repo that has not opted
  // in by placing skill-config/avoid-cloud-cost-config.yaml at its root.
  // Skipping is the correct, silent default. Pass --force to override.
  //
  // Output layout: flat when only one eligible repo is in scope (the common
  // case); per-repo subdirs when multiple. --repo=<name> targets a named
  // subdirectory explicitly when callers want it.
  let outcomeDir;
  let displayName = null;
  let displayNameSource = null;

  if (opts.repo) {
    outcomeDir = resolveOutcomeDir(opts.repo);
  } else {
    const verdict = scanRepos(PROJECT_ROOT);
    const targets = opts.force ? verdict.repos : verdict.included;

    if (targets.length === 0) {
      log(`Skipped: no eligible repo in ${PROJECT_ROOT}.`);
      log(`  Detected ${verdict.repoCount} candidate repo(s); 0 carry ${CONFIG_REL_PATH}.`);
      verdict.excluded.forEach(r => log(`  - ${r.name}: ${r.exclusionReason}`));
      log(`Hint: run --scaffold-config inside each repo, edit it, then re-run --setup.`);
      process.exit(0);
    }

    const useFlatLayout = targets.length === 1;
    if (useFlatLayout) {
      outcomeDir = OUTCOME_ROOT;
      displayName = targets[0].displayName;
      displayNameSource = targets[0].displayNameSource;
    } else {
      targets.forEach(repo => {
        const dir = resolveOutcomeDir(repo.name);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          log(`Created: ${path.relative(PROJECT_ROOT, dir)}`);
        } else {
          log(`Exists:  ${path.relative(PROJECT_ROOT, dir)}`);
          archiveExisting(dir).forEach(a => log(`  Archived ${a.from} -> ${a.to} (prior report kept for reconcile)`));
        }
        log(`  display-name: "${repo.displayName}" (source: ${repo.displayNameSource}, prompt overrides: ${repo.promptOverrideCount})`);
      });
      verdict.excluded.forEach(r => log(`Skipped: ${r.name} (${r.exclusionReason})`));
      log(`Setup complete. Output root: ${OUTCOME_BASE}/${OUTCOME_SHORT}/<repo>/`);
      log(`Generate design_for_cost.html (self-contained, inline <style> from style.css) and design_for_cost.json side-by-side per repo.`);
      process.exit(0);
    }
  }

  if (!fs.existsSync(outcomeDir)) {
    fs.mkdirSync(outcomeDir, { recursive: true });
    log(`Created: ${path.relative(PROJECT_ROOT, outcomeDir)}`);
  } else {
    log(`Exists:  ${path.relative(PROJECT_ROOT, outcomeDir)}`);
    // A prior report is archived to design_for_cost-old.{html,json} so the
    // reconcile step can diff it against the run about to be generated.
    archiveExisting(outcomeDir).forEach(a => log(`Archived ${a.from} -> ${a.to} (prior report kept for reconcile)`));
  }

  if (displayName) {
    log(`  display-name: "${displayName}" (source: ${displayNameSource})`);
  }

  // Remove artefacts from older skill versions so the output contract is clean
  // (HTML + JSON only).
  for (const entry of fs.readdirSync(outcomeDir)) {
    const full = path.join(outcomeDir, entry);
    if (!fs.statSync(full).isFile()) continue;
    if (/\.(css|md|otf|ttf|png|jpg|jpeg|gif|svg)$/i.test(entry)) {
      fs.unlinkSync(full);
      log(`Removed stray ${entry} (this skill emits only .html + .json)`);
      continue;
    }
    if (/^design-for-cost\.(html|json)$/i.test(entry)) {
      fs.unlinkSync(full);
      log(`Removed legacy ${entry} (artefacts are now named design_for_cost.*)`);
      continue;
    }
    if (/^\.scan-.*\.json$/i.test(entry)) {
      fs.unlinkSync(full);
      log(`Removed stray ${entry} (evidence inventory is no longer emitted)`);
    }
  }

  const scopeSuffix = opts.repo ? `${opts.repo}/` : '';
  log(`Output directory: ${OUTCOME_BASE}/${OUTCOME_SHORT}/${scopeSuffix}`);
  log('Setup complete. Generate design_for_cost.html (self-contained, inline <style> from style.css) and design_for_cost.json side-by-side.');
  process.exit(0);
}

if (opts.validate) {
  const outcomeDir = resolveOutcomeDir(opts.repo);
  if (!fs.existsSync(outcomeDir)) {
    die(`Missing path: ${path.relative(PROJECT_ROOT, outcomeDir)}\n` +
        `Run with --setup${opts.repo ? ` --repo=${opts.repo}` : ''} to create it.`);
  }

  const stray = fs.readdirSync(outcomeDir).filter(f => {
    const full = path.join(outcomeDir, f);
    if (!fs.statSync(full).isFile()) return false;
    if (/\.(css|md|otf|ttf|png|jpg|jpeg|gif|svg)$/i.test(f)) return true;
    if (/^\.scan-.*\.json$/i.test(f)) return true;
    return false;
  });
  if (stray.length > 0) {
    die(`Unexpected file(s) in outcome directory: ${stray.join(', ')}\n` +
        'This skill emits only .html + .json. Re-run --setup to clean them.');
  }

  log(`Output directory is valid (${path.relative(PROJECT_ROOT, outcomeDir)}): no stray .css / .md / font / image / evidence inventory files.`);
  process.exit(0);
}

// Default: inventory generated files
(function inventory() {
  const outcomeDir = resolveOutcomeDir(opts.repo);

  const outcomeFiles = fs.existsSync(outcomeDir)
    ? fs.readdirSync(outcomeDir).filter(f => {
        const full = path.join(outcomeDir, f);
        return fs.statSync(full).isFile() && /\.(html|json)$/i.test(f);
      }).sort()
    : [];

  const byExtension = outcomeFiles.reduce((acc, file) => {
    const ext = path.extname(file).slice(1).toLowerCase();
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {});

  const strayFiles = fs.existsSync(outcomeDir)
    ? fs.readdirSync(outcomeDir).filter(f => {
        const full = path.join(outcomeDir, f);
        if (!fs.statSync(full).isFile()) return false;
        if (/\.(css|md|otf|ttf|png|jpg|jpeg|gif|svg)$/i.test(f)) return true;
        if (/^\.scan-.*\.json$/i.test(f)) return true;
        return false;
      }).sort()
    : [];

  // For inventory, --repo may be an outcome-subdir NAME that is not a repo
  // root on disk. Resolve the config repo root defensively: use the path when
  // it exists, otherwise fall back to the CWD instead of dying.
  let repoRoot = PROJECT_ROOT;
  if (opts.repo) {
    const candidate = path.resolve(PROJECT_ROOT, opts.repo);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) repoRoot = candidate;
  }
  const { configPath, exists, parsed } = readConfigFile(repoRoot);

  const report = {
    skill: SKILL_NAME,
    version: pkg.version,
    timestamp: new Date().toISOString(),
    projectRoot: PROJECT_ROOT,
    skillDir: SKILL_DIR,
    repoScope: opts.repo || null,
    repoScan: scanRepos(PROJECT_ROOT),
    configFile: { name: CONFIG_REL_PATH, path: configPath, exists },
    displayName: getDisplayName(parsed, repoRoot),
    displayNameSource: hasDisplayName(parsed) ? 'config:display-name' : 'repo-folder-name',
    promptOverrideCount: countPromptOverrides(parsed),
    promptCount: discoverPrompts().length,
    outcomeDir: path.relative(PROJECT_ROOT, outcomeDir),
    outcomeFiles,
    summary: {
      totalOutcomeFiles: outcomeFiles.length,
      byExtension,
      htmlReportPresent: outcomeFiles.includes('design_for_cost.html'),
      jsonReportPresent: outcomeFiles.includes('design_for_cost.json'),
      strayFiles,
      strayFileCount: strayFiles.length,
    },
  };

  const outPath = opts.output || path.join(outcomeDir, `${SKILL_NAME}-report.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  log(`Report written to: ${path.relative(PROJECT_ROOT, outPath)}`);
})();
