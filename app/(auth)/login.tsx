import { Text, View, useThemeColor } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { loginSchema } from '@/utils/validation';
import { FontAwesome } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

type LoginFormData = {
  email: string;
  password: string;
  role?: 'agent' | 'admin' | 'hospital';
};

const ROLES: { value: LoginFormData['role']; label: string; labelKreyol: string }[] = [
  { value: 'agent', label: 'Agent de terrain', labelKreyol: 'Ajan Teren' },
  { value: 'admin', label: 'Administrateur', labelKreyol: 'Administratè' },
  { value: 'hospital', label: 'Hôpital', labelKreyol: 'Lopital' },
];

export default function LoginScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const [language, setLanguage] = useState<'kreyol' | 'francais'>('kreyol');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginFormData['role'] | ''>('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const { appTheme, setAppTheme, loadTheme } = useThemeStore();
  const t = useTranslation();

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  // Déterminer le thème actuel (app ou système)
  const currentTheme = appTheme === 'system' ? systemColorScheme : appTheme;

  // Couleurs thématiques basées sur le thème actuel
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#ddd', dark: '#444' }, 'text');
  const inputBackgroundColor = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');
  const placeholderColor = useThemeColor({ light: '#999', dark: '#666' }, 'text');
  const iconColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  
  // Couleurs spécifiques pour les boutons
  const buttonBackgroundColor = currentTheme === 'dark' ? '#2f95dc' : '#2f95dc';
  const buttonTextColor = '#fff';
  const languageButtonActiveBg = currentTheme === 'dark' ? '#2f95dc' : '#2f95dc';
  const languageButtonInactiveBg = currentTheme === 'dark' ? '#1a1a1a' : '#fff';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    if (!selectedRole) return;
    
    clearError(); // Effacer les erreurs précédentes
    
    try {
      await login({ 
        email: data.email,
        password: data.password 
      });
      
      // Rediriger vers le dashboard approprié selon le rôle de l'utilisateur connecté
      // Le rôle vient maintenant du profil utilisateur dans Firestore
      const { user } = useAuthStore.getState();
      if (user) {
        router.replace(`/(dashboard)/${user.role}` as any);
      }
    } catch (error) {
      if (__DEV__) console.error('Login error:', error);
      // L'erreur est déjà gérée dans le store et affichée via la variable `error`
    }
  };

  const isKreyol = language === 'kreyol';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Theme Selector Panel - Vertical Floating Icons */}
      <View style={styles.themePanel}>
        <Pressable
          style={({ pressed }) => [
            styles.themePanelButton,
            appTheme === 'light' && styles.themePanelButtonActive,
            { 
              shadowColor: appTheme === 'light' 
                ? (currentTheme === 'dark' ? tintColor : '#000')
                : (currentTheme === 'dark' ? '#fff' : '#000'),
              shadowOffset: { width: 0, height: appTheme === 'light' ? 4 : 2 },
              shadowOpacity: appTheme === 'light' ? 0.4 : 0.15,
              shadowRadius: appTheme === 'light' ? 6 : 4,
              elevation: appTheme === 'light' ? 5 : 3,
              backgroundColor: appTheme === 'light' 
                ? (currentTheme === 'dark' ? tintColor + '40' : tintColor + '25')
                : (currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
              borderWidth: appTheme === 'light' ? 2 : 0,
              borderColor: appTheme === 'light' ? tintColor : 'transparent',
              opacity: pressed ? 0.7 : 1,
            }
          ]}
          onPress={() => setAppTheme('light')}
        >
          <FontAwesome 
            name="sun-o" 
            size={appTheme === 'light' ? 24 : 22} 
            color={appTheme === 'light' ? tintColor : (currentTheme === 'dark' ? '#fff' : iconColor)} 
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.themePanelButton,
            appTheme === 'system' && styles.themePanelButtonActive,
            { 
              shadowColor: appTheme === 'system' 
                ? (currentTheme === 'dark' ? tintColor : '#000')
                : (currentTheme === 'dark' ? '#fff' : '#000'),
              shadowOffset: { width: 0, height: appTheme === 'system' ? 4 : 2 },
              shadowOpacity: appTheme === 'system' ? 0.4 : 0.15,
              shadowRadius: appTheme === 'system' ? 6 : 4,
              elevation: appTheme === 'system' ? 5 : 3,
              backgroundColor: appTheme === 'system' 
                ? (currentTheme === 'dark' ? tintColor + '40' : tintColor + '25')
                : (currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
              borderWidth: appTheme === 'system' ? 2 : 0,
              borderColor: appTheme === 'system' ? tintColor : 'transparent',
              opacity: pressed ? 0.7 : 1,
            }
          ]}
          onPress={() => setAppTheme('system')}
        >
          <FontAwesome 
            name="circle-o" 
            size={appTheme === 'system' ? 24 : 22} 
            color={appTheme === 'system' ? tintColor : (currentTheme === 'dark' ? '#fff' : iconColor)} 
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.themePanelButton,
            appTheme === 'dark' && styles.themePanelButtonActive,
            { 
              shadowColor: appTheme === 'dark' 
                ? (currentTheme === 'dark' ? tintColor : '#000')
                : (currentTheme === 'dark' ? '#fff' : '#000'),
              shadowOffset: { width: 0, height: appTheme === 'dark' ? 4 : 2 },
              shadowOpacity: appTheme === 'dark' ? 0.4 : 0.15,
              shadowRadius: appTheme === 'dark' ? 6 : 4,
              elevation: appTheme === 'dark' ? 5 : 3,
              backgroundColor: appTheme === 'dark' 
                ? (currentTheme === 'dark' ? tintColor + '40' : tintColor + '25')
                : (currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
              borderWidth: appTheme === 'dark' ? 2 : 0,
              borderColor: appTheme === 'dark' ? tintColor : 'transparent',
              opacity: pressed ? 0.7 : 1,
            }
          ]}
          onPress={() => setAppTheme('dark')}
        >
          <FontAwesome 
            name="moon-o" 
            size={appTheme === 'dark' ? 24 : 22} 
            color={appTheme === 'dark' ? tintColor : (currentTheme === 'dark' ? '#fff' : iconColor)} 
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: tintColor }]}>
            <FontAwesome 
              name="user" 
              size={40} 
              color={currentTheme === 'dark' ? '#fff' : '#2f95dc'} 
            />
          </View>
          <Text style={[styles.appName, { color: textColor }]}>GraceRegistry</Text>
          <Text style={[styles.subtitle, { color: iconColor }]}>
            {isKreyol ? 'Sistèm Anrejistreman Nesans' : 'Système d\'enregistrement des naissances'}
          </Text>
          <Text style={[styles.welcome, { color: placeholderColor }]}>
            {isKreyol ? 'Byenveni' : 'Bienvenue'}
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>
              {isKreyol ? 'Imèl' : 'Email'}
            </Text>
            <View style={[styles.inputWrapper, { borderColor, backgroundColor: inputBackgroundColor }]}>
              <FontAwesome name="envelope" size={20} color={iconColor} style={styles.inputIcon} />
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={isKreyol ? 'imel@example.com' : 'email@example.com'}
                    placeholderTextColor={placeholderColor}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>
              {isKreyol ? 'Modpas' : 'Mot de passe'}
            </Text>
            <View style={[styles.inputWrapper, { borderColor, backgroundColor: inputBackgroundColor }]}>
              <FontAwesome name="lock" size={20} color={iconColor} style={styles.inputIcon} />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder={isKreyol ? 'Modpas' : 'Mot de passe'}
                    placeholderTextColor={placeholderColor}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                )}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed }) => [
                  styles.eyeIcon,
                  pressed && { opacity: 0.7 }
                ]}
              >
                <FontAwesome
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color={iconColor}
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* Role Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>
              {isKreyol ? 'Wòl' : 'Rôle'}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.inputWrapper, 
                { borderColor, backgroundColor: inputBackgroundColor },
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedRole ? textColor : placeholderColor },
                ]}
              >
                {selectedRole
                  ? ROLES.find((r) => r.value === selectedRole)?.[isKreyol ? 'labelKreyol' : 'label']
                  : isKreyol
                  ? 'Chwazi yon wòl'
                  : 'Choisir un rôle'}
              </Text>
              <FontAwesome
                name="chevron-down"
                size={16}
                color={iconColor}
                style={{ transform: [{ rotate: showRoleDropdown ? '180deg' : '0deg' }] }}
              />
            </Pressable>
            {showRoleDropdown && (
              <View style={[styles.dropdown, { borderColor, backgroundColor: inputBackgroundColor }]}>
                {ROLES.map((role) => (
                  <Pressable
                    key={role.value}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      { borderBottomColor: borderColor },
                      selectedRole === role.value && { backgroundColor: tintColor + '20' },
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => {
                      setSelectedRole(role.value);
                      setShowRoleDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: selectedRole === role.value ? tintColor : textColor },
                        selectedRole === role.value && { fontWeight: '600' },
                      ]}
                    >
                      {isKreyol ? role.labelKreyol : role.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {t(error) || t('errors.auth.default')}
              </Text>
            </View>
          )}

          {/* Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton, 
              { backgroundColor: buttonBackgroundColor },
              isLoading && styles.loginButtonDisabled,
              pressed && !isLoading && selectedRole && { opacity: 0.7 }
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading || !selectedRole}
          >
            <Text style={[styles.loginButtonText, { color: buttonTextColor }]}>
              {isLoading 
                ? (isKreyol ? 'Konekte...' : 'Connexion...')
                : (isKreyol ? 'Konekte' : 'Se connecter')
              }
            </Text>
          </Pressable>
        </View>

        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <FontAwesome name="globe" size={20} color={iconColor} />
          <View style={[styles.languageButtons, { borderColor }]}>
            <Pressable
              style={({ pressed }) => [
                styles.languageButton, 
                { backgroundColor: language === 'kreyol' ? languageButtonActiveBg : languageButtonInactiveBg },
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => setLanguage('kreyol')}
            >
              <Text style={[
                styles.languageButtonText, 
                { color: language === 'kreyol' ? '#fff' : textColor }
              ]}>
                Kreyòl
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.languageButton, 
                { backgroundColor: language === 'francais' ? languageButtonActiveBg : languageButtonInactiveBg },
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => setLanguage('francais')}
            >
              <Text style={[
                styles.languageButtonText, 
                { color: language === 'francais' ? '#fff' : textColor }
              ]}>
                Français
              </Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2f95dc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  welcome: {
    fontSize: 18,
    color: '#999',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
  placeholderText: {
    color: '#999',
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f7ff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownItemTextSelected: {
    color: '#2f95dc',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 20,
  },
  languageButtons: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  languageButtonActive: {
    backgroundColor: '#2f95dc',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  themePanel: {
    position: 'absolute',
    right: 16,
    top: 60,
    gap: 12,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePanelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  themePanelButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
});
