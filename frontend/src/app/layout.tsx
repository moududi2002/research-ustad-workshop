//frontend/src/app/layout.tsx

import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const siteUrl = 'https://workshop.researchustad.org';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: 'Research Ustad | Research, Courses, Workshops & Academic Mentorship',
    template: '%s | Research Ustad',
  },

  description:
    'Research Ustad is a research and academic learning platform offering research courses, workshops, research training, academic mentorship, and practical learning opportunities for students and researchers worldwide.',

  applicationName: 'Research Ustad',

  keywords: [
    'Research Ustad',
    'Research Ustad Bangladesh',
    'Research Ustad Courses',
    'Research Ustad Workshops',
    'Research Ustad Classes',
    'Research Courses',
    'Research Workshops',
    'Research Training',
    'Academic Mentorship',
    'Research Paper Writing',
    'Research Methodology',
    'Research Publication',
    'Research Guidance',
    'Higher Study Preparation',
    'Scholarship Preparation',
    'Academic Learning Platform',
    'Online Research Courses',
    'Research Skills Development',
  ],

  authors: [
    {
      name: 'Research Ustad',
      url: 'https://researchustad.org',
    },
    {
      name: 'Abul Ala Moududi',
    },
  ],

  creator: 'Research Ustad',
  publisher: 'Research Ustad',

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'Research Ustad | Research, Courses, Workshops & Academic Mentorship',
    description:
      'Explore research courses, professional workshops, academic classes, research training, and mentorship opportunities with Research Ustad.',
    url: siteUrl,
    siteName: 'Research Ustad',
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Research Ustad | Research & Academic Learning Platform',
    description:
      'Discover research courses, workshops, academic classes, and research mentorship opportunities with Research Ustad.',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',

  '@id': `${siteUrl}/#organization`,

  name: 'Research Ustad',

  url: siteUrl,

  description:
    'Research Ustad is a research and academic learning platform providing research courses, workshops, training, and academic mentorship.',

  founder: {
    '@type': 'Person',
    name: 'Anichur Rahman',
    jobTitle: 'Founder & CEO',
  },

  employee: [
    {
      '@type': 'Person',
      name: 'Abul Ala Moududi',
      jobTitle: 'Co-Founder & COO',
    },
  ],

  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dhaka',
    addressCountry: 'BD',
  },

  sameAs: [
    'https://researchustad.org',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(
              /</g,
              '\\u003c',
            ),
          }}
        />

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
