import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectUrl = new URL('/', requestUrl.origin);

  try {
    if (code) {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    }
  } catch {
    // Avoid white-screen 500 on OAuth callback failures; surface a recoverable state.
    redirectUrl.searchParams.set('auth_error', 'callback_exchange_failed');
  }

  return NextResponse.redirect(redirectUrl);
}
