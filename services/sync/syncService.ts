/**
 * Service de synchronisation principal
 * Orchestre la synchronisation entre SQLite (local) et Firestore (cloud)
 */

import NetInfo from '@react-native-community/netinfo';
import { firestore } from '@/services/firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { executeSql, querySql, runSql } from '@/services/database/sqlite';
// Note: On ne peut pas modifier directement le store Zustand depuis l'extérieur
// Les mises à jour doivent passer par les actions du store
// Pour l'instant, on logge les changements et on laisse le store se mettre à jour via ses propres actions

export type RecordType = 'pregnancy' | 'birth';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

interface PendingRecord {
  id: string;
  type: RecordType;
  data: any;
  status: SyncStatus;
  retry_count: number;
  last_error?: string;
  created_at: number;
  updated_at: number;
}

// Verrou pour empêcher les synchronisations concurrentes
let isSyncing = false;

/**
 * Ajouter un enregistrement à la queue de synchronisation
 */
export async function addToSyncQueue(
  type: RecordType,
  data: any
): Promise<string> {
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await runSql(
    `INSERT INTO pending_records (id, type, data, status, retry_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, type, JSON.stringify(data), 'pending', 0, now, now]
  );

  // Ne pas appeler syncPendingRecords ici - laisser le store gérer la synchronisation
  // Cela évite les appels multiples simultanés qui causent des doublons

  return id;
}

/**
 * Synchroniser tous les enregistrements en attente
 */
export async function syncPendingRecords(): Promise<void> {
  // Empêcher les synchronisations concurrentes
  if (isSyncing) {
    console.log('⚠️ Sync already in progress, skipping...');
    return;
  }

  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('No internet connection. Sync skipped.');
    return;
  }

  // Activer le verrou
  isSyncing = true;
  console.log('Starting sync...');

  try {
    // S'assurer que la base de données est initialisée
    const { initDatabase } = await import('@/services/database/sqlite');
    await initDatabase();
    
    // Récupérer uniquement les enregistrements en attente (pas ceux en cours de sync)
    // Utiliser une transaction pour éviter les race conditions
    const rows = await querySql(
      `SELECT * FROM pending_records 
       WHERE (status = 'pending' OR (status = 'failed' AND retry_count < 3))
       AND status != 'syncing'
       ORDER BY created_at ASC
       LIMIT 10`
    );

    const pendingRecords: PendingRecord[] = rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
      status: row.status,
      retry_count: row.retry_count,
      last_error: row.last_error,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    if (pendingRecords.length === 0) {
      console.log('No pending records to sync');
      return;
    }

    // Synchroniser chaque enregistrement
    for (const record of pendingRecords) {
      await syncSingleRecord(record);
    }

    const pendingCount = await getPendingCount();
    console.log('Sync completed. Pending:', pendingCount);
    // Le store se mettra à jour via syncAll() qui appelle cette fonction
  } catch (error) {
    console.error('Sync error:', error);
    throw error; // Laisser le store gérer l'erreur
  } finally {
    // Libérer le verrou dans tous les cas
    isSyncing = false;
  }
}

/**
 * Synchroniser un seul enregistrement
 */
async function syncSingleRecord(record: PendingRecord): Promise<void> {
  // Vérifier que l'enregistrement est toujours en attente avant de le synchroniser
  // Cela évite de synchroniser deux fois le même enregistrement
  const checkRow = await querySql(
    `SELECT status FROM pending_records WHERE id = ?`,
    [record.id]
  );

  if (checkRow.length === 0) {
    console.log(`⚠️ Record ${record.id} already deleted, skipping...`);
    return;
  }

  if (checkRow[0].status === 'syncing') {
    console.log(`⚠️ Record ${record.id} already syncing, skipping...`);
    return;
  }

  // Marquer comme "en cours de synchronisation" de manière atomique
  // La condition WHERE status != 'syncing' empêche la mise à jour si déjà en cours
  await runSql(
    `UPDATE pending_records 
     SET status = 'syncing', updated_at = ?
     WHERE id = ? AND status != 'syncing'`,
    [Date.now(), record.id]
  );

  // Vérifier à nouveau que le statut a bien été mis à jour
  const verifyRow = await querySql(
    `SELECT status FROM pending_records WHERE id = ?`,
    [record.id]
  );

  if (verifyRow.length === 0 || verifyRow[0].status !== 'syncing') {
    console.log(`⚠️ Record ${record.id} was already being synced by another process, skipping...`);
    return;
  }

  try {
    // Déterminer la collection Firestore
    const collectionName = record.type === 'pregnancy' ? 'pregnancies' : 'births';

    // Ajouter à Firestore
    const docRef = await addDoc(collection(firestore, collectionName), {
      ...record.data,
      synced: true,
      validationStatus: record.data.validationStatus || 'pending', // Statut de validation admin
      createdAt: Timestamp.fromMillis(record.created_at),
      updatedAt: Timestamp.now(),
    });

    // Supprimer de la queue (sync réussie)
    await runSql(`DELETE FROM pending_records WHERE id = ?`, [record.id]);

    // Optionnel : Sauvegarder dans la table de cache local
    const cacheTable = record.type === 'pregnancy' ? 'synced_pregnancies' : 'synced_births';
    await runSql(
      `INSERT OR REPLACE INTO ${cacheTable} (id, data, synced_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [docRef.id, JSON.stringify({ ...record.data, firestoreId: docRef.id }), Date.now(), Date.now()]
    );

    console.log(`✅ Synced ${record.type} ${record.id} -> ${docRef.id}`);
  } catch (error: any) {
    console.error(`❌ Sync failed for ${record.id}:`, error);

    // Marquer comme échoué et incrémenter retry_count
    await runSql(
      `UPDATE pending_records 
       SET status = 'failed', 
           retry_count = retry_count + 1,
           last_error = ?,
           updated_at = ?
       WHERE id = ?`,
      [error.message || 'Unknown error', Date.now(), record.id]
    );
  }
}

