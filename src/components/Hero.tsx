import React from 'react';
import { ArrowRight, Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { HeroBackground } from './SectionBackgrounds';
import { HeroCareerDashboard } from './HeroCareerDashboard';

interface HeroProps {
  onBookConsultation: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookConsultation, onExploreServices }) => {
  return (
    <section
      id="home"
      className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32 overflow-hidden"
    >
      {/* Impressive Animated Hero Background with gradient blooms, geometric paths, and micro-dots */}
      <HeroBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Copy and CTA with Staggered Entrance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            {/* Small Rounded Badge with Entrance Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-[#2563EB] text-xs sm:text-sm font-bold tracking-wide mb-6 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB] animate-pulse-subtle" />
              <span>✦ Structured Career Guidance &amp; Mentorship</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.12] max-w-2xl mx-auto lg:mx-0">
              Your Career Journey Starts with the{' '}
              <span className="text-[#2563EB] relative inline-block">
                Right Guidance.
                {/* Organic highlight underline accent */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 -bottom-1 sm:-bottom-2 w-full h-1.5 sm:h-2 bg-[#38BDF8]/40 rounded-full"
                />
              </span>
            </h1>

            {/* Subtitle / Description */}
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              Maxicareer helps students and aspiring professionals build clarity, develop the right
              skills, and move confidently toward their career goals.
            </p>

            {/* Interactive CTA Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                id="hero-book-consultation-btn"
                type="button"
                onClick={onBookConsultation}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] active:translate-y-0 shadow-lg shadow-blue-500/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 group"
              >
                <span>Book a Consultation</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                id="hero-explore-services-btn"
                type="button"
                onClick={onExploreServices}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-base font-bold text-[#0F172A] bg-white border border-slate-200/90 hover:border-blue-400 hover:text-[#2563EB] hover:bg-blue-50/50 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] active:translate-y-0 shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Compass className="w-5 h-5 text-[#2563EB]" />
                <span>Explore Our Services</span>
              </button>
            </div>

            {/* Core Guidance Pillars (2 x 2 grid) */}
            <div className="mt-10 pt-7 border-t border-slate-200/70 max-w-lg mx-auto lg:mx-0">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                {['Personalized Roadmaps', '1-on-1 Mentorship', 'Practical Skills', 'Industry Ready'].map((pillar) => (
                  <div
                    key={pillar}
                    className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs text-left hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>{pillar}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Digital Career Dashboard with Floating Highlights */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-5 relative flex justify-center items-center"
          >
            <HeroCareerDashboard />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
