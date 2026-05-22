import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { Spinner } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth-context';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <Spinner />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
