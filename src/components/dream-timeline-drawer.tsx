'use client';

import { ChevronUp, Compass, Globe2, User2 } from 'lucide-react';
import type { DreamEntry } from '@/lib/dream-types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DreamCard } from '@/components/dream-card';
import { cn } from '@/lib/utils';

interface DreamTimelineDrawerProps {
  open: boolean;
  publicDreams: DreamEntry[];
  myDreams: DreamEntry[];
  currentDreamId?: string | null;
  loggedIn: boolean;
  deletingDreamId?: string | null;
  onToggle: () => void;
  onDreamSelect: (dream: DreamEntry) => void;
  onDeleteDream: (dream: DreamEntry) => void;
}

export function DreamTimelineDrawer({
  open,
  publicDreams,
  myDreams,
  currentDreamId,
  loggedIn,
  deletingDreamId,
  onToggle,
  onDreamSelect,
  onDeleteDream,
}: DreamTimelineDrawerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto w-full max-w-5xl">
        <div className="mb-3 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full border bg-background/90 px-5 shadow-lg backdrop-blur"
            onClick={onToggle}
          >
            <Compass className="h-4 w-4" />
            Latest activity
            <ChevronUp className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </Button>
        </div>

        <div
          className={cn(
            'overflow-hidden rounded-[28px] border bg-background/94 shadow-2xl backdrop-blur transition-all duration-300',
            open ? 'max-h-[68vh] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <Tabs defaultValue="public" className="gap-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <TabsList>
                <TabsTrigger value="public">
                  <Globe2 className="h-4 w-4" />
                  Latest
                </TabsTrigger>
                {loggedIn ? (
                  <TabsTrigger value="mine">
                    <User2 className="h-4 w-4" />
                    My Dreams
                  </TabsTrigger>
                ) : null}
              </TabsList>

              <p className="text-xs text-muted-foreground">
                Fresh public dreams with coarse locations only.
              </p>
            </div>

            <TabsContent value="public">
              <ScrollArea className="h-[48vh] px-5 py-5">
                <div className="space-y-4">
                  {publicDreams.length === 0 ? (
                    <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                      No public dreams yet.
                    </div>
                  ) : (
                    publicDreams.map((dream) => (
                      <DreamCard
                        key={dream.id}
                        dream={dream}
                        onSelect={() => onDreamSelect(dream)}
                        className={cn(currentDreamId === dream.id && 'border-foreground/20 shadow-md')}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {loggedIn ? (
              <TabsContent value="mine">
                <ScrollArea className="h-[48vh] px-5 py-5">
                  <div className="space-y-4">
                    {myDreams.length === 0 ? (
                      <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                        Your published dreams will appear here.
                      </div>
                    ) : (
                      myDreams.map((dream) => (
                        <DreamCard
                          key={dream.id}
                          dream={dream}
                          onSelect={() => onDreamSelect(dream)}
                          onDelete={() => onDeleteDream(dream)}
                          deleting={deletingDreamId === dream.id}
                          showDelete
                          className={cn(currentDreamId === dream.id && 'border-foreground/20 shadow-md')}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
