/**
 * Configuration Firebase pour GraceRegistry
 * 
 * Setup:
 * 1. Créer un projet Firebase sur https://console.firebase.google.com
 * 2. Activer Firestore Database
 * 3. Récupérer les clés de configuration
 * 4. Créer un fichier .env avec les variables
 */

import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

// Configuration Firebase (à remplacer par vos vraies clés)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
};

// Initialiser Firebase (une seule fois)
let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
  // Initialiser Auth - la persistance est automatique pour React Native dans Firebase v9+
  auth = getAuth(app);
} else {
  app = getApps()[0];
  firestore = getFirestore(app);
  // Récupérer l'instance Auth existante
  auth = getAuth(app);
}

export { app, auth, firestore };
export default { app, firestore, auth };

