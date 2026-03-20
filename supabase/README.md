# Supabase Setup for Dreammap

This directory contains the SQL needed to back the Dreammap app in Supabase.

## Quick setup

1. Run `schema.sql` in the Supabase SQL editor.
2. Run `policies.sql` to enable RLS for `dream_entries`.

The current Dreammap app depends only on the `dream_entries` table.

## Keys used by the app

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser and SSR auth clients
- `SUPABASE_SECRET_KEY` for server-only CRUD access

Keep the secret key on the server only. Never expose it to the browser.
