import { NextRequest, NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { col, COLLECTIONS } from '@/lib/server/db';
import { requireStaff } from '@/lib/server/auth';
import type { StudentDoc } from '@/lib/server/students';

export const dynamic = 'force-dynamic';

export const GET = route(async (req: NextRequest) => {
  await requireStaff(req);
  const format = req.nextUrl.searchParams.get('format') || 'csv';
  const students = await (await col<StudentDoc>(COLLECTIONS.students)).find({}).sort({ createdAt: -1 }).toArray();

  if (format === 'json') {
    return new NextResponse(JSON.stringify(students, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="maxicareer_students_${Date.now()}.json"`,
      },
    });
  }

  const headers = ['Registration_ID', 'Name', 'Email', 'Phone', 'City', 'Cohort', 'Institution_or_Company', 'Background_Detail', 'Plan_Name', 'Fee_INR', 'Status', 'Assigned_Mentor', 'Assigned_Counsellor', 'Registration_Date', 'Source'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = students.map((s) =>
    [s._id, s.name, s.email, s.phone, s.city, s.professionLabel, s.institutionOrCompany, s.detail, s.planName, s.planPrice || 0, s.status, s.mentorAssigned, s.counselorAssigned || 'Unassigned', s.registeredDate, s.source].map(esc).join(',')
  );
  return new NextResponse('﻿' + [headers.join(','), ...rows].join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="maxicareer_students_${Date.now()}.csv"`,
    },
  });
});
