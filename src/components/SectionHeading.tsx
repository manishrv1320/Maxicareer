import React from 'react';
import { motion } from 'motion/react';

interface SectionHeadingProps {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: 'center' | 'left';
  dark?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  highlight,
  description,
  align = 'center',
  dark = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`max-w-3xl mb-12 md:mb-16 ${
        align === 'center' ? 'mx-auto text-center' : 'text-left'
      }`}
    >
      {badge && (
        <span
          className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3.5 transition-colors ${
            dark
              ? 'bg-blue-900/60 text-sky-300 border border-blue-700/40'
              : 'bg-[#EFF6FF] text-[#2563EB] border border-blue-100'
          }`}
        >
          {badge}
        </span>
      )}

      <h2
        className={`text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight leading-tight ${
          dark ? 'text-white' : 'text-[#0F172A]'
        }`}
      >
        {title}{' '}
        {highlight && (
          <span className="text-[#2563EB] font-extrabold">{highlight}</span>
        )}
      </h2>

      {description && (
        <p
          className={`mt-4 text-base sm:text-lg leading-relaxed ${
            dark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
};
