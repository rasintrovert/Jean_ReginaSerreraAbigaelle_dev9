/**
 * Service pour les fonctionnalités admin
 * Gère la validation/rejet des enregistrements
 */

import { firestore } from '@/services/firebase/config';
import NetInfo from '@react-native-community/netinfo';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

export type ValidationStatus = 'pending' | 'validated' | 'rejected';
export type RecordType = 'pregnancy' | 'birth';

/**
 * Valider un enregistrement (pregnancy ou birth)
 */
export async function validateRecord(
  type: RecordType,
  firestoreId: string,
  validatedBy?: string
): Promise<void> {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('No internet connection');
  }

  try {
    const collectionName = type === 'pregnancy' ? 'pregnancies' : 'births';
    const docRef = doc(firestore, collectionName, firestoreId);
    
    await updateDoc(docRef, {
      validationStatus: 'validated' as ValidationStatus,
      validatedAt: Timestamp.now(),
      validatedBy: validatedBy || 'admin',
      updatedAt: Timestamp.now(),
    });

    if (__DEV__) console.log(`${type} ${firestoreId} validated`);
  } catch (error) {
    if (__DEV__) console.error(`Error validating ${type}:`, error);
    throw error;
  }
}

/**
 * Rejeter un enregistrement (pregnancy ou birth)
 */
export async function rejectRecord(
  type: RecordType,
  firestoreId: string,
  reason: string,
  rejectedBy?: string
): Promise<void> {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('No internet connection');
  }

  try {
    const collectionName = type === 'pregnancy' ? 'pregnancies' : 'births';
    const docRef = doc(firestore, collectionName, firestoreId);
    
    await updateDoc(docRef, {
      validationStatus: 'rejected' as ValidationStatus,
      rejectionReason: reason,
      rejectedAt: Timestamp.now(),
      rejectedBy: rejectedBy || 'admin',
      updatedAt: Timestamp.now(),
    });

    if (__DEV__) console.log(`${type} ${firestoreId} rejected`);
  } catch (error) {
    if (__DEV__) console.error(`Error rejecting ${type}:`, error);
    throw error;
  }
}

/**
 * Valider plusieurs enregistrements en masse
 */
export async function validateRecordsBulk(
  type: RecordType,
  firestoreIds: string[],
  validatedBy?: string
): Promise<void> {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('No internet connection');
  }

  try {
    const collectionName = type === 'pregnancy' ? 'pregnancies' : 'births';
    const batch = writeBatch(firestore);

    // Utiliser batch pour mettre à jour plusieurs documents
    const now = Timestamp.now();
    for (const id of firestoreIds) {
      const docRef = doc(firestore, collectionName, id);
      batch.update(docRef, {
        validationStatus: 'validated' as ValidationStatus,
        validatedAt: now,
        validatedBy: validatedBy || 'admin',
        updatedAt: now,
      });
    }

    await batch.commit();
    if (__DEV__) console.log(`${firestoreIds.length} ${type} records validated`);
  } catch (error) {
    if (__DEV__) console.error(`Error bulk validating ${type}:`, error);
    throw error;
  }
}

/**
 * Récupérer tous les enregistrements avec leur statut de validation
 * Note: On charge tous les enregistrements et on filtre côté client pour éviter les index composites
 */
export async function getRecordsForValidation(
  type: RecordType,
  status?: ValidationStatus
): Promise<any[]> {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('No internet connection. Returning empty array.');
    return [];
  }

  try {
    const collectionName = type === 'pregnancy' ? 'pregnancies' : 'births';
    
    // Charger tous les enregistrements et filtrer côté client
    // Cela évite d'avoir besoin d'un index composite
    const q = query(
      collection(firestore, collectionName),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map((doc) => ({
      id: doc.id,
      firestoreId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    }));

    // Filtrer par statut côté client si spécifié
    if (status) {
      records = records.filter((record: any) => {
        const recordStatus = record.validationStatus || 'pending';
        return recordStatus === status;
      });
    }

    return records;
  } catch (error) {
    console.error(`Error fetching ${type} records:`, error);
    // Si l'erreur est liée à l'index, essayer sans orderBy
    try {
      const collectionName = type === 'pregnancy' ? 'pregnancies' : 'births';
      const q = query(collection(firestore, collectionName));
      const snapshot = await getDocs(q);
      let records = snapshot.docs.map((doc) => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      }));

      // Trier côté client
      records.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Filtrer par statut côté client si spécifié
      if (status) {
        records = records.filter((record: any) => {
          const recordStatus = record.validationStatus || 'pending';
          return recordStatus === status;
        });
      }

      return records;
    } catch (fallbackError) {
      console.error(`Error in fallback fetch for ${type}:`, fallbackError);
      return [];
    }
  }
}

