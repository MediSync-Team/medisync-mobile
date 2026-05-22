import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '../src/lib/auth-context';
import { NotificationsProvider } from '../src/lib/notifications-context';
import { LanguageProvider } from '../src/i18n/context';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ThemedApp>
          <AuthProvider>
            <NotificationsProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </NotificationsProvider>
          </AuthProvider>
        </ThemedApp>
      </ThemeProvider>
    </LanguageProvider>
  );
}
