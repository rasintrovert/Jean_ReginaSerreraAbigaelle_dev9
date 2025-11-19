import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Page d'index du dashboard - redirige vers le dashboard approprié selon le rôle
 */
export default function DashboardIndex() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login' as any);
      return;
    }

    // Rediriger vers le dashboard approprié selon le rôle
    switch (user.role) {
      case 'agent':
        router.replace('/(dashboard)/agent' as any);
        break;
      case 'admin':
        router.replace('/(dashboard)/admin' as any);
        break;
      case 'hospital':
        router.replace('/(dashboard)/hospital' as any);
        break;
      default:
        router.replace('/(auth)/login' as any);
    }
  }, [user, router]);

  // Retourner null pendant la redirection
  return null;
}
