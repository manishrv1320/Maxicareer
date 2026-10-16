import type { Metadata } from 'next';
import './globals.css';

// Link previews (WhatsApp, LinkedIn, X) need absolute image URLs. APP_URL wins; on Vercel the
// production domain is the fallback.
const siteUrl =
  process.env.APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

const previewImage = {
  url: '/images/og-image.png',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Maxicareer: Career Guidance & Mentorship',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Maxicareer | Career Guidance and Mentorship',
  description:
    'Maxicareer provides personalized career guidance, mentorship, skill development, and practical support to help students and aspiring professionals achieve their goals.',
  openGraph: {
    title: 'Maxicareer | Career Guidance and Mentorship',
    description:
      'Maxicareer provides personalized career guidance, mentorship, skill development, and practical support to help students and aspiring professionals achieve their goals.',
    type: 'website',
    siteName: 'Maxicareer',
    locale: 'en_IN',
    images: [previewImage],
  },
  twitter: {
    card: 'summary_large_image',
    images: [previewImage.url],
  },
  icons: {
    icon: [
      { url: '/images/maxicareer-icon.svg', type: 'image/svg+xml' },
      { url: '/images/maxicareer-icon.png', type: 'image/png' },
    ],
    apple: '/images/maxicareer-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-blue-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
