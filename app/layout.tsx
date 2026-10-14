import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maxicareer | Career Guidance and Mentorship',
  description:
    'Maxicareer provides personalized career guidance, mentorship, skill development, and practical support to help students and aspiring professionals achieve their goals.',
  openGraph: {
    title: 'Maxicareer | Career Guidance and Mentorship',
    description:
      'Maxicareer provides personalized career guidance, mentorship, skill development, and practical support to help students and aspiring professionals achieve their goals.',
    type: 'website',
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
