import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Spinner } from '../src/components/ui';
import { useAuth } from '../src/lib/auth-context';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  switch (user.rol) {
    case 'PROFESIONAL':
      return <Redirect href="/dashboard/profesional" />;
    case 'PACIENTE':
      return <Redirect href="/dashboard/paciente" />;
    default:
      return <Redirect href="/login" />;
  }
}
