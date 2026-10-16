import React, { useState } from 'react';
import {
  Compass,
  Code2,
  Users,
  FileText,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';
import { ServiceDetailModal } from './ServiceDetailModal';
import { ServiceItem, UserProfession } from '../types';
import { ServicesBackground } from './SectionBackgrounds';
import { COURSE_PROGRAMS_DATA, CourseProgramConfig } from './CourseRegistrationModal';

interface ServicesSectionProps {
  onSelectService: (serviceTitle: string) => void;
  onOpenRegisterProgram: (profession: UserProfession, programName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onSelectService,
  onOpenRegisterProgram,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Foundational Services
  const services: ServiceItem[] = [
    {
      id: 'career-guidance',
      title: 'Career Guidance',
      shortDescription:
        'Understand your strengths, explore high-growth opportunities, and map a personalized roadmap for your career journey.',
      fullDescription:
        'Comprehensive career mapping tailored to your strengths, academic background, and personal ambitions. We eliminate confusion by analyzing growth sectors, defining clear trajectories, and formulating an actionable milestone plan.',
      features: [
        'Personalized strength & interest evaluation',
        'Industry career path mapping (0 to 5 year forecast)',
        'Academic vs. industry transition strategies',
        'Actionable quarterly milestones checklist',
      ],
      deliverables: [
        'Custom 12-Month Career Blueprint Document',
        'Role-specific competency checklist',
        'Recommended target certifications and credentials',
      ],
      iconName: 'Compass',
      badge: 'Foundation',
    },
    {
      id: 'skill-development',
      title: 'Skill Development',
      shortDescription:
        'Learn practical technical and professional skills aligned with current industry expectations and modern tools.',
      fullDescription:
        'Avoid outdated tutorials. We curate structured skill development roadmaps based on what modern tech, business, and creative companies actively demand. Focus your study time on high-leverage tools, methodologies, and frameworks.',
      features: [
        'Curated hands-on project briefs with real codebases',
        'Tooling mastery (Git, Cloud, modern tech stacks)',
        'Communication & executive presentation skills',
        'Code and project architecture critiques',
      ],
      deliverables: [
        'Industry-grade portfolio project templates',
        'Curated learning resources & practice modules',
        'Peer and mentor review checklists',
      ],
      iconName: 'Code2',
      badge: 'Practical Skills',
    },
    {
      id: 'one-to-one-mentorship',
      title: 'One-to-One Mentorship',
      shortDescription:
        'Connect directly with experienced mentors who provide personalized advice, direct feedback, and career accountability.',
      fullDescription:
        'Direct, unfiltered access to seasoned mentors who have walked the path you are on. Get regular check-ins, targeted feedback on your work, strategic career answers, and continuous support when dealing with career decisions.',
      features: [
        'Dedicated 1-on-1 video sessions with active practitioners',
        'Goal tracking and weekly accountability prompts',
        'Direct messaging for pressing career doubts',
        'Constructive, honest feedback on your projects',
      ],
      deliverables: [
        'Post-session recap notes and action commitments',
        'Priority access to mentor office hours',
        'Networking and introduction guidelines',
      ],
      iconName: 'Users',
      badge: 'High Impact',
    },
    {
      id: 'interview-resume-preparation',
      title: 'Interview and Resume Preparation',
      shortDescription:
        'Master behavioral and technical interviews while crafting an ATS-optimized resume that gets noticed by recruiters.',
      fullDescription:
        'Turn your skills into real career opportunities. We optimize your resume for applicant tracking systems (ATS), coach you through behavioral and technical interview scenarios, polish your professional portfolio, and guide your negotiation strategy.',
      features: [
        'ATS-optimized resume and LinkedIn profile review',
        'Simulated mock interviews with recorded critiques',
        'Portfolio website and project presentation polish',
        'Offer evaluation and negotiation advisory',
      ],
      deliverables: [
        'Polished modern resume in multiple formats',
        'Personal interview answer bank with STAR framework',
        'Tailored outreach templates for recruiters',
      ],
      iconName: 'FileText',
      badge: 'Job Ready',
    },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Compass':
        return Compass;
      case 'Code2':
        return Code2;
      case 'Users':
        return Users;
      case 'FileText':
      default:
        return FileText;
    }
  };

  return (
    <section id="services" className="py-20 lg:py-28 bg-[#EFF6FF] relative overflow-hidden">
      {/* Background Subtle Elements */}
      <ServicesBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <SectionHeading
          badge="Courses & Mentorship"
          title="Career Programs &"
          highlight="1:1 Mentorship"
          description="Tailored for students and aspiring professionals at every milestone. Register with all required details to connect directly with your dedicated mentor."
        />

        {/* ------------------------------------------------------------------ */}
        {/* 4 Specialized Career Programs matching user's uploaded image        */}
        {/* ------------------------------------------------------------------ */}
        <div className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Specialized Mentorship Courses</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Choose your cohort below and register with your details for personalized 1:1 career guidance.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full w-fit">
              Direct Mentor Connect Included
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COURSE_PROGRAMS_DATA.map((program, index) => {
              // Subgrid: each card's six rows share heights with its neighbours, so badges,
              // titles, buttons, checklists and footers line up across the row of cards.
              return (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-200/95 p-6 grid grid-rows-subgrid row-span-6 gap-0 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 relative group"
                >
                  {/* Dark Cohort Badge matching Image Header */}
                  <div className="w-full bg-[#1E293B] text-white py-3 px-3 rounded-xl flex items-center justify-center text-center font-bold text-sm tracking-wide shadow-xs mb-5 group-hover:bg-blue-900 transition-colors">
                    {program.cohortBadge}
                  </div>

                  {/* Program Title */}
                  <h4 className="text-lg sm:text-xl font-black text-[#0F172A] mb-2 tracking-tight">
                    {program.name}
                  </h4>

                  {/* Tagline / Subtitle */}
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-5">
                    {program.tagline}
                  </p>

                  {/* Action Button: Register for Mentorship (No Prices!) */}
                  <button
                    type="button"
                    onClick={() => onOpenRegisterProgram(program.profession, program.name)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-6"
                  >
                    <span>Register for Mentorship</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Inclusions Checklist with Green Checkmarks */}
                  <div className="border-t border-slate-100 pt-5 space-y-2.5">
                    {program.features.map((feature, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"
                      >
                        <Check className="w-4 h-4 text-emerald-600 font-black shrink-0 mt-0.5" />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Duration & Support */}
                  <div className="pt-5 mt-6 border-t border-slate-100">
                    <div className="text-center">
                      <div className="text-xs font-black text-slate-900 tracking-tight">
                        {program.support}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {program.duration}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Foundational Career Support Services                               */}
        {/* ------------------------------------------------------------------ */}
        <div className="mt-20 pt-16 border-t border-slate-200/80">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Foundational Career Pillars
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Explore the core skills and advisory services integrated into every Maxicareer mentorship program.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = getIcon(service.iconName);
              return (
                <motion.div
                  key={service.id}
                  id={`service-card-${service.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="group flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div>
                    {/* Top Bar: Icon + Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-all shadow-xs">
                        <Icon className="w-5 h-5 transition-transform" />
                      </div>
                      <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        {service.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-[#0F172A] mb-2 group-hover:text-[#2563EB] transition-colors">
                      {service.title}
                    </h4>

                    {/* Description */}
                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                      {service.shortDescription}
                    </p>
                  </div>

                  {/* Learn More link */}
                  <div className="pt-3 border-t border-slate-100 mt-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors focus:outline-none"
                    >
                      <span>Explore Curriculum</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onBookService={(title) => {
            setSelectedService(null);
            onSelectService(title);
          }}
        />
      )}
    </section>
  );
};
