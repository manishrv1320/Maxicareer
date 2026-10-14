import { getDb, COLLECTIONS, nowIso, longDate } from './db';
import { hashPassword, type UserDoc, type StaffRole } from './auth';
import { audit } from './notify';
import type { StudentDoc, Profession } from './students';
import { DEMO_CRM_STUDENTS, DEMO_PLATFORM } from './demoData';

/**
 * Sample data for walkthroughs. Loaded and cleared from the admin portal; every
 * document is tagged `isDemo` so clearing never touches real records.
 */

export const DEMO_PASSWORD = 'password123';

/** Accounts used by the "quick demo login" buttons on the student portal. */
export const DEMO_STUDENT_LOGINS: Record<Profession, string> = {
  school: 'aarav.sharma@example.com',
  college: 'darshaniprachi@gmail.com',
  fresher: 'ananya.gupta@example.com',
  working_professional: 'rohan.verma@example.com',
};

const DEMO_STAFF: { email: string; name: string; staffRole: StaffRole; password: string }[] = [
  { email: 'admin@maxicareer.com', name: 'Admin', staffRole: 'Global admin', password: 'admin123' },
  { email: 'mentor@maxicareer.com', name: 'Lead Mentor', staffRole: 'Mentor', password: 'mentor123' },
];

/** Sample sign-ins shown on /login while sample data is loaded (never in production data). */
export const SAMPLE_LOGINS: { role: 'Student' | 'Counsellor' | 'Mentor' | 'Admin'; name: string; email: string; password: string; note: string }[] = [
  { role: 'Student', name: 'Darshani Prachi', email: DEMO_STUDENT_LOGINS.college, password: DEMO_PASSWORD, note: 'College student' },
  { role: 'Student', name: 'Aarav Sharma', email: DEMO_STUDENT_LOGINS.school, password: DEMO_PASSWORD, note: 'School student' },
  { role: 'Student', name: 'Ananya Gupta', email: DEMO_STUDENT_LOGINS.fresher, password: DEMO_PASSWORD, note: 'Fresher / PSW' },
  { role: 'Student', name: 'Rohan Verma', email: DEMO_STUDENT_LOGINS.working_professional, password: DEMO_PASSWORD, note: 'Working professional' },
  { role: 'Counsellor', name: 'Dr. Ananya Sen', email: 'ananya.sen@maxicareer.com', password: DEMO_PASSWORD, note: 'Counsellor workspace' },
  { role: 'Counsellor', name: 'Rajiv Menon', email: 'rajiv.menon@maxicareer.com', password: DEMO_PASSWORD, note: 'Counsellor workspace' },
  { role: 'Mentor', name: 'Karthik Raman', email: 'karthik.raman@example.com', password: DEMO_PASSWORD, note: 'Mentor workspace' },
];
for (const s of DEMO_STAFF) {
  SAMPLE_LOGINS.push({ role: 'Admin', name: s.name, email: s.email, password: s.password, note: s.staffRole === 'Global admin' ? 'Admin portal, all pages' : `Admin portal, ${s.staffRole.toLowerCase()} pages` });
}

// Old sample mentor names mapped onto the sample counsellors/mentors that actually exist.
const MENTOR_REMAP: Record<string, string> = {
  'Dr. Priya Nair': 'Dr. Ananya Sen',
  'Sneha Sen': 'Rajiv Menon',
  'Rajesh Kumar': 'Karthik Raman',
  'Amitav Ghosh': 'Rajiv Menon',
};

const PORTAL_STUDENT_EXTRAS: Record<string, Partial<StudentDoc>> = {
  'student-demo-darshani': {
    status: 'enrolled',
    mentorAssigned: 'Karthik Raman',
    counselorAssigned: 'Dr. Ananya Sen',
    city: 'Chennai, Tamil Nadu',
    headline: 'Final-year CSE student · aspiring data analyst',
    skills: ['SQL', 'Python', 'Power BI', 'Excel'],
    linkedinUrl: 'https://www.linkedin.com/in/darshani-prachi-sample',
  },
  'student-demo-aarav': { status: 'enrolled', mentorAssigned: 'Dr. Ananya Sen', city: 'New Delhi' },
  'student-demo-rohan': { status: 'enrolled', mentorAssigned: 'Karthik Raman', city: 'Bengaluru, Karnataka' },
};

