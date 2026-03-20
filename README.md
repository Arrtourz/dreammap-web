# Dreammap Web

Dreammap is a lightweight public dream-sharing web app built around an interactive globe.

Production: https://dreammap.space

## What it does

- Public visitors browse shared dreams on a globe and in the latest activity panel
- Publishing is anonymous and tied to the current browser with an HttpOnly ownership cookie
- Each dream stores dream text, dream date, a time bucket, and only a rough sleep-location
- The current browser can view and delete the dreams it published

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
3. Run the SQL in `supabase/schema.sql`
4. Start the app
   ```bash
   npm run dev
   ```

## Main routes

- `/` globe + timeline + publish flow
- `/share/[token]` public dream detail
- `/api/dreams` public list + anonymous create
- `/api/my-dreams` dreams published from the current browser
