# BountyFlow

BountyFlow is a Next.js 14 prototype for an on-chain bug bounty platform with separate researcher and project owner flows.

## Stack

- Next.js 14 App Router
- Tailwind CSS
- Zustand
- React Query
- Supabase Auth

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
OWNER_ALLOWED_EMAILS=you@example.com
```

3. In Supabase SQL Editor, run:

- [supabase/profiles.sql](./supabase/profiles.sql)

4. Start the app:

```bash
npm run dev
```

## Auth Notes

- Public pages remain open.
- Researcher routes are protected.
- Owner routes are protected.
- Owner access is restricted by `OWNER_ALLOWED_EMAILS`.
- Signup requires email confirmation once, then users log in manually with email and password.

## Current Routes

- `/`
- `/bounties`
- `/bounty/[slug]`
- `/bounty/[slug]/submit`
- `/dashboard`
- `/dashboard/submission/[id]`
- `/admin`
- `/admin/submissions`
- `/admin/treasury`
- `/auth`
