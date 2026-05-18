import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { Spinner } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth-context';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <Spinner />
      </View>
    );
  }
  if (isAuthenticated) return <Redirect href="/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
