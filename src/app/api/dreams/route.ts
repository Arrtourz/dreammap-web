import { z } from 'zod';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { coarsenLocation } from '@/lib/location-utils';
import { createDreamEntry, listPublicDreams } from '@/lib/dreams-db';
import { createAdminClient } from '@/utils/supabase/admin';
import { createOwnerEmail, createOwnerSeed, getOwnerCookieOptions, OWNER_COOKIE_NAME } from '@/lib/owner-session';

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
    const parsed = dreamSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: 'Invalid dream payload' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let ownerUserId = cookieStore.get(OWNER_COOKIE_NAME)?.value;
    let shouldSetOwnerCookie = false;

    if (!ownerUserId) {
      const seed = createOwnerSeed();
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.createUser({
        email: createOwnerEmail(seed),
        email_confirm: true,
        user_metadata: {
          anonymous_owner: true,
        },
      });

      if (error || !data.user) {
        throw error || new Error('Failed to create anonymous owner');
      }

      ownerUserId = data.user.id;
      shouldSetOwnerCookie = true;
    }

    const roughLocation = coarsenLocation({
      label: parsed.data.locationLabel,
      lat: parsed.data.locationLatRough,
      lng: parsed.data.locationLngRough,
    });

    const dream = await createDreamEntry(ownerUserId, {
      ...parsed.data,
      locationLabel: roughLocation.label,
      locationLatRough: roughLocation.lat,
      locationLngRough: roughLocation.lng,
    });

    const response = NextResponse.json({ dream }, { status: 201 });

    if (shouldSetOwnerCookie) {
      response.cookies.set(OWNER_COOKIE_NAME, ownerUserId, getOwnerCookieOptions());
    }

    return response;
  } catch {
    return Response.json({ error: 'Failed to create dream' }, { status: 500 });
  }
}
