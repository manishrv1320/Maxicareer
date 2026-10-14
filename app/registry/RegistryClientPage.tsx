'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminPortal } from '@/src/components/AdminPortal';

/** The admin portal reads the signed-in staff member from the server session. */
export default function RegistryClientPage() {
  const router = useRouter();
  return <AdminPortal onBackToSite={() => router.push('/')} />;
}
