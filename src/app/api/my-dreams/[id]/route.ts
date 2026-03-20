import { createClient } from '@/utils/supabase/server';
import { deleteUserDream } from '@/lib/dreams-db';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    await deleteUserDream(user.id, id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed to delete dream' }, { status: 500 });
  }
}
