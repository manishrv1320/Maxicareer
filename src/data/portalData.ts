import { PricingPlan, UserProfession, StudentProfile, AddOnService } from '../types';

export const OFFICIAL_PHONE = '+91 9789730097';
export const OFFICIAL_PHONE_DIGITS = '919789730097';
export const OFFICIAL_EMAIL = 'contact@maxicareer.com';
export const SECONDARY_EMAIL = 'maxicareer1@gmail.com';

export const PROFESSION_OPTIONS: {
  id: UserProfession;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'working_professional',
    title: 'Working Professionals',
    subtitle: 'Career transition, Go next!',
    badge: '0–10+ Years Exp',
    description:
      'Step-Up career program for strategic pivots, executive resume, LinkedIn optimization, interview prep, and industry expert networking.',
  },
  {
    id: 'fresher',
    title: 'Freshers/ PSW',
    subtitle: 'Understand your career, get your job!',
    badge: 'Fresh Grad / PSW',
    description:
      'Step-In career program tailored for fresh graduates and post-study work visa holders seeking high-trajectory employment.',
  },
  {
    id: 'college',
    title: 'College Students',
    subtitle: 'Plan Ahead, Step into Success!',
    badge: 'Undergrads & Grads',
    description:
      'Step-Next career program covering internships, approaching universities, networking, and comprehensive placement mastery.',
  },
  {
    id: 'school',
    title: 'School Students',
    subtitle: 'Discover Your Path, Be Future-Ready!',
    badge: 'Grades 9–12',
    description:
      'Step-Ready career program to discover career paths, study abroad guidance, entrance/board exam approaches, and time management.',
  },
];

/**
 * Add-On services matching exact content from Image 1:
 * - Professional Resume Writing (₹ 5500)
 * - LinkedIn Profile Optimization (₹ 2500)
 * - Custom Cover Letter Writing (₹ 1500)
 * - 1:1 Career Counseling Session (₹ 3000)
 */
export const ADD_ON_SERVICES: AddOnService[] = [
  {
    id: 'resume-writing',
    title: 'Professional Resume Writing',
    price: 0,
    priceFormatted: 'Fee on Consultation',
    description: 'ATS-friendly resume crafted by experts!',
    deliveryTime: 'Delivery: 1 to 3 days',
    isScheduleBased: false,
    features: [
      'ATS-friendly structure crafted by recruitment experts',
      'Keyword-optimized for top hiring software',
      'Delivered in editable Word and polished PDF formats',
      'Direct revisions with senior career consultant',
    ],
  },
  {
    id: 'linkedin-optimization',
    title: 'LinkedIn Profile Optimization',
    price: 0,
    priceFormatted: 'Fee on Consultation',
    description: 'Boost your LinkedIn presence & attract recruiters!',
    deliveryTime: 'Delivery: 1 to 3 days',
    isScheduleBased: false,
    features: [
      'Search-optimized headline, summary & experience copy',
      'Strategic featured section & key skills placement',
      'Recruiter attraction strategy and outreach advice',
      'Full profile review and personal branding guide',
    ],
  },
  {
    id: 'cover-letter-writing',
    title: 'Custom Cover Letter Writing',
    price: 0,
    priceFormatted: 'Fee on Consultation',
    description: 'Personalized cover letter tailored to your job application!',
    deliveryTime: 'Delivery: 1 to 3 days',
    isScheduleBased: false,
    features: [
      'Tailored specifically to your target role and company',
      'Persuasive value proposition highlighting strengths',
      'Addresses career pivots, transitions, or gaps seamlessly',
      'Ready to submit in Word and PDF formats',
    ],
  },
  {
    id: 'career-counseling-session',
    title: '1:1 Career Counseling Session',
    price: 0,
    priceFormatted: 'Fee on Consultation',
    description: 'Personalized career guidance from experts!',
    deliveryTime: 'Scheduled as per availability',
    isScheduleBased: true,
    features: [
      'Private 1-on-1 virtual strategy consultation',
      'Direct guidance on career choices, roles & salary benchmarks',
      'Live question-and-answer session with industry veteran',
      'Flexible scheduling coordinated via WhatsApp / Email',
    ],
  },
];

/**
 * Career Programs matching exact image 2 columns:
 * Working Professionals | Freshers/ PSW | College Students | School Students
 */
