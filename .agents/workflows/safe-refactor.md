# Safe Refactor with Property-Based Testing

## Purpose

Safely rewrite or refactor a module by using property-based testing (fast-check) to prove the new code behaves identically to the old code for all possible inputs.

## When to Use

- Rewriting a module for performance or readability
- Migrating between libraries
- Refactoring complex business logic

## When NOT to Use

- The behavior itself needs to change
- The function has side effects that can't be isolated
- The function is trivial (simple rename or one-liner)

## Steps

### Step 1: Identify Boundary

| Question | Answer |
| :--- | :--- |
| What function(s) are being rewritten? | List them |
| What are the input types? | Define precisely |
| What are the output types? | Define precisely |
| Are there side effects? | List them, plan to mock |

### Step 2: Write Arbitraries

```typescript
import fc from "fast-check";

const inputArb = fc.record({
  // Build from spec's Core Types and validation rules
});
```

### Step 3: Bridge Test

```typescript
describe("refactor equivalence", () => {
  it("produces identical output", () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const oldResult = oldFunction(input);
        const newResult = newFunction(input);
        expect(newResult).toEqual(oldResult);
      }),
      { numRuns: 1000 }
    );
  });
});
```

### Step 4: Run and Fix

If tests fail, fast-check shows the minimal failing input. Fix and re-run.

### Step 5: Replace

1. Replace old module with new
2. Keep property tests as regression tests
3. Run full test suite

## Success Criteria

- [ ] Property tests pass with 1000+ runs
- [ ] Equivalence bridge confirms identical output
- [ ] Old module replaced
- [ ] Full test suite passes
- [ ] Property tests kept as regression tests
