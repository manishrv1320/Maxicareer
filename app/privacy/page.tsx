import type { Metadata } from 'next';
import { PolicyPage } from '@/src/components/PolicyPage';
import { publishedPolicies } from '@/lib/server/policies';

export const metadata: Metadata = {
  title: 'Privacy policy | Maxicareer',
  description: 'How Maxicareer collects, uses and protects your personal information.',
};

// Always the text last published from Website > Policies in the admin portal.
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <PolicyPage policy="privacy" policies={await publishedPolicies()} />;
}
