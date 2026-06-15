import { Redirect, useLocalSearchParams } from 'expo-router';

export default function VideoCallWaiting() {
  const { turnoId, participantName } = useLocalSearchParams<{
    turnoId: string;
    participantName: string;
  }>();
  const params = new URLSearchParams({ turnoId, role: 'professional' });
  if (participantName) params.set('participantName', participantName);
  return <Redirect href={`/video-call?${params.toString()}`} />;
}
