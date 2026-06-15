import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { useLang } from '../src/i18n/context';
import { useVideoCall } from '../src/hooks/useVideoCall';

export default function VideoCallScreen() {
  const { turnoId, participantName } = useLocalSearchParams<{
    turnoId: string;
    participantName: string;
  }>();
  const router = useRouter();
  const { t } = useLang();
  const vc = (key: string) => t('videoCall', key);

  const { stage, duration, error, hangUp, rtc } = useVideoCall(turnoId);

  const close = useCallback(() => {
    hangUp();
    router.back();
  }, [hangUp, router]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const isActive = stage === 'in-call' || stage === 'waiting' || stage === 'calling' || stage === 'connecting';
  const localStreamURL = rtc.streamRef.current?.toURL();
  const remoteStreamURL = rtc.remoteStream?.toURL();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.statusDot,
              stage === 'in-call' && styles.statusDotGreen,
              stage === 'error' && styles.statusDotRed,
              stage === 'ended' && styles.statusDotGray,
              isActive && stage !== 'in-call' && styles.statusDotYellow,
            ]}
          />
          <Text style={styles.headerText} numberOfLines={1}>
            {participantName || ''}
          </Text>
          {stage === 'in-call' && (
            <Text style={styles.timer}>{formatDuration(duration)}</Text>
          )}
        </View>
      </View>

      <View style={styles.videoArea}>
        {remoteStreamURL ? (
          <RTCView
            streamURL={remoteStreamURL}
            objectFit="cover"
            style={StyleSheet.absoluteFill}
            zOrder={0}
          />
        ) : null}

        {!remoteStreamURL && isActive && (
          <View style={styles.overlay}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.statusText}>
              {stage === 'waiting' ? vc('waiting') : vc('calling')}
            </Text>
            {(stage === 'connecting' || stage === 'calling') && (
              <ActivityIndicator size="small" color="#94A3B8" style={{ marginTop: 16 }} />
            )}
          </View>
        )}

        {stage === 'ended' && (
          <View style={styles.overlay}>
            <View style={styles.avatar}>
              <Ionicons name="call" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.statusText}>{vc('ended')}</Text>
            {duration > 0 && (
              <Text style={styles.statusHint}>
                {vc('duration')}: {formatDuration(duration)}
              </Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeButtonText}>{vc('close')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.overlay}>
            <View style={[styles.avatar, { backgroundColor: '#7F1D1D' }]}>
              <Ionicons name="warning" size={40} color="#F87171" />
            </View>
            <Text style={styles.statusText}>{vc('error')}</Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeButtonText}>{vc('close')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {localStreamURL ? (
          <View style={styles.pipContainer}>
            <RTCView
              streamURL={localStreamURL}
              mirror={true}
              objectFit="cover"
              style={styles.pipVideo}
              zOrder={1}
            />
            {!rtc.cameraEnabled && (
              <View style={styles.pipOverlay}>
                <Ionicons name="videocam-off" size={20} color="#94A3B8" />
              </View>
            )}
            {!rtc.micEnabled && (
              <View style={styles.micOffBadge}>
                <Ionicons name="mic-off" size={12} color="#FFF" />
              </View>
            )}
          </View>
        ) : null}
      </View>

      {isActive && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, !rtc.micEnabled && styles.controlButtonOff]}
            onPress={rtc.toggleMic}
          >
            <Ionicons
              name={rtc.micEnabled ? 'mic' : 'mic-off'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.hangUpButton} onPress={close}>
            <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !rtc.cameraEnabled && styles.controlButtonOff]}
            onPress={rtc.toggleCamera}
          >
            <Ionicons
              name={rtc.cameraEnabled ? 'videocam' : 'videocam-off'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  statusDotGreen: {
    backgroundColor: '#34D399',
  },
  statusDotRed: {
    backgroundColor: '#F87171',
  },
  statusDotGray: {
    backgroundColor: '#64748B',
  },
  statusDotYellow: {
    backgroundColor: '#F59E0B',
  },
  headerText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  timer: {
    color: '#34D399',
    fontSize: 12,
    fontFamily: 'monospace',
    marginLeft: 4,
  },
  videoArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusHint: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#334155',
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  pipContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#475569',
  },
  pipVideo: {
    width: '100%',
    height: '100%',
  },
  pipOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  micOffBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonOff: {
    backgroundColor: '#DC2626',
  },
  hangUpButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
