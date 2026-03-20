'use client';

import { useEffect, useState } from 'react';
import type { DreamTimeBucket, RoughLocation } from '@/lib/dream-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DreamDraft {
  dreamText: string;
  dreamDate: string;
  dreamTimeBucket: DreamTimeBucket;
  location: RoughLocation | null;
}

interface DreamComposeModalProps {
  open: boolean;
  draft: DreamDraft;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (draft: DreamDraft) => void;
  onSubmit: () => void;
  onUseBrowserLocation: () => Promise<void>;
  onPickOnGlobe: () => void;
  submitting: boolean;
}

const DEFAULT_BUCKET: DreamTimeBucket = 'early-morning';

export function createEmptyDreamDraft(): DreamDraft {
  return {
    dreamText: '',
    dreamDate: new Date().toISOString().slice(0, 10),
    dreamTimeBucket: DEFAULT_BUCKET,
    location: null,
  };
}

export function DreamComposeModal({
  open,
  draft,
  onOpenChange,
  onDraftChange,
  onSubmit,
  onUseBrowserLocation,
  onPickOnGlobe,
  submitting,
}: DreamComposeModalProps) {
  const [locationAttempted, setLocationAttempted] = useState(false);

  useEffect(() => {
    if (open && !draft.location && !locationAttempted) {
      setLocationAttempted(true);
      void onUseBrowserLocation();
    }

    if (!open) {
      setLocationAttempted(false);
    }
  }, [draft.location, locationAttempted, onUseBrowserLocation, open]);

  const isValid = !!draft.dreamText.trim() && !!draft.dreamDate && !!draft.location;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Add a dream</DialogTitle>
          <DialogDescription>
            Save the dream text, when it happened, and only the rough area where you were sleeping.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dream description</label>
            <Textarea
              value={draft.dreamText}
              onChange={(event) => onDraftChange({ ...draft, dreamText: event.target.value })}
              placeholder="Write the dream as you remember it..."
              className="min-h-40"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dream date</label>
              <Input
                type="date"
                value={draft.dreamDate}
                onChange={(event) => onDraftChange({ ...draft, dreamDate: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time bucket</label>
              <Select
                value={draft.dreamTimeBucket}
                onValueChange={(value) =>
                  onDraftChange({ ...draft, dreamTimeBucket: value as DreamTimeBucket })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a time bucket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="after-midnight">After midnight</SelectItem>
                  <SelectItem value="early-morning">Early morning</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon-nap">Afternoon nap</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Rough sleep-location</p>
              <p className="text-xs text-muted-foreground">
                We store only a coarse area. Exact coordinates are never saved.
              </p>
            </div>

            <div className="rounded-xl border bg-background px-4 py-3 text-sm">
              {draft.location ? draft.location.label : 'No rough location selected yet.'}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => void onUseBrowserLocation()}>
                Use browser location
              </Button>
              <Button type="button" variant="outline" onClick={onPickOnGlobe}>
                Pick on globe
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={!isValid || submitting}>
            {submitting ? 'Publishing...' : 'Publish dream'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
