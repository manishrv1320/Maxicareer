import type { Metadata } from 'next';
import { PolicyPage } from '@/src/components/PolicyPage';
import { publishedPolicies } from '@/lib/server/policies';

export const metadata: Metadata = {
  title: 'Terms of service | Maxicareer',
  description: 'The terms for using Maxicareer and joining our programs.',
};

// Always the text last published from Website > Policies in the admin portal.
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <PolicyPage policy="terms" policies={await publishedPolicies()} />;
}
