/**
 * Configuration de l'application GraceRegistry
 */

export const CONFIG = {
  // URL de l'API backend
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  
  // Configuration de synchronisation
  SYNC_INTERVAL: 30000, // 30 secondes
  SYNC_BATCH_SIZE: 10,
  
  // Configuration de stockage local
  STORAGE_KEYS: {
    USER: '@graceregistry:user',
    AUTH_TOKEN: '@graceregistry:token',
    PREGNANCIES: '@graceregistry:pregnancies',
    BIRTHS: '@graceregistry:births',
    SETTINGS: '@graceregistry:settings',
  },
  
  // Configuration des certificats
  CERTIFICATE: {
    VALIDATION_LEVELS: ['local', 'regional', 'national'] as const,
    TTL_DAYS: 90, // Durée de validité en jours
  },
  
  // Rôles utilisateurs
  ROLES: {
    AGENT: 'agent',
    ADMIN: 'admin',
    HOSPITAL: 'hospital',
  } as const,
};

export const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'ht', name: 'Kreyòl' },
  { code: 'en', name: 'English' },
];

export const STATUS_COLORS = {
  pending: '#ffa500',
  verified: '#4169e1',
  approved: '#32cd32',
  issued: '#00ced1',
  rejected: '#dc143c',
};

