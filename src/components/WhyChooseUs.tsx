import React from 'react';
import {
  Route,
  Award,
  BookOpen,
  HeartHandshake,
  Compass,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';
import { WhyChooseUsBackground } from './SectionBackgrounds';

export const WhyChooseUs: React.FC = () => {
  const benefits = [
    {
      id: 'personalized-roadmaps',
      title: 'Personalized Career Roadmaps',
      description: 'Step-by-step learning and milestone paths tailored to your exact starting point and target role.',
      icon: Route,
    },
    {
      id: 'experienced-mentors',
      title: 'Experienced Mentors',
      description: 'Real guidance from engineers, consultants, and leaders actively practicing in their respective industries.',
      icon: Award,
    },
    {
      id: 'practical-skills',
      title: 'Practical Skill Development',
      description: 'Hands-on projects and modern tooling that demonstrate authentic, production-grade domain competence.',
      icon: BookOpen,
    },
    {
      id: 'continuous-support',
      title: 'Continuous Support',
      description: 'Regular feedback loops, checkpoint reviews, and consistent encouragement through every challenge.',
      icon: HeartHandshake,
    },
    {
      id: 'student-focused',
      title: 'Student-Focused Guidance',
      description: 'Approachable, student-friendly mentorship designed specifically to overcome early career hurdles.',
      icon: Compass,
    },
    {
      id: 'industry-preparation',
      title: 'Industry-Oriented Preparation',
      description: 'Resume optimization, simulated mock interviews, and communication training aligned with hiring needs.',
      icon: Briefcase,
    },
  ];

  return (
    <section id="why-us" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background Subtle Elements */}
      <WhyChooseUsBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="The Maxicareer Edge"
          title="Why Choose"
          highlight="Maxicareer?"
          description="We replace uncertainty with actionable plans. Our platform centers on clarity, consistency, practical learning, and building unwavering confidence in every learner."
        />

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center mt-14">
          {/* Left Column: Visual Highlight Card with Soft Gradient Shapes & Checklist */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-md">
              {/* Soft Gradient Blob Behind */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 via-sky-300/25 to-blue-200/20 rounded-3xl filter blur-2xl transform rotate-2 animate-pulse-glow" />

              {/* Main Feature Showcase Card */}
              <div className="relative z-10 p-7 sm:p-8 rounded-3xl bg-gradient-to-b from-[#F8FAFC] to-white border border-blue-100 shadow-xl shadow-blue-900/5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center mb-5 shadow-xs">
                  <Compass className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                  A Student-First Approach to Career Success
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Unlike generic tutorials or one-size-fits-all advice, Maxicareer provides dedicated mentorship tailored to your personal trajectory.
                </p>

                {/* Key Commitments */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">
                      Zero guesswork: every milestone has a clear objective
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">
                      Personalized matching with domain-specific mentors
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">
                      Practical skill mastery over theoretical lectures
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700">
                      Continuous guidance until you reach your goal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 6 Benefits Grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.id}
                    id={`benefit-${benefit.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
                    className="p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:bg-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#0F172A] mb-1.5 group-hover:text-[#2563EB] transition-colors">
                          {benefit.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
