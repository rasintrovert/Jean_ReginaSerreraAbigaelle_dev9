export interface Pregnancy {
  id: string;
  motherName: string;
  fatherName: string;
  lastMenstruationDate: string;
  expectedDueDate: string;
  location: string;
  address?: string;
  prenatalCare: boolean;
  hospitalName?: string;
  notes?: string;
  status: 'pending' | 'synced';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyFormData {
  // Étape 1 : Informations de la mère
  motherFirstNames: string[];
  motherLastName: string;
  motherBirthDate: string;
  motherPhone: string;
  motherPhoneAlt?: string;
  motherAddress: string;
  motherCity: string;
  motherDepartment: string;
  motherBloodGroup?: string;
  // Étape 2 : Informations de grossesse
  estimatedDeliveryDate?: string;
  estimatedDeliveryMonth?: string;
  pregnancyCount: string;
  healthCondition?: string;
  notes?: string;
}

