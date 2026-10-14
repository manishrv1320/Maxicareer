export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  deliverables: string[];
  iconName: string;
  badge: string;
}

export interface WhyChooseItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  subPoints: string[];
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  authorType: string;
  cohort: string;
  focusArea: string;
  verifiedLabel: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  phone?: string;
  serviceInterest?: string;
  message: string;
}

export type UserProfession = 'school' | 'college' | 'fresher' | 'working_professional';

export interface PricingPlan {
  id: string;
  profession: UserProfession;
  cohortBadge: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  launchOffer?: boolean;
  popular?: boolean;
  recommendedFor: string;
  features: string[];
}

export interface AddOnService {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  description: string;
  deliveryTime: string;
  isScheduleBased?: boolean;
  features?: string[];
}

export interface RegistrationFormData {
  profession: UserProfession;
  name: string;
  email: string;
  phone: string;
  city: string;
  // School fields
  schoolName?: string;
  classGrade?: string;
  streamInterest?: string;
  // College fields
  collegeName?: string;
  degree?: string;
  yearOfStudy?: string;
  targetDomain?: string;
  // Fresher / PSW fields
  graduationYear?: string;
  highestQualification?: string;
  targetRole?: string;
  pswStatus?: string;
  // Working professional fields
  company?: string;
  designation?: string;
  experienceYears?: string;
  careerGoal?: string;
  // Plan & Add-ons
  selectedPlanId: string;
  selectedAddOnIds?: string[];
  additionalNotes?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  profession: UserProfession;
  professionLabel: string;
  institutionOrCompany: string;
  detail: string;
  planName: string;
  planPrice: number;
  selectedAddOns?: string[];
  registeredDate: string;
  roadmapProgress: number;
  avatarUrl?: string;
  authProvider?: 'google' | 'email' | 'credentials';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface DbStudent {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  profession: UserProfession;
  professionLabel: string;
  institutionOrCompany: string;
  detail: string;
  planName: string;
  planPrice: number;
  selectedAddOns: string[];
  status: 'pending' | 'contacted' | 'enrolled' | 'completed' | 'cancelled';
  mentorAssigned: string;
  counselorAssigned?: string;
  programEndsAt?: string;
  notes: string;
  academicDetails?: Record<string, any>;
  roadmapProgress: number;
  registeredDate: string;
  createdAt: string;
  updatedAt: string;
  source: 'portal_registration' | 'quick_consultation' | 'synthetic_seed' | 'admin_manual';
}

export interface MongoStats {
  mode: 'synthetic' | 'mongodb';
  status: 'connected' | 'disconnected' | 'connecting' | 'fallback_active';
  dbName: string;
  collection: string;
  totalStudents: number;
  totalPipelineRevenue: number;
  cohortBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  uriHost: string;
  lastPingMs: number;
  isRealMongo: boolean;
  version: string;
}

