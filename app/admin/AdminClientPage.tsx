'use client';

import React from 'react';
import { AdminPortal } from '@/src/components/AdminPortal';

/** The admin portal reads the signed-in staff member from the server session. */
export default function AdminClientPage() {
  return <AdminPortal />;
}