export const CAREER_PROGRAMS_LIST: PricingPlan[] = [
  {
    id: 'program-working-professionals',
    profession: 'working_professional',
    cohortBadge: 'Working Professionals',
    name: 'Step-Up career program',
    price: 19999,
    originalPrice: 35999,
    launchOffer: true,
    popular: true,
    tagline: 'Career transition, Go next!',
    recommendedFor: 'Working professionals aiming for career advancement or role pivot',
    features: [
      'Find your career Path',
      'Resume',
      'Linkedin Optimization',
      'Cover Letter',
      'Interview Preparation',
      'Networking with Industry Experts',
    ],
  },
  {
    id: 'program-freshers-psw',
    profession: 'fresher',
    cohortBadge: 'Freshers/ PSW',
    name: 'Step-In career program',
    price: 15999,
    originalPrice: 35999,
    launchOffer: true,
    popular: true,
    tagline: 'Understand your career, get your job!',
    recommendedFor: 'Fresh graduates & post-study work job seekers entering industry',
    features: [
      'Find your career Path',
      'Resume',
      'Linkedin Optimization',
      'Cover Letter',
      'Interview Preparation',
      'Networking with Industry Experts',
    ],
  },
  {
    id: 'program-college-students',
    profession: 'college',
    cohortBadge: 'College Students',
    name: 'Step-Next career program',
    price: 15999,
    originalPrice: 35999,
    launchOffer: true,
    tagline: 'Plan Ahead, Step into Success!',
    recommendedFor: 'Undergraduate and postgraduate students preparing for placements',
    features: [
      'Internship Guidance',
      'How to approach Universities?',
      'Networking',
      'Resume',
      'Cover Letter',
      'Interview Preparation',
      'Networking with Industry Experts',
    ],
  },
  {
    id: 'program-school-students',
    profession: 'school',
    cohortBadge: 'School Students',
    name: 'Step-Ready career program',
    price: 13999,
    originalPrice: 19999,
    launchOffer: true,
    tagline: 'Discover Your Path, Be Future-Ready!',
    recommendedFor: 'Class 9th to 12th students establishing future career roadmaps',
    features: [
      'What to choose next?',
      'Study abroad guidance',
      'How to approach exams',
      'Time management',
    ],
  },
];

export const PRICING_PLANS: Record<UserProfession, PricingPlan[]> = {
  working_professional: [
    CAREER_PROGRAMS_LIST[0],
  ],
  fresher: [
    CAREER_PROGRAMS_LIST[1],
  ],
  college: [
    CAREER_PROGRAMS_LIST[2],
  ],
  school: [
    CAREER_PROGRAMS_LIST[3],
  ],
};

export const DEMO_STUDENT_PROFILES: Record<UserProfession, StudentProfile> = {
  school: {
    id: 'school-demo-01',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 9876543210',
    profession: 'school',
    professionLabel: 'School Student (Class 11th - PCM)',
    institutionOrCompany: 'Delhi Public School',
    detail: 'Class 11 • Target: Computer Science / Engineering',
    planName: 'Step-Ready career program',
    planPrice: 13999,
    registeredDate: 'September 12, 2026',
    roadmapProgress: 65,
    authProvider: 'email',
  },
  college: {
    id: 'college-demo-02',
    name: 'Darshani Prachi',
    email: 'darshaniprachi@gmail.com',
    phone: '+91 9789730097',
    profession: 'college',
    professionLabel: 'College Student (Final Year B.Tech CSE)',
    institutionOrCompany: 'National Institute of Technology',
    detail: 'Final Year CSE • Target: Software Development Engineer (SDE)',
    planName: 'Step-Next career program',
    planPrice: 15999,
    registeredDate: 'September 15, 2026',
    roadmapProgress: 78,
    authProvider: 'google',
  },
  fresher: {
    id: 'fresher-demo-03',
    name: 'Ananya Gupta',
    email: 'ananya.gupta@example.com',
    phone: '+91 9811223344',
    profession: 'fresher',
    professionLabel: 'Fresher / PSW (2025/2026 Graduate)',
    institutionOrCompany: 'Delhi University / Coventry University UK',
    detail: 'Recent Graduate • Target: Business Analyst / Associate PM',
    planName: 'Step-In career program',
    planPrice: 15999,
    registeredDate: 'September 16, 2026',
    roadmapProgress: 70,
    authProvider: 'email',
  },
  working_professional: {
    id: 'pro-demo-04',
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '+91 9988776655',
    profession: 'working_professional',
    professionLabel: 'Working Professional (Associate Consultant)',
    institutionOrCompany: 'Accenture Solutions',
    detail: '3 Years Experience • Target: Product Manager in Tech',
    planName: 'Step-Up career program',
    planPrice: 19999,
    registeredDate: 'September 10, 2026',
    roadmapProgress: 82,
    authProvider: 'email',
  },
};

