# Implement and Verify

## Purpose

Execute a phase from `TODO.md` with built-in quality gates. After implementation, spawn 2 independent review subagents that compare the code against the spec. Fix any issues found, then re-review until clean.

## When to Use

- Implementing any phase from `TODO.md`
- Making significant changes to an existing system
- You want high confidence that code matches the spec

## Prerequisites

- [ ] The relevant `specs/{system}.md` exists and is up to date
- [ ] The phase is defined in `TODO.md` with clear tasks
- [ ] The project builds and existing tests pass

## Steps

### Step 1: Read the Spec and Plan

Read the spec file(s) for the system(s) you're implementing. Check `specs/README.md` for the index. Understand:
- What the system should do (Overview, API, Core Types)
- How it should handle errors (Error Handling section)
- What design decisions were made and why

### Step 2: Implement

Work through each task in the phase:
1. Implement the feature following the spec
2. Write tests as you go
3. Check off each task in `TODO.md`
4. Ensure the project builds after each task

If the spec is wrong or incomplete, update the spec first, then implement.

### Step 3: Self-Review

Before spawning review subagents:
1. Re-read the spec top to bottom
2. Verify types match, APIs match, errors match, security is addressed
3. Fix obvious gaps

### Step 4: Spawn Review Subagents

Spawn 2 independent subagents:

**Subagent 1 — Spec Compliance:**
```
Review code against the spec:
1. TYPES: Do code types match spec types?
2. API: Do functions match? Correct arguments and returns?
3. ERRORS: Are all error codes implemented?
4. SECURITY: Are auth checks and validation rules implemented?
5. DATABASE: Does the schema match?

Report severity: CRITICAL / MAJOR / MINOR
```

**Subagent 2 — Behavioral:**
```
Review code for correctness:
1. EDGE CASES: Null/undefined/empty inputs handled?
2. ERROR PATHS: Try/catch blocks appropriate?
3. STATE: State transitions valid?
4. PERFORMANCE: N+1 queries, unbounded loops?

Report severity: CRITICAL / MAJOR / MINOR
```

### Step 5: Triage and Fix

- **CRITICAL/MAJOR**: Fix immediately
- **MINOR, quick fix**: Fix if < 5 minutes
- **MINOR, significant**: Log for later
- **False positive**: Dismiss with explanation

### Step 6: Re-Review (if needed)

If CRITICAL/MAJOR issues were found, fix and re-review. Maximum 3 iterations.

### Step 7: Done Checklist

- [ ] `TODO.md` — tasks checked off, phase status updated
- [ ] `docs/quality.md` — grades updated
- [ ] `specs/README.md` — verification status updated
- [ ] ExecPlan updated if applicable

## Success Criteria

- [ ] All phase tasks checked off
- [ ] Zero CRITICAL or MAJOR issues from review
- [ ] All tests pass
- [ ] Done checklist complete
