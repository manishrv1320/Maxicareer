import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceItem } from '../types';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onBookService: (serviceTitle: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookService,
}) => {
  return (
    <AnimatePresence>
      {service && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-service-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 my-8"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50/90 to-sky-50/70 border-b border-slate-200 flex items-start justify-between">
              <div>
                <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-white rounded-full border border-blue-200 mb-2 shadow-xs">
                  {service.badge}
                </span>
                <h3 id="modal-service-title" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                  {service.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 active:scale-95 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                {service.fullDescription}
              </p>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
                  What Is Included:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
                  Expected Outcomes:
                </h4>
                <ul className="space-y-2">
                  {service.deliverables.map((deliv, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                      <span>{deliv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200/70 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Back to Services
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookService(service.title);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] active:translate-y-0 shadow-md shadow-blue-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span>Consult on {service.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
