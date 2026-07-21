# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-21

First public, open-source release.

### Added
- MIT `LICENSE`.
- Self-contained report stylesheet bundled at `assets/style.css` (Facebook-themed
  palette; excludes pure black and purple/violet hues).
- Sample opt-in configs under `skill-config/`:
  `avoid-cloud-cost-config.minimal.yaml` (zero input) and
  `avoid-cloud-cost-config.example.yaml` (fully populated).
- Community health files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `.editorconfig`, GitHub issue/PR templates, and a CI workflow.
- Test suite runnable via `npm test` (`node --test`).

### Changed
- **Self-contained by default:** the report stylesheet now ships inside the skill
  (`assets/style.css`); a sibling `Architecture-Standards` install is an optional
  legacy fallback and is no longer required. The report is text-only (no icon
  library bundled).
- **Config filename:** opt-in is now gated by
  `skill-config/avoid-cloud-cost-config.yaml` (previously
  `evaluate-design-for-cost.yaml`) across the CLI and all docs.
- **Prompt IDs:** the per-topic prompts are `FINOPS-00 … FINOPS-20`; all
  references updated from the former `DFC-*` naming.
- Report look and feel rethemed to a Facebook-style design language.
- Metadata (`package.json`, `skill.json`) updated with the MIT license,
  author, and the public repository URL.

### Removed
- Duplicate and stray prompt files (there are now exactly 21: `FINOPS-00 … 20`).
- The "Reconcile with the previous report" and "Cross-repo roll-up" sections from
  `SKILL.md`.

[Unreleased]: https://github.com/sdubeyslb/finops-ai-skills/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sdubeyslb/finops-ai-skills/releases/tag/v1.0.0
