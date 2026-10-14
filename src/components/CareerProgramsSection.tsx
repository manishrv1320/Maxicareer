import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck, MessageCircle, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { CAREER_PROGRAMS_LIST, OFFICIAL_PHONE, OFFICIAL_PHONE_DIGITS, OFFICIAL_EMAIL } from '../data/portalData';
import { PricingPlan, UserProfession } from '../types';
import { EmailModal, EmailModalData } from './EmailModal';

interface CareerProgramsSectionProps {
  onSelectProgram: (profession: UserProfession, planId: string) => void;
}

export const CareerProgramsSection: React.FC<CareerProgramsSectionProps> = ({
  onSelectProgram,
}) => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState<EmailModalData | null>(null);

  const handleDirectWhatsApp = (programName: string) => {
    const text = `*Maxicareer Program Inquiry* 🚀\n--------------------------------\n*Program:* ${programName}\nHello Maxicareer Team, I am interested in the *${programName}*. Please share the curriculum, pricing details, and schedule a consultation!`;
    window.open(`https://wa.me/${OFFICIAL_PHONE_DIGITS}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleDirectEmail = (programName: string) => {
    setEmailModalData({
      recipient: OFFICIAL_EMAIL,
      subject: `Maxicareer Inquiry: ${programName}`,
      body: `Dear Maxicareer Team,\n\nI am interested in the ${programName}.\nPlease provide more information on program enrollment, fee details, syllabus, and consultation schedule.\n\nThank you!`,
      title: `Inquire: ${programName}`,
      subtitle: `Direct to ${OFFICIAL_EMAIL}`,
      category: programName,
    });
    setEmailModalOpen(true);
  };

  return (
    <section id="career-programs" className="py-20 bg-[#F8FAFC] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Mentorship • Step-by-Step Guidance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            Comprehensive Career Programs
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Tailored step-by-step career acceleration programs designed for every stage of your journey — from school and college to fresh graduates and working professionals. Register to the portal and submit your message via WhatsApp or Email for further consultation and fee details.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAREER_PROGRAMS_LIST.map((program, index) => {
            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300"
              >
                <div>
                  {/* Top Dark Header Pill / Badge */}
                  <div className="w-full bg-[#1E293B] text-white py-2.5 px-3 rounded-xl text-center font-bold text-sm tracking-wide shadow-xs mb-5">
                    {program.cohortBadge}
                  </div>

                  {/* Program Name */}
                  <h3 className="text-lg sm:text-xl font-black text-[#0F172A] mb-3">
                    {program.name}
                  </h3>

                  {/* Tagline / Subtitle */}
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-5">
                    {program.tagline}
                  </p>

                  {/* Registration Action Button (Opens portal for registration & inquiry) */}
                  <button
                    type="button"
                    onClick={() => onSelectProgram(program.profession, program.id)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-3"
                  >
                    <span>Register to Portal &amp; Inquire</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Direct Contact Options: WhatsApp & Email */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <button
                      type="button"
                      onClick={() => handleDirectWhatsApp(program.name)}
                      className="py-2 px-2.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
                      title="Direct WhatsApp Inquiry"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectEmail(program.name)}
                      className="py-2 px-2.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-1.5 transition-colors"
                      title="Direct Email Inquiry"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Mail</span>
                    </button>
                  </div>

                  {/* Inclusions Checklist with Green Checkmarks */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    {program.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 font-black flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Trust Note */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>1-on-1 Mentorship &amp; Portal Included</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Email Dispatch Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        data={emailModalData}
        onClose={() => setEmailModalOpen(false)}
      />
    </section>
  );
};
