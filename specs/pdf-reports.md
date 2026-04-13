# PDF Reports

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

Users can generate a downloadable PDF report that captures their biomarker results, AI analysis findings, supplement stack, nutrition framework, and training program from a specific bloodwork upload. The report is generated client-side using `@react-pdf/renderer` — no server-side rendering or Puppeteer needed.

### Goals

- Professional-looking PDF that users can share with their doctor or trainer
- All actionable information in one document
- Color-coded biomarker status (optimal/normal/suboptimal/critical)
- Clear medical disclaimer
- Generated client-side for zero server cost

### Non-Goals

- Server-side PDF generation
- PDF editing capabilities
- Automatic email delivery of reports

---

## Report Structure

### Page 1: Cover

- BioTransform logo and branding
- User name and date of report
- Lab date and provider
- Report type (Bloodwork / Hormone / DNA Analysis)

### Page 2-3: Biomarker Summary

- Table with columns: Biomarker, Value, Unit, Optimal Range, Status
- Color coding: green (optimal), blue (normal), amber (suboptimal), red (critical)
- Grouped by category (CBC, CMP, Lipids, etc.)

### Page 4: Key Findings & Risk Areas

- Summary paragraph (from AI)
- Numbered key findings (top 5)
- Risk areas with severity and related biomarkers

### Page 5: Supplement Protocol

- Table: Supplement, Dosage, Form, Timing, Purpose
- Duration and interaction notes

### Page 6: Nutrition Framework

- Macro breakdown (calories, protein, carbs, fat)
- Key foods to emphasize (list)
- Foods to avoid (list)
- Meal timing and hydration notes

### Page 7: Training Program

- Split type and schedule
- Intensity and volume guidelines
- Focus areas and cardio recommendation
- Recovery notes

### Last Page: Disclaimer

- "This report is for educational and informational purposes only."
- "It is not medical advice and should not replace professional medical consultation."
- "Consult your healthcare provider before making changes to supplements, diet, or exercise."
- BioTransform website URL
- Generation date and timestamp

---

## Implementation

### Client-Side Generation

```typescript
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

// Generate PDF blob
const blob = await pdf(<BioTransformReport data={reportData} />).toBlob();

// Trigger download
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `biotransform-report-${labDate}.pdf`;
a.click();
```

### Styling

Use `@react-pdf/renderer`'s `StyleSheet.create()` with the BioTransform color palette:
- Background: white (#FFFFFF)
- Text: dark charcoal (#1A1A2E)
- Accent: electric teal (#00F0B5)
- Optimal: green (#22C55E)
- Normal: blue (#3B82F6)
- Suboptimal: amber (#F59E0B)
- Critical: red (#EF4444)
- Headers: Satoshi-like bold, body: clean sans-serif

### Data Source

The report page (`/report/[id]`) fetches:
1. `uploads.getUpload(id)` — upload metadata
2. `uploads.getComparableUploads(id)` — other complete uploads for comparison baseline selection
3. `biomarkers.getReportData()` — merged biomarkers and genetics
4. `biomarkers.getByUpload(comparisonUploadId)` — biomarkers for selected comparison upload
5. `healthPlans.getByUpload(id)` — supplement/nutrition/training plan
6. `profiles.get()` — user profile for cover page

**Comparison baseline:** Users can select which previous bloodwork/DNA upload to compare against for progress tracking. Defaults to the chronologically previous upload; the selector lists all other complete uploads.

All data is fetched via Convex hooks, then passed to the React-PDF template.

---

## Design Decisions

### Why client-side over server-side PDF?

**Context:** Could use Puppeteer/Playwright for server-rendered PDFs with full CSS support.

**Decision:** Client-side with @react-pdf/renderer. Zero server cost, no cold starts, works offline after data is loaded. The trade-off is more limited styling (no full CSS grid), but the report layout is straightforward enough that React-PDF handles it well.

### Why not include the uploaded PDF in the report?

**Context:** Could embed the original lab report alongside the analysis.

**Decision:** Omit the original PDF. It would massively increase file size, and the user already has their original. Our report adds value by organizing, color-coding, and interpreting — not by repeating the source.