export interface RoadmapStep {
  id: string;
  stepNumber: string;
  title: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  description: string;
  actionLabel?: string;
}

export const ROADMAP_DATA: Record<UserProfession, RoadmapStep[]> = {
  school: [
    {
      id: 'sc-1',
      stepNumber: '01',
      title: 'Aptitude & Strengths Assessment',
      status: 'completed',
      description: 'Discovered strong analytical and creative reasoning competencies.',
    },
    {
      id: 'sc-2',
      stepNumber: '02',
      title: 'Stream & Subject Finalization',
      status: 'completed',
      description: 'Aligned stream choices with competitive entrance prerequisites.',
    },
    {
      id: 'sc-3',
      stepNumber: '03',
      title: 'Entrance Exam Strategy (CUET / JEE / SAT)',
      status: 'in-progress',
      description: 'Formulating daily study schedule, high-yield topics, and test series milestones.',
      actionLabel: 'Review Study Timetable',
    },
    {
      id: 'sc-4',
      stepNumber: '04',
      title: 'College Shortlisting & Applications',
      status: 'upcoming',
      description: 'Mapping top tier universities and cutoff forecasts.',
    },
  ],
  college: [
    {
      id: 'col-1',
      stepNumber: '01',
      title: 'Skill Gap & Profile Audit',
      status: 'completed',
      description: 'Identified core DSA, modern web stack, and system basics requirements.',
    },
    {
      id: 'col-2',
      stepNumber: '02',
      title: 'ATS Resume Polish & Portfolio Review',
      status: 'completed',
      description: 'Reformatted resume into single-page Harvard ATS template; optimized GitHub projects.',
    },
    {
      id: 'col-3',
      stepNumber: '03',
      title: '1-on-1 Mock Technical & HR Interview',
      status: 'in-progress',
      description: 'Upcoming live session with Senior Mentor scheduled for tomorrow at 4:00 PM.',
      actionLabel: 'Join Session Link',
    },
    {
      id: 'col-4',
      stepNumber: '04',
      title: 'Off-Campus Applications & Referral Outreach',
      status: 'upcoming',
      description: 'Structured cold email outreach to hiring managers and verified alumni.',
    },
    {
      id: 'col-5',
      stepNumber: '05',
      title: 'Offer Evaluation & Salary Negotiation',
      status: 'upcoming',
      description: 'Reviewing job offers, stock options, and joining bonuses.',
    },
  ],
  fresher: [
    {
      id: 'fresh-1',
      stepNumber: '01',
      title: 'Career Path & Market Mapping',
      status: 'completed',
      description: 'Discovered high-growth entry roles aligning degree and market demand.',
    },
    {
      id: 'fresh-2',
      stepNumber: '02',
      title: 'ATS Resume & Cover Letter Overhaul',
      status: 'completed',
      description: 'Replaced generic academic CV with measurable project outcomes and keyword-targeted resume.',
    },
    {
      id: 'fresh-3',
      stepNumber: '03',
      title: 'LinkedIn Optimization & Recruiter Outreach',
      status: 'in-progress',
      description: 'Setting up high-visibility headline, portfolio projects, and direct messaging campaigns.',
      actionLabel: 'View Outreach Templates',
    },
    {
      id: 'fresh-4',
      stepNumber: '04',
      title: 'Interview Preparation & Mock Sessions',
      status: 'upcoming',
      description: '1-on-1 technical, case study, and HR mock interviews with live mentor feedback.',
    },
    {
      id: 'fresh-5',
      stepNumber: '05',
      title: 'Industry Expert Networking & Job Placement',
      status: 'upcoming',
      description: 'Warm introductions and alumni referrals to accelerate landing your first job.',
    },
  ],
  working_professional: [
    {
      id: 'pro-1',
      stepNumber: '01',
      title: 'Career Benchmark & Market Valuation',
      status: 'completed',
      description: 'Evaluated current compensation vs 90th percentile industry standards.',
    },
    {
      id: 'pro-2',
      stepNumber: '02',
      title: 'Executive Narrative & Resume Redesign',
      status: 'completed',
      description: 'Quantified impact metrics and leadership accomplishments.',
    },
    {
      id: 'pro-3',
      stepNumber: '03',
      title: 'System Design & Leadership Scenarios',
      status: 'in-progress',
      description: 'Deep dive into scalable architectures and stakeholder management case studies.',
      actionLabel: 'Access Case Studies',
    },
    {
      id: 'pro-4',
      stepNumber: '04',
      title: 'Executive Offer Negotiation & Closing',
      status: 'upcoming',
      description: 'Tailored counter-offer playbook and equity advisory.',
    },
  ],
};

