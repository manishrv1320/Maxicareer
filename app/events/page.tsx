import type { Metadata } from 'next';
import { WebsiteEventsPage } from '@/src/components/WebsiteEventsPage';

export const metadata: Metadata = {
  title: 'Events | Maxicareer',
  description: 'Upcoming webinars, workshops, masterclasses and career fairs from Maxicareer mentors and hiring partners.',
};

export default function Page() {
  return <WebsiteEventsPage />;
}
