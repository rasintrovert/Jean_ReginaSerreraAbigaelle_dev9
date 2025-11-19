/**
 * Service de gestion des signalements d'urgence
 * Permet aux agents de signaler des urgences qui seront notifiées aux admins
 */

import { 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { useAuthStore } from '@/store/authStore';

export interface EmergencyReport {
  id?: string;
  emergencyType: string;
  description: string;
  location: string;
  contactPhone: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string; // User ID
  reportedByName?: string; // Nom de l'agent
  reportedByEmail?: string; // Email de l'agent
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: Timestamp | Date;
  acknowledgedAt?: Timestamp | Date;
  acknowledgedBy?: string; // Admin ID qui a pris en charge
  resolvedAt?: Timestamp | Date;
  resolvedBy?: string; // Admin ID qui a résolu
  notes?: string; // Notes de l'admin
}

export interface CreateEmergencyReportData {
  emergencyType: string;
  description: string;
  location: string;
  contactPhone: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Créer un signalement d'urgence
 */
export async function createEmergencyReport(
  reportData: CreateEmergencyReportData
): Promise<string> {
  try {
    const { user } = useAuthStore.getState();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const emergencyReport: Omit<EmergencyReport, 'id'> = {
      ...reportData,
      reportedBy: user.id,
      reportedByName: user.name,
      reportedByEmail: user.email,
      status: 'pending',
      createdAt: serverTimestamp() as any,
    };

    const docRef = await addDoc(
      collection(firestore, 'emergency_reports'),
      emergencyReport
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating emergency report:', error);
    throw error;
  }
}

/**
 * Récupérer tous les signalements d'urgence (pour les admins)
 */
export async function getAllEmergencyReports(): Promise<EmergencyReport[]> {
  try {
    const { getDocs, query, orderBy } = await import('firebase/firestore');
    const reportsRef = collection(firestore, 'emergency_reports');
    const q = query(reportsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      acknowledgedAt: doc.data().acknowledgedAt?.toDate(),
      resolvedAt: doc.data().resolvedAt?.toDate(),
    })) as EmergencyReport[];
  } catch (error) {
    console.error('Error fetching emergency reports:', error);
    throw error;
  }
}

/**
 * Marquer un signalement comme pris en charge (pour les admins)
 */
export async function acknowledgeEmergencyReport(
  reportId: string,
  adminId: string
): Promise<void> {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const reportRef = doc(firestore, 'emergency_reports', reportId);
    
    await updateDoc(reportRef, {
      status: 'acknowledged',
      acknowledgedBy: adminId,
      acknowledgedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error acknowledging emergency report:', error);
    throw error;
  }
}

/**
 * Marquer un signalement comme résolu (pour les admins)
 */
export async function resolveEmergencyReport(
  reportId: string,
  adminId: string,
  notes?: string
): Promise<void> {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const reportRef = doc(firestore, 'emergency_reports', reportId);
    
    await updateDoc(reportRef, {
      status: 'resolved',
      resolvedBy: adminId,
      resolvedAt: serverTimestamp(),
      notes: notes || '',
    });
  } catch (error) {
    console.error('Error resolving emergency report:', error);
    throw error;
  }
}

