This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## HANAN authentication

Login uses Supabase Auth email/password and the existing public.hanan_members table.
Only members named Farhan or Anantha can access the application. Both accounts share the application, but Personal Savings page and transaction API
are restricted to Anantha. SeaBank aggregate balances remain visible to both accounts.

Required environment variables (locally in .env.local and in deployment settings):

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
- SUPABASE_SERVICE_ROLE_KEY (server-side database operations only)

Create both accounts in Supabase Authentication and link their auth.users IDs in
hanan_members. Enable the Email provider and disable public signup. Membership
SELECT must be allowed for authenticated users on their own row, as in the setup SQL.
HANAN_PIN_HASH_B64 is no longer used. Existing PIN sessions must sign in again.
No additional database migration is needed for this authentication change.

Verification with configured Supabase:

1. Sign in with each member; verify access to the same savings and memories.
2. Try an incorrect password and a valid Auth user without membership; deny access.
3. Logout; protected pages must redirect to /login and protected APIs return 401.
4. A legacy hanan_session=authenticated cookie alone must not grant access.
5. Confirm sessions refresh after access-token expiry and cron still requires CRON_SECRET.

Run isolated authentication regression tests with npm run test:auth (mocked Supabase; no database writes).
