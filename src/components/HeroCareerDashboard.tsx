import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Compass,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';

export const HeroCareerDashboard: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg lg:max-w-xl mx-auto select-none">
      {/* Ambient background glow behind dashboard */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-blue-500/20 via-sky-400/20 to-indigo-500/10 rounded-3xl filter blur-2xl -z-10 animate-pulse-glow" />

      {/* Main Glass Dashboard Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative rounded-3xl bg-white/95 backdrop-blur-md border border-blue-100 shadow-2xl shadow-blue-900/10 p-5 sm:p-7 sm:pb-12 overflow-hidden"
      >
        {/* Subtle decorative inner corner sheen */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50/70 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />

        {/* Dashboard Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Career Growth Roadmap</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Plan
                </span>
              </div>
              <p className="text-xs text-slate-500">Personalized Guidance &amp; Mentorship</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Quarterly Track</span>
          </div>
        </div>

        {/* Mentorship Status Block */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-blue-50/60 border border-blue-100/80 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Assigned Mentor Session
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Next: Tomorrow, 4:00 PM</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white">
                MC
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#0F172A] truncate">1-on-1 Strategy &amp; Resume Review</h4>
              <p className="text-xs text-slate-600 truncate">Senior Industry Mentor • Tech &amp; Product</p>
            </div>
            <span className="inline-flex items-center text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
              Details
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0F172A]">Core Milestone Completion</span>
            <span className="font-extrabold text-[#2563EB]">78% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '78%' }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] rounded-full"
            />
          </div>
        </div>

        {/* 3 Active Roadmap Pillars */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-[#0F172A]">Clarity</div>
            <div className="text-[10px] text-slate-500">Direction mapped</div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-sky-100 text-[#0284C7] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-[#0F172A]">Skills</div>
            <div className="text-[10px] text-slate-500">Hands-on tasks</div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200">
            <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg bg-indigo-100 text-[#4F46E5] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-[#0F172A]">Success</div>
            <div className="text-[10px] text-slate-500">Interview ready</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Badge 1: Top Right - Mentor Match Notification */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="hidden sm:flex absolute -top-4 -right-4 z-20 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-blue-200 shadow-xl shadow-blue-500/10 hover:scale-105 transition-transform duration-200"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#0F172A]">Mentor Matched</p>
          <p className="text-[10px] font-semibold text-[#2563EB]">1-on-1 Guidance Ready</p>
        </div>
      </motion.div>

      {/* Floating Badge 2: Bottom Left - Growth Metric (left edge lines up with the card content) */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 15 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="hidden sm:flex absolute -bottom-6 left-7 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-[#0F172A] text-white border border-slate-700/60 shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform duration-200"
      >
        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Career Clarity &amp; Readiness</p>
          <p className="text-[10px] font-medium text-sky-300">Structured Roadmap Execution</p>
        </div>
      </motion.div>
    </div>
  );
};
