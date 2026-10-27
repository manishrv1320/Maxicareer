import type { Metadata } from 'next';
import { NewsletterUnsubscribe } from '@/src/components/NewsletterUnsubscribe';

export const metadata: Metadata = {
  title: 'Unsubscribe | Maxicareer',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NewsletterUnsubscribe />;
}
