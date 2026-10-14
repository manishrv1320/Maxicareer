import React from 'react';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { CTABackground } from './SectionBackgrounds';

interface CTASectionProps {
  onBookConsultation: () => void;
  onContactClick: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  onBookConsultation,
  onContactClick,
}) => {
  return (
    <section className="py-20 lg:py-28 bg-[#0F172A] relative overflow-hidden text-white">
      {/* Dynamic CTA Background: Blue gradient, animated glowing spheres & light accents */}
      <CTABackground />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Small Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/60 text-sky-300 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse-subtle" />
            <span>Begin Your Transformation</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Ready to Take the <span className="text-[#38BDF8]">Next Step in Your Career?</span>
          </h2>

          {/* Description */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Get the guidance, skills, and mentorship you need to move forward with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="cta-book-consultation-btn"
              type="button"
              onClick={onBookConsultation}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-600/40 active:scale-[0.98] active:translate-y-0 shadow-lg shadow-blue-600/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 group"
            >
              <span>Book a Consultation</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <button
              id="cta-contact-us-btn"
              type="button"
              onClick={onContactClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-slate-800/90 border border-slate-700 hover:border-slate-500 hover:bg-slate-700/80 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] active:translate-y-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Mail className="w-5 h-5 text-sky-400" />
              <span>Contact Us</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
