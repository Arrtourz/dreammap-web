import 'server-only';

import { createAdminClient } from '@/utils/supabase/admin';
import type { CreateDreamInput, DreamEntry } from '@/lib/dream-types';

type DreamRow = {
  id: string;
  user_id: string;
  dream_text: string;
  dream_date: string;
  dream_time_bucket: DreamEntry['dreamTimeBucket'];
  location_label: string;
  location_lat_rough: number;
  location_lng_rough: number;
  is_public: boolean;
  share_token: string;
  created_at: string;
};

function toDreamEntry(row: DreamRow): DreamEntry {
  return {
    id: row.id,
    userId: row.user_id,
    dreamText: row.dream_text,
    dreamDate: row.dream_date,
    dreamTimeBucket: row.dream_time_bucket,
    locationLabel: row.location_label,
    locationLatRough: row.location_lat_rough,
    locationLngRough: row.location_lng_rough,
    isPublic: row.is_public,
    shareToken: row.share_token,
    createdAt: row.created_at,
  };
}

function createShareToken(label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return `${slug || 'dream'}-${Math.random().toString(36).slice(2, 10)}`;
}

function monthBounds(month: string) {
  const [year, monthPart] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthPart - 1, 1));
  const end = new Date(Date.UTC(year, monthPart, 1));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function createDreamEntry(userId: string, input: CreateDreamInput) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('dream_entries')
    .insert({
      user_id: userId,
      dream_text: input.dreamText,
      dream_date: input.dreamDate,
      dream_time_bucket: input.dreamTimeBucket,
      location_label: input.locationLabel,
      location_lat_rough: input.locationLatRough,
      location_lng_rough: input.locationLngRough,
      is_public: true,
      share_token: createShareToken(input.locationLabel),
    })
    .select('*')
    .single();

  if (error) throw error;

  return toDreamEntry(data as DreamRow);
}

export async function listPublicDreams(month?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from('dream_entries')
    .select('*')
    .eq('is_public', true)
    .order('dream_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (month) {
    const { start, end } = monthBounds(month);
    query = query.gte('dream_date', start).lt('dream_date', end);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as DreamRow[]).map(toDreamEntry);
}

export async function getPublicDreamByShareToken(shareToken: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('dream_entries')
    .select('*')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .single();

  if (error) throw error;

  return toDreamEntry(data as DreamRow);
}

export async function listUserDreams(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('dream_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as DreamRow[]).map(toDreamEntry);
}

export async function deleteUserDream(userId: string, dreamId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('dream_entries')
    .delete()
    .eq('id', dreamId)
    .eq('user_id', userId);

  if (error) throw error;
}
