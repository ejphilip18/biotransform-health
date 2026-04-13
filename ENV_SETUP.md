# Environment Setup (For New Machines)

1. Install dependencies:
   - `pnpm install`

2. Create env file:
   - Copy `.env.example` to `.env.local`
   - Fill in all required values with your own credentials

3. Required variables:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CONVEX_SITE_URL`
   - `CONVEX_SITE_URL`
   - `AUTH_SECRET`
   - `GEMINI_API_KEY`

4. Generate `AUTH_SECRET`:
   - Run: `openssl rand -base64 32`

5. Start services:
   - Terminal A: `pnpm convex dev`
   - Terminal B: `pnpm dev`

6. Open app:
   - `http://localhost:3000`

Notes:
- Do not commit `.env.local`.
- If OAuth is not used, keep `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` empty.