const ANANYA_GUPTA: Record<string, any> = {
  id: 'student-demo-ananya',
  name: 'Ananya Gupta',
  email: 'ananya.gupta@example.com',
  phone: '+91 9811223344',
  profession: 'fresher',
  professionLabel: 'Fresher / PSW (2025/2026 Graduate)',
  institutionOrCompany: 'Delhi University / Coventry University UK',
  detail: 'Recent Graduate – Target: Business Analyst / Associate PM',
  planName: 'Step-In career program',
  planPrice: 15999,
  registeredDate: 'September 16, 2026',
  roadmapProgress: 40,
  authProvider: 'email',
  careerGoal: 'Business Analyst / Associate Product Manager',
  careerInterests: ['Business Analysis', 'Product Management', 'SQL & Dashboards'],
  assessmentStatus: 'in_progress',
  counselingSessionsCount: 0,
  pendingTasksCount: 0,
  completedTasksCount: 0,
};

const isoDaysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

function portalStudentToDoc(s: Record<string, any>): StudentDoc {
  const { id, ...rest } = s;
  const created = new Date(Date.parse(s.registeredDate) || Date.now()).toISOString();
  return {
    status: 'enrolled',
    mentorAssigned: 'Unassigned',
    notes: 'Sample student for demonstrations.',
    selectedAddOns: [],
    createdAt: created,
    updatedAt: created,
    source: 'synthetic_seed',
    ...rest,
    ...(PORTAL_STUDENT_EXTRAS[id] || {}),
    _id: id,
    isDemo: true,
  } as StudentDoc;
}

export async function loadDemoData(actor: string) {
  const db = await getDb();
  const C = COLLECTIONS;
  const pw = await hashPassword(DEMO_PASSWORD);
  const users = db.collection<UserDoc>(C.users);
  const counts: Record<string, number> = {};

  const upsertAll = async (name: string, docs: Record<string, any>[]) => {
    if (!docs.length) return;
    const res = await db.collection(name).bulkWrite(
      docs.map(({ _id, ...d }) => ({ updateOne: { filter: { _id }, update: { $setOnInsert: { ...d, isDemo: true } }, upsert: true } }))
    );
    counts[name] = res.upsertedCount;
  };
  const addUser = async (u: Omit<UserDoc, '_id' | 'createdAt' | 'isDemo'> & { _id?: string }) => {
    await users.updateOne(
      { email: u.email },
      { $setOnInsert: { _id: u._id || `user-${u.refId || u.email}`, ...u, isDemo: true, createdAt: nowIso() } as any },
      { upsert: true }
    );
  };

  // Counsellors & mentors, each with a login
  const providers = async (kind: 'counselor' | 'mentor', list: any[]) => {
    const docs = list.map(({ id, password, ...rest }) => ({ _id: id, userId: `user-${id}`, ...rest }));
    await upsertAll(kind === 'counselor' ? C.counselors : C.mentors, docs);
    for (const d of docs) {
      await addUser({ _id: d.userId, email: d.email.toLowerCase(), name: d.name, passwordHash: pw, role: kind, refId: d._id, status: d.approvalStatus === 'approved' ? 'active' : 'pending' });
    }
    await upsertAll(
      C.approvals,
      docs
        .filter((d) => d.approvalStatus === 'pending')
        .map((d) => ({ _id: `appr-${d._id}`, title: `${kind === 'counselor' ? 'Counsellor' : 'Mentor'} sign-up: ${d.name}`, requester: `${d.name} (${d.email})`, status: 'Pending', createdAt: nowIso(), kind, refId: d._id }))
    );
  };
  await providers('counselor', DEMO_PLATFORM.counselors);
  await providers('mentor', DEMO_PLATFORM.mentors);

  // Students with portal logins
  const portalStudents = [...DEMO_PLATFORM.students, ANANYA_GUPTA].map(portalStudentToDoc);
  await upsertAll(C.students, portalStudents.map((s) => ({ ...s, userId: `user-${s._id}` })));
  for (const s of portalStudents) {
    await addUser({ _id: `user-${s._id}`, email: s.email, name: s.name, passwordHash: pw, role: 'student', refId: s._id, status: 'active' });
  }

  // CRM-only sample registrations
  await upsertAll(
    C.students,
    DEMO_CRM_STUDENTS.map((s) => ({ ...s, mentorAssigned: MENTOR_REMAP[s.mentorAssigned] || s.mentorAssigned }))
  );

  // Counselling relationships
  const withIds = (list: any[]) => list.map(({ id, ...rest }) => ({ _id: id, ...rest }));
  await upsertAll(C.counselingRequests, withIds(DEMO_PLATFORM.counselingRequests));
  await upsertAll(
    C.appointments,
    withIds(DEMO_PLATFORM.appointments).map((a) => ({ ...a, meetingLink: a.meetingLink ? `https://meet.jit.si/maxicareer-${a._id.replace(/[^a-z0-9]/gi, '')}` : undefined }))
  );
  await upsertAll(C.sessionNotes, withIds(DEMO_PLATFORM.sessionNotes));
  await upsertAll(C.recommendations, withIds(DEMO_PLATFORM.recommendations));
  await upsertAll(C.followUpTasks, withIds(DEMO_PLATFORM.followUpTasks));
  await upsertAll(
    C.messages,
    withIds(DEMO_PLATFORM.messages).map((m, i) => ({
      ...m,
      createdAt: new Date(Date.parse(String(m.timestamp).replace(' – ', ' ')) || Date.now() - (100 - i) * 60_000).toISOString(),
    }))
  );
  await upsertAll(C.assessments, withIds(DEMO_PLATFORM.assessments));

  // Admin-scheduled sessions
  await upsertAll(C.mentoringSessions, [
    { _id: 'sess-demo-1', date: isoDaysFromNow(1), time: '16:00', studentName: 'Darshani Prachi', topic: 'Mock technical and HR interview', mentor: 'Dr. Ananya Sen', mode: 'Video call', status: 'Upcoming' },
    { _id: 'sess-demo-2', date: isoDaysFromNow(2), time: '18:30', studentName: 'Rohan Verma', topic: 'Career transition strategy', mentor: 'Karthik Raman', mode: 'Video call', status: 'Upcoming' },
    { _id: 'sess-demo-3', date: isoDaysFromNow(3), time: '17:00', studentName: 'Aarav Sharma', topic: 'Entrance exam strategy', mentor: 'Rajiv Menon', mode: 'Phone', status: 'Upcoming' },
  ]);

  await loadPortalSamples(upsertAll);

  // Staff logins for the admin portal
  for (const s of DEMO_STAFF) {
    await addUser({ _id: `user-demo-${s.email.split('@')[0]}`, email: s.email, name: s.name, passwordHash: await hashPassword(s.password), role: 'staff', staffRole: s.staffRole, status: 'active' });
  }

  await db.collection(C.settings).updateOne({ _id: 'demo_loaded' as any }, { $set: { value: true, updatedAt: nowIso() } }, { upsert: true });
  await audit(actor, 'Settings', 'Loaded sample data', longDate());
  return { inserted: counts };
}

