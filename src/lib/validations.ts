import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(80, { message: 'Name cannot exceed 80 characters.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address (e.g. name@domain.com).' }),
  subject: z
    .string()
    .trim()
    .min(3, { message: 'Subject must be at least 3 characters.' })
    .max(120, { message: 'Subject cannot exceed 120 characters.' }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, '').length >= 7, { message: 'Please enter a valid phone number, or leave it empty.' }),
  serviceInterest: z.string().optional(),
  message: z
    .string()
    .trim()
    .min(10, { message: 'Please share at least 10 characters describing your goals or question.' })
    .max(1000, { message: 'Message cannot exceed 1000 characters.' }),
});

export type ContactFormSchema = z.infer<typeof contactFormSchema>;
