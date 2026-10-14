import React from 'react';
import {
  Compass,
  Users2,
  BookOpenCheck,
  FolderGit2,
  Speech,
  LineChart,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';
import { BenefitItem } from '../types';
import { BenefitsBackground } from './SectionBackgrounds';

export const BenefitsSection: React.FC = () => {
  const benefits: BenefitItem[] = [
    {
      id: 'career-clarity',
      title: 'Career Clarity',
      description:
        'Zero ambiguity regarding your direction, suitable industries, and high-demand roles matching your innate strengths.',
      iconName: 'Compass',
    },
    {
      id: 'personalized-mentorship',
      title: 'Personalized Mentorship',
      description:
        'Tailored advice that takes your unique circumstances, challenges, and goals into deep consideration.',
      iconName: 'Users2',
    },
    {
      id: 'structured-learning',
      title: 'Structured Learning',
      description:
        'Step-by-step curriculum maps that remove tutorial fatigue and focus on high-yield professional skills.',
      iconName: 'BookOpenCheck',
    },
    {
      id: 'practical-projects',
      title: 'Practical Projects',
      description:
        'Build portfolio-ready deliverables reflecting real production challenges that employers actually care about.',
      iconName: 'FolderGit2',
    },
    {
      id: 'interview-prep',
      title: 'Interview Preparation',
      description:
        'Simulated technical and behavioral drills to ensure you speak with command and confidence in front of hiring managers.',
      iconName: 'Speech',
    },
    {
      id: 'progress-tracking',
      title: 'Progress Tracking',
      description:
        'Systematic milestones, transparent accountability metrics, and continuous celebration of your skill breakthroughs.',
      iconName: 'LineChart',
    },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Compass':
        return Compass;
      case 'Users2':
        return Users2;
      case 'BookOpenCheck':
        return BookOpenCheck;
      case 'FolderGit2':
        return FolderGit2;
      case 'Speech':
        return Speech;
      case 'LineChart':
        return LineChart;
      default:
        return Sparkles;
    }
  };

  return (
    <section id="benefits" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background: Floating translucent circles, light diagonal lines, gentle gradient movement */}
      <BenefitsBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="Tangible Outcomes"
          title="Everything You Need to"
          highlight="Move Forward"
          description="A holistic career ecosystem that equips you with knowledge, support, and proven tools to build an enviable career."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-12">
          {benefits.map((benefit, index) => {
            const Icon = getIcon(benefit.iconName);
            return (
              <motion.div
                key={benefit.id}
                id={`benefit-card-${benefit.id}`}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
                className="p-6 sm:p-7 rounded-2xl bg-[#F8FAFC]/90 backdrop-blur-xs border border-slate-200/90 hover:bg-white hover:border-blue-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white group-hover:scale-110 transition-all duration-300 mb-5 shadow-xs">
                    <Icon className="w-6 h-6 transition-transform duration-300" />
                  </div>

                  <h3 className="text-lg font-bold text-[#0F172A] mb-2 group-hover:text-[#2563EB] transition-colors duration-200">
                    {benefit.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                  <span>Built for student success</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
