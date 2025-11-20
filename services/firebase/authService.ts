/**
 * Service d'authentification Firebase pour GraceRegistry
 * Gère l'authentification et les profils utilisateurs dans Firestore
 */

import { UserRole } from '@/types/user';
import {
  AuthError,
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, firestore } from './config';

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
  
  // Utiliser les codes d'erreur Firebase (chaînes de caractères)
  switch (code) {
    case AuthErrorCodes.INVALID_EMAIL:
    case 'auth/invalid-email':
      return 'errors.auth.invalidEmail';
    case AuthErrorCodes.USER_DISABLED:
    case 'auth/user-disabled':
      return 'errors.auth.userDisabled';
    case 'auth/user-not-found':
      return 'errors.auth.userNotFound';
    case 'auth/wrong-password':
      return 'errors.auth.wrongPassword';
    case AuthErrorCodes.EMAIL_EXISTS:
    case 'auth/email-already-in-use':
      return 'errors.auth.emailAlreadyInUse';
    case AuthErrorCodes.WEAK_PASSWORD:
    case 'auth/weak-password':
      return 'errors.auth.weakPassword';
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
    case 'auth/too-many-requests':
      return 'errors.auth.tooManyRequests';
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
    case 'auth/network-request-failed':
      return 'errors.auth.networkRequestFailed';
    case 'auth/requires-recent-login':
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
    if (__DEV__) console.error('Error fetching user profile:', error);
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
    if (__DEV__) console.error('Error creating/updating user profile:', error);
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
    if (__DEV__) console.error('Login error:', error);
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
    if (__DEV__) console.error('Register error:', error);
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
    if (__DEV__) console.error('Sign out error:', error);
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

/**
 * Changer le mot de passe de l'utilisateur actuellement connecté
 * Nécessite une réauthentification pour des raisons de sécurité
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('No user is currently signed in');
    }

    // Créer les credentials pour la réauthentification
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    // Réauthentifier l'utilisateur
    await reauthenticateWithCredential(user, credential);

    // Mettre à jour le mot de passe
    await updatePassword(user, newPassword);
  } catch (error: any) {
    if (__DEV__) console.error('Change password error:', error);
    throw error;
  }
}

