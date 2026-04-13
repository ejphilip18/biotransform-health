# Architecture

**Last Updated:** 2026-02-15

This document provides a top-level map of the BioTransform codebase. Read this to understand how the project is organized, where things live, and how the major pieces connect.

## System Overview

BioTransform is a health optimization platform that allows users to upload bloodwork, DNA, and hormone test PDFs. The system uses Gemini 3 Flash Preview to parse and analyze the results, then generates personalized supplement stacks, nutrition plans, and training programs. Users track progress via daily check-ins and quarterly bloodwork uploads. An admin panel provides oversight with HIPAA/GDPR-compliant data handling.

## High-Level Architecture

```
┌──────────────────────────────────────────────────┐
│                Next.js App (App Router)            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   Pages /   │  │   Client   │  │  Providers  │  │
│  │ Components  │  │   Hooks    │  │  (Convex)   │  │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  │
│         │               │               │         │
│  ┌──────┴───────────────┴───────────────┴──────┐  │
│  │           Convex React Client                │  │
│  └──────────────────┬──────────────────────────┘  │
└─────────────────────┼─────────────────────────────┘
                      │ Real-time subscriptions
              ┌───────┴────────┐
              │  Convex Backend │
              │  ┌───────────┐ │
              │  │  Queries   │ │ ← Read data (reactive)
              │  │  Mutations │ │ ← Write data
              │  │  Actions   │ │ ← External API calls
              │  └───────────┘ │
              │  ┌───────────┐ │
              │  │  Database  │ │ ← Document store
              │  │  Storage   │ │ ← File storage (PDFs)
              │  │  Auth      │ │ ← Convex Auth
              │  └───────────┘ │
              └───────┬────────┘
                      │
              ┌───────┴────────┐
              │  Gemini 3 Flash│
              │  Preview API   │
              │  (@google/genai)│
              └────────────────┘
```

## Domain Map

| Domain | Code Location | Spec | Description |
| :--- | :--- | :--- | :--- |
| Auth | `convex/auth.ts`, `convex/users.ts` | `specs/auth.md` | Convex Auth with Password + Google, role management |
| Profiles | `convex/profiles.ts`, `src/app/onboarding/` | `specs/profiles.md` | User demographics, onboarding wizard |
| Bloodwork Analysis | `convex/uploads.ts`, `convex/analysis.ts` | `specs/bloodwork-analysis.md` | PDF upload, Gemini AI parsing, biomarker extraction |
| Health Plans | `convex/healthPlans.ts`, `src/app/plan/` | `specs/health-plans.md` | Supplement stacks, nutrition, training programs |
| Daily Engagement | `convex/checkins.ts`, `src/app/dashboard/` | `specs/daily-engagement.md` | Check-ins, streaks, health score, progress |
| Compliance | `convex/consent.ts`, `convex/audit.ts` | `specs/compliance.md` | HIPAA/GDPR consent, audit logging, data export |
| Admin | `convex/admin.ts`, `src/app/admin/` | `specs/admin.md` | Admin dashboard, user management, analytics |
| PDF Reports | `src/lib/pdf-template.tsx` | `specs/pdf-reports.md` | Client-side PDF generation via @react-pdf/renderer |

## Directory Structure

```
biotransform/
├── convex/                       # Convex backend
│   ├── schema.ts                 # All table definitions + authTables
│   ├── auth.ts                   # Convex Auth config (Password + Google)
│   ├── users.ts                  # User queries + admin checks
│   ├── profiles.ts               # Profile mutations (onboarding)
│   ├── uploads.ts                # File upload + processing triggers
│   ├── analysis.ts               # Gemini AI action ("use node")
│   ├── biomarkers.ts             # Biomarker queries + reference data
│   ├── healthPlans.ts            # Plan queries/mutations
│   ├── checkins.ts               # Daily check-in mutations
│   ├── admin.ts                  # Admin-only queries (role-gated)
│   ├── audit.ts                  # Audit logging helpers
│   ├── consent.ts                # Consent management
│   └── http.ts                   # HTTP routes
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing page (public)
│   │   ├── auth/page.tsx         # Sign in / sign up
│   │   ├── onboarding/page.tsx   # Multi-step onboarding wizard
│   │   ├── dashboard/page.tsx    # Daily hub (authenticated)
│   │   ├── upload/page.tsx       # PDF upload
│   │   ├── results/[id]/page.tsx # Analysis results
│   │   ├── plan/page.tsx         # Active health protocol
│   │   ├── progress/page.tsx     # Regression tracking
│   │   ├── checkin/page.tsx      # Daily check-in form
│   │   ├── report/[id]/page.tsx  # PDF preview + download
│   │   ├── settings/page.tsx     # Profile, consent, data export
│   │   └── admin/page.tsx        # Admin dashboard (role-gated)
│   ├── components/
│   │   ├── ui/                   # Shared UI primitives
│   │   ├── onboarding/           # Wizard step components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── biomarkers/           # Biomarker cards, charts
│   │   ├── plans/                # Supplement, nutrition, training views
│   │   └── admin/                # Admin-specific components
│   ├── lib/
│   │   ├── biomarker-reference.ts # Biomarker definitions + reference ranges
│   │   ├── gemini-prompts.ts     # AI prompt templates
│   │   ├── pdf-template.tsx      # React-PDF report template
│   │   └── utils.ts              # Shared utilities
│   └── providers/
│       └── convex-provider.tsx   # ConvexAuthNextjsProvider wrapper
├── specs/                        # Design specifications
├── docs/                         # Project knowledge base
├── .agents/workflows/            # Agent workflow definitions
├── AGENTS.md                     # Repository entry point
└── TODO.md                       # Implementation progress tracker
```

