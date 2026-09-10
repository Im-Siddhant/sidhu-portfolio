# Sidhu Portfolio

Production-ready personal portfolio and admin CMS built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth + Storage
- Vercel

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. Run `npm install` and `npm run dev`.

## Database
The canonical schema is represented by the migration documented in `supabase/migrations/20260910190000_portfolio_cms_schema.sql`. Apply it to a fresh Supabase project before using the CMS.

## Admin
Create a Supabase Auth user, then promote that user's row in `public.profiles` to `admin` using a trusted SQL session. Never expose service-role credentials in the browser.

## Deployment
Deploy the repository to Vercel and configure the variables from `.env.example`. Set Supabase Auth Site URL and redirect URLs to the production domain.

## Security
RLS is enabled on application tables. Public reads are limited to published portfolio content; writes require editor/admin authorization. Contact submissions are insert-only for anonymous visitors and readable by authorized staff.
