import { z } from 'zod';

// Schémas de validation pour les formulaires
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['agent', 'admin', 'hospital']).optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['agent', 'admin', 'hospital']),
  phone: z.string().optional(),
  organization: z.string().optional(),
});

export const pregnancySchema = z.object({
  motherName: z.string().min(2, 'Nom requis'),
  fatherName: z.string().min(2, 'Nom requis'),
  lastMenstruationDate: z.string().min(1, 'Date requise'),
  expectedDueDate: z.string().min(1, 'Date requise'),
  location: z.string().min(2, 'Lieu requis'),
  address: z.string().optional(),
  prenatalCare: z.boolean(),
  hospitalName: z.string().optional(),
  notes: z.string().optional(),
});

export const birthSchema = z.object({
  childLastName: z.string().min(2, 'Nom de famille requis'),
  childFirstName: z.string().min(2, 'Prénom requis'),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  birthTime: z.string().optional(),
  birthPlace: z.string().min(2, 'Lieu de naissance requis'),
  gender: z.enum(['male', 'female', 'other']),
  birthWeight: z.string().optional(),
  
  motherName: z.string().min(2, 'Nom de la mère requis'),
  motherId: z.string().optional(),
  motherNationality: z.string().optional(),
  fatherName: z.string().min(2, 'Nom du père requis'),
  fatherId: z.string().optional(),
  fatherNationality: z.string().optional(),
  
  witness1Name: z.string().min(2, 'Nom du témoin 1 requis'),
  witness1Id: z.string().optional(),
  witness2Name: z.string().min(2, 'Nom du témoin 2 requis'),
  witness2Id: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PregnancyFormData = z.infer<typeof pregnancySchema>;
export type BirthFormData = z.infer<typeof birthSchema>;

