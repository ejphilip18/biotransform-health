# BioTransform Specifications

Design documentation for BioTransform. This is the index of all specifications.

## How to Use This Index

1. **Find the relevant spec** using the tables below.
2. **Read before implementing** — specs define the expected behavior and design.
3. **Update after implementing** — if reality differs from spec, reconcile them.
4. **Check verification status** — only "Verified" specs have been confirmed to match the code.

---

## Core Systems

| Spec | Code Location | Purpose | Status | Verified |
| :--- | :--- | :--- | :--- | :--- |
| [auth.md](./auth.md) | `convex/auth.ts`, `convex/users.ts` | Authentication, roles, sessions | Draft | No |
| [profiles.md](./profiles.md) | `convex/profiles.ts`, `src/app/onboarding/` | User profiles, onboarding wizard | Draft | No |
| [bloodwork-analysis.md](./bloodwork-analysis.md) | `convex/uploads.ts`, `convex/analysis.ts` | PDF upload, Gemini AI analysis pipeline | Draft | No |
| [dna-analysis.md](./dna-analysis.md) | `convex/analysis.ts`, `convex/genetics.ts` | DNA report extraction, genetic results, cancer markers | Implemented | No |
| [health-plans.md](./health-plans.md) | `convex/healthPlans.ts`, `src/app/plan/` | Supplement, nutrition, training plans | Draft | No |
| [daily-engagement.md](./daily-engagement.md) | `convex/checkins.ts`, `src/app/dashboard/` | Check-ins, streaks, health score, progress | Draft | No |

## Compliance & Admin

| Spec | Code Location | Purpose | Status | Verified |
| :--- | :--- | :--- | :--- | :--- |
| [compliance.md](./compliance.md) | `convex/consent.ts`, `convex/audit.ts` | HIPAA/GDPR consent, audit, data export | Draft | No |
| [admin.md](./admin.md) | `convex/admin.ts`, `src/app/admin/` | Admin dashboard, user management | Draft | No |

## Output

| Spec | Code Location | Purpose | Status | Verified |
| :--- | :--- | :--- | :--- | :--- |
| [pdf-reports.md](./pdf-reports.md) | `src/lib/pdf-template.tsx` | Client-side PDF report generation | Draft | No |

## Infrastructure

| Spec | Code Location | Purpose | Status | Verified |
| :--- | :--- | :--- | :--- | :--- |
| [testing-strategy.md](./testing-strategy.md) | `tests/` | Testing approach and standards | Draft | No |

---

## Status Legend

| Status | Meaning |
| :--- | :--- |
| **Draft** | Spec written, implementation not started |
| **In Progress** | Implementation underway |
| **Implemented** | Code written to match spec |
| **Needs Update** | Code and spec have diverged |
| **Planned** | Placeholder, spec not yet written |

## Verification Legend

| Verified | Meaning |
| :--- | :--- |
| **Yes** | Code reviewed against spec and confirmed to match (date noted) |
| **Partial** | Some sections verified, others pending |
| **No** | Not yet verified against code |
| **Stale** | Was verified, but code or spec has changed since |
