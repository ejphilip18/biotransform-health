# Diagnosis: "Track progress" text disappears when selecting baseline

## Flow

1. **Initial state (no explicit selection)**
   - `selectedComparisonId` = `null`
   - `comparisonUpload` = `previousUpload` (from `getPreviousUpload`)
   - `selectedId` = `comparisonUpload?._id` = `previousUpload._id` (truthy)
   - Span renders: "Track progress to {currentLabDate}"

2. **User selects a different baseline from dropdown**
   - `onChange` → `setSelectedComparisonId(id)`
   - `selectedComparisonId` = selected upload id
   - `comparisonUpload` = `selectedComparisonUpload` (query for selected id)
   - While `selectedComparisonUpload` loads: `comparisonUpload` = `undefined`
   - `selectedId` = `selectedComparisonId ?? comparisonUpload?._id` = `selectedComparisonId` (still truthy)
   - Span should still render

3. **Layout cause (most likely)**
   - Select has `flex: 1 1 200px` — can grow to fill space
   - When selection changes, the displayed option text changes (e.g. "Bloodwork - 2025-06-15")
   - Native `<select>` width grows to fit the selected option text
   - Select expands → pushes span to next row (flexWrap: wrap)
   - On the next row, the span may be clipped or the row layout may collapse
   - Alternatively: select grows so much it leaves no room; span wraps but gets squeezed/overflow-hidden by a parent

4. **Data flow check**
   - `selectedId` is never reset after selection (only `setSelectedComparisonId` in `onSelect`)
   - No conditional remount of `ComparisonSelector` based on selection
   - `comparableUploads` does not depend on selection

## Root cause

**Layout, not state.** The select expands when showing a longer option. With `flex: 1 1 200px` and no `maxWidth`, it can take most of the row. The span either wraps to a second row that gets clipped, or is pushed out of view.

## Fix

Cap the select width so the span always has space on the same row, or move the span to its own row.
