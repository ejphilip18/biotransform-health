# DNA Analysis Pipeline

**Status:** Implemented
**Last Updated:** 2026-02-15

---

## Overview

DNA reports are processed through a dedicated pipeline separate from bloodwork/hormone analysis. The system extracts genetic variants (genes, zygosity, classification, risk level) and stores them in `geneticResults`. These are merged with biomarkers when generating the health plan.

### Goals

- Extract cancer risk genes (BRCA1/2, Lynch, CHEK2, PALB2, etc.)
- Extract pharmacogenomics (CYP2D6, CYP2C19, etc.)
- Extract nutrigenomics (MTHFR, VDR, COMT, etc.)
- Store gene-centric schema (not numeric biomarker schema)
- Merge genetic findings into synthesized health plan and report

### Non-Goals

- DNA sequencing (accept existing DNA test report PDFs only)
- Raw variant calling or interpretation beyond report content

---

## Architecture

```
DNA Upload → createUpload(testType: "dna") → analyzeDNA (not analyzeBloodwork)
                    ↓
            geneticResults table
                    ↓
            regenerateHealthPlan (biomarkers + genetics)
                    ↓
            Report: Biomarker table + Genetic Findings section + Plan
```

---

## Schema: geneticResults

| Field | Type | Description |
| :--- | :--- | :--- |
| userId | Id<"users"> | Owner |
| uploadId | Id<"bloodworkUploads"> | Source DNA upload |
| gene | string | Gene symbol (e.g. BRCA1, MTHFR) |
| variant | string | rsID or HGVS notation |
| zygosity | homozygous \| heterozygous \| wild_type | Genotype |
| classification | pathogenic \| likely_pathogenic \| vus \| likely_benign \| benign | ACMG-style |
| diseaseCategory | string | e.g. breast_cancer, methylation |
| riskLevel | elevated \| average \| reduced \| unknown | Risk tier |
| interpretation | string | Plain-language explanation |
| recommendations | string[] | Action items |
| labDate | string | Report date |

---

## Analysis Flow

1. **Upload**: User selects "DNA" test type, uploads PDF
2. **Branch**: `createUpload` schedules `analyzeDNA` (not `analyzeBloodwork`) when `testType === "dna"`
3. **Extract**: Gemini parses PDF with DNA-specific prompt; returns `geneticVariants[]`
4. **Store**: Each variant → `genetics.create` mutation
5. **Plan**: `regenerateHealthPlan` fetches biomarkers + genetics, includes both in prompt
6. **Report**: `getReportData` returns biomarkers, genetics, sources; UI shows both sections

---

## Merge Strategy

- **Biomarkers**: Merged by name, latest labDate wins (unchanged)
- **Genetics**: Merged by `gene-variant` key, latest labDate wins
- **Sources**: Union of uploads from biomarkers and genetics
- **Plan**: Single prompt receives both `biomarkersJson` and `geneticsJson`

---

## Report Integration

- **Report page**: `getReportData` → biomarkers + genetics + sources
- **GeneticFindingsPreview**: Table by disease category; interpretation + recommendations per variant
- **PDF**: Genetic findings section on page 2 (Areas of Concern)
- **Results page**: For DNA uploads, shows genetic findings instead of biomarker table

---

## VUS Handling

Variants of uncertain significance (VUS) are flagged. The prompt instructs Gemini to recommend genetic counseling and avoid over-interpretation.
