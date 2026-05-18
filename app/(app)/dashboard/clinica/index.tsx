import { ScrollView, Text } from 'react-native';
import { PrimaryButton, sharedStyles } from '../../../../src/components/ui';
import { useAuth } from '../../../../src/lib/auth-context';

export default function ClinicaDashboard() {
  const { logout } = useAuth();
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <Text style={sharedStyles.title}>Clínica</Text>
      <Text style={sharedStyles.subtitle}>Dashboard clínica queda como placeholder protegido para el MVP.</Text>
      <PrimaryButton title="Cerrar sesión" onPress={logout} />
    </ScrollView>
  );
}
