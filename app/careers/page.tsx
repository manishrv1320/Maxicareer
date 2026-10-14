import type { Metadata } from 'next';
import { CareersPage } from '@/src/components/CareersPage';

export const metadata: Metadata = {
  title: 'Careers | Maxicareer',
  description: 'Jobs and internships from Maxicareer and our hiring partners for students, freshers and working professionals.',
};

export default function Page() {
  return <CareersPage />;
}
