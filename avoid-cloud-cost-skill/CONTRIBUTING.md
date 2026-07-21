# Contributing to avoid-cloud-cost-skill

Thanks for your interest in improving this skill! This project is a
zero-dependency Node.js CLI plus a set of Markdown prompts, so getting started
is quick.

## Prerequisites

- Node.js **>= 16** (no npm dependencies to install)
- Git

## Getting started

```bash
git clone https://github.com/sdubeyslb/finops-ai-skills.git
cd finops-ai-skills/avoid-cloud-cost-skill

# Sanity-check the CLI
node index.js --help
node index.js --list-prompts
node index.js --read-style-css | head

# Run the test suite
npm test          # == node --test
```

## Project layout

| Path | What it is |
|---|---|
| `index.js` | The CLI (scan, read-prompts, setup, validate, read-style-css, …) |
| `SKILL.md` | The authoring instructions Claude follows to produce a report |
| `prompts/FINOPS-00…20*.md` | The authoritative per-topic FinOps criteria |
| `Cost-Avoidance-Scorecard.md` | Equal-weight scorecard definition |
| `HTML-STRUCTURE.md` / `JSON-STRUCTURE.md` | Output contracts (HTML + JSON) |
| `assets/style.css` | The bundled, self-contained report stylesheet |
| `skill-config/*.yaml` | Sample opt-in configs (minimal + full example) |

## Conventions

- **Prompts** are the single source of truth. There must be exactly **21** files
  (`FINOPS-00` … `FINOPS-20`). Don't add duplicates or stray files —
  `--read-prompts` concatenates everything in `prompts/`.
- **No runtime dependencies.** Keep `index.js` dependency-free (Node built-ins
  only) so the skill stays trivial to install and audit.
- **Self-contained output.** The HTML report must inline everything: no external
  CSS/JS, no images, no embedded fonts. The palette must exclude pure black
  (`#000000`) and any purple / violet hue.
- **Keep docs in sync.** If you change the config filename, prompt IDs, CLI
  flags, or output contract, update `SKILL.md`, `README.md`, `skill.json`,
  `HTML-STRUCTURE.md`, and `JSON-STRUCTURE.md` together.

## Making a change

1. Create a branch: `git checkout -b feat/short-description`.
2. Make your change and run `npm test` + `node --check index.js`.
3. Add a `CHANGELOG.md` entry under **Unreleased**.
4. Open a pull request describing the change and how you verified it.

## Reporting bugs / requesting features

Open an issue using the templates under `.github/ISSUE_TEMPLATE/`. For security
issues, please follow [`SECURITY.md`](./SECURITY.md) instead of filing a public
issue.

By contributing, you agree that your contributions are licensed under the
project's [MIT](./LICENSE) license.