export const RESOURCE_ITEMS: Record<
  UserProfession,
  { title: string; type: string; size: string; description: string }[]
> = {
  school: [
    {
      title: 'Maxicareer 2026 Stream Selection Guide',
      type: 'PDF Guide',
      size: '2.4 MB',
      description: 'Detailed analysis of career tracks in Science, Commerce, Arts & Emerging AI.',
    },
    {
      title: 'CUET & Competitive Exam Master Calendar',
      type: 'Calendar Sheet',
      size: '1.1 MB',
      description: 'All important registration dates, syllabus breakdowns, and preparation roadmaps.',
    },
    {
      title: 'High-School Study Habit & Time Matrix',
      type: 'Workbook',
      size: '850 KB',
      description: 'Balancing board exams with entrance exam preparation.',
    },
  ],
  college: [
    {
      title: 'Harvard Standard ATS Resume Template (Word & LaTeX)',
      type: 'Template Kit',
      size: '1.8 MB',
      description: 'Tested and proven template that passes 99% of corporate ATS filters.',
    },
    {
      title: 'Top 150 Coding & Behavioral Interview Questions',
      type: 'Interview Bank',
      size: '3.2 MB',
      description: 'Curated technical questions with model answers utilizing the STAR methodology.',
    },
    {
      title: 'Recruiter & Alumni Cold Outreach Message Scripts',
      type: 'Copy Kit',
      size: '950 KB',
      description: 'High-converting LinkedIn and email connection templates with a 45%+ reply rate.',
    },
  ],
  fresher: [
    {
      title: 'Fresher & PSW Job Hunting Playbook',
      type: 'Toolkit Kit',
      size: '2.1 MB',
      description: 'End-to-end guide to finding unlisted openings, visa navigation, and recruiter calls.',
    },
    {
      title: 'Zero-Experience High-Impact Resume Template',
      type: 'Word & PDF',
      size: '1.3 MB',
      description: 'Showcasing internships, capstones, and freelance projects to stand out immediately.',
    },
    {
      title: 'Entry-Level HR & Behavioral Question Bank',
      type: 'Cheat Sheet',
      size: '1.6 MB',
      description: 'Perfecting "Tell me about yourself", salary expectations, and situational roleplay.',
    },
  ],
  working_professional: [
    {
      title: 'Executive Resume & LinkedIn Re-Positioning Playbook',
      type: 'Executive Guide',
      size: '2.9 MB',
      description: 'How to present cross-functional leadership and measurable business impact.',
    },
    {
      title: 'Senior Tech & Product System Design Cheatsheet',
      type: 'Architecture Deck',
      size: '4.5 MB',
      description: 'Scalability, microservices, and trade-offs explained for senior interviews.',
    },
    {
      title: 'Salary & Equity Negotiation Script Book',
      type: 'Negotiation Guide',
      size: '1.4 MB',
      description: 'Exact phrasing to negotiate up to 35%+ higher base and joining bonuses.',
    },
  ],
};

/**
 * Generates an automated, clean WhatsApp URL prefilled with the user's registration
 */