/**
 * Récupérer les enregistrements depuis Firestore (Pull)
 */
export async function pullFromFirestore(
  type: RecordType,
  lastSyncTimestamp?: number
): Promise<void> {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('No internet connection. Pull skipped.');
    return;
  }

  try {
    // S'assurer que la base de données est initialisée
    const { initDatabase } = await import('@/services/database/sqlite');
    await initDatabase();
    
    const collectionName = type === 'pregnancy' ? 'pregnancies' : 'births';
    const q = query(
      collection(firestore, collectionName),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const cacheTable = type === 'pregnancy' ? 'synced_pregnancies' : 'synced_births';

    // Récupérer tous les IDs existants dans Firestore
    const firestoreIds = new Set<string>();
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      firestoreIds.add(docId);
      
      // Sauvegarder dans le cache local
      await runSql(
        `INSERT OR REPLACE INTO ${cacheTable} (id, data, synced_at, updated_at)
         VALUES (?, ?, ?, ?)`,
        [
          docId,
          JSON.stringify(data),
          Date.now(),
          data.updatedAt?.toMillis() || Date.now(),
        ]
      );
    }

    // Supprimer de SQLite les enregistrements qui n'existent plus dans Firestore
    const existingRows = await querySql(`SELECT id FROM ${cacheTable}`);
    const existingIds = new Set(existingRows.map((row: any) => row.id));
    
    for (const existingId of existingIds) {
      if (!firestoreIds.has(existingId)) {
        await runSql(`DELETE FROM ${cacheTable} WHERE id = ?`, [existingId]);
        console.log(`🗑️ Removed ${type} ${existingId} from local cache (not in Firestore)`);
      }
    }

    // Mettre à jour le timestamp de dernière sync
    await runSql(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [`last_sync_${type}`, Date.now().toString(), Date.now()]
    );

    console.log(`✅ Pulled ${querySnapshot.size} ${type} records from Firestore`);
  } catch (error) {
    console.error(`❌ Pull error for ${type}:`, error);
    throw error;
  }
}

