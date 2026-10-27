'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { HowItWorks } from './components/HowItWorks';
import { BenefitsSection } from './components/BenefitsSection';
import { Testimonials } from './components/Testimonials';
import { CTASection } from './components/CTASection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { WhatsAppButton } from './components/WhatsAppButton';
import { StudentDashboard } from './components/StudentDashboard';
import { AddOnServicesSection } from './components/AddOnServicesSection';
import { CourseRegistrationModal } from './components/CourseRegistrationModal';
import { scrollToSection } from './lib/utils';
import { StudentProfile, UserProfession } from './types';
import { auth } from './lib/api';

export default function App() {
  const [selectedService, setSelectedService] = useState<string>('Career Guidance');

  // Student Profile State
  const [userProfile, setUserProfile] = useState<StudentProfile | null>(null);

  // Restore the signed-in student from the server session (httpOnly cookie).
  useEffect(() => {
    auth
      .me()
      .then((res) => {
        if (res.user?.role === 'student' && res.student) setUserProfile(res.student);
      })
      .catch(() => {});
  }, []);

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  // /?portal=student opens the student portal; anyone else goes to the shared sign-in page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') !== 'student') return;
    window.history.replaceState(null, '', window.location.pathname);
    auth
      .me()
      .then((res) => {
        if (res.user?.role === 'student') setCurrentView('dashboard');
        else window.location.assign('/login');
      })
      .catch(() => window.location.assign('/login'));
  }, []);

  // Course Registration Modal State
  const [isCourseRegOpen, setIsCourseRegOpen] = useState(false);
  const [courseRegProfession, setCourseRegProfession] = useState<UserProfession>('college');
  const [courseRegProgramName, setCourseRegProgramName] = useState<string>('Step-Next career program');

  /** Sign-in and sign-up for every role happen on the shared /login page. */
  const handleOpenStudentPortal = (mode: 'login' | 'register' = 'login') => {
    window.location.assign(mode === 'register' ? '/signup' : '/login');
  };

  const handleOpenRegisterCourse = (profession: UserProfession, programName: string) => {
    setCourseRegProfession(profession);
    setCourseRegProgramName(programName);
    setIsCourseRegOpen(true);
  };

  const handleRegistrationSuccess = (profile: StudentProfile) => {
    setUserProfile(profile);
  };

  /** Switches to a sample student account (only works while sample data is loaded). */
  const handleSwitchProfile = async (profile: StudentProfile) => {
    try {
      const res = await auth.demoLogin(profile.profession);
      if (res.student) setUserProfile(res.student);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not switch accounts.');
    }
  };

  const handleLogout = async () => {
    await auth.logout().catch(() => {});
    setUserProfile(null);
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookConsultation = () => {
    if (currentView === 'dashboard') {
      setCurrentView('landing');
      setTimeout(() => {
        scrollToSection('#contact', 76);
      }, 100);
      return;
    }

    scrollToSection('#contact', 76);
    setTimeout(() => {
      const input = document.getElementById('contact-name');
      if (input) {
        input.focus();
      }
    }, 400);
  };

  const handleExploreServices = () => {
    if (currentView === 'dashboard') {
      setCurrentView('landing');
      setTimeout(() => {
        scrollToSection('#services', 76);
      }, 100);
      return;
    }
    scrollToSection('#services', 76);
  };

  const handleServiceSelect = (serviceTitle: string) => {
    setSelectedService(serviceTitle);
    scrollToSection('#contact', 76);
    setTimeout(() => {
      const select = document.getElementById('contact-service');
      if (select) {
        select.focus();
      }
    }, 400);
  };

  // If user is viewing the student dashboard
  if (currentView === 'dashboard' && userProfile) {
    return (
      <div className="min-h-screen bg-slate-100 text-[#0F172A] relative flex flex-col selection:bg-blue-600 selection:text-white">
        <StudentDashboard
          profile={userProfile}
          onLogout={handleLogout}
          onSwitchProfile={handleSwitchProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] relative flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Sticky Top Navbar */}
      <Navbar
        onBookConsultation={handleBookConsultation}
        onOpenStudentPortal={() => handleOpenStudentPortal('login')}
        onOpenSignIn={() => handleOpenStudentPortal('login')}
        onOpenRegister={() => handleOpenStudentPortal('register')}
        userProfile={userProfile}
        onOpenDashboard={() => setCurrentView('dashboard')}
        onLogout={handleLogout}
        onSwitchProfile={handleSwitchProfile}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-grow">
        {/* 1. Hero Section */}
        <Hero
          onBookConsultation={handleBookConsultation}
          onExploreServices={handleExploreServices}
        />

        {/* 2. Services Section: 4 Specialized Career Programs + Core Services */}
        <ServicesSection
          onSelectService={handleServiceSelect}
          onOpenRegisterProgram={handleOpenRegisterCourse}
        />

        {/* 4. Add-On Services (Resume, LinkedIn, Cover Letter, 1:1 Strategy Call) */}
        <AddOnServicesSection />

        {/* 5. About Section */}
        <AboutSection />

        {/* 6. Why Choose Us */}
        <WhyChooseUs />

        {/* 7. How It Works */}
        <HowItWorks />

        {/* 8. Benefits Section */}
        <BenefitsSection />

        {/* 9. Student Feedback / Testimonials */}
        <Testimonials />

        {/* 10. Call to Action */}
        <CTASection
          onBookConsultation={handleBookConsultation}
          onContactClick={handleBookConsultation}
        />

        {/* 11. Contact / Consultation Form Section */}
        <ContactSection preselectedService={selectedService} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Scroll to Top */}
      <ScrollToTop />

      {/* Floating WhatsApp Support Action Button */}
      <WhatsAppButton />

      {/* Course Registration Modal (With direct WhatsApp & Email actions) */}
      <CourseRegistrationModal
        isOpen={isCourseRegOpen}
        onClose={() => setIsCourseRegOpen(false)}
        initialProfession={courseRegProfession}
        initialProgramName={courseRegProgramName}
        currentUserProfile={userProfile}
        onRegistrationSuccess={handleRegistrationSuccess}
        onOpenDashboard={() => setCurrentView('dashboard')}
      />
    </div>
  );
}
