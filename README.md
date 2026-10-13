# MaxiCareer — Career Guidance & Mentorship Platform

> **"Your Career Journey Starts with the Right Guidance."**

MaxiCareer is a career guidance and mentorship landing website designed for students and aspiring professionals seeking structured roadmaps, skill development, 1-on-1 mentorship, and dedicated career placement support.

---

## 🚀 Live Preview & Quick Start

### 1. Installation
```bash
npm install
cp .env.example .env.local   # then set MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, AZURE_STORAGE_CONNECTION_STRING
```

### 2. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 3. Production Build
```bash
npm run build
```

---

## 📁 Project Structure

```text
/
├── .env.example                # Documented environment variables
├── index.html                  # HTML entry point, SEO metadata & Google Fonts
├── metadata.json               # Applet metadata configuration
├── package.json                # Dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration with /api/contact handler
├── public/
│   └── images/
│       ├── maxicareer-logo.png # Official brand logo (transparent PNG)
│       ├── maxicareer-logo.svg # Scalable vector brand logo
│       ├── maxicareer-icon.svg # Brand icon badge & favicon
│       ├── hero-illustration.svg # Hero roadmap vector visual
│       ├── mentor-illustration.svg # Mentorship collaborative visual
│       └── student-illustration.svg # Student milestone visual
└── src/
    ├── App.tsx                 # Main application landing page orchestrator
    ├── index.css               # Tailwind CSS, theme colors, reduced-motion rules
    ├── main.tsx                # React DOM root entry
    ├── components/
    │   ├── AnimatedBackground.tsx # Subtle floating ambient light blobs
    │   ├── Navbar.tsx             # Sticky responsive navigation & mobile menu
    │   ├── Hero.tsx               # Hero banner with trust pills and CTAs
    │   ├── AboutSection.tsx       # About MaxiCareer and 3 core pillar cards
    │   ├── ServicesSection.tsx    # 4 core services with interactive modal details
    │   ├── ServiceDetailModal.tsx # Full curriculum & deliverables detail modal
    │   ├── WhyChooseUs.tsx        # 2-column layout with 6 core advantages
    │   ├── HowItWorks.tsx         # 3-step numbered roadmap timeline
    │   ├── BenefitsSection.tsx    # 6 tangible outcome benefit cards
    │   ├── Testimonials.tsx       # Student feedback cards (sample demo labeled)
    │   ├── CTASection.tsx         # High-contrast action banner
    │   ├── ContactSection.tsx     # Validated consultation form & API integration
    │   ├── Footer.tsx             # Brand footer, privacy & terms modals
    │   ├── ScrollToTop.tsx        # Floating return-to-top button
    │   └── SectionHeading.tsx     # Reusable typography heading component
    ├── lib/
    │   ├── utils.ts               # Smooth scroll and helper utilities
    │   └── validations.ts         # Zod schema definitions for form inputs
    └── types/
        └── index.ts               # Shared TypeScript interfaces and types
```

---

## 🎨 Color Palette

