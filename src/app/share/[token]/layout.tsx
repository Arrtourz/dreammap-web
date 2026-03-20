import type { Metadata } from 'next';
import { getPublicDreamByShareToken } from '@/lib/dreams-db';
import { getDreamExcerpt } from '@/lib/dream-presenters';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  try {
    const dream = await getPublicDreamByShareToken(token);
    const preview = getDreamExcerpt(dream.dreamText, 160);

    return {
      title: `${dream.locationLabel} dream`,
      description: preview,
      openGraph: {
        title: `${dream.locationLabel} dream`,
        description: preview,
        images: ['/favicon.ico'],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${dream.locationLabel} dream`,
        description: preview,
        images: ['/favicon.ico'],
      },
    };
  } catch {
    return {
      title: 'Dream not found',
      description: 'This dream is no longer available.',
    };
  }
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
