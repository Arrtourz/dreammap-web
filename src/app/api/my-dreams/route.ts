import { createClient } from '@/utils/supabase/server';
import { listUserDreams } from '@/lib/dreams-db';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const dreams = await listUserDreams(user.id);
    return Response.json({ dreams });
  } catch {
    return Response.json({ error: 'Failed to load your dreams' }, { status: 500 });
  }
}
