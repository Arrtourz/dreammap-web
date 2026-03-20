import type { DreamEntry, DreamTimeBucket } from '@/lib/dream-types';

const TIME_BUCKET_LABELS: Record<DreamTimeBucket, string> = {
  'after-midnight': 'After midnight',
  'early-morning': 'Early morning',
  'morning': 'Morning',
  'afternoon-nap': 'Afternoon nap',
  'evening': 'Evening',
};

export function formatDreamDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthKey}-01T00:00:00Z`));
}

export function getDreamTimeBucketLabel(bucket: DreamTimeBucket) {
  return TIME_BUCKET_LABELS[bucket];
}

export function getDreamExcerpt(text: string, maxLength = 140) {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

export function groupDreamsByMonth(dreams: DreamEntry[]) {
  return dreams.reduce<Record<string, DreamEntry[]>>((acc, dream) => {
    const monthKey = dream.dreamDate.slice(0, 7);
    acc[monthKey] = acc[monthKey] || [];
    acc[monthKey].push(dream);
    return acc;
  }, {});
}
