import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { coarsenLocation } from '@/lib/location-utils';
import { createDreamEntry, listPublicDreams } from '@/lib/dreams-db';

const dreamSchema = z.object({
  dreamText: z.string().min(1).max(4000),
  dreamDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dreamTimeBucket: z.enum(['after-midnight', 'early-morning', 'morning', 'afternoon-nap', 'evening']),
  locationLabel: z.string().min(1).max(160),
  locationLatRough: z.number().min(-90).max(90),
  locationLngRough: z.number().min(-180).max(180),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined;
    const dreams = await listPublicDreams(month);
    return Response.json({ dreams });
  } catch {
    return Response.json({ error: 'Failed to load dreams' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const parsed = dreamSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: 'Invalid dream payload' }, { status: 400 });
    }

    const roughLocation = coarsenLocation({
      label: parsed.data.locationLabel,
      lat: parsed.data.locationLatRough,
      lng: parsed.data.locationLngRough,
    });

    const dream = await createDreamEntry(user.id, {
      ...parsed.data,
      locationLabel: roughLocation.label,
      locationLatRough: roughLocation.lat,
      locationLngRough: roughLocation.lng,
    });

    return Response.json({ dream }, { status: 201 });
  } catch {
    return Response.json({ error: 'Failed to create dream' }, { status: 500 });
  }
}
