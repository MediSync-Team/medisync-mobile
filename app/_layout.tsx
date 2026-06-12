import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Text, View } from 'react-native';
import { Component, useEffect } from 'react';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Error</Text>
          <Text style={{ fontSize: 12 }}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
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

function DeepLinkBridge() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'medisync:') return;

        if (parsed.hostname === 'video-call' || parsed.pathname.includes('video-call')) {
          const turnoId = parsed.searchParams.get('turnoId');
          const role = parsed.searchParams.get('role');
          if (turnoId) {
            router.push(role === 'professional'
              ? `/video-call-waiting?turnoId=${encodeURIComponent(turnoId)}`
              : `/video-call?turnoId=${encodeURIComponent(turnoId)}&role=patient`);
          }
        }
      } catch {
        // ignore malformed links
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    }).catch(() => undefined);

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <ThemedApp>
            <DeepLinkBridge />
            <AuthProvider>
              <NotificationsProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </NotificationsProvider>
            </AuthProvider>
          </ThemedApp>
        </ErrorBoundary>
      </ThemeProvider>
    </LanguageProvider>
  );
}
