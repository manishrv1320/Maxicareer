import React from 'react';
import { Quote, Info, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';

export const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 'fb-1',
      name: 'Aarav P.',
      role: 'Computer Science Final-Year Student',
      rating: 5,
      quote:
        'Maxicareer helped me understand what skills I should focus on and how to plan my next steps without feeling overwhelmed by countless tutorials.',
      focusArea: 'Skill Roadmap & Focus',
      initials: 'AP',
    },
    {
      id: 'fb-2',
      name: 'Meera K.',
      role: 'Engineering Graduate & Aspiring Analyst',
      rating: 5,
      quote:
        'Having structured guidance and weekly milestones made my learning journey much more focused. The mentor gave practical advice on real-world projects.',
      focusArea: 'Structured Mentorship',
      initials: 'MK',
    },
    {
      id: 'fb-3',
      name: 'Rohan S.',
      role: 'Early Career Transitioner',
      rating: 5,
      quote:
        'The 1-on-1 mentorship approach made career planning straightforward. I received honest feedback on my resume and interview prep that boosted my confidence.',
      focusArea: 'Interview Preparation',
      initials: 'RS',
    },
  ];

  return (
    <section id="feedback" className="py-20 lg:py-28 bg-[#FFFBEB] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="Community Feedback"
          title="Student &amp; Learner"
          highlight="Impressions"
          description="Hear how our structured approach brings clarity, direction, and practical confidence to students and early-career job seekers."
        />

        {/* Demo Content Disclosure */}
        <div className="max-w-2xl mx-auto mb-12 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200/80 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-blue-900 text-center font-medium">
          <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
          <span>
            Note: The following quotes represent sample demonstration feedback illustrating our mentorship curriculum.
          </span>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.id}
              id={`testimonial-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.1, ease: 'easeOut' }}
              className="p-7 sm:p-8 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div>
                {/* Top: Star Rating & Focus Pill */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {item.focusArea}
                  </span>
                </div>

                {/* Quote Icon */}
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB] mb-4 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Quote className="w-4 h-4" />
                </div>

                {/* Testimonial Quote */}
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic mb-6">
                  "{item.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F172A] to-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                  {item.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
