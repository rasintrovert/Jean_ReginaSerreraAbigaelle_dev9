/**
 * Service SQLite pour GraceRegistry
 * Gère la base de données locale pour le mode offline
 * 
 * Utilise l'API moderne d'expo-sqlite (v16+)
 */

import * as SQLite from 'expo-sqlite';

// Instance de la base de données
let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

/**
 * Obtenir ou créer la base de données
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync('graceregistry.db');
      if (!db) {
        throw new Error('Failed to open database');
      }
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  }
  return db;
}

/**
 * Initialiser la base de données
 * Crée les tables nécessaires
 */
export async function initDatabase(): Promise<void> {
  if (isInitialized) {
    return; // Déjà initialisée
  }

  try {
    const database = await getDatabase();
    
    if (!database) {
      throw new Error('Database instance is null');
    }
    
    // Table pour les enregistrements en attente de synchronisation
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_records (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_records(status);
      CREATE INDEX IF NOT EXISTS idx_pending_type ON pending_records(type);
    `);

    // Table pour les métadonnées de synchronisation
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Table pour les enregistrements synchronisés (cache local)
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS synced_pregnancies (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        synced_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS synced_births (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        synced_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    isInitialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    isInitialized = false;
    throw error;
  }
}

/**
 * Exécuter une requête SQL (SELECT)
 */
export async function executeSql(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLResultSet> {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(sql, params);
    
    // Pour compatibilité avec l'ancienne API
    return {
      insertId: result.lastInsertRowId,
      rowsAffected: result.changes,
      rows: {
        length: result.rows ? result.rows.length : 0,
        item: (index: number) => result.rows?.[index] || null,
        _array: result.rows || [],
      },
    } as any;
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

/**
 * Exécuter une requête SQL et retourner les résultats (SELECT)
 */
export async function querySql(
  sql: string,
  params: any[] = []
): Promise<any[]> {
  try {
    // S'assurer que la base de données est initialisée
    if (!isInitialized) {
      await initDatabase();
    }
    
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database instance is null');
    }
    
    const result = await database.getAllAsync(sql, params);
    return result || [];
  } catch (error) {
    console.error('SQL query error:', error);
    // Retourner un tableau vide en cas d'erreur plutôt que de planter
    return [];
  }
}

/**
 * Exécuter une requête SQL sans retour (INSERT, UPDATE, DELETE)
 */
export async function runSql(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> {
  try {
    // S'assurer que la base de données est initialisée
    if (!isInitialized) {
      await initDatabase();
    }
    
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database instance is null');
    }
    
    return await database.runAsync(sql, params);
  } catch (error) {
    console.error('SQL run error:', error);
    throw error;
  }
}

/**
 * Obtenir l'instance de la base de données
 */
export async function getDatabaseInstance(): Promise<SQLite.SQLiteDatabase> {
  return await getDatabase();
}
