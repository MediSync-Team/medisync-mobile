import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView } from '@livekit/react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLang } from '../src/i18n/context';
import { useVideoCall } from '../src/hooks/useVideoCall';
import type { ChatItem } from '../src/lib/chat';

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function VideoCallScreen() {
  const { turnoId, participantName } = useLocalSearchParams<{ turnoId: string; participantName: string }>();
  const router = useRouter();
  const { t } = useLang();
  const vc = (key: string) => t('videoCall', key);

  const call = useVideoCall(turnoId);
  const { stage, duration, error } = call;

  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatItem>>(null);

  const close = useCallback(() => {
    call.hangUp();
    router.back();
  }, [call, router]);

  const toggleChat = useCallback(() => {
    setChatOpen((o) => {
      const next = !o;
      call.notifyChatOpen(next);
      return next;
    });
  }, [call]);

  const onSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void call.sendText(text);
  }, [draft, call]);

  const onAttach = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      void call.sendFile({
        uri: asset.uri,
        name: asset.name ?? 'archivo',
        type: asset.mimeType ?? 'application/octet-stream',
      });
    } catch {
      // ignore picker errors
    }
  }, [call]);

  const isActive = stage === 'in-call' || stage === 'waiting' || stage === 'connecting' || stage === 'reconnecting';

  const overlayStatus =
    stage === 'connecting' ? vc('starting') :
    stage === 'reconnecting' ? vc('reconnecting') :
    vc('waiting');

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
              stage === 'reconnecting' && styles.statusDotYellow,
            ]}
          />
          <Text style={styles.headerText} numberOfLines={1}>
            {participantName || ''}
          </Text>
          {stage === 'in-call' && <Text style={styles.timer}>{formatDuration(duration)}</Text>}
        </View>
        <TouchableOpacity
          onPress={stage === 'ended' || stage === 'error' ? close : close}
          style={styles.headerClose}
        >
          <Ionicons name="close" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.videoArea}>
        {call.remoteVideoTrack ? (
          <VideoView
            videoTrack={call.remoteVideoTrack}
            objectFit="cover"
            style={StyleSheet.absoluteFillObject}
            zOrder={0}
          />
        ) : null}

        {!call.hasRemote && (stage === 'connecting' || stage === 'waiting' || stage === 'reconnecting') && (
          <View style={styles.overlay}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.statusText}>{overlayStatus}</Text>
            {stage === 'waiting' && <Text style={styles.statusHint}>{vc('waitingInstructions')}</Text>}
            {(stage === 'connecting' || stage === 'reconnecting') && (
              <ActivityIndicator size="small" color="#94A3B8" style={{ marginTop: 16 }} />
            )}
          </View>
        )}

        {/* Connected, but the other participant has their camera off / no video yet. */}
        {!call.hasRemote && stage === 'in-call' && (
          <View style={styles.overlay}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{(participantName || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.statusText}>{participantName}</Text>
            <Text style={styles.statusHint}>{vc('remoteCameraOff')}</Text>
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
            <Text style={styles.statusText}>{vc('startError')}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeButtonText}>{vc('close')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {call.localVideoTrack ? (
          <View style={styles.pipContainer}>
            <VideoView
              videoTrack={call.localVideoTrack}
              mirror
              objectFit="cover"
              style={styles.pipVideo}
              zOrder={1}
            />
            {!call.micEnabled && (
              <View style={styles.micOffBadge}>
                <Ionicons name="mic-off" size={12} color="#FFF" />
              </View>
            )}
          </View>
        ) : isActive && !call.cameraEnabled ? (
          <View style={styles.pipContainer}>
            <View style={styles.pipOverlay}>
              <Ionicons name="videocam-off" size={20} color="#94A3B8" />
            </View>
          </View>
        ) : null}

        {/* Chat panel overlay */}
        {chatOpen && stage !== 'ended' && stage !== 'error' && (
          <KeyboardAvoidingView
            style={styles.chatPanel}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>{vc('chatTitle')}</Text>
              <TouchableOpacity onPress={toggleChat} style={styles.headerClose}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={listRef}
              data={call.items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={<Text style={styles.chatEmpty}>{vc('chatEmpty')}</Text>}
              renderItem={({ item }) => <ChatBubble item={item} myUserId={call.myUserId} />}
            />

            {call.chatError ? <Text style={styles.chatErrorText}>{call.chatError}</Text> : null}

            <View style={styles.composer}>
              <TouchableOpacity onPress={onAttach} disabled={call.sending} style={styles.attachButton}>
                <Ionicons name="attach" size={20} color="#E2E8F0" />
              </TouchableOpacity>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={vc('chatPlaceholder')}
                placeholderTextColor="#64748B"
                style={styles.input}
                multiline
                onSubmitEditing={onSend}
              />
              <TouchableOpacity
                onPress={onSend}
                disabled={!draft.trim() || call.sending}
                style={[styles.sendButton, (!draft.trim() || call.sending) && styles.sendButtonDisabled]}
              >
                {call.sending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

      {isActive && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, !call.micEnabled && styles.controlButtonOff]}
            onPress={call.toggleMic}
          >
            <Ionicons name={call.micEnabled ? 'mic' : 'mic-off'} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.hangUpButton} onPress={close}>
            <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !call.cameraEnabled && styles.controlButtonOff]}
            onPress={call.toggleCamera}
          >
            <Ionicons name={call.cameraEnabled ? 'videocam' : 'videocam-off'} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, chatOpen && styles.controlButtonActive]}
            onPress={toggleChat}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#FFF" />
            {!chatOpen && call.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{call.unread > 9 ? '9+' : call.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function ChatBubble({ item, myUserId }: { item: ChatItem; myUserId: string }) {
  const isMine = !!item.senderId && item.senderId === myUserId;
  if (item.kind === 'file') {
    return (
      <TouchableOpacity
        onPress={() => item.url && Linking.openURL(item.url)}
        style={[styles.bubbleRow, isMine ? styles.rowEnd : styles.rowStart]}
      >
        <View style={[styles.fileBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Ionicons name="document-attach" size={16} color="#E2E8F0" />
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.bubbleRow, isMine ? styles.rowEnd : styles.rowStart]}>
      <View style={[styles.textBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerClose: { padding: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
  statusDotGreen: { backgroundColor: '#34D399' },
  statusDotRed: { backgroundColor: '#F87171' },
  statusDotGray: { backgroundColor: '#64748B' },
  statusDotYellow: { backgroundColor: '#F59E0B' },
  headerText: { color: '#FFF', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  timer: { color: '#34D399', fontSize: 12, fontFamily: 'monospace', marginLeft: 4 },
  videoArea: { flex: 1, position: 'relative', overflow: 'hidden' },
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
  avatarInitial: { color: '#E2E8F0', fontSize: 36, fontWeight: '600' },
  statusText: { color: '#E2E8F0', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  statusHint: { color: '#94A3B8', fontSize: 14, textAlign: 'center' },
  errorText: { color: '#94A3B8', fontSize: 14, textAlign: 'center' },
  closeButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#334155',
    borderRadius: 12,
  },
  closeButtonText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
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
    backgroundColor: '#1E293B',
  },
  pipVideo: { width: '100%', height: '100%' },
  pipOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' },
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
  controlButtonOff: { backgroundColor: '#DC2626' },
  controlButtonActive: { backgroundColor: '#10B981' },
  hangUpButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  // Chat panel
  chatPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  chatTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  chatList: { padding: 12, gap: 8, flexGrow: 1 },
  chatEmpty: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 24 },
  chatErrorText: { color: '#F87171', fontSize: 12, textAlign: 'center', paddingBottom: 4 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  textBubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  fileBubble: {
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMine: { backgroundColor: '#059669', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#334155', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  fileName: { color: '#E2E8F0', fontSize: 14, flexShrink: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
