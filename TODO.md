# BioTransform Implementation Plan

**Current Phase:** Phase 1
**Last Updated:** 2026-02-15
**Overall Progress:** 5%

---

## Quick Status

| Phase | Status | Progress |
| :--- | :--- | :--- |
| Phase 0: Project Scaffold | Complete | 100% |
| Phase 1: Foundation | In Progress | 0% |
| Phase 2: Core Features | Not Started | 0% |
| Phase 3: Engagement & Daily Use | Not Started | 0% |
| Phase 4: Admin & Compliance | Not Started | 0% |

---

## Phase 0: Project Scaffold — COMPLETE

- [x] Create AGENTS.md
- [x] Create docs/architecture.md
- [x] Create docs/core-beliefs.md
- [x] Create docs/quality.md
- [x] Create specs/README.md with index
- [x] Create specs/testing-strategy.md
- [x] Create all 8 system specs
- [x] Create TODO.md
- [x] Create .agents/workflows/implement-and-verify.md
- [x] Create .agents/workflows/safe-refactor.md

---

## Phase 1: Foundation — In Progress

Initialize the project, set up auth, schema, and build landing + auth pages.

**Relevant Specs:** `specs/auth.md`

### 1.1 Project Initialization

- [ ] Initialize Next.js with App Router, TypeScript, Tailwind
- [ ] Install Convex, @convex-dev/auth, @auth/core
- [ ] Install @google/genai, @react-pdf/renderer, recharts, framer-motion
- [ ] Initialize Convex deployment (`pnpm convex init`)
- [ ] Set up ConvexClientProvider with ConvexAuthNextjsProvider
- [ ] Set up middleware.ts with convexAuthNextjsMiddleware
- [ ] Configure environment variables

### 1.2 Convex Schema + Auth

- [ ] Define schema.ts with all tables + authTables spread
- [ ] Configure auth.ts with Password + Google providers
- [ ] Implement users.ts (getCurrentUser, isAdmin, setRole)
- [ ] Seed admin role for primary account

### 1.3 Landing Page + Auth Pages

- [ ] Build landing page (/) with clinical-luxury design, value prop, CTA
- [ ] Build auth page (/auth) with sign in / sign up forms
- [ ] Create protected route layout for authenticated pages
- [ ] Test auth flow end-to-end

### 1.4 Phase 1 Verification

- [ ] All tasks above are complete
- [ ] App builds without errors (`pnpm build`)
- [ ] Auth flow works (sign up, sign in, sign out)
- [ ] Protected routes redirect to /auth
- [ ] Admin role can be set via Convex Dashboard
- [ ] Updated `docs/quality.md` with Phase 1 grades

---

## Phase 2: Core Features — Not Started

Onboarding wizard, PDF upload, AI analysis pipeline, results and plan views.

**Relevant Specs:** `specs/profiles.md`, `specs/bloodwork-analysis.md`, `specs/health-plans.md`

### 2.1 Onboarding Wizard

- [ ] Build multi-step form (4 steps: demographics, lifestyle, goals, consent)
- [ ] Implement profile Convex mutations (saveDemographics, saveLifestyle, saveGoals)
- [ ] Implement consent collection with versioning
- [ ] Implement completeOnboarding mutation
- [ ] Redirect to /dashboard after onboarding

### 2.2 Upload + AI Analysis Pipeline

- [ ] Build upload page (/upload) with drag-and-drop PDF input
- [ ] Implement Convex file storage upload (generateUploadUrl + createUpload)
- [ ] Build analysis.ts Convex action ("use node" + @google/genai)
- [ ] Define Gemini structured JSON response schema
- [ ] Implement biomarker result storage (biomarkers.ts mutations)
- [ ] Implement health plan storage (healthPlans.ts mutations)
- [ ] Build real-time processing status indicator (Convex subscription)
- [ ] Handle errors: invalid PDF, Gemini timeout, partial extraction

### 2.3 Results + Health Plan Views

- [ ] Build results page (/results/[id]) with biomarker cards
- [ ] Implement biomarker traffic light status system
- [ ] Build AI insights and risk areas display
- [ ] Build health plan page (/plan) with 3 tabs: supplements, nutrition, training
- [ ] Link recommendations back to triggering biomarkers

### 2.4 Phase 2 Verification

