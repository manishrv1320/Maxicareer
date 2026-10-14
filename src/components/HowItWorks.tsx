import React from 'react';
import { Calendar, Users, Route, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';
import { HowItWorksBackground } from './SectionBackgrounds';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Book a Consultation',
      description:
        'Share your background, current goals, and career questions. We schedule an introductory session to understand your exact starting point.',
      icon: Calendar,
      subPoints: [
        'Aptitude & interest discovery',
        'Academic & background review',
        'Identify target industries & roles',
      ],
    },
    {
      number: '02',
      title: 'Connect with the Right Mentor',
      description:
        'Get matched with an experienced mentor in your target field who provides personalized guidance, insights, and continuous direction.',
      icon: Users,
      subPoints: [
        'Domain-specific mentor matching',
        'Direct 1-on-1 strategy session',
        'Identification of key skill gaps',
      ],
    },
    {
      number: '03',
      title: 'Follow Your Personalized Career Plan',
      description:
        'Execute a structured roadmap covering core skill acquisition, portfolio deliverables, resume optimization, and interview preparation.',
      icon: Route,
      subPoints: [
        'Quarterly milestone roadmaps',
        'Hands-on project milestones',
        'Weekly accountability & feedback',
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#F0FDFA] relative overflow-hidden">
      {/* Background: Soft background circles & subtle rotating trajectory */}
      <HowItWorksBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="A Structured Process"
          title="How Maxicareer"
          highlight="Works"
          description="A clear, three-stage pathway created to take you from uncertain student or beginner to an industry-ready professional."
        />

        {/* Timeline Stepper Container */}
        <div className="relative mt-16">
          {/* Desktop Animated Connecting Line & Traveling Pulse */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-[86px] left-[15%] right-[15%] h-1 bg-slate-200/90 rounded-full z-0 overflow-hidden"
          >
            {/* Gradient Track */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 via-sky-400 to-blue-500/40" />
            {/* Traveling glowing light pulse */}
            <div className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white to-transparent animate-travel-timeline" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  id={`step-${step.number}`}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: idx * 0.15, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group"
                >
                  {/* Step Number & Icon Badge */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:shadow-blue-500/40 transition-all duration-300">
                      <Icon className="w-7 h-7" />
                    </div>
                    {/* Step label pill below */}
                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0F172A] text-white shadow-2xs">
                      STEP {step.number}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#2563EB] transition-colors duration-200 mt-2">
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {step.description}
                  </p>

                  {/* Sub-checkpoints */}
                  <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2 mt-auto">
                    {step.subPoints.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
