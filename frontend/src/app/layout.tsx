//frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Research Ustad Grand Opening Workshop | Research to Higher Study',
  description:
    'Join the free Research Ustad Grand Opening Workshop on 26 September 2026. Learn how to build a strong academic profile for global opportunities.',
  keywords: [
    'Research Ustad',
    'Workshop',
    'Higher Study',
    'Research',
    'Academic Profile',
    'Scholarship',
  ],
  openGraph: {
    title: 'Research Ustad Grand Opening Workshop',
    description:
      'Research to Higher Study: Building a Strong Academic Profile for Global Opportunities',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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