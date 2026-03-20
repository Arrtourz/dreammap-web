import { getPublicDreamByShareToken } from '@/lib/dreams-db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const dream = await getPublicDreamByShareToken(shareToken);
    return Response.json({ dream });
  } catch {
    return Response.json({ error: 'Dream not found' }, { status: 404 });
  }
}
