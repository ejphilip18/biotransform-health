# BioTransform

A health optimization platform that turns bloodwork, DNA, and hormone test PDFs into personalized supplement stacks, nutrition plans, and training programs — powered by Gemini 3 Flash Preview AI analysis.

## Repository Map

This file is the entry point. It tells you where to find everything. Do not treat it as the full documentation — read the linked files for detail.

### Knowledge Base

| Document | Purpose | Read when... |
| :--- | :--- | :--- |
| `docs/architecture.md` | Domain map, package layering, key directories | You need to understand how the codebase is organized |
| `docs/core-beliefs.md` | Agent-first operating principles | You're unsure how to approach a decision |
| `docs/quality.md` | Per-domain quality scorecard | You need to know what's solid vs. what has gaps |
| `specs/README.md` | Index of all specifications with verification status | You're about to implement or modify a feature |
| `specs/testing-strategy.md` | Testing approach: unit, property-based, review loop | You're writing or reviewing tests |
| `TODO.md` | Phased implementation checklist | You need to know what to work on next |

### Execution Plans

| Location | Purpose |
| :--- | :--- |
| `docs/plans/active/` | Living plans for work touching 2+ systems or 5+ files |
| `docs/plans/completed/` | Finished plans kept for retrospective and context |

### Workflows

| Workflow | Purpose | When to use |
| :--- | :--- | :--- |
| `.agents/workflows/implement-and-verify.md` | Multi-agent review loop | After implementing each phase |
| `.agents/workflows/safe-refactor.md` | Property-based testing for safe refactors | When rewriting existing code |

## Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start Next.js development server |
| `pnpm convex dev` | Start Convex backend dev server |
| `pnpm build` | Build for production |
| `pnpm lint` | Lint and format |
| `pnpm test` | Run all tests |

## Code Style

TypeScript strict mode. Functional React components with hooks. Convex queries/mutations/actions for backend. `"use node"` directive for actions calling external APIs (Gemini). See `docs/architecture.md` for naming conventions and formatting details.

## How to Work in This Repo

### Before implementing anything

1. Read the spec for the system you're touching (see `specs/README.md`). Include it in context.
2. Read `docs/quality.md` to understand the current state of that domain.
3. For work touching 2+ systems or 5+ files: check `docs/plans/active/` for an existing plan or create one.

### Implementation flow

1. Read `TODO.md` to find the current phase and next task.
2. Read the spec file for the system you're touching.
3. Implement the feature following the spec.
4. Write tests (unit + property). See `specs/testing-strategy.md`.
5. Run the implement-and-verify workflow (`.agents/workflows/implement-and-verify.md`).
6. Before marking the phase complete, run the **Done checklist** below.

### Before marking a phase complete

- [ ] `TODO.md` — all tasks checked off, phase status updated
- [ ] `docs/quality.md` — grades updated for affected domains
- [ ] `specs/README.md` — verification status updated
- [ ] If you followed an ExecPlan: update its status; move to `docs/plans/completed/` when done

### Key rules

- **Specs describe intent; code describes reality.** If they diverge, reconcile them.
- **Assume specs are NOT yet implemented** unless code proves otherwise.
- **Update docs as you go.** A stale doc is worse than no doc.
- **When in doubt, read `docs/core-beliefs.md`.**

## Environment Variables

| Variable | Purpose | Required |
| :--- | :--- | :--- |
| `CONVEX_DEPLOYMENT` | Convex deployment identifier | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex backend URL | Yes |
| `GEMINI_API_KEY` | Google AI API key for Gemini 3 Flash Preview | Yes |
| `AUTH_SECRET` | Secret for Convex Auth session encryption | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | For Google sign-in |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | For Google sign-in |