- [ ] Upload a real bloodwork PDF and get analysis results
- [ ] Biomarker values display with correct status colors
- [ ] Health plan shows supplement, nutrition, and training tabs
- [ ] Processing status updates in real-time
- [ ] Error states handled gracefully
- [ ] Updated `docs/quality.md` with Phase 2 grades

---

## Phase 3: Engagement & Daily Use — Not Started

Dashboard, daily check-ins, progress tracking, PDF reports.

**Relevant Specs:** `specs/daily-engagement.md`, `specs/pdf-reports.md`

### 3.1 Dashboard

- [ ] Build dashboard page (/dashboard) with widget layout
- [ ] Implement health score calculation and display (ring gauge)
- [ ] Implement streak counter with visual display
- [ ] Implement 90-day countdown ring
- [ ] Build biomarker traffic light summary widget
- [ ] Build trend sparklines for key biomarkers (Recharts)
- [ ] Build quick check-in card

### 3.2 Daily Check-ins + Progress

- [ ] Build check-in page (/checkin) with 30-second form
- [ ] Implement checkins.ts Convex mutations
- [ ] Implement streak calculation query
- [ ] Build progress page (/progress) with multi-upload comparison
- [ ] Build biomarker trend line charts (Recharts)
- [ ] Build quarterly timeline visualization

### 3.3 PDF Report

- [ ] Build React-PDF report template (pdf-template.tsx)
- [ ] Implement report page (/report/[id]) with preview
- [ ] Add download button that generates PDF client-side
- [ ] Include all sections: cover, biomarkers, findings, plan, disclaimer

### 3.4 Phase 3 Verification

- [ ] Dashboard displays correct health score, streak, countdown
- [ ] Check-in form completes in under 30 seconds
- [ ] Progress page shows comparison between multiple uploads
- [ ] PDF report generates and downloads successfully
- [ ] Updated `docs/quality.md` with Phase 3 grades

---

## Phase 4: Admin & Compliance — Not Started

Admin panel, audit logging, settings, data export, account deletion.

**Relevant Specs:** `specs/admin.md`, `specs/compliance.md`

### 4.1 Admin Panel

- [ ] Build admin page (/admin) with role gate
- [ ] Implement admin.ts Convex queries (listUsers, getUserDetail, getAggregateStats)
- [ ] Build user list table with consent status indicators
- [ ] Build individual user detail view (triggers audit log)
- [ ] Build aggregate statistics dashboard with charts
- [ ] Build audit log viewer
- [ ] Implement admin data export

### 4.2 Compliance Layer

- [ ] Implement audit.ts logging helper
- [ ] Wire audit logging into all health data access functions
- [ ] Implement consent.ts management mutations
- [ ] Implement data export action (JSON)
- [ ] Implement account deletion cascade

### 4.3 Settings Page

- [ ] Build settings page (/settings)
- [ ] Profile edit form
- [ ] Consent management (view, revoke)
- [ ] Data export button (triggers JSON download)
- [ ] Account deletion with confirmation flow

### 4.4 Phase 4 Verification

- [ ] Admin page only accessible to admin role
- [ ] Viewing user detail creates audit log entry
- [ ] Data export produces valid JSON with all user data
- [ ] Account deletion removes all data except consent/audit records
- [ ] Updated `docs/quality.md` with Phase 4 grades

---

## Completed Phases Archive

### Phase 0: Project Scaffold — COMPLETE (2026-02-15)

All scaffold files created. Specs drafted for all 8 systems. TODO, AGENTS.md, architecture, quality scorecard in place.

---

## Decision Log

| Date | Decision | Rationale |
| :--- | :--- | :--- |
| 2026-02-15 | Use @google/genai (not @google/generative-ai) | Correct package for Gemini 3 Flash Preview |
| 2026-02-15 | Convex Auth over Clerk | Built into Convex, zero cost, control auth UI |
| 2026-02-15 | Client-side PDF via @react-pdf/renderer | Zero server cost, works offline |
| 2026-02-15 | Single Gemini call for extract + analyze | Fewer tokens, lower latency, simpler pipeline |
| 2026-02-15 | Functional/optimal ranges over standard lab ranges | Core value proposition — optimal health, not just disease absence |
| 2026-02-15 | Resolve `POST /api/auth` 404 by adding explicit route handler | Middleware-only proxying did not provide a routable `api/auth` endpoint under current app/runtime setup |