export function generateRegistrationWhatsAppUrl(params: {
  name: string;
  email: string;
  phone: string;
  profession: string;
  planName: string;
  price: number;
  institutionOrCompany?: string;
  notes?: string;
  addOns?: string[];
}): string {
  const addOnsText = params.addOns && params.addOns.length > 0 ? `\n*Selected Add-Ons:* ${params.addOns.join(', ')}` : '';
  const message = `*Maxicareer Portal Registration & Fee Inquiry* 🎓
----------------------------------------
*Name:* ${params.name}
*Phone:* ${params.phone}
*Email:* ${params.email}
*Category:* ${params.profession}
*Program of Interest:* ${params.planName}${addOnsText}
${params.institutionOrCompany ? `*Institution / Org:* ${params.institutionOrCompany}` : ''}
${params.notes ? `*Goal / Note:* ${params.notes}` : ''}
----------------------------------------
Hello Maxicareer Team, I have registered on the portal for the *${params.planName}*. Please share the customized pricing schedule, curriculum details, and schedule my 1:1 mentorship consultation!`;

  return `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates an automated mailto link with the registration details
 */
export function generateRegistrationEmailUrl(params: {
  name: string;
  email: string;
  phone: string;
  profession: string;
  planName: string;
  price: number;
  institutionOrCompany?: string;
  notes?: string;
  addOns?: string[];
}): string {
  const data = generateRegistrationEmailData(params);
  return data.mailtoUrl;
}

export function generateRegistrationEmailData(params: {
  name: string;
  email: string;
  phone: string;
  profession: string;
  planName: string;
  price: number;
  institutionOrCompany?: string;
  notes?: string;
  addOns?: string[];
}) {
  const subject = `Maxicareer Portal Registration: ${params.name} (${params.profession} - ${params.planName})`;
  const addOnsText = params.addOns && params.addOns.length > 0 ? `\n- Selected Add-Ons: ${params.addOns.join(', ')}` : '';
  const body = `Dear Maxicareer Team,

I have submitted my portal registration details on Maxicareer:

Registration Details:
- Name: ${params.name}
- Email: ${params.email}
- Phone: ${params.phone}
- Category: ${params.profession}
- Institution / Organization: ${params.institutionOrCompany || 'N/A'}
- Program of Interest: ${params.planName}${addOnsText}
${params.notes ? `- Goals / Inquiries: ${params.notes}` : ''}

Please share the customized program fee structure, curriculum roadmap, and schedule my 1:1 career consultation.

Best regards,
${params.name}`;

  const recipient = OFFICIAL_EMAIL;
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);

  return {
    recipient,
    subject,
    body,
    mailtoUrl: `mailto:${recipient}?subject=${encSubject}&body=${encBody}`,
    gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encSubject}&body=${encBody}`,
    outlookUrl: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(recipient)}&subject=${encSubject}&body=${encBody}`,
  };
}

/**
 * Generates direct WhatsApp URL for Add-On services (e.g. Professional Resume Writing, LinkedIn, etc.)
 */
export function generateAddOnWhatsAppUrl(service: AddOnService, customerName?: string, customerPhone?: string): string {
  const message = `*Maxicareer Add-On Service Inquiry* ⚡
----------------------------------------
*Service:* ${service.title}
*Turnaround:* ${service.deliveryTime}
${customerName ? `*Customer Name:* ${customerName}\n` : ''}${customerPhone ? `*Phone:* ${customerPhone}\n` : ''}----------------------------------------
Hello Maxicareer Team, I would like to consult for the *${service.title}*. Please share the pricing details and process to get started!`;

  return `https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates direct email link for Add-On services
 */
export function generateAddOnEmailUrl(service: AddOnService, customerName?: string): string {
  const subject = `Maxicareer Add-On Service Inquiry: ${service.title}`;
  const body = `Dear Maxicareer Team,

I am interested in consulting for the following Add-On service:

- Service Name: ${service.title}
- Turnaround / Schedule: ${service.deliveryTime}
${customerName ? `- Name: ${customerName}\n` : ''}
Please share the pricing details, requirements submission process, and schedule for consultation.

Thank you!`;

  return `mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function generateAddOnEmailData(service: AddOnService, customerName?: string) {
  const subject = `Maxicareer Add-On Service Inquiry: ${service.title}`;
  const body = `Dear Maxicareer Team,

I am interested in consulting for the following Add-On service:

- Service Name: ${service.title}
- Turnaround / Schedule: ${service.deliveryTime}
${customerName ? `- Name: ${customerName}\n` : ''}
Please share the pricing details, requirements submission process, and schedule for consultation.

Thank you!`;

  const recipient = OFFICIAL_EMAIL;
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);

  return {
    recipient,
    subject,
    body,
    mailtoUrl: `mailto:${recipient}?subject=${encSubject}&body=${encBody}`,
    gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encSubject}&body=${encBody}`,
    outlookUrl: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(recipient)}&subject=${encSubject}&body=${encBody}`,
  };
}
