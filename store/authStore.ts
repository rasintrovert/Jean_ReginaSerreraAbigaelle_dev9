import { create } from 'zustand';
import { 
  login as firebaseLogin, 
  register as firebaseRegister,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getUserProfile,
  getAuthErrorMessage,
  UserProfile
} from '@/services/firebase/authService';
import { UserRole } from '@/types/user';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organization?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
}

// Convertir UserProfile en User pour le store
function profileToUser(profile: UserProfile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    phone: profile.phone,
    organization: profile.organization,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Commence à true pour vérifier l'état initial
  error: null,
  
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await firebaseLogin(credentials.email, credentials.password);
      const user = profileToUser(profile);
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = getAuthErrorMessage(error);
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false 
      });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await firebaseSignOut();
      set({ 
        user: null, 
        isAuthenticated: false,
        error: null 
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      const errorMessage = getAuthErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },
  
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await firebaseRegister(
        data.email,
        data.password,
        data.name,
        data.role
      );
      const user = profileToUser(profile);
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = getAuthErrorMessage(error);
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false 
      });
      throw error;
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  initializeAuth: () => {
    // Écouter les changements d'état d'authentification
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Utilisateur connecté, récupérer le profil
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            const user = profileToUser(profile);
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            // Profil non trouvé, déconnecter
            await firebaseSignOut();
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      } else {
        // Utilisateur déconnecté
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    });
    
    // Retourner la fonction de nettoyage (optionnel, pour cleanup)
    return unsubscribe;
  },
}));

