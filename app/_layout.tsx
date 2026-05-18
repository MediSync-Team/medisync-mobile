import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/lib/auth-context';
import { NotificationsProvider } from '../src/lib/notifications-context';
import { LanguageProvider } from '../src/i18n/context';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationsProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
