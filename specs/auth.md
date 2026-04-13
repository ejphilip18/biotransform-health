# Authentication System

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

BioTransform uses Convex Auth for authentication. Users can sign up and sign in with email/password or Google OAuth. The system supports two roles: `user` (default) and `admin`. Protected routes require authentication via Next.js middleware. Admin routes additionally check the user's role server-side in Convex functions.

### Goals

- Seamless sign-up/sign-in with Password and Google OAuth
- Role-based access control (user vs admin)
- Protected routes via Next.js middleware
- Session persistence across page reloads

### Non-Goals

- Multi-factor authentication (future consideration)
- Custom OAuth providers beyond Google (future)
- Fine-grained permissions beyond user/admin

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Auth Pages      │────▶│  Convex Auth    │────▶│  Convex DB      │
│  (sign in/up)    │     │  (Password +    │     │  (authTables +  │
│                  │     │   Google)        │     │   users table)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│  Middleware      │                             │  User Functions  │
│  (route protect) │                             │  (getCurrentUser│
└─────────────────┘                             │   isAdmin)      │
                                                └─────────────────┘
```

---

## Core Types

### UserRole

```typescript
type UserRole = "user" | "admin";
```

### User (extended from Convex Auth)

The `users` table extends Convex Auth's `authTables` with additional fields:

```typescript
interface User {
  _id: Id<"users">;
  _creationTime: number;
  // From Convex Auth
  name?: string;
  email?: string;
  image?: string;
  // Custom fields
  role: UserRole;               // Default: "user"
  onboardingComplete: boolean;  // Default: false
}
```

---

## Convex Auth Configuration

```typescript
// convex/auth.ts
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Google],
});
```

---

## Convex Functions

### Queries

| Function | Purpose | Auth Required |
| :--- | :--- | :--- |
| `users.getCurrentUser` | Get the authenticated user's full record | Yes |
| `users.isAdmin` | Check if current user has admin role | Yes |

### Mutations

| Function | Purpose | Auth Required |
| :--- | :--- | :--- |
| `users.setRole` | Set a user's role (admin only) | Admin |

---

## Route Protection

### Middleware (`middleware.ts`)

```typescript
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
export default convexAuthNextjsMiddleware();
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### Auth API route (`src/app/api/auth/route.ts`)

The app uses an explicit Next.js route handler for Convex auth actions:

```ts
export async function POST(request: NextRequest) { ... }
```

This handles `auth:signIn` and `auth:signOut` payloads from `@convex-dev/auth` client calls and manages:

- action validation (`POST`, auth action names),
- CORS guard,
- refresh-token exchange,
- secure auth cookie set/clear flow,
- and proxying `auth:signIn` / `auth:signOut` into Convex actions.

This avoids runtime 404s for `/api/auth` in this package/runtime combination while preserving middleware-based route protection.

### Public Routes

- `/` — Landing page
- `/auth` — Sign in / sign up

### Protected Routes (require authentication)

- `/onboarding` — Profile setup
- `/dashboard` — Main hub
- `/upload` — PDF upload
- `/results/[id]` — Analysis results
- `/plan` — Health protocol
- `/progress` — Progress tracking
- `/checkin` — Daily check-in
- `/report/[id]` — PDF report
- `/settings` — User settings

### Admin Routes (require admin role)

- `/admin` — Admin dashboard

Admin check happens server-side in Convex functions. The middleware only checks authentication; the admin page additionally calls `users.isAdmin` and redirects non-admins.

---

## Client Provider

```typescript
// src/providers/convex-provider.tsx
"use client";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
```

---

## Admin Seeding

To seed an admin account, use the Convex Dashboard or a one-time mutation that:
1. Looks up a user by email
2. Sets their `role` field to `"admin"`

This is a manual operation, not an automated migration, for security reasons.

---

## Security Considerations

- Passwords are hashed by Convex Auth (bcrypt)
- Sessions are encrypted via `AUTH_SECRET` environment variable
- Google OAuth tokens are managed by `@auth/core` — never stored in our DB
- Role changes are admin-only and should be audit-logged
- Failed login attempts are rate-limited by Convex Auth defaults

---

## Design Decisions

### Why Convex Auth over Clerk?

**Context:** Clerk has better UI out of the box but adds a third-party dependency and cost.

**Decision:** Convex Auth — it's built into the Convex ecosystem, zero additional cost, and we control the auth UI which matters for the clinical-luxury design aesthetic.

### Why only two roles (user/admin)?

**Context:** Could have fine-grained permissions (viewer, editor, analyst, etc.)

**Decision:** Start simple. Two roles cover our needs. User can do everything with their own data. Admin can view all users' data (with audit logging). Add roles only when there's evidence they're needed.

---

## Dependencies

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `@convex-dev/auth` | latest | Convex Auth framework |
| `@auth/core` | 0.37.x | OAuth provider support |
| `convex` | latest | Backend platform |
