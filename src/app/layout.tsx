import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { fontBody, fontDisplay } from '@/lib/fonts';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/providers/QueryProvider';
import '@/app/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://civicfix.app'
  ),
  title: {
    default: 'CivicFix — Pothole & Road Defect Reporting Network',
    template: '%s | CivicFix',
  },
  description:
    'CivicFix empowers citizens to report potholes and road defects, tracks every ticket from open to repair, and gives government crews the tools to close jobs with proof.',
  keywords: [
    'pothole reporting',
    'road defects',
    'civic tech',
    'infrastructure reporting',
    'city maintenance',
    'citizen reporting',
  ],
  authors: [{ name: 'CivicFix' }],
  creator: 'CivicFix',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'CivicFix',
    title: 'CivicFix — Pothole & Road Defect Reporting Network',
    description:
      'Report road defects, track repairs, and hold local government accountable — all in one civic platform.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CivicFix — Road Defect Reporting Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicFix — Pothole & Road Defect Reporting Network',
    description:
      'Report road defects, track repairs, and hold local government accountable.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontBody.variable}`}
    >
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
