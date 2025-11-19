import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="pregnancy/index" />
      <Stack.Screen name="birth/index" />
      <Stack.Screen name="certificates/index" />
      <Stack.Screen name="users/index" />
      <Stack.Screen name="validation/index" />
      <Stack.Screen name="statistics/index" />
      <Stack.Screen name="emergency/index" />
      <Stack.Screen name="help/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="profile/index" />
    </Stack>
  );
}

