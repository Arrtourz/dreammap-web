import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { QueryProvider } from '@/components/query-provider';
import { ThemeProvider } from '@/components/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dreammap.example';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Dreammap',
    template: '%s | Dreammap',
  },
  description:
    'Browse and publish dreams on an interactive globe. Dreammap stores only rough locations and keeps public sharing lightweight.',
  applicationName: 'Dreammap',
  keywords: [
    'dream journal',
    'dream sharing',
    'interactive globe',
    'sleep location',
    'dream archive',
  ],
  authors: [{ name: 'Dreammap' }],
  creator: 'Dreammap',
  publisher: 'Dreammap',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'Dreammap',
    description:
      'A public globe of remembered dreams with rough sleep-locations and a latest activity feed.',
    url: baseUrl,
    siteName: 'Dreammap',
    images: [
      {
        url: '/favicon.ico',
        width: 48,
        height: 48,
        alt: 'Dreammap',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dreammap',
    description:
      'Browse and publish dreams on a shared globe, with only rough location data stored.',
    images: ['/favicon.ico'],
  },
  icons: {
    icon: [{ url: '/favicon.ico' }],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Analytics />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
