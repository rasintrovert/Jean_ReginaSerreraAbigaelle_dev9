/**
 * Service API pour les enregistrements de grossesse
 * Utilise async/await avec axios
 */

import { get, post, put, del } from './client';
import { PregnancyFormData } from '@/types/pregnancy';

export interface PregnancyRecord {
  id: string;
  motherFirstNames: string[];
  motherLastName: string;
  motherBirthDate: string;
  motherPhone: string;
  motherPhoneAlt?: string;
  motherAddress: string;
  motherCity: string;
  motherDepartment: string;
  motherBloodGroup?: string;
  estimatedDeliveryDate?: string;
  estimatedDeliveryMonth?: string;
  pregnancyCount: string;
  healthCondition?: string;
  notes?: string;
  status: 'pending' | 'validated' | 'legalized';
  createdAt: string;
  updatedAt: string;
}

/**
 * Récupérer toutes les grossesses
 */
export async function fetchPregnancies(): Promise<PregnancyRecord[]> {
  try {
    const data = await get<PregnancyRecord[]>('/api/pregnancies');
    return data;
  } catch (error) {
    console.error('Error fetching pregnancies:', error);
    throw error;
  }
}

/**
 * Récupérer une grossesse par ID
 */
export async function fetchPregnancyById(id: string): Promise<PregnancyRecord> {
  try {
    const data = await get<PregnancyRecord>(`/api/pregnancies/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching pregnancy:', error);
    throw error;
  }
}

/**
 * Créer un nouvel enregistrement de grossesse
 */
export async function createPregnancy(pregnancyData: PregnancyFormData): Promise<PregnancyRecord> {
  try {
    const data = await post<PregnancyRecord>('/api/pregnancies', pregnancyData);
    return data;
  } catch (error) {
    console.error('Error creating pregnancy:', error);
    throw error;
  }
}

/**
 * Mettre à jour un enregistrement de grossesse
 */
export async function updatePregnancy(id: string, pregnancyData: Partial<PregnancyFormData>): Promise<PregnancyRecord> {
  try {
    const data = await put<PregnancyRecord>(`/api/pregnancies/${id}`, pregnancyData);
    return data;
  } catch (error) {
    console.error('Error updating pregnancy:', error);
    throw error;
  }
}

/**
 * Supprimer un enregistrement de grossesse
 */
export async function deletePregnancy(id: string): Promise<void> {
  try {
    await del(`/api/pregnancies/${id}`);
  } catch (error) {
    console.error('Error deleting pregnancy:', error);
    throw error;
  }
}

