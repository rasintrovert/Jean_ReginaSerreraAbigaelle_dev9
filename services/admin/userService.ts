/**
 * Service de gestion des utilisateurs pour l'admin
 * Gère la création, modification, activation/désactivation des utilisateurs
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { firestore, auth } from '@/services/firebase/config';
import { UserRole } from '@/types/user';

export interface AdminUser {
  id: string; // Firebase Auth UID
  lastName: string;
  firstNames: string[];
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  department?: string; // Code du département (ex: "OU")
  institutionName?: string; // Pour les hôpitaux
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  lastActivity?: Timestamp | Date;
  recordsCount?: number;
  validationsCount?: number;
}

export interface CreateUserData {
  lastName: string;
  firstNames: string[];
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  institutionName?: string;
  password: string; // Mot de passe temporaire
}

export interface UpdateUserData {
  lastName?: string;
  firstNames?: string[];
  email?: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  institutionName?: string;
}

/**
 * Créer un nouvel utilisateur dans Firebase Auth et Firestore
 */
export async function createUser(userData: CreateUserData): Promise<AdminUser> {
  try {
    // 1. Créer le compte Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const firebaseUser = userCredential.user;

    // 2. Construire le nom complet
    const name = userData.firstNames.filter(fn => fn.trim()).join(' ') + ' ' + userData.lastName;

    // 3. Créer le profil dans Firestore
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userProfile: Omit<AdminUser, 'id'> = {
      lastName: userData.lastName,
      firstNames: userData.firstNames,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: 'active',
      department: userData.department,
      institutionName: userData.institutionName,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(userRef, userProfile);

    // 4. Mettre à jour le nom d'affichage dans Firebase Auth
    await firebaseUpdateProfile(firebaseUser, {
      displayName: name.trim(),
    });

    // 5. Récupérer l'utilisateur créé
    const createdUser = await getUserById(firebaseUser.uid);
    if (!createdUser) {
      throw new Error('Failed to retrieve created user');
    }

    return createdUser;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Récupérer un utilisateur par son ID
 */
export async function getUserById(userId: string): Promise<AdminUser | null> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      lastName: data.lastName || '',
      firstNames: Array.isArray(data.firstNames) ? data.firstNames : (data.name ? [data.name] : []),
      email: data.email || '',
      phone: data.phone,
      role: data.role || 'agent',
      status: data.status || 'active',
      department: data.department,
      institutionName: data.institutionName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastActivity: data.lastActivity?.toDate(),
    } as AdminUser;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Récupérer tous les utilisateurs
 */
export async function getAllUsers(): Promise<AdminUser[]> {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const users: AdminUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        lastName: data.lastName || '',
        firstNames: Array.isArray(data.firstNames) ? data.firstNames : (data.name ? [data.name] : []),
        email: data.email || '',
        phone: data.phone,
        role: data.role || 'agent',
        status: data.status || 'active',
        department: data.department,
        institutionName: data.institutionName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastActivity: data.lastActivity?.toDate(),
      } as AdminUser);
    });

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Mettre à jour un utilisateur
 */
export async function updateUser(userId: string, userData: UpdateUserData): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', userId);
    
    // Construire les données à mettre à jour
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
    if (userData.firstNames !== undefined) updateData.firstNames = userData.firstNames;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.department !== undefined) updateData.department = userData.department;
    if (userData.institutionName !== undefined) updateData.institutionName = userData.institutionName;

    await updateDoc(userRef, updateData);

    // Si le nom a changé, mettre à jour le displayName dans Firebase Auth
    if (userData.lastName || userData.firstNames) {
      const user = await getUserById(userId);
      if (user) {
        const name = user.firstNames.filter(fn => fn.trim()).join(' ') + ' ' + user.lastName;
        // Note: On ne peut pas mettre à jour le displayName d'un autre utilisateur directement
        // Il faudrait utiliser Firebase Admin SDK côté serveur pour cela
      }
    }
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Activer ou désactiver un utilisateur
 */
export async function toggleUserStatus(userId: string, status: 'active' | 'inactive'): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
}

/**
 * Réinitialiser le mot de passe d'un utilisateur
 */
export async function resetUserPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

/**
 * Calculer les statistiques d'un utilisateur (nombre d'enregistrements, validations)
 */
export async function getUserStatistics(userId: string): Promise<{
  recordsCount: number;
  validationsCount: number;
}> {
  try {
    // Compter les enregistrements créés par cet utilisateur
    const pregnanciesRef = collection(firestore, 'pregnancies');
    const birthsRef = collection(firestore, 'births');

    const [pregnanciesSnapshot, birthsSnapshot] = await Promise.all([
      getDocs(query(pregnanciesRef, where('recordedBy', '==', userId))),
      getDocs(query(birthsRef, where('recordedBy', '==', userId))),
    ]);

    const recordsCount = pregnanciesSnapshot.size + birthsSnapshot.size;

    // Compter les validations effectuées par cet utilisateur (si c'est un admin)
    // Note: On pourrait ajouter un champ "validatedBy" dans les enregistrements
    const validationsCount = 0; // TODO: Implémenter si nécessaire

    return {
      recordsCount,
      validationsCount,
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return {
      recordsCount: 0,
      validationsCount: 0,
    };
  }
}