## Package Layering

Dependencies flow in one direction. No layer may import from a layer above it.

```
Pages (src/app/) → Components (src/components/) → Convex hooks (useQuery, useMutation, useAction)
                                                 → Lib utilities (src/lib/)

Convex Functions:
  Queries   → Database reads only
  Mutations → Database reads + writes
  Actions   → External APIs (Gemini) + schedule mutations for DB writes
```

Specifically:
- `src/app/` pages import from `src/components/` and call Convex via hooks
- `src/components/` use Convex hooks (`useQuery`, `useMutation`, `useAction`) and `src/lib/`
- `convex/` functions access Convex DB and storage; actions call external APIs
- `src/lib/` contains pure utilities — no Convex imports, no React imports (except pdf-template)

## Tech Stack

| Component | Technology | Notes |
| :--- | :--- | :--- |
| Language | TypeScript 5.x | Strict mode |
| Framework | Next.js 14+ (App Router) | Server + client components |
| Backend | Convex | Real-time DB, file storage, auth, server functions |
| Auth | Convex Auth | Password + Google OAuth via @convex-dev/auth |
| AI | Gemini 3 Flash Preview | Via @google/genai, model: `gemini-3-flash-preview` |
| Styling | Tailwind CSS 4 | Utility-first, dark-mode-first |
| Animation | Framer Motion | Page transitions, micro-interactions |
| Charts | Recharts | Biomarker trend lines, progress charts |
| PDF | @react-pdf/renderer | Client-side PDF report generation |
| Package Manager | pnpm | Fast, disk-efficient |

## Naming Conventions

| Element | Convention | Example |
| :--- | :--- | :--- |
| Files (components) | PascalCase | `BiomarkerCard.tsx` |
| Files (utilities) | kebab-case | `biomarker-reference.ts` |
| Files (Convex) | camelCase | `healthPlans.ts` |
| Functions/Variables | camelCase | `getHealthScore` |
| Types/Interfaces | PascalCase | `BiomarkerResult` |
| Constants | SCREAMING_SNAKE | `MAX_UPLOAD_SIZE_MB` |
| Convex tables | camelCase | `biomarkerResults` |

## Formatting

| Rule | Value |
| :--- | :--- |
| Indentation | 2 spaces |
| Line width | 100 characters |
| Quotes | Double quotes |
| Semicolons | Yes |
| Trailing commas | ES5 |

## Database

Convex document database. Schema defined in `convex/schema.ts` using Convex validators. Tables use Convex's auto-generated `_id` fields. File storage for PDFs via Convex's built-in `_storage` system.

### Key Tables

| Table | Purpose |
| :--- | :--- |
| `users` | Extended auth user with role field |
| `profiles` | Demographics, lifestyle, goals |
| `consentRecords` | Versioned consent tracking |
| `bloodworkUploads` | PDF upload records with processing status |
| `biomarkerResults` | Parsed biomarker values per upload |
| `healthPlans` | AI-generated supplement/nutrition/training plans |
| `dailyCheckins` | Daily check-in entries |
| `auditLogs` | All data access audit trail |

## Error Handling

Convex functions throw `ConvexError` for user-facing errors. Client components catch errors via Convex's built-in error handling. All health data access is wrapped in audit-logged helpers.

## Security

- Authentication required for all routes except `/` (landing) and `/auth`
- Authorization enforced in every Convex function via `auth.getUserIdentity()`
- Admin role checked server-side before admin queries execute
- File uploads validated for MIME type (application/pdf only)
- No PHI in console logs or error messages
- Consent required before any health data processing
- All admin access to individual user data creates audit log entries

## Debugging

- `pnpm dev` for Next.js hot reload
- `pnpm convex dev` for Convex backend with live schema push
- Convex Dashboard for inspecting database, logs, and function execution
- Browser DevTools for React component debugging
