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
- Login, signup, logout, email verification, and password reset are handled through server routes.
- Session activity is tracked server-side with an absolute lifetime and idle timeout.
- Password reset confirmation is limited to a 15 minute in-app reset window.
- Cloudflare Turnstile can be enabled with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

## Production Auth Checklist

1. In Supabase Auth, keep `Confirm email` enabled.
2. Set the email OTP / recovery token expiry to `900` seconds if you want dashboard-side password reset expiry to match the in-app 15 minute window exactly.
3. Use custom SMTP before production.
4. Configure Cloudflare Turnstile and set the Turnstile env vars for login/signup/reset CAPTCHA protection.
5. Serve the app only over HTTPS in production.

## Secret Hygiene

- Only `.env.example` should ever be tracked in git.
- Real environment files are ignored by [.gitignore](./.gitignore).
- Frontend SDKs only receive public `NEXT_PUBLIC_*` configuration; owner allowlists, CAPTCHA secrets, Gemini keys, and WDK secrets stay server-side.
- Run `npm run scan:secrets` before commits to catch likely leaked credentials in tracked files.
- A GitHub Actions workflow now runs the same tracked-file secret scan on pushes and pull requests.
- To enable the local pre-commit hook, run:

```bash
git config core.hooksPath .githooks
```

- If a real key was ever committed, shared in screenshots, or pasted into client code, rotate it immediately in the upstream provider.

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
