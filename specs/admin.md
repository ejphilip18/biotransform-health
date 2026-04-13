# Admin Panel

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

The admin panel provides the admin account with oversight of all registered users, their health data (with audit logging), consent status, and system analytics. The admin panel is accessible only to users with `role: "admin"` and every access to individual user data is logged.

### Goals

- View registered users with demographics
- Access individual user profiles and health data (with audit trail)
- See aggregate biomarker statistics across the user base
- Monitor consent status and compliance
- Export user data in compliant format
- View audit log history

### Non-Goals

- Modify user health data (read-only for admin)
- Delete user accounts (users control their own deletion)
- Real-time alerting or notifications

---

## Core Types

### AdminUserListItem (anonymized by default)

```typescript
interface AdminUserListItem {
  _id: Id<"users">;
  email: string;
  createdAt: number;
  onboardingComplete: boolean;
  lastCheckinDate?: string;
  uploadCount: number;
  consentStatus: {
    dataProcessing: boolean;
    aiAnalysis: boolean;
    dataSharing: boolean;
  };
}
```

### AdminUserDetail (full view — triggers audit log)

```typescript
interface AdminUserDetail {
  user: User;
  profile: Profile;
  uploads: BloodworkUpload[];
  latestBiomarkers: BiomarkerResult[];
  activeHealthPlan?: HealthPlan;
  checkinStreak: number;
  consentRecords: ConsentRecord[];
}
```

### AggregateStats

```typescript
interface AggregateStats {
  totalUsers: number;
  onboardedUsers: number;
  totalUploads: number;
  uploadsThisMonth: number;
  avgHealthScore: number;
  avgCheckinStreak: number;
  biomarkerDistribution: Record<string, { optimal: number; normal: number; suboptimal: number; critical: number }>;
}
```

---

## Convex Functions

### Queries (all require admin role)

| Function | Purpose |
| :--- | :--- |
| `admin.listUsers` | Paginated user list with consent status |
| `admin.getUserDetail` | Full user detail (creates audit log entry) |
| `admin.getAggregateStats` | System-wide aggregate statistics |
| `admin.getAuditLogs` | Paginated audit log viewer |
| `admin.getConsentOverview` | Consent status summary across all users |

Every query starts with:
```typescript
const identity = await ctx.auth.getUserIdentity();
const user = await ctx.db.query("users")
  .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
  .unique();
if (!user || user.role !== "admin") throw new ConvexError("Unauthorized");
```

### getUserDetail — Audit Trail

When admin views an individual user's data:
```typescript
// Log the access
await ctx.scheduler.runAfter(0, internal.audit.log, {
  userId: targetUserId,
  actorId: adminUser._id,
  action: "admin_view",
  resource: "full_profile",
  metadata: JSON.stringify({ reason: "admin_dashboard_access" }),
});
```

---

## Admin UI

### User List Page
- Table with: email, signup date, onboarded (yes/no), upload count, last check-in, consent status dots (green/red)
- Search by email
- Sort by signup date, upload count, last activity
- Click row to view detail (triggers audit log)

### User Detail Page
- Profile summary (demographics, goals)
- Upload history with status
- Latest biomarker overview (traffic light)
- Active health plan summary
- Consent records timeline
- "Export User Data" button (JSON download, creates audit entry)

### Aggregate Dashboard
- Total users, active users (checked in last 7 days)
- Uploads per month chart
- Average health score gauge
- Most common suboptimal biomarkers (bar chart)
- Consent coverage percentages

### Audit Log Viewer
- Filterable table: user, actor, action, resource, timestamp
- Filter by action type, date range, user
- Shows who accessed what and when

---

## Design Decisions

### Why anonymized user list by default?

**Context:** Could show full names and details in the user list.

**Decision:** Show only email and aggregate data in the list view. Viewing full profile is a deliberate action that triggers an audit log. This follows the HIPAA "minimum necessary" principle — admin sees only what's needed for their role at each level.

### Why no admin data modification?

**Context:** Admin could have edit capabilities for user data.

**Decision:** Admin is read-only for health data. This reduces risk of accidental data modification, simplifies audit trail (only "read" actions, never "admin_update"), and keeps data integrity in the user's hands. If corrections are needed, the user re-uploads or updates their own data.
