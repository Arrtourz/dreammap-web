# Supabase Setup for Dreammap

This directory contains the SQL needed to back the Dreammap app in Supabase.

## Quick setup

Run `schema.sql` in the Supabase SQL editor. The current Dreammap app depends on the `dream_entries` table defined there.

## Keys used by the app

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser and SSR auth clients
- `SUPABASE_SECRET_KEY` for server-only CRUD access

Keep the secret key on the server only. Never expose it to the browser.
