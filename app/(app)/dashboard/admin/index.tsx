import { ScrollView, Text } from 'react-native';
import { PrimaryButton, sharedStyles } from '../../../../src/components/ui';
import { useAuth } from '../../../../src/lib/auth-context';

export default function AdminDashboard() {
  const { logout } = useAuth();
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <Text style={sharedStyles.title}>Admin</Text>
      <Text style={sharedStyles.subtitle}>Dashboard admin queda como placeholder protegido para el MVP.</Text>
      <PrimaryButton title="Cerrar sesión" onPress={logout} />
    </ScrollView>
  );
}
