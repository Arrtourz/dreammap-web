'use client';

import Link from 'next/link';
import { Trash2, Share2, MapPin, Clock3 } from 'lucide-react';
import type { DreamEntry } from '@/lib/dream-types';
import { cn } from '@/lib/utils';
import { formatDreamDate, getDreamExcerpt, getDreamTimeBucketLabel } from '@/lib/dream-presenters';
import { Button } from '@/components/ui/button';

interface DreamCardProps {
  dream: DreamEntry;
  onSelect?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  showDelete?: boolean;
  className?: string;
}

export function DreamCard({
  dream,
  onSelect,
  onDelete,
  deleting = false,
  showDelete = false,
  className,
}: DreamCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-card/95 p-4 shadow-sm transition hover:border-border/80 hover:shadow-md',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={onSelect}
    >
      {showDelete && onDelete ? (
        <button
          type="button"
          aria-label="Delete dream"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="absolute right-3 top-3 rounded-full p-2 text-red-500 transition hover:bg-red-500/10 hover:text-red-600"
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}

      <div className="space-y-3 pr-10">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDreamDate(dream.dreamDate)} · {getDreamTimeBucketLabel(dream.dreamTimeBucket)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {dream.locationLabel}
          </span>
        </div>

        <p className="text-sm leading-6 text-foreground/90">{getDreamExcerpt(dream.dreamText, showDelete ? 180 : 140)}</p>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="secondary" onClick={(event) => event.stopPropagation()}>
            <Link href={`/share/${dream.shareToken}`}>
              <Share2 className="h-4 w-4" />
              Open
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