/**
 * Obtenir le nombre d'enregistrements en attente
 */
export async function getPendingCount(): Promise<{ pregnancies: number; births: number }> {
  try {
    // S'assurer que la base de données est initialisée
    const { initDatabase } = await import('@/services/database/sqlite');
    await initDatabase();
    
    const rows = await querySql(
      `SELECT type, COUNT(*) as count 
       FROM pending_records 
       WHERE status = 'pending' OR status = 'failed'
       GROUP BY type`
    );

    const counts = { pregnancies: 0, births: 0 };
    rows.forEach((row: any) => {
      if (row.type === 'pregnancy') {
        counts.pregnancies = row.count;
      } else {
        counts.births = row.count;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return { pregnancies: 0, births: 0 };
  }
}

/**
 * Charger toutes les grossesses depuis SQLite (pending + synced)
 */
export async function loadPregnanciesFromSQLite(): Promise<any[]> {
  try {
    const pregnancies: any[] = [];

    // Charger les enregistrements en attente
    const pendingRows = await querySql(
      `SELECT * FROM pending_records 
       WHERE type = 'pregnancy'
       ORDER BY created_at DESC`
    );

    pendingRows.forEach((row: any) => {
      try {
        const data = JSON.parse(row.data);
        pregnancies.push({
          ...data,
          id: row.id,
          status: 'pending' as const,
          createdAt: new Date(row.created_at).toISOString(),
        });
      } catch (error) {
        console.error('Error parsing pending pregnancy:', error);
      }
    });

    // Charger les enregistrements synchronisés
    const syncedRows = await querySql(
      `SELECT * FROM synced_pregnancies 
       ORDER BY updated_at DESC`
    );

    syncedRows.forEach((row: any) => {
      try {
        const data = JSON.parse(row.data);
        // Utiliser l'ID Firestore si disponible, sinon l'ID local
        const uniqueId = data.firestoreId || row.id;
        pregnancies.push({
          ...data,
          id: uniqueId,
          firestoreId: data.firestoreId, // Garder le firestoreId pour la déduplication
          status: 'synced' as const,
          createdAt: data.createdAt || new Date(row.synced_at).toISOString(),
        });
      } catch (error) {
        console.error('Error parsing synced pregnancy:', error);
      }
    });

    // Dédupliquer (priorité aux synced, et exclure les pending qui sont déjà synced)
    const uniquePregnancies = new Map<string, any>();
    const syncedIds = new Set(syncedRows.map((row: any) => {
      try {
        const data = JSON.parse(row.data);
        // Utiliser l'ID Firestore si disponible, sinon l'ID local
        return data.firestoreId || row.id;
      } catch {
        return row.id;
      }
    }));
    
    pregnancies.forEach((p) => {
      // Identifier la clé unique - utiliser firestoreId si disponible
      const uniqueKey = p.firestoreId || p.id;
      
      // Si c'est un pending mais qu'il existe déjà en synced, on l'ignore
      if (p.status === 'pending' && syncedIds.has(uniqueKey)) {
        return;
      }
      
      // Si on a déjà cette clé, on garde seulement si c'est synced
      if (!uniquePregnancies.has(uniqueKey) || p.status === 'synced') {
        uniquePregnancies.set(uniqueKey, p);
      }
    });

    console.log(`📊 Loaded ${uniquePregnancies.size} unique pregnancies (${pendingRows.length} pending, ${syncedRows.length} synced)`);
    return Array.from(uniquePregnancies.values());
  } catch (error) {
    console.error('Error loading pregnancies from SQLite:', error);
    return [];
  }
}

/**
 * Supprimer un enregistrement (pregnancy ou birth)
 * Supprime de SQLite et Firestore si synchronisé
 */
export async function deleteRecord(
  type: RecordType,
  id: string,
  firestoreId?: string
): Promise<void> {
  try {
    // S'assurer que la base de données est initialisée
    const { initDatabase } = await import('@/services/database/sqlite');
    await initDatabase();
    
    // 1. Supprimer de pending_records si présent
    await runSql(`DELETE FROM pending_records WHERE id = ?`, [id]);
    
    // 2. Supprimer de la table de cache si présent
    const cacheTable = type === 'pregnancy' ? 'synced_pregnancies' : 'synced_births';
    if (firestoreId) {
      await runSql(`DELETE FROM ${cacheTable} WHERE id = ?`, [firestoreId]);
    } else {
      // Si pas de firestoreId, essayer avec l'ID local
      await runSql(`DELETE FROM ${cacheTable} WHERE id = ?`, [id]);
    }
    
    // 3. Supprimer de Firestore si synchronisé et en ligne
    if (firestoreId) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const collectionName = type === 'pregnancy' ? 'pregnancies' : 'births';
          await deleteDoc(doc(firestore, collectionName, firestoreId));
          console.log(`✅ Deleted ${type} ${firestoreId} from Firestore`);
        } catch (error) {
          console.error(`❌ Error deleting from Firestore:`, error);
          // On continue même si la suppression Firestore échoue
        }
      }
    }
    
    console.log(`✅ Deleted ${type} ${id} from local database`);
  } catch (error) {
    console.error(`❌ Error deleting ${type} record:`, error);
    throw error;
  }
}

