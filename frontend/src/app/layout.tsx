import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://workshop.researchustad.org'),

  title: {
    default: 'Research Ustad Grand Opening Workshop',
    template: '%s | Research Ustad',
  },

  description:
    'Join the free Research Ustad Grand Opening Workshop on 26 September 2026. Learn how to build a strong academic profile for global opportunities.',

  keywords: [
    'Research Ustad',
    'Research Ustad Workshop',
    'Grand Opening Workshop',
    'Higher Study',
    'Research',
    'Academic Profile',
    'Scholarship',
    'Study Abroad',
  ],

  authors: [{ name: 'Research Ustad' }],
  creator: 'Research Ustad',
  publisher: 'Research Ustad',

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },

  openGraph: {
    title: 'Research Ustad Grand Opening Workshop',
    description:
      'Research to Higher Study: Building a Strong Academic Profile for Global Opportunities',
    url: 'https://workshop.researchustad.org',
    siteName: 'Research Ustad',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/Research-Ustad-OG.png',
        width: 1200,
        height: 630,
        alt: 'Research Ustad Grand Opening Workshop',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Research Ustad Grand Opening Workshop',
    description:
      'Research to Higher Study: Building a Strong Academic Profile for Global Opportunities',
    images: ['/images/Research-Ustad-OG.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#23262f',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
