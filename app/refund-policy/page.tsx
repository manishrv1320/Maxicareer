import type { Metadata } from 'next';
import { PolicyPage } from '@/src/components/PolicyPage';
import { publishedPolicies } from '@/lib/server/policies';

export const metadata: Metadata = {
  title: 'Refund and cancellation policy | Maxicareer',
  description: 'Rescheduling and cancelling sessions, and refunds for Maxicareer programs and services.',
};

// Always the text last published from Website > Policies in the admin portal.
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <PolicyPage policy="refund" policies={await publishedPolicies()} />;
}
