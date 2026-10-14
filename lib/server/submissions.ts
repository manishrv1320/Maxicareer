import { col, COLLECTIONS, newId, nowIso } from './db';
import { str } from './http';
import { notifyAdmins } from './notify';

/**
 * Every form filled on the website or portal lands here as well as in its own workflow
 * (students, approvals, support tickets), so admins have one inbox with the full details.
 */

export type FormKind =
  | 'contact'
  | 'service_request'
  | 'program_registration'
  | 'student_signup'
  | 'counsellor_signup'
  | 'mentor_signup'
  | 'support_request';

export const FORM_LABEL: Record<FormKind, string> = {
  contact: 'Contact form',
  service_request: 'Service request',
  program_registration: 'Program registration',
  student_signup: 'Student sign-up',
  counsellor_signup: 'Counsellor sign-up',
  mentor_signup: 'Mentor sign-up',
  support_request: 'Support request',
};

export type SubmissionStatus = 'New' | 'Contacted' | 'Closed';

export interface FormSubmissionDoc {
  _id: string;
  form: FormKind;
  formLabel: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Every other field the person filled in, as readable label/value pairs. */
  details: { label: string; value: string }[];
  studentId?: string;
  status: SubmissionStatus;
  adminNote: string;
  createdAt: string;
}

const LABELS: Record<string, string> = {
  serviceInterest: 'Service',
  subject: 'Subject',
  city: 'City',
  professionLabel: 'Cohort',
  institutionOrCompany: 'School / college / company',
  planName: 'Program',
  selectedAddOns: 'Focus areas',
  currentLevel: 'Current level',
  targetGoal: 'Target goal',
  supportType: 'Support type',
  duration: 'Duration',
  preferredContact: 'Preferred contact',
  detail: 'Summary',
  notes: 'Notes',
  company: 'Company',
  role: 'Role',
  domain: 'Domain',
  qualification: 'Qualification',
  experienceYears: 'Years of experience',
  specializations: 'Specialisations',
  languages: 'Languages',
  bio: 'About',
  category: 'Category',
  priority: 'Priority',
  deliveryTime: 'Turnaround',
};

// Contact fields have their own columns; the rest is internal or must never be stored.
const SKIP = new Set([
  'name', 'fullName', 'email', 'phone', 'subject', 'message', 'form', 'type', 'source', 'status',
  'mentorAssigned', 'planPrice', 'price', 'profession', 'action',
]);
const SECRET = /pass|token|otp|secret|captcha/i;

// camelCase / snake_case keys become sentence case: "preferredStartDate" → "Preferred start date".
const labelFor = (key: string) =>
  LABELS[key] ||
  key
    .replace(/([a-z])([A-Z])/g, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`)
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

function displayValue(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => displayValue(x)).filter(Boolean).join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (typeof v === 'string') return v.trim();
  return '';
}

/** Turns loosely-typed form input into label/value rows, one level of nesting deep. */
export function describeFields(fields: Record<string, unknown> = {}) {
  const rows: { label: string; value: string }[] = [];
  const seen = new Set<string>();
  const add = (key: string, v: unknown) => {
    if (SKIP.has(key) || SECRET.test(key)) return;
    const value = str(displayValue(v), 2000);
    const label = labelFor(key);
    if (!value || seen.has(label)) return;
    seen.add(label);
    rows.push({ label, value });
  };
  for (const [key, v] of Object.entries(fields)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) add(k2, v2);
    } else {
      add(key, v);
    }
    if (rows.length >= 40) break;
  }
  return rows;
}

/**
 * Saves a form submission and tells the admins about it. Never throws: the form's own
 * record is already saved, and a failure here shouldn't make the person submit twice.
 */
export async function recordSubmission(input: {
  form: FormKind;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  fields?: Record<string, unknown>;
  studentId?: string;
  /** false: the caller already notifies admins. `id` reuses an existing notification id. */
  notify?: false | { id?: string; priority?: 'normal' | 'high' };
}) {
  try {
    const doc: FormSubmissionDoc = {
      _id: newId('form'),
      form: input.form,
      formLabel: FORM_LABEL[input.form],
      name: str(input.name, 120) || 'Unknown',
      email: str(input.email, 200).toLowerCase(),
      phone: str(input.phone, 40),
      subject: str(input.subject, 300),
      message: str(input.message, 5000),
      details: describeFields(input.fields),
      studentId: input.studentId || undefined,
      status: 'New',
      adminNote: '',
      createdAt: nowIso(),
    };
    await (await col<FormSubmissionDoc>(COLLECTIONS.formSubmissions)).insertOne(doc);

    if (input.notify !== false) {
      const isProvider = input.form === 'counsellor_signup' || input.form === 'mentor_signup';
      await notifyAdmins({
        id: input.notify?.id,
        title: `${doc.formLabel}: ${doc.name}`,
        body: [doc.subject, doc.email, doc.phone].filter(Boolean).join(' · '),
        category: isProvider ? 'approvals' : 'students',
        priority: input.notify?.priority || (input.form === 'contact' || input.form === 'service_request' ? 'high' : 'normal'),
        link: 'submissions',
      });
    }
    return doc._id;
  } catch (err) {
    console.error('[submissions] Could not record form submission:', err);
    return null;
  }
}
