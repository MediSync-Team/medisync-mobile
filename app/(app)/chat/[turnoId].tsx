import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AppHeader, ErrorNotice, Spinner } from '../../../src/components/ui';
import { api, type Turno } from '../../../src/lib/api';
import { resolveUploadUrl, sortChatItems, type ChatItem } from '../../../src/lib/chat';
import { fullName } from '../../../src/lib/utils';
import { useAuth } from '../../../src/lib/auth-context';
import { useLang } from '../../../src/i18n/context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { spacing, borderRadius, fontSize } from '../../../src/theme';

const ACTIVE_ESTADOS: Turno['estado'][] = ['RESERVADO', 'CONFIRMADO'];

/**
 * Standalone chat for a turno: lets a patient (or professional) read the
 * conversation — including the in-call chat — and the attached files after the
 * turno is completed or cancelled. The composer is read-only when the turno is
 * no longer active (mirrors the web "Ver chat" + read-only behaviour).
 */
export default function ChatScreen() {
  const { turnoId } = useLocalSearchParams<{ turnoId: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useLang();
  const vc = (key: string) => t('videoCall', key);

  const [turno, setTurno] = useState<Turno | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const seenIds = useRef<Set<string>>(new Set());
  const listRef = useRef<FlatList<ChatItem>>(null);

  const myUserId = user?.id ?? '';
  const isActive = turno ? ACTIVE_ESTADOS.includes(turno.estado) : false;
  const otherName =
    turno && (user?.rol === 'PACIENTE' ? fullName(turno.profesional) : fullName(turno.paciente));

  const addItem = useCallback((item: ChatItem) => {
    if (seenIds.current.has(item.id)) return;
    seenIds.current.add(item.id);
    setItems((prev) => sortChatItems([...prev, item]));
  }, []);

  const load = useCallback(async () => {
    if (!turnoId) return;
    setLoading(true);
    setError(null);
    try {
      const [turnoData, mensajes, archivos] = await Promise.all([
        api.turnos.getById(turnoId),
        api.chat.getMensajes(turnoId),
        api.archivos.getByTurno(turnoId),
      ]);
      setTurno(turnoData);
      seenIds.current = new Set();
      const merged: ChatItem[] = [
        ...mensajes.map((m) => ({
          kind: 'text' as const,
          id: m.id,
          senderId: m.remitenteId,
          text: m.contenido,
          at: m.createdAt,
        })),
        ...archivos.map((a) => ({
          kind: 'file' as const,
          id: a.id,
          name: a.nombreOriginal ?? 'archivo',
          url: resolveUploadUrl(a.url),
          mime: a.mimeType,
          at: a.createdAt ?? new Date().toISOString(),
        })),
      ];
      merged.forEach((it) => seenIds.current.add(it.id));
      setItems(sortChatItems(merged));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el chat.');
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending || !isActive) return;
    setSending(true);
    setDraft('');
    try {
      const saved = await api.chat.enviar(turnoId, text);
      addItem({ kind: 'text', id: saved.id, senderId: myUserId, text, at: saved.createdAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : vc('unknownError'));
    } finally {
      setSending(false);
    }
  }, [draft, sending, isActive, turnoId, myUserId, addItem, vc]);

  const onAttach = useCallback(async () => {
    if (sending || !isActive) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      setSending(true);
      const archivo = await api.archivos.subir(
        turnoId,
        { uri: asset.uri, name: asset.name ?? 'archivo', type: asset.mimeType ?? 'application/octet-stream' },
        'OTRO',
      );
      addItem({
        kind: 'file',
        id: archivo.id,
        senderId: myUserId,
        name: archivo.nombreOriginal ?? asset.name ?? 'archivo',
        url: resolveUploadUrl(archivo.url),
        mime: archivo.mimeType,
        at: archivo.createdAt ?? new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : vc('fileError'));
    } finally {
      setSending(false);
    }
  }, [sending, isActive, turnoId, myUserId, addItem, vc]);

  const renderItem = useCallback(
    ({ item }: { item: ChatItem }) => {
      const isMine = !!item.senderId && item.senderId === myUserId;
      const bubbleColor = isMine ? colors.primary : colors.muted;
      const textColor = isMine ? colors.white : colors.text;
      if (item.kind === 'file') {
        return (
          <TouchableOpacity
            onPress={() => item.url && Linking.openURL(item.url)}
            style={[styles.row, isMine ? styles.rowEnd : styles.rowStart]}
          >
            <View style={[styles.fileBubble, { backgroundColor: bubbleColor }]}>
              <Ionicons name="document-attach" size={16} color={textColor} />
              <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
      return (
        <View style={[styles.row, isMine ? styles.rowEnd : styles.rowStart]}>
          <View style={[styles.textBubble, { backgroundColor: bubbleColor }]}>
            <Text style={[styles.bubbleText, { color: textColor }]}>{item.text}</Text>
          </View>
        </View>
      );
    },
    [myUserId, colors],
  );

  if (loading && !turno) return <Spinner />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingHorizontal: spacing.md }}>
        <AppHeader showBack />
      </View>
      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
        <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text }}>{vc('chatTitle')}</Text>
        {otherName ? (
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{otherName}</Text>
        ) : null}
      </View>

      <ErrorNotice message={error} />

      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
            {vc('chatEmpty')}
          </Text>
        }
        renderItem={renderItem}
      />

      {isActive ? (
        <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={onAttach}
            disabled={sending}
            style={[styles.attachButton, { backgroundColor: colors.muted }]}
          >
            <Ionicons name="attach" size={20} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={vc('chatPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            multiline
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendButton, { backgroundColor: colors.primary }, (!draft.trim() || sending) && { opacity: 0.4 }]}
          >
            {sending ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.readOnly, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center' }}>
            {vc('readOnly')}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  textBubble: { maxWidth: '80%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  fileBubble: {
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleText: { fontSize: fontSize.sm, lineHeight: 20 },
  fileName: { fontSize: fontSize.sm, flexShrink: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  attachButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  readOnly: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1 },
});
