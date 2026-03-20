import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Clock3 } from 'lucide-react';
import { getPublicDreamByShareToken } from '@/lib/dreams-db';
import { formatDreamDate, getDreamTimeBucketLabel } from '@/lib/dream-presenters';

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  try {
    const { token } = await params;
    const dream = await getPublicDreamByShareToken(token);

    return (
      <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Dreammap
            </Link>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Dreammap</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shared dream</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Public dream entries store only a rough area, never precise sleep coordinates.
              </p>
            </div>
          </div>

          <article className="rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {formatDreamDate(dream.dreamDate)} · {getDreamTimeBucketLabel(dream.dreamTimeBucket)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {dream.locationLabel}
              </span>
            </div>

            <div className="prose prose-neutral max-w-none dark:prose-invert">
              {dream.dreamText.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
