//frontend/src/lib/validation.ts
import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name is too long'),
  email: z.string().email('Please enter a valid email address'),
  whatsapp: z
    .string()
    .min(10, 'Please enter a valid WhatsApp number')
    .max(20, 'WhatsApp number is too long')
    .regex(/^[+]?[\d\s-()]+$/, 'Please enter a valid WhatsApp number'),
  academicStatus: z.string().min(1, 'Please select your academic status'),
  universityName: z
    .string()
    .min(2, 'University name is required')
    .max(150, 'University name is too long'),
  department: z.string().max(150, 'Department name is too long').optional(),
  researchLevel: z.string().min(1, 'Please select your research knowledge level'),
  higherStudyInterest: z.enum(['Yes', 'No']),
  preferredCountry: z.string().optional(),
  registrationSource: z.string().min(1, 'Please select how you heard about us'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to continue' }),
  }),
}).refine(
  (data) => {
    if (data.higherStudyInterest === 'Yes') {
      return data.preferredCountry && data.preferredCountry.length > 0;
    }
    return true;
  },
  {
    message: 'Please select your preferred country',
    path: ['preferredCountry'],
  }
);

export type RegistrationSchemaType = z.infer<typeof registrationSchema>;