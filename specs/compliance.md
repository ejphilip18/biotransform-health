# HIPAA/GDPR Compliance

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

BioTransform handles protected health information (PHI) — bloodwork results, health conditions, medications. While we're not a covered entity under HIPAA (we're not a healthcare provider), we implement HIPAA-aligned security practices as a best practice for handling health data. We are subject to GDPR for EU users. This spec defines consent management, audit logging, data portability, and right to erasure.

### Goals

- Explicit, versioned consent before any data processing
- Comprehensive audit trail for all health data access
- GDPR Article 17 right to erasure (data deletion)
- GDPR Article 20 data portability (JSON export)
- Admin access controls with audit trail
- Transparent privacy practices

### Non-Goals

- Full HIPAA certification (requires organizational controls beyond code)
- HITRUST compliance
- BAA with Convex (would require Convex Enterprise)

---

## Core Types

### ConsentRecord

```typescript
interface ConsentRecord {
  _id: Id<"consentRecords">;
  userId: Id<"users">;
  consentType: ConsentType;
  version: string;              // e.g. "1.0", "1.1" — tracks policy updates
  granted: boolean;
  grantedAt?: number;           // timestamp when consent was given
  revokedAt?: number;           // timestamp if consent was revoked
  ipAddress?: string;           // IP at time of consent
}

type ConsentType =
  | "data_processing"           // Required: we can store and process your health data
  | "ai_analysis"               // Required: we can send your data to Gemini for analysis
  | "data_sharing"              // Optional: anonymized data for research/improvement
  ;
```

### AuditLog

```typescript
interface AuditLog {
  _id: Id<"auditLogs">;
  userId: Id<"users">;          // user whose data was accessed
  actorId: Id<"users">;         // who performed the action (user or admin)
  action: AuditAction;
  resource: string;             // table name: "biomarkerResults", "profiles", etc.
  resourceId?: string;          // specific record ID if applicable
  metadata?: string;            // JSON string with additional context
  timestamp: number;
}

type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "admin_view"               // admin viewed user data
  | "consent_granted"
  | "consent_revoked"
  | "account_deleted"
  ;
```

---

## Consent Flow

### During Onboarding (Step 4)

Two required consents + one optional:

1. **Data Processing** (required) — "I consent to BioTransform storing and processing my health data including bloodwork results, health profile, and daily check-ins."
2. **AI Analysis** (required) — "I consent to my health data being sent to Google's Gemini AI for analysis. Data is transmitted securely and not stored by Google beyond the analysis request."
3. **Data Sharing** (optional) — "I consent to my anonymized, de-identified health data being used to improve BioTransform's algorithms and recommendations."

Each consent is stored as a separate `ConsentRecord` with the current policy version.

### Consent Versioning

When privacy policy changes:
1. Increment the version string
2. Existing consents remain valid for their version
3. Users are prompted to re-consent on next login
4. Old consent records are retained (never deleted)

### Consent Revocation

Users can revoke any consent via Settings:
- **Data Processing revoked** → Account is effectively frozen. No new uploads or analysis. Existing data retained until deletion requested.
- **AI Analysis revoked** → Uploads still work but analysis is not triggered. User sees raw (unparsed) upload data only.
- **Data Sharing revoked** → No impact on user experience. Data excluded from aggregate analysis.

---

## Audit Logging

### What Gets Logged

| Action | Trigger |
| :--- | :--- |
| `create` | New upload, check-in, or profile created |
| `read` | Biomarker results queried, health plan viewed |
| `update` | Profile updated, consent changed |
| `delete` | Account deletion, data removal |
| `export` | User exports their data |
| `admin_view` | Admin views any individual user's data |
| `consent_granted` | User grants any consent |
| `consent_revoked` | User revokes any consent |
| `account_deleted` | User deletes their account |

### Implementation Pattern

Audit logging is done via a helper function called within Convex mutations/queries:

```typescript
// convex/audit.ts
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const log = internalMutation({
  args: {
    userId: v.id("users"),
    actorId: v.id("users"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
```

---

## Data Export (GDPR Article 20)

### What's Exported

Complete JSON file containing:
- User profile
- All consent records
- All bloodwork uploads (metadata, not PDF files)
- All biomarker results
- All health plans
- All daily check-ins

### Format

```json
{
  "exportDate": "2026-02-15T10:00:00Z",
  "user": { ... },
  "profile": { ... },
  "consentRecords": [ ... ],
  "bloodworkUploads": [ ... ],
  "biomarkerResults": [ ... ],
  "healthPlans": [ ... ],
  "dailyCheckins": [ ... ]
}
```

### Implementation

Convex action that:
1. Queries all user data across tables
2. Assembles into JSON structure
3. Returns as downloadable blob
4. Creates audit log entry (action: "export")

---

## Right to Erasure (GDPR Article 17)

### Deletion Cascade Order

When a user requests account deletion:

1. Delete all files from Convex storage (uploaded PDFs)
2. Delete all `dailyCheckins` for user
3. Delete all `biomarkerResults` for user
4. Delete all `healthPlans` for user
5. Delete all `bloodworkUploads` for user
6. Delete user `profile`
7. Create audit log entry (action: "account_deleted", metadata includes deletion timestamp)
8. **Retain** `consentRecords` (legal requirement — proof of consent)
9. **Retain** `auditLogs` for the user (legal requirement — proof of data handling)
10. Delete user record from Convex Auth tables

### Implementation

Convex action that runs the cascade as a series of mutations. Each step is logged. The action is triggered from the Settings page after the user confirms with a typed confirmation (e.g., "DELETE MY ACCOUNT").

---

## Admin Access Controls

- Admin role checked server-side via `users.isAdmin` in every admin query
- Viewing individual user data creates an `admin_view` audit entry
- Admin sees anonymized user list by default (name hidden, only demographics + aggregate stats)
- Accessing individual user profile requires clicking through and logs the access
- Admin cannot delete users (only users can delete themselves)
- Admin can export user data (with audit log)

---

## Security Measures

| Measure | Implementation |
| :--- | :--- |
| Encryption at rest | Convex handles this automatically |
| Encryption in transit | HTTPS enforced by Convex and Vercel |
| No PHI in logs | Error messages and console.log never include health data |
| Session security | AUTH_SECRET for Convex Auth session encryption |
| File access control | Storage URLs are scoped to authenticated users |
| AI data handling | Gemini processes data in-request, no persistent storage |

---

## Design Decisions

### Why retain consent records after account deletion?

**Context:** GDPR allows data deletion but organizations need to prove they had legal basis to process data.

**Decision:** Consent records and audit logs are retained as proof of lawful data processing. This is standard practice and explicitly allowed under GDPR Article 17(3)(e) — retention for legal claims.

### Why not encrypt health data at the application level?

**Context:** Could add AES-256 encryption on top of Convex's at-rest encryption.

**Decision:** Application-level encryption would prevent us from querying biomarker data for trend analysis and comparisons. Convex's built-in encryption at rest is sufficient for our threat model. If we need field-level encryption (e.g., for BAA compliance), Convex Enterprise would be the path.