- **Deep Navy:** `#0F172A`
- **Professional Blue:** `#2563EB`
- **Sky Blue:** `#38BDF8`
- **Light Blue:** `#EFF6FF`
- **White:** `#FFFFFF`
- **Soft Background:** `#F8FAFC`
- **Dark Text:** `#1E293B`

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill it in. The full list with comments is in `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas `mongodb+srv://…` works). |
| `MONGODB_DB_NAME` | No | Database name. Default `maxicareer`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First run | Creates the first administrator if the database has none. Changing them later does nothing; change passwords from the app instead. |
| `AZURE_STORAGE_CONNECTION_STRING` | For uploads | Azure Storage account connection string. Without it, uploads return "File storage is not configured". |
| `AZURE_STORAGE_CONTAINER` | No | Blob container name. Default `maxicareer-uploads`; created automatically as **private**. |
| `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_EMAIL` | No | Email sign-in codes and enquiry alerts through [Resend](https://resend.com). Without a key, emails are logged to the server console. |
| `ENABLE_DEMO_LOGIN` | No | Set `false` to disable one-click sample student sign-in. |

## 🔌 Backend: MongoDB + Azure Blob

Every dashboard reads and writes the same MongoDB database through the Next.js API routes in `app/api`. Nothing shared is kept in the browser any more.

| URL | Who | What |
| --- | --- | --- |
| `/login`, `/signup` | Everyone | One sign-in and sign-up page for every role. After signing in, students go to the student portal, counsellors and mentors to `/portal`, staff to `/admin`. Signed-out visits to any dashboard come here. While sample data is loaded it lists the sample accounts. |
| `/` | Students | Public site and the student portal (vertical menu, see below). |
| `/portal` | Counsellors & mentors | Sign-up (pending until an admin approves), sign-in, and their workspace (vertical menu). |
| `/careers` | Everyone | Job and internship openings published from the admin **Career page**. |
| `/admin` | Staff | Admin portal. Pages shown depend on the staff role (set in **Page access**). |

**How the dashboards connect**

- A student books a counsellor or mentor → it appears in that counsellor's **Requests** and in the admin **Sessions** page; accepting it creates an appointment with a [Jitsi](https://meet.jit.si) video link and notifies the student.
- Counsellors' session notes, tasks and recommendations show up on the student's dashboard; students can tick off tasks and reply in **Messages** (with file attachments).
- Admin actions flow out: assigning a mentor or confirming enrolment notifies the student and adds them to that counsellor's caseload; personal roadmaps built in **Roadmaps** appear on the student dashboard; broadcasts from **Notifications** land in student/staff inboxes.
- Counsellor and mentor sign-ups create an item in **Approvals** and **Counsellors**; approving it unlocks their login and lists them in the public directory.
- **User management** creates real staff logins with one-time passwords (hashed; staff must change them on first sign-in). Counsellor/Mentor staff accounts also get a `/portal` workspace.

**Files (Azure Blob Storage)** are uploaded through `POST /api/files` and served through `GET /api/files/:id`, which checks access and redirects to a 10-minute SAS link. Profile photos and website images are public; chat attachments are visible only to the sender, the recipient and staff.

**Auth** uses scrypt-hashed passwords and an httpOnly session cookie (`mc_session`, 14 days, stored in `auth_sessions`). The cookie is `Secure` in production, so serve the site over **HTTPS**. Login is rate-limited per IP and per account (in memory, so per server instance).

**Sample data**: an admin can load and remove clearly-marked sample records from **Settings → Sample data** (or the bar at the top of `/portal`). Clearing removes only sample records. Sample accounts use `password123`; sample staff use `admin@maxicareer.com` / `admin123` and `mentor@maxicareer.com` / `mentor123`. Don't leave sample data loaded on a public site.

**Moving from the old browser-only version**: data an earlier version saved in an admin's browser (applications, roadmaps, sessions, audit log, website drafts…) can be imported from **Settings → Data saved in this browser**.

### Dashboards

The student portal and the counsellor/mentor workspace use the same collapsible vertical sidebar as the admin portal (`src/components/workspace/WorkspaceShell.tsx`), with a page finder (Ctrl K), notifications and the account menu.

**Student portal** (`src/components/StudentDashboard.tsx`, pages in `src/components/student/`)

| Group | Pages |
| --- | --- |
| Overview | **Dashboard**: assigned mentor and counsellor, my program, progress, book a meeting (mentor, counsellor or the admin team), Your Personal Plan, up next · **Notifications** |
| Learning | **Curriculum & syllabus** (modules from the admin and from the student's mentor/counsellor) · **Tasks & assignments** (tasks plus file/link uploads, grades and feedback) · **Courses & tests** (timed tests marked on the server) · **Resources** · **Milestones & certificates** (badges, printable certificates) |
| Guidance | **1-on-1 sessions** (upcoming, history with notes, proctoring summary per mentor/counsellor/admin) · **Calendar** (sessions, due dates, tests, targets, events, invoices, plus the student's own notes/reminders/targets) · **Chat** · **Upcoming events** |
| Career & account | **Profile & resume** (headline, skills, LinkedIn/GitHub/portfolio, resume shared with the mentor and counsellor) · **Add a service** · **Invoices** (“I have paid” with the transaction reference) · **Renewal** |
| Help | **Support** · **Feedback** · **Tutorials** |

Recommendations are no longer shown to students.

**Counsellor / mentor workspace** (`/portal`, pages in `src/components/provider/`): Dashboard, Notifications, Calendar (with personal notes, reminders, to-dos and days off), My mentees (tasks, submissions, tests, add a personal syllabus module, share a resource), 1-on-1 sessions (requests, upcoming, completed with notes), Appointment availability (days, time slots, session length, days off), Pending tasks, Session notes, Projects & assignments (review and grade), Follow-ups, Chat, Report analysis, Work hours (completed sessions counted automatically plus a manual log, CSV export), Payment history, Expenditure (claims with receipts), Profile and Support.

**Admin additions**: *Learning* — Curriculum & resources (syllabus modules per cohort, resource library with uploads), Assessments (multiple-choice test builder, results with “allow retake”, certificates), Events. *Operations* — Feedback; Sessions has a “Student requests” tab for meetings students book with the admin team. *Finance* — Payments (invoices, payment verification, payouts, renewal pricing and payment instructions) and Expenditure (company expenses, provider claims, work-hours summary). *Website* — Career page (openings shown at `/careers`). The student drawer has a Counsellor assignment next to Mentor.

**How the new pieces connect**

- Admins assign each student a **mentor** and a **counsellor**; both see the student, can message them and review their work.
- A student's submission goes to the task's author (or their mentor); the review, grade and feedback come back as a notification.
- Buying a service or requesting a renewal creates an **invoice**. When an admin marks it **Paid** in Payments, a service is added to the student's add-ons and a renewal extends `programEndsAt` (program access defaults to one year from registration).
- Tests are created in the admin **Assessments** page; students never receive the answer key and results land in the `assessments` collection, visible to their mentor and counsellor. Deleting a result gives the student another attempt.
- Counsellors and mentors set their **availability** (days, time slots, days off); student booking only offers those days.
- Counsellors and mentors log **work hours** and **expense claims**; admins approve claims in **Expenditure** and record **payouts**, which show in the provider's **Payment history**.
- Student meeting requests with the admin team appear in the admin **Sessions** page; confirming, moving or cancelling them notifies the student.

### MongoDB collections

`users`, `auth_sessions`, `otp_codes`, `students`, `counselors`, `mentors`, `counseling_requests`, `appointments`, `session_notes`, `recommendations`, `follow_up_tasks`, `messages`, `assessments`, `user_notifications`, `support_tickets`, `files`, `settings`, plus admin data: `admin_notifications`, `audit_logs`, `applications`, `roadmap_templates`, `student_roadmaps`, `approvals`, `mentoring_sessions`, `managed_users`, `services`, `broadcasts`, and for the portal features: `assignments`, `calendar_notes`, `invoices`, `payouts`, `expenses`, `work_logs`, `feedback`, `events`, `tests`, `certificates`, `careers`, `curricula`, `resources`. Indexes are created automatically on first connection. Server actions for these live in `lib/server/portal.ts`; admin edits go through `/api/admin/data/<key>` (`invoices`, `payouts`, `expenses`, `worklogs` (read-only), `curricula`, `resources`, `tests`, `results`, `certificates`, `events`, `feedback`, `careers`).

---

## 🚢 Deployment Instructions

### GitHub Repository
```bash
git init
git add .
git commit -m "feat: Initial commit of MaxiCareer website"
git branch -M main
git remote add origin https://github.com/<your-username>/maxicareer.git
git push -u origin main
```

### Vercel Deployment
1. Connect your GitHub account at [Vercel](https://vercel.com).
2. Click **New Project** and import `maxicareer`.
3. Framework Preset: Next.js (the API routes need a Node.js server; a static Vite export has no backend).
4. Add the environment variables from `.env.example` in the project settings.
5. Click **Deploy**. On Azure App Service or any Node host, run `npm run build` then `npm start`.

---

## ✨ Implemented Features

1. **Sticky Header & Mobile Drawer:** Transparent-to-glassmorphism transitions, animated hamburger drawer, active section highlights.
2. **Official Logo Integration:** Standardized at `public/images/maxicareer-logo.png` with auto-fallback to SVG vector.
3. **Interactive Hero Section:** Clear value proposition, trust pill indicators, direct action buttons.
4. **Interactive Services & Detail Modals:** 4 comprehensive service cards with roadmap exploration modals and direct booking triggers.
5. **Timeline Stepper:** 3-step progressive numbered guide with connected timeline accents.
6. **Robust Consultation Form:** Built with Zod validation, required field checks, email format validation, loading state, error alerts, and success confirmations.
7. **Production API Route:** `POST /api/contact` handling with mock log simulation and production email webhook readiness.
8. **Accessibility & Reduced Motion:** Full `prefers-reduced-motion` compliance, keyboard-friendly focus rings, ARIA labels, semantic markup.
9. **Zero Dead Links:** Every button and anchor scrolls or opens its corresponding section or modal.
#   M a x i c a r e e r  
 