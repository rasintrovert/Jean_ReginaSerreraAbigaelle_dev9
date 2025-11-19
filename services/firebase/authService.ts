/**
 * Service d'authentification Firebase pour GraceRegistry
 * Gère l'authentification et les profils utilisateurs dans Firestore
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError,
  AuthErrorCodes
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth, firestore } from './config';
import { UserRole } from '@/types/user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organization?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Convertir une erreur Firebase Auth en message lisible
 */
export function getAuthErrorMessage(error: AuthError): string {
  const code = error.code;
  
  switch (code) {
    case AuthErrorCodes.INVALID_EMAIL:
      return 'errors.auth.invalidEmail';
    case AuthErrorCodes.USER_DISABLED:
      return 'errors.auth.userDisabled';
    case AuthErrorCodes.USER_NOT_FOUND:
      return 'errors.auth.userNotFound';
    case AuthErrorCodes.WRONG_PASSWORD:
      return 'errors.auth.wrongPassword';
    case AuthErrorCodes.EMAIL_EXISTS:
      return 'errors.auth.emailAlreadyInUse';
    case AuthErrorCodes.WEAK_PASSWORD:
      return 'errors.auth.weakPassword';
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
      return 'errors.auth.tooManyRequests';
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
      return 'errors.auth.networkRequestFailed';
    case AuthErrorCodes.REQUIRES_RECENT_LOGIN:
      return 'errors.auth.requiresRecentLogin';
    default:
      return 'errors.auth.default';
  }
}

/**
 * Récupérer le profil utilisateur depuis Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    return {
      id: userId,
      name: data.name || '',
      email: data.email || '',
      role: data.role as UserRole,
      phone: data.phone,
      organization: data.organization,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Créer ou mettre à jour le profil utilisateur dans Firestore
 */
export async function createOrUpdateUserProfile(
  userId: string,
  profileData: {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    organization?: string;
  }
): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Mettre à jour le profil existant
      await setDoc(
        userRef,
        {
          ...profileData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // Créer un nouveau profil
      await setDoc(userRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}

/**
 * Connexion avec email et mot de passe
 */
export async function login(email: string, password: string): Promise<UserProfile> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Récupérer le profil utilisateur depuis Firestore
    const profile = await getUserProfile(firebaseUser.uid);
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    return profile;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Inscription avec email et mot de passe
 */
export async function register(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone?: string,
  organization?: string
): Promise<UserProfile> {
  try {
    // Créer le compte Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Créer le profil utilisateur dans Firestore
    await createOrUpdateUserProfile(firebaseUser.uid, {
      name,
      email,
      role,
      phone,
      organization,
    });
    
    // Récupérer le profil créé
    const profile = await getUserProfile(firebaseUser.uid);
    
    if (!profile) {
      throw new Error('Failed to create user profile');
    }
    
    return profile;
  } catch (error: any) {
    console.error('Register error:', error);
    throw error;
  }
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Obtenir l'utilisateur actuellement connecté
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Écouter les changements d'état d'authentification
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

