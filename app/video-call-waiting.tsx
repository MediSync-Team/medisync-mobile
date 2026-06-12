import { View, Text } from 'react-native';

export default function VideoCallWaitingStub() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Sala de espera</Text>
      <Text style={{ fontSize: 14, marginTop: 8 }}>Próximamente disponible.</Text>
    </View>
  );
}
