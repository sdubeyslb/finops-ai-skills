# Security Policy

## Supported versions

The latest released version on the default branch is supported. Older versions
are not maintained.

| Version | Supported |
|---|---|
| 1.0.x   | ✅ |
| < 1.0   | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Instead, report privately via GitHub Security Advisories:

1. Go to the repository's **Security** tab →
   **[Report a vulnerability](https://github.com/sdubeyslb/finops-ai-skills/security/advisories/new)**.
2. Include a description, reproduction steps, affected version/commit, and impact.

We aim to acknowledge reports within **5 business days** and to provide a
remediation timeline after triage.

## Scope & threat model

This skill is a **zero-dependency, read-only** Node.js CLI. It:

- reads files under the current working directory to gather evidence,
- reads its own bundled prompts and `assets/style.css`,
- writes reports only under `outcome/` (or `output-new/`).

It performs **no network calls**, ships **no third-party dependencies**, and
embeds **no remote content** in its output. Relevant things we care about:

- Path-traversal when resolving `--repo`, `--read-icon`, or prompt/config paths.
- Accidental inclusion of secrets from a scanned repo into a generated report
  (the report only ever cites `file:line`, never file contents verbatim — report
  any deviation).
- Prompt/config parsing that could crash or hang on malformed input.

Thanks for helping keep users safe.
