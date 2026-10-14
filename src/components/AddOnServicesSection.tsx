import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ADD_ON_SERVICES } from '../data/portalData';
import { AddOnService } from '../types';
import { Check, Clock, X, Sparkles, ArrowRight, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { apiSend } from '../lib/api';

interface AddOnServicesSectionProps {
  onBuyService?: (service: AddOnService) => void;
}

const EMPTY_FORM = { name: '', email: '', phone: '', notes: '' };
type FormField = keyof typeof EMPTY_FORM;

export const AddOnServicesSection: React.FC<AddOnServicesSectionProps> = ({
  onBuyService,
}) => {
  const [selectedService, setSelectedService] = useState<AddOnService | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleOpenBuyModal = (service: AddOnService) => {
    if (onBuyService) {
      onBuyService(service);
      return;
    }
    setErrors({});
    setSubmitError('');
    setSuccessMessage('');
    setSelectedService(service);
  };

  const updateField = (field: FormField) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const found: Partial<Record<FormField, string>> = {};
    if (form.name.trim().length < 2) found.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'Please enter a valid email address.';
    if (form.phone.replace(/\D/g, '').length < 7) found.phone = 'Please enter a valid phone number.';
    return found;
  };

  /** Saves the request through /api/contact (stored in MongoDB and sent to the admin team). */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await apiSend('/api/contact', {
        form: 'service_request',
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        serviceInterest: selectedService.title,
        deliveryTime: selectedService.deliveryTime,
        message: form.notes.trim(),
      });
      setSuccessMessage(
        `Thank you, ${form.name.trim()}! Your request for ${selectedService.title} has been received. Our team will contact you within 24 hours.`
      );
      setForm(EMPTY_FORM);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: FormField) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
    }`;

  return (
    <section id="addon-services" className="py-20 bg-white relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Targeted Career Boosters</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            Specialized Career Services
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            Need focused deliverables? Connect with our mentors for resume writing, LinkedIn optimization, cover letters, and private 1:1 strategy calls. Request a service and our team will get back to you within 24 hours.
          </p>
        </div>

        {/* 4 Cards in Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ADD_ON_SERVICES.map((service, index) => {
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300"
              >
                <div>
                  {/* Card Title */}
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A] min-h-[48px] line-clamp-2">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed min-h-[52px] my-4">
                    {service.description}
                  </p>

                  {/* Opens the request form */}
                  <button
                    type="button"
                    onClick={() => handleOpenBuyModal(service)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Request Service</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer Delivery / Availability Badge */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  {service.isScheduleBased ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span>⏳</span>
                      <span className="italic">{service.deliveryTime}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black">
                        ✓
                      </span>
                      <span className="italic">{service.deliveryTime}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Service Request Form Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="service-request-title"
              className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-8 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pr-6">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Request a Service
                </span>
                <h3 id="service-request-title" className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {selectedService.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Turnaround: {selectedService.deliveryTime}</span>
                </div>
              </div>

              {successMessage ? (
                <div className="text-center pt-8 pb-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Request received</h4>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{successMessage}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <div className="font-bold text-slate-800 mb-1">What&apos;s Included:</div>
                    {selectedService.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="space-y-3">
                    <div>
                      <label htmlFor="service-request-name" className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="service-request-name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={updateField('name')}
                        placeholder="Enter your name"
                        className={inputClass('name')}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="service-request-email" className="block text-xs font-bold text-slate-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="service-request-email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={updateField('email')}
                        placeholder="name@example.com"
                        className={inputClass('email')}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="service-request-phone" className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="service-request-phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={updateField('phone')}
                        placeholder="+91 98765 43210"
                        className={inputClass('phone')}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                    </div>
                    <div>
                      <label htmlFor="service-request-notes" className="block text-xs font-bold text-slate-700 mb-1">
                        Anything we should know? <span className="font-medium text-slate-400">(optional)</span>
                      </label>
                      <textarea
                        id="service-request-notes"
                        rows={3}
                        maxLength={1000}
                        value={form.notes}
                        onChange={updateField('notes')}
                        placeholder="Target role, deadline, current experience…"
                        className={`${inputClass('notes')} resize-none`}
                      />
                    </div>

                    {submitError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>A Maxicareer mentor will contact you within 24 hours</span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
