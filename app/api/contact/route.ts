import { NextRequest } from 'next/server';
import { route, ok, fail, readJson, str } from '@/lib/server/http';
import { normaliseEmail, isValidEmail, rateLimit } from '@/lib/server/auth';
import { recordPublicLead } from '@/lib/server/students';
import { recordSubmission, type FormKind } from '@/lib/server/submissions';
import { sendMail } from '@/lib/server/mail';

export const dynamic = 'force-dynamic';

/** Consultation, service and enrolment enquiries from the public website. */
export const POST = route(async (req: NextRequest) => {
  rateLimit(req, 'contact', 10, 15 * 60_000);
  const data = await readJson<Record<string, any>>(req);
  const isRegistration = Boolean(data.planName || data.type === 'registration');
  const form: FormKind = data.form === 'service_request' ? 'service_request' : isRegistration ? 'program_registration' : 'contact';
  const name = str(data.name || data.fullName, 120) || 'Prospective student';
  const email = normaliseEmail(data.email);
  if (!isValidEmail(email)) return fail('Please enter a valid email address.');

  const service = str(data.serviceInterest || data.planName || data.serviceTitle, 200);
  const message = str(data.message || data.notes, 3000);
  const phone = str(data.phone, 40);
  const { student, created } = await recordPublicLead(
    {
      ...data,
      name,
      email,
      planName: data.planName || data.serviceInterest || 'General career consultation',
      planPrice: typeof data.price === 'number' ? data.price : 0,
      detail: message || service,
      notes: message ? `Message: ${message}` : `${form === 'service_request' ? 'Service request' : 'Consultation enquiry'} from the website.`,
      message: message || str(data.subject, 300),
    },
    isRegistration ? 'portal_registration' : 'quick_consultation'
  );

  await recordSubmission({
    form,
    name,
    email,
    phone,
    subject: form === 'service_request' ? service : str(data.subject, 300) || service,
    message,
    // Shown under "Details"; the service is already the subject of a service request.
    fields: form === 'service_request' ? { deliveryTime: data.deliveryTime } : { serviceInterest: service, planName: data.planName },
    studentId: student._id,
    notify: { id: created ? `auto-reg-${student._id}` : undefined, priority: 'high' },
  });

  const inbox = process.env.CONTACT_EMAIL;
  if (inbox) {
    const kind = form === 'service_request' ? 'Service' : isRegistration ? 'Enrolment' : 'Consultation';
    await sendMail({
      to: inbox,
      replyTo: email,
      subject: `${kind} request from ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, `Phone: ${phone || '—'}`, `Interest: ${service || '—'}`, '', message || '(no message)'].join('\n'),
    });
  }

  return ok({
    message: isRegistration
      ? `Thank you, ${name}! Your enrolment request for ${data.planName || 'the Maxicareer program'} has been registered. Our team will reach out within 24 hours.`
      : `Thank you, ${name}! Your request has been submitted. A Maxicareer mentor will contact you within 24 hours.`,
    data: { name, email, service, receivedAt: new Date().toISOString() },
  });
});
