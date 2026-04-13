# Testing Strategy

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

BioTransform uses a three-layer testing approach: unit tests for isolated logic, property-based tests for invariant verification, and the multi-agent review loop for spec compliance.

### Testing Pyramid

```
         ┌───────────────────┐
         │  Multi-Agent      │  Spec compliance
         │  Review Loop      │  (implement-and-verify workflow)
         ├───────────────────┤
         │  Property-Based   │  Invariants hold for all inputs
         │  Tests (fast-check)│  (1000+ random inputs per property)
         ├───────────────────┤
         │  Unit Tests       │  Individual functions work correctly
         │  (Vitest)         │  (happy path + error cases)
         └───────────────────┘
```

---

## Unit Tests

**Tool:** Vitest
**Location:** `tests/unit/`

### Conventions

| Convention | Rule |
| :--- | :--- |
| File naming | `{module}.test.ts` in `tests/unit/` |
| Test runner | Vitest |
| Assertion style | `expect().toBe()`, `expect().toEqual()` |
| Mocking | `vi.mock()` for external dependencies |

### What to Unit Test

| Category | Priority |
| :--- | :--- |
| Health score calculation | High |
| Streak calculation | High |
| Biomarker status determination | High |
| Consent validation logic | High |
| Profile validation | Medium |
| Date/formatting utilities | Medium |

---

## Property-Based Tests

**Tool:** fast-check
**Location:** `tests/properties/`

### When to Write Property Tests

| Scenario | Property |
| :--- | :--- |
| Health score calculation | Score always 0-100, never NaN |
| Biomarker status mapping | Value in optimal range always returns "optimal" |
| Streak calculation | Streak count >= 0, never exceeds total check-in days |
| Data export | Exported JSON always parseable, contains all expected keys |
| Consent validation | Required consents must be granted before proceeding |

### Arbitraries

```typescript
// tests/properties/arbitraries/biomarker.ts
import * as fc from "fast-check";

export const biomarkerValueArb = fc.double({ min: 0, max: 10000, noNaN: true });
export const biomarkerStatusArb = fc.constantFrom("optimal", "normal", "suboptimal", "critical");
export const sleepQualityArb = fc.constantFrom(1, 2, 3, 4, 5);
export const healthScoreArb = fc.integer({ min: 0, max: 100 });
```

---

## Multi-Agent Review

After each implementation phase, run the review loop defined in `.agents/workflows/implement-and-verify.md`. Two subagents review the code:
1. **Spec Compliance** — does the code match the spec's types, APIs, and error handling?
2. **Behavioral** — are edge cases handled, error paths correct, no race conditions?

---

## Test Commands

| Command | What it runs |
| :--- | :--- |
| `pnpm test` | All tests |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:property` | Property tests only |
| `pnpm test -- --watch` | Watch mode |

---

## Coverage Targets

| Category | Target |
| :--- | :--- |
| Health score / streak logic | 90%+ |
| Biomarker processing | 80%+ |
| Convex function handlers | 70%+ |
| UI components | 50%+ |
