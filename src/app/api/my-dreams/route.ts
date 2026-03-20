import { cookies } from 'next/headers';
import { listOwnedDreams } from '@/lib/dreams-db';
import { OWNER_COOKIE_NAME } from '@/lib/owner-session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const ownerToken = cookieStore.get(OWNER_COOKIE_NAME)?.value;
    const dreams = ownerToken ? await listOwnedDreams(ownerToken) : [];
    return Response.json({ dreams });
  } catch {
    return Response.json({ error: 'Failed to load your dreams' }, { status: 500 });
  }
}
