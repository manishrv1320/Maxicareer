import React from 'react';
import { Compass, BookOpen, Users, Route, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AboutBackground } from './SectionBackgrounds';

export const AboutSection: React.FC = () => {
  const corePillars = [
    {
      id: 'career-clarity',
      title: 'Career Clarity',
      description:
        'Eliminate confusion with structured evaluations of your strengths, interests, and high-growth industry paths.',
      icon: Compass,
      color: 'text-[#2563EB]',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      id: 'skill-development',
      title: 'Skill Development',
      description:
        'Focus your energy on hands-on, high-leverage skills and real-world projects that modern employers actually seek.',
      icon: BookOpen,
      color: 'text-[#0284C7]',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100',
    },
    {
      id: 'expert-mentorship',
      title: 'Expert Mentorship',
      description:
        'Direct 1-on-1 guidance from experienced practitioners who provide actionable advice and accountability.',
      icon: Users,
      color: 'text-[#4F46E5]',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      id: 'personalized-guidance',
      title: 'Personalized Guidance',
      description:
        'No generic advice. Every recommendation is tailored to your unique background, timeline, and goals.',
      icon: Route,
      color: 'text-[#2563EB]',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
  ];

  return (
    <section id="about" className="py-20 lg:py-28 bg-[#F5F3FF] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <AboutBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading, Short Description & Supporting Paragraph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold uppercase tracking-wider">
              <span>Who We Are</span>
            </div>

            {/* Main Section Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              About <span className="text-[#2563EB]">Maxicareer</span>
            </h2>

            {/* Short Professional Description */}
            <p className="text-lg sm:text-xl text-slate-700 font-medium leading-relaxed">
              Maxicareer is a dedicated career guidance and mentorship platform built to make career planning structured, accessible, and deeply impactful for students and aspiring professionals.
            </p>

            {/* Supporting Paragraph */}
            <p className="text-base text-slate-600 leading-relaxed">
              We bridge the gap between academic education and real-world industry requirements. By combining structured career roadmaps, hands-on skill development, and one-on-one expert mentorship, we empower learners to eliminate uncertainty, cultivate practical competencies, and move confidently toward their dream careers.
            </p>

            {/* Supporting Highlights */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                <span>Unbiased recommendations tailored to individual strengths</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                <span>Step-by-step accountability with experienced mentors</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                <span>Direct focus on high-yield, industry-relevant skills</span>
              </div>
            </div>

            <div className="pt-4">
              <a
                href="#services"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] group transition-colors"
              >
                <span>Discover our mentorship programs</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </motion.div>

          {/* Right Column: Modern Visual Card with 4 Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-6"
          >
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F8FAFC] border border-slate-200/90 shadow-xl shadow-slate-900/5 relative overflow-hidden">
              {/* Subtle top decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB]" />

              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#0F172A] mb-1.5">
                  Our Core Pillars of Impact
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Every Maxicareer program is engineered around four essential components:
                </p>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {corePillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group flex flex-col justify-between"
                    >
                      <div>
                        <div
                          className={`w-10 h-10 rounded-xl ${pillar.bgColor} ${pillar.borderColor} border flex items-center justify-center ${pillar.color} mb-3.5 group-hover:scale-110 transition-transform duration-200 shadow-2xs`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-base font-bold text-[#0F172A] mb-1.5 group-hover:text-[#2563EB] transition-colors">
                          {pillar.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
