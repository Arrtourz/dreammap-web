# Dreammap Web

Dreammap is a lightweight public dream-sharing web app built around an interactive globe.

Production: https://dreammap-web.vercel.app

## What it does

- Public visitors browse shared dreams on a globe and in the latest activity panel
- Publishing requires `Sign in with Google`
- Each dream stores dream text, dream date, a time bucket, and only a rough sleep-location
- Signed-in users can view and delete their own entries

## Local setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Create `.env.local`
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   SUPABASE_SECRET_KEY=sb_secret_xxx
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
   ```
3. Enable Google auth in Supabase
4. Run the SQL in `supabase/schema.sql`
5. Start the app
   ```bash
   npm run dev
   ```

## Main routes

- `/` globe + timeline + publish flow
- `/share/[token]` public dream detail
- `/api/dreams` public list + authenticated create
- `/api/my-dreams` signed-in user entries