/**
 * Charger toutes les naissances depuis SQLite (pending + synced)
 */
export async function loadBirthsFromSQLite(): Promise<any[]> {
  try {
    const births: any[] = [];

    // Charger les enregistrements en attente
    const pendingRows = await querySql(
      `SELECT * FROM pending_records 
       WHERE type = 'birth'
       ORDER BY created_at DESC`
    );

    pendingRows.forEach((row: any) => {
      try {
        const data = JSON.parse(row.data);
        births.push({
          ...data,
          id: row.id,
          synced: false,
          certificateStatus: data.certificateStatus || 'pending',
          createdAt: new Date(row.created_at).toISOString(),
        });
      } catch (error) {
        console.error('Error parsing pending birth:', error);
      }
    });

    // Charger les enregistrements synchronisés
    const syncedRows = await querySql(
      `SELECT * FROM synced_births 
       ORDER BY updated_at DESC`
    );

    syncedRows.forEach((row: any) => {
      try {
        const data = JSON.parse(row.data);
        // Utiliser l'ID Firestore si disponible, sinon l'ID local
        const uniqueId = data.firestoreId || row.id;
        births.push({
          ...data,
          id: uniqueId,
          firestoreId: data.firestoreId, // Garder le firestoreId pour la déduplication
          synced: true,
          certificateStatus: data.certificateStatus || 'pending',
          createdAt: data.createdAt || new Date(row.synced_at).toISOString(),
        });
      } catch (error) {
        console.error('Error parsing synced birth:', error);
      }
    });

    // Dédupliquer (priorité aux synced, et exclure les pending qui sont déjà synced)
    const uniqueBirths = new Map<string, any>();
    const syncedIds = new Set(syncedRows.map((row: any) => {
      try {
        const data = JSON.parse(row.data);
        // Utiliser l'ID Firestore si disponible, sinon l'ID local
        return data.firestoreId || row.id;
      } catch {
        return row.id;
      }
    }));
    
    births.forEach((b) => {
      // Identifier la clé unique - utiliser firestoreId si disponible
      const uniqueKey = b.firestoreId || b.id;
      
      // Si c'est un pending mais qu'il existe déjà en synced, on l'ignore
      if (!b.synced && syncedIds.has(uniqueKey)) {
        return;
      }
      
      // Si on a déjà cette clé, on garde seulement si c'est synced
      if (!uniqueBirths.has(uniqueKey) || b.synced) {
        uniqueBirths.set(uniqueKey, b);
      }
    });

    console.log(`📊 Loaded ${uniqueBirths.size} unique births (${pendingRows.length} pending, ${syncedRows.length} synced)`);
    return Array.from(uniqueBirths.values());
  } catch (error) {
    console.error('Error loading births from SQLite:', error);
    return [];
  }
}