/** Sample records for the portal features (events, tests, invoices, assignments…). */
async function loadPortalSamples(upsertAll: (name: string, docs: Record<string, any>[]) => Promise<void>) {
  const C = COLLECTIONS;
  const now = nowIso();
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  const thisMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  await upsertAll(C.events, [
    { _id: 'event-demo-1', title: 'Cracking your first analyst interview', type: 'Webinar', description: 'A live walkthrough of SQL and case questions with Q&A.', date: isoDaysFromNow(4), time: '18:00', durationMins: 60, mode: 'Online', link: 'https://meet.jit.si/maxicareer-webinar-analyst', audience: 'students', host: 'Karthik Raman', status: 'Published', createdAt: now },
    { _id: 'event-demo-2', title: 'Resume & LinkedIn clinic', type: 'Workshop', description: 'Bring your resume; mentors review it live in small groups.', date: isoDaysFromNow(9), time: '11:00', durationMins: 90, mode: 'Online', link: 'https://meet.jit.si/maxicareer-resume-clinic', audience: 'everyone', host: 'Maxicareer team', status: 'Published', createdAt: now },
    { _id: 'event-demo-3', title: 'Chennai campus career fair', type: 'Career fair', description: 'Meet hiring partners for internships and graduate roles.', date: isoDaysFromNow(16), time: '10:00', durationMins: 240, mode: 'In person', location: 'Maxicareer hub, T. Nagar, Chennai', audience: 'college', host: 'Maxicareer partnerships', status: 'Published', createdAt: now },
    { _id: 'event-demo-4', title: 'Mentor calibration meet', type: 'Other', description: 'Monthly sync for counsellors and mentors.', date: isoDaysFromNow(6), time: '19:00', durationMins: 45, mode: 'Online', link: 'https://meet.jit.si/maxicareer-mentor-sync', audience: 'staff', host: 'Admin team', status: 'Published', createdAt: now },
  ]);

  await upsertAll(C.tests, [
    {
      _id: 'test-demo-aptitude',
      title: 'Career aptitude quick check',
      description: 'Logical and numerical reasoning warm-up.',
      kind: 'Aptitude',
      cohort: 'all',
      durationMins: 10,
      passPercent: 60,
      attemptsAllowed: 2,
      dueDate: isoDaysFromNow(7),
      status: 'Published',
      createdAt: now,
      questions: [
        { id: 'q1', prompt: 'If 3 pens cost ₹45, how much do 7 pens cost?', options: ['₹95', '₹105', '₹115', '₹120'], answer: 1 },
        { id: 'q2', prompt: 'Which number comes next: 2, 6, 12, 20, 30, …?', options: ['36', '40', '42', '44'], answer: 2 },
        { id: 'q3', prompt: 'All analysts use SQL. Priya is an analyst. Which must be true?', options: ['Priya uses Python', 'Priya uses SQL', 'Everyone using SQL is an analyst', 'None of these'], answer: 1 },
        { id: 'q4', prompt: 'A task takes 4 people 6 days. How long for 8 people at the same rate?', options: ['2 days', '3 days', '4 days', '12 days'], answer: 1 },
        { id: 'q5', prompt: 'Which is the odd one out?', options: ['Excel', 'Power BI', 'Tableau', 'Photoshop'], answer: 3 },
      ],
    },
    {
      _id: 'test-demo-sql',
      title: 'SQL fundamentals',
      description: 'SELECT, JOIN and GROUP BY basics.',
      kind: 'Skill test',
      cohort: 'college',
      durationMins: 15,
      passPercent: 70,
      attemptsAllowed: 1,
      dueDate: isoDaysFromNow(12),
      status: 'Published',
      createdAt: now,
      questions: [
        { id: 'q1', prompt: 'Which clause filters rows after grouping?', options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], answer: 1 },
        { id: 'q2', prompt: 'Which join returns only matching rows from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], answer: 2 },
        { id: 'q3', prompt: 'COUNT(*) counts…', options: ['Non-null values in a column', 'All rows', 'Distinct rows', 'Columns'], answer: 1 },
        { id: 'q4', prompt: 'Which keyword removes duplicate rows from a result?', options: ['UNIQUE', 'DISTINCT', 'GROUP', 'ONLY'], answer: 1 },
      ],
    },
  ]);

  await upsertAll(C.curricula, [
    {
      _id: 'mod-demo-darshani',
      scope: 'student',
      cohort: 'all',
      studentId: 'student-demo-darshani',
      studentName: 'Darshani Prachi',
      title: 'Analyst interview sprint',
      description: 'Extra practice your counsellor added before your mock interviews.',
      weeks: '2 weeks',
      order: Date.parse(daysAgo(4)),
      lessons: [
        { id: 'lesson-demo-a1', title: '20 SQL interview questions', duration: '90 mins', type: 'Practice' },
        { id: 'lesson-demo-a2', title: 'Case study: retail sales dip', duration: '45 mins', type: 'Case' },
      ],
      status: 'Published',
      createdBy: 'counselor-demo-01',
      createdByName: 'Dr. Ananya Sen',
      createdAt: daysAgo(4),
    },
  ]);

  await upsertAll(C.resources, [
    { _id: 'res-demo-1', scope: 'cohort', cohort: 'all', title: 'STAR method answer template', description: 'Structure behavioural answers in four short parts.', kind: 'Template', url: 'https://www.themuse.com/advice/star-interview-method', sharedBy: 'admin', sharedByName: 'Maxicareer team', status: 'Published', createdAt: daysAgo(10) },
    { _id: 'res-demo-2', scope: 'cohort', cohort: 'college', title: 'SQL practice set (free)', description: 'Hands-on SQL exercises from beginner to joins.', kind: 'Worksheet', url: 'https://sqlbolt.com', sharedBy: 'admin', sharedByName: 'Maxicareer team', status: 'Published', createdAt: daysAgo(6) },
    { _id: 'res-demo-3', scope: 'student', cohort: 'all', studentId: 'student-demo-darshani', title: 'Analyst portfolio examples', description: 'Three portfolios to model yours on.', kind: 'Guide', url: 'https://www.mavenanalytics.io/blog/data-analyst-portfolio', sharedBy: 'counselor-demo-01', sharedByName: 'Dr. Ananya Sen', status: 'Published', createdAt: daysAgo(3) },
  ]);

  await upsertAll(C.invoices, [
    { _id: 'inv-demo-1', number: 'MC-SAMPLE-0001', studentId: 'student-demo-darshani', studentName: 'Darshani Prachi', studentEmail: 'darshaniprachi@gmail.com', kind: 'Enrolment', lines: [{ description: 'Step-Next career program', amount: 15999 }], total: 15999, status: 'Paid', issuedAt: daysAgo(40), dueDate: daysAgo(33).slice(0, 10), paidAt: daysAgo(38), paymentMethod: 'UPI', paymentReference: 'SAMPLE-UPI-2231' },
    { _id: 'inv-demo-2', number: 'MC-SAMPLE-0002', studentId: 'student-demo-darshani', studentName: 'Darshani Prachi', studentEmail: 'darshaniprachi@gmail.com', kind: 'Service', serviceId: 'svc-3', serviceName: '1:1 Mentor Coaching', lines: [{ description: '1:1 Mentor Coaching (60 minutes)', amount: 999 }], total: 999, status: 'Due', issuedAt: daysAgo(2), dueDate: isoDaysFromNow(5) },
  ]);

  await upsertAll(C.assignments, [
    { _id: 'asg-demo-1', studentId: 'student-demo-darshani', studentName: 'Darshani Prachi', counselorId: 'counselor-demo-01', counselorName: 'Dr. Ananya Sen', kind: 'Project', title: 'Sales dashboard in Power BI', description: 'Monthly sales by region with a drill-through page.', link: 'https://github.com/example/sales-dashboard', status: 'reviewed', grade: 'A-', feedback: 'Clear story. Add a one-line insight above each chart and a README with the data source.', submittedAt: daysAgo(8), reviewedAt: daysAgo(6) },
    { _id: 'asg-demo-2', studentId: 'student-demo-darshani', studentName: 'Darshani Prachi', counselorId: 'counselor-demo-01', counselorName: 'Dr. Ananya Sen', kind: 'Assignment', title: 'Updated resume draft', description: 'Rewrote bullets with numbers as discussed.', link: 'https://docs.google.com/document/d/sample', status: 'submitted', submittedAt: daysAgo(1) },
  ]);

  await upsertAll(C.feedback, [
    { _id: 'fb-demo-1', fromId: 'student-demo-darshani', fromName: 'Darshani Prachi', fromRole: 'student', about: 'Counsellor', targetId: 'counselor-demo-01', targetName: 'Dr. Ananya Sen', rating: 5, comment: 'Very practical advice, and the roadmap is easy to follow.', createdAt: daysAgo(5) },
  ]);

  await upsertAll(C.certificates, [
    { _id: 'cert-demo-1', studentId: 'student-demo-darshani', studentName: 'Darshani Prachi', title: 'Certificate of Achievement', program: 'Career Discovery Assessment', description: 'for completing the Maxicareer career discovery assessment with distinction.', issuedOn: daysAgo(20).slice(0, 10), certificateNo: 'MC-CERT-SAMPLE-01', issuedBy: 'Maxicareer', createdAt: daysAgo(20) },
  ]);

  await upsertAll(C.payouts, [
    { _id: 'payout-demo-1', providerId: 'counselor-demo-01', providerName: 'Dr. Ananya Sen', providerKind: 'counselor', period: lastMonth, sessions: 12, hours: 10, amount: 18000, method: 'Bank transfer', reference: 'SAMPLE-NEFT-8812', status: 'Paid', paidOn: daysAgo(8).slice(0, 10), createdAt: daysAgo(9) },
    { _id: 'payout-demo-2', providerId: 'counselor-demo-01', providerName: 'Dr. Ananya Sen', providerKind: 'counselor', period: thisMonth, sessions: 5, hours: 4.5, amount: 7500, method: 'Bank transfer', reference: '', status: 'Pending', createdAt: daysAgo(1) },
    { _id: 'payout-demo-3', providerId: 'mentor-demo-01', providerName: 'Karthik Raman', providerKind: 'mentor', period: lastMonth, sessions: 6, hours: 6, amount: 9000, method: 'UPI', reference: 'SAMPLE-UPI-5521', status: 'Paid', paidOn: daysAgo(7).slice(0, 10), createdAt: daysAgo(8) },
  ]);

  await upsertAll(C.expenses, [
    { _id: 'exp-demo-1', source: 'company', date: daysAgo(12).slice(0, 10), category: 'Software', amount: 4200, description: 'Video meeting and scheduling tools', vendor: 'Sample vendor', status: 'Recorded', createdAt: daysAgo(12) },
    { _id: 'exp-demo-2', source: 'company', date: daysAgo(4).slice(0, 10), category: 'Marketing', amount: 12500, description: 'Campus fair stall booking', vendor: 'Sample events co.', status: 'Recorded', createdAt: daysAgo(4) },
    { _id: 'exp-demo-3', source: 'provider', providerId: 'counselor-demo-01', providerName: 'Dr. Ananya Sen', date: daysAgo(3).slice(0, 10), category: 'Travel', amount: 640, description: 'Cab to the campus workshop', status: 'Submitted', createdAt: daysAgo(3) },
  ]);

  await upsertAll(C.workLogs, [
    { _id: 'work-demo-1', providerId: 'counselor-demo-01', providerName: 'Dr. Ananya Sen', date: daysAgo(2).slice(0, 10), hours: 1.5, activity: 'Review', studentId: 'student-demo-darshani', studentName: 'Darshani Prachi', notes: 'Reviewed dashboard project', createdAt: daysAgo(2) },
    { _id: 'work-demo-2', providerId: 'counselor-demo-01', providerName: 'Dr. Ananya Sen', date: daysAgo(5).slice(0, 10), hours: 2, activity: 'Session prep', notes: 'Prepared mock interview questions', createdAt: daysAgo(5) },
    { _id: 'work-demo-3', providerId: 'mentor-demo-01', providerName: 'Karthik Raman', date: daysAgo(1).slice(0, 10), hours: 1, activity: 'Mentoring', notes: 'Async feedback on SQL practice', createdAt: daysAgo(1) },
  ]);

  await upsertAll(C.careers, [
    { _id: 'career-demo-1', title: 'Career Counsellor (part-time)', company: 'Maxicareer', location: 'Chennai / Remote', workMode: 'Hybrid', type: 'Part-time', department: 'Counselling', experience: '3+ years in career guidance', salary: '', description: 'Guide students and early professionals through 1-on-1 sessions and structured roadmaps.', requirements: ['Experience counselling students or professionals', 'Excellent spoken English and Tamil or Hindi', 'Comfortable running video sessions'], applyEmail: 'contact@maxicareer.com', status: 'Published', createdAt: daysAgo(6), updatedAt: daysAgo(6) },
    { _id: 'career-demo-2', title: 'Data Analyst Intern', company: 'Sample partner company', location: 'Bengaluru', workMode: 'On-site', type: 'Internship', department: 'Analytics', experience: 'Final-year students', salary: '₹20,000 / month', description: 'Six-month internship building dashboards for sales and operations teams.', requirements: ['SQL and Excel', 'Any BI tool (Power BI / Tableau)', 'Available for 6 months'], applyUrl: 'https://example.com/careers/data-analyst-intern', deadline: isoDaysFromNow(20), status: 'Published', createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  ]);
}

export async function clearDemoData(actor: string) {
  const db = await getDb();
  const C = COLLECTIONS;
  const demoUsers = await db.collection<UserDoc>(C.users).find({ isDemo: true }, { projection: { _id: 1 } }).toArray();
  await db.collection(C.authSessions).deleteMany({ userId: { $in: demoUsers.map((u) => u._id) } });
  const removed: Record<string, number> = {};
  for (const name of Object.values(C)) {
    if (name === C.authSessions || name === C.settings) continue;
    const res = await db.collection(name).deleteMany({ isDemo: true });
    if (res.deletedCount) removed[name] = res.deletedCount;
  }
  await db.collection(C.settings).updateOne({ _id: 'demo_loaded' as any }, { $set: { value: false, updatedAt: nowIso() } }, { upsert: true });
  await audit(actor, 'Settings', 'Cleared sample data', longDate());
  return { removed };
}
