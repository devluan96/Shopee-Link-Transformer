# Agent Rules

This file defines how AI agents should work in this repository.

## Core Rule

Make the smallest correct change that solves the requested task.

Do not broaden scope unless the user explicitly asks for it.

## Scope Control

- Only edit the files directly related to the request.
- If a fix requires touching files outside the stated scope, stop and explain why before continuing.
- Do not mix refactor work into bug fixes or UI tweaks unless requested.
- Do not rename files, move modules, or reorganize folders without explicit approval.

## Protect Stable Code

- Do not delete or rewrite existing working code just because a cleaner approach exists.
- Do not remove fallbacks, guards, retries, or compatibility code unless the user asks or there is a demonstrated bug.
- Do not change existing API contracts, payload shapes, auth behavior, routing behavior, or storage keys unless required by the task.
- If a section looks messy but is not part of the requested problem, leave it alone.

## Sensitive Areas

Treat these areas as high risk:

- `src/App.tsx`
- `src/lib/supabase.ts`
- `api/server.ts`
- auth flows
- logout/login/session handling
- profile bootstrap
- admin actions
- Vercel deployment config

For changes in high-risk areas:

- prefer minimal patches over cleanup/refactor
- preserve backward compatibility
- call out risk clearly in the final summary

## Change Workflow

For every task:

1. Restate the requested scope briefly.
2. Inspect related files before editing.
3. Change only what is necessary.
4. Verify with the smallest relevant check available.
5. Report exactly which files changed and why.

## When To Stop And Ask

Stop and ask before continuing if:

- the requested change conflicts with current architecture
- the fix requires broad refactoring
- the change may break auth, billing, admin, or production routing
- existing code appears user-authored and conflicts with the planned patch
- there are multiple reasonable interpretations of the request

## Verification Rules

- Run targeted verification after changes when possible.
- Prefer existing checks such as `npm run build` or type checks.
- If verification cannot be run, say so explicitly.

## Diff Discipline

- Keep diffs compact and reviewable.
- Avoid opportunistic formatting-only edits.
- Avoid touching unrelated lines in large files.
- Preserve comments and existing conventions unless they are part of the requested fix.

## Communication Rules

- Be direct and concrete.
- Say what changed, why it changed, and what risk remains.
- Do not claim a refactor is harmless without verification.
- If confidence is low, say so clearly.

## Default Repo Policy

Unless the user says otherwise:

- do not refactor stable code
- do not change visual design outside the requested screen
- do not alter database behavior outside the requested feature
- do not change deployment settings except to solve the specific issue
- do not remove logs or diagnostics that are actively helping debug an issue
