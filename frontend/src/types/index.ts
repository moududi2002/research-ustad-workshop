//frontend/src/types/index.ts
export interface RegistrationFormData {
  fullName: string;
  email: string;
  whatsapp: string;
  academicStatus: string;
  universityName: string;
  department?: string;
  researchLevel: string;
  higherStudyInterest: 'Yes' | 'No';
  preferredCountry?: string;
  registrationSource: string;
  consent: boolean;
}

export interface RegistrationResponse {
  id: string;
  registrationId: string;
  fullName: string;
  email: string;
  workshopDate: string;
  createdAt: string;
}

export interface AdminStats {
  totalRegistrations: number;
  todayRegistrations: number;
  universityStats: { university: string; count: number }[];
  researchLevelStats: { level: string; count: number }[];
  higherStudyStats: { interest: string; count: number };
}