'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Sparkles } from 'lucide-react';
import { getRandomGlobeCenter, Globe, GlobeMarker, GlobeRef } from '@/components/globe';
import { DreamComposeModal, createEmptyDreamDraft } from '@/components/dream-compose-modal';
import { DreamTimelineDrawer } from '@/components/dream-timeline-drawer';
import type { DreamEntry, RoughLocation } from '@/lib/dream-types';
import { Button } from '@/components/ui/button';
import { reverseGeocodeToRoughLocation } from '@/lib/location-utils';
import { formatDreamDate, getDreamExcerpt, getDreamTimeBucketLabel } from '@/lib/dream-presenters';

const EMPTY_DREAMS: DreamEntry[] = [];

async function fetchPublicDreams() {
  const response = await fetch('/api/dreams');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to load dreams');
  return data.dreams as DreamEntry[];
}

async function fetchMyDreams() {
  const response = await fetch('/api/my-dreams');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to load your dreams');
  return data.dreams as DreamEntry[];
}

export default function Home() {
  const queryClient = useQueryClient();
  const globeRef = useRef<GlobeRef>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedDream, setSelectedDream] = useState<DreamEntry | null>(null);
  const [draft, setDraft] = useState(createEmptyDreamDraft());
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [deletingDreamId, setDeletingDreamId] = useState<string | null>(null);

  const publicDreamsQuery = useQuery({
    queryKey: ['dreams'],
    queryFn: fetchPublicDreams,
  });

  const myDreamsQuery = useQuery({
    queryKey: ['my-dreams'],
    queryFn: fetchMyDreams,
  });

  const createDreamMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamText: draft.dreamText,
          dreamDate: draft.dreamDate,
          dreamTimeBucket: draft.dreamTimeBucket,
          locationLabel: draft.location?.label,
          locationLatRough: draft.location?.lat,
          locationLngRough: draft.location?.lng,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create dream');
      }

      return data.dream as DreamEntry;
    },
    onSuccess: async (dream) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dreams'] }),
        queryClient.invalidateQueries({ queryKey: ['my-dreams'] }),
      ]);

      setDraft(createEmptyDreamDraft());
      setShowComposeModal(false);
      setSelectedDream(dream);
      setActivityOpen(true);
      setNotification('Dream published.');
      globeRef.current?.focusLocation(dream.locationLngRough, dream.locationLatRough);
    },
    onError: (error) => {
      setNotification(error instanceof Error ? error.message : 'Failed to publish dream');
    },
  });

  const deleteDreamMutation = useMutation({
    mutationFn: async (dream: DreamEntry) => {
      const response = await fetch(`/api/my-dreams/${dream.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete dream');
      }
    },
    onMutate: (dream) => {
      setDeletingDreamId(dream.id);
    },
    onSuccess: async (_, dream) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dreams'] }),
        queryClient.invalidateQueries({ queryKey: ['my-dreams'] }),
      ]);
      setNotification('Dream deleted.');
      if (selectedDream && selectedDream.id === dream.id) {
        setSelectedDream(null);
      }
    },
    onError: (error) => {
      setNotification(error instanceof Error ? error.message : 'Failed to delete dream');
    },
    onSettled: () => {
      setDeletingDreamId(null);
    },
  });

  const publicDreams = publicDreamsQuery.data ?? EMPTY_DREAMS;
  const myDreams = myDreamsQuery.data ?? EMPTY_DREAMS;
  const initialCenter = useMemo(() => getRandomGlobeCenter(), []);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => {
      setNotification((current) => (current === notification ? null : current));
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  const visibleDreams = publicDreams.slice(0, 24);

  const markers = useMemo<GlobeMarker[]>(
    () =>
      visibleDreams.map((dream) => ({
        id: dream.id,
        label: dream.locationLabel,
        lat: dream.locationLatRough,
        lng: dream.locationLngRough,
        excerpt: getDreamExcerpt(dream.dreamText, 90),
      })),
    [visibleDreams]
  );

  const handleDreamSelect = useCallback((dream: DreamEntry) => {
    setSelectedDream(dream);
    globeRef.current?.focusLocation(dream.locationLngRough, dream.locationLatRough);
  }, []);

  const handleLocationSelected = useCallback((location: { name: string; lat: number; lng: number }) => {
    const roughLocation: RoughLocation = {
      label: location.name,
      lat: location.lat,
      lng: location.lng,
    };

    if (isPickingLocation) {
      setDraft((current) => ({ ...current, location: roughLocation }));
      setShowComposeModal(true);
      setIsPickingLocation(false);
      setNotification(`Location set to ${location.name}`);
      return;
    }

    setDraft((current) => ({ ...current, location: roughLocation }));
    setShowComposeModal(true);
  }, [isPickingLocation]);

  const handleUseBrowserLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNotification('Browser geolocation is unavailable. Right-click the globe to pick a rough area instead.');
      return;
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const roughLocation = await reverseGeocodeToRoughLocation(
              position.coords.latitude,
              position.coords.longitude
            );
            setDraft((current) => ({ ...current, location: roughLocation }));
          } catch {
            setNotification('Could not translate your location into a rough area.');
          }
          resolve();
        },
        () => {
          setNotification('Location access denied. Right-click the globe to pick a rough area instead.');
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 10_000,
        }
      );
    });
  };

  const handleStartManualLocationPick = () => {
    setShowComposeModal(false);
    setIsPickingLocation(true);
    setNotification('Right-click the globe to pick a rough area.');
  };

  const handleAddDream = () => {
    setShowComposeModal(true);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          markers={markers}
          theme="navigation-day-v1"
          initialCenter={initialCenter}
          initialZoom={1.6}
          onMarkerClick={(marker) => {
            const dream = visibleDreams.find((entry) => entry.id === marker.id);
            if (dream) handleDreamSelect(dream);
          }}
          onLocationClick={handleLocationSelected}
          interactionHint={
            isPickingLocation
              ? 'Right-click the globe to set the rough place where you were sleeping'
              : 'Browse recent dreams or right-click the globe to add one'
          }
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div className="pointer-events-auto rounded-[28px] border bg-background/88 px-5 py-4 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-foreground p-2 text-background">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Dreammap</p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">A public globe of remembered dreams</h1>
              </div>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Browse recent dreams by rough place. Publish your own anonymously and store only coarse location data.
            </p>
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center justify-end gap-2 px-3 py-2">
              <Button type="button" onClick={handleAddDream}>
                Add dream
              </Button>
            </div>

            {selectedDream ? (
              <div className="max-w-sm rounded-[28px] border bg-background/92 p-4 shadow-2xl backdrop-blur">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{selectedDream.locationLabel}</span>
                    <span>/</span>
                    <span>
                      {formatDreamDate(selectedDream.dreamDate)} / {getDreamTimeBucketLabel(selectedDream.dreamTimeBucket)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-foreground/90">{selectedDream.dreamText}</p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/share/${selectedDream.shareToken}`}>Open detail</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {notification ? (
        <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full border bg-background/92 px-4 py-2 text-sm shadow-lg backdrop-blur">
          {notification}
        </div>
      ) : null}

      <DreamTimelineDrawer
        open={activityOpen}
        publicDreams={publicDreams}
        myDreams={myDreams}
        currentDreamId={selectedDream?.id || null}
        deletingDreamId={deletingDreamId}
        onToggle={() => setActivityOpen((current) => !current)}
        onDreamSelect={handleDreamSelect}
        onDeleteDream={(dream) => deleteDreamMutation.mutate(dream)}
      />

      <DreamComposeModal
        open={showComposeModal}
        draft={draft}
        onOpenChange={setShowComposeModal}
        onDraftChange={setDraft}
        onSubmit={() => createDreamMutation.mutate()}
        onUseBrowserLocation={handleUseBrowserLocation}
        onPickOnGlobe={handleStartManualLocationPick}
        submitting={createDreamMutation.isPending}
      />
    </div>
  );
}
