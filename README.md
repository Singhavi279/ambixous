# Ambixous Events Platform

This repository contains the Next.js application and Supabase schema that power the Ambixous events experience.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 8+
- [Supabase CLI](https://supabase.com/docs/guides/cli) 1.150+

## Local development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and provide your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Set the environment variables so the app can talk to Supabase:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY"
   SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-ROLE-KEY"
   ```

3. Start the local dev server:

   ```bash
   pnpm dev
   ```

## Supabase database

Run the migrations and seed data locally with the Supabase CLI:

```bash
supabase db reset --db-url "$SUPABASE_DB_URL"
```

The `reset` command applies the SQL files in [`supabase/migrations`](./supabase/migrations) and then executes [`supabase/seed.sql`](./supabase/seed.sql) so the database mirrors the fixtures used by the application.

If you are connecting to a hosted Supabase project, run the schema and seed scripts through the dashboard SQL editor instead of the CLI.
