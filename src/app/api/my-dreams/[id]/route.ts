import { cookies } from 'next/headers';
import { deleteOwnedDream } from '@/lib/dreams-db';
import { OWNER_COOKIE_NAME } from '@/lib/owner-session';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const ownerToken = cookieStore.get(OWNER_COOKIE_NAME)?.value;

    if (!ownerToken) {
      return Response.json({ error: 'This browser cannot delete any dreams yet' }, { status: 401 });
    }

    const { id } = await params;
    await deleteOwnedDream(ownerToken, id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed to delete dream' }, { status: 500 });
  }
}
