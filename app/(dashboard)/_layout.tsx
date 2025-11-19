import { Stack } from 'expo-router';

/**
 * Layout parent simplifié pour le dashboard
 * 
 * Ce layout ne fait que router vers les modules (admin/agent/hospital).
 * Chaque module a son propre Stack layout qui gère sa navigation.
 * 
 * La redirection vers le bon module se fait via app/(dashboard)/index.tsx
 */
export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="agent" />
      <Stack.Screen name="hospital" />
    </Stack>
  );
}