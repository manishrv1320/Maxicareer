import type { CurriculumModule } from '../types/portal';

/**
 * The program syllabus every learner starts with. The admin Curriculum page stores this
 * once in MongoDB and edits it from there; students fall back to it until then.
 * Lesson ids of modules 1–2 match the original syllabus so saved progress carries over.
 */
export const DEFAULT_CURRICULUM: CurriculumModule[] = [
  {
    id: 'mod-default-1',
    scope: 'cohort',
    cohort: 'all',
    title: 'Career trajectory & strength architecture',
    description: 'Personalised diagnostic, a 0-to-5 year trajectory, and industry market mapping.',
    weeks: 'Weeks 1–4',
    order: 1,
    status: 'Published',
    createdBy: 'admin',
    createdByName: 'Maxicareer team',
    createdAt: '2026-01-01T00:00:00.000Z',
    lessons: [
      { id: 'lesson-1-1', title: 'Aptitude & strength evaluation diagnostic', duration: '45 mins', type: 'Assessment' },
      { id: 'lesson-1-2', title: 'Market value & target role benchmark', duration: '60 mins', type: 'Blueprint' },
      { id: 'lesson-1-3', title: 'Quarterly career roadmap & milestones', duration: '50 mins', type: '1:1 Review' },
    ],
  },
  {
    id: 'mod-default-2',
    scope: 'cohort',
    cohort: 'all',
    title: 'Core practical skills & industry tooling',
    description: 'High-leverage technical and domain skills that employers screen for.',
    weeks: 'Weeks 5–8',
    order: 2,
    status: 'Published',
    createdBy: 'admin',
    createdByName: 'Maxicareer team',
    createdAt: '2026-01-01T00:00:00.000Z',
    lessons: [
      { id: 'lesson-2-1', title: 'Hands-on tooling (Git, cloud, production stacks)', duration: '1h 15m', type: 'Hands-on' },
      { id: 'lesson-2-2', title: 'Communication, presence & case walkthroughs', duration: '50 mins', type: 'Interactive' },
      { id: 'lesson-2-3', title: 'Problem-solving & system design frameworks', duration: '1h 30m', type: 'Masterclass' },
    ],
  },
  {
    id: 'mod-default-3',
    scope: 'cohort',
    cohort: 'all',
    title: 'Portfolio projects & real deliverables',
    description: 'Proof of work that stands out in recruiter screens and hiring panels.',
    weeks: 'Weeks 9–12',
    order: 3,
    status: 'Published',
    createdBy: 'admin',
    createdByName: 'Maxicareer team',
    createdAt: '2026-01-01T00:00:00.000Z',
    lessons: [
      { id: 'lesson-3-1', title: 'Choose and scope a portfolio project', duration: '40 mins', type: 'Workshop' },
      { id: 'lesson-3-2', title: 'Build, document and publish your project', duration: '2 weeks', type: 'Project' },
      { id: 'lesson-3-3', title: 'Project review with your mentor', duration: '45 mins', type: '1:1 Review' },
    ],
  },
  {
    id: 'mod-default-4',
    scope: 'cohort',
    cohort: 'all',
    title: 'ATS resume, interview coaching & offers',
    description: 'Mock interviews, recruiter messaging and offer negotiation.',
    weeks: 'Weeks 13–16',
    order: 4,
    status: 'Published',
    createdBy: 'admin',
    createdByName: 'Maxicareer team',
    createdAt: '2026-01-01T00:00:00.000Z',
    lessons: [
      { id: 'lesson-4-1', title: 'ATS resume and LinkedIn rewrite', duration: '60 mins', type: 'Workshop' },
      { id: 'lesson-4-2', title: 'Mock technical and HR interviews', duration: '2 × 45 mins', type: 'Mock interview' },
      { id: 'lesson-4-3', title: 'Offer evaluation & negotiation', duration: '40 mins', type: '1:1 Review' },
    ],
  },
];
