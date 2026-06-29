import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  type VideoTrack,
  type RemoteVideoTrack,
  type LocalTrackPublication,
} from 'livekit-client';
import { AudioSession } from '@livekit/react-native';
import { api } from '../lib/api';
import { resolveUploadUrl, sortChatItems, type ChatItem } from '../lib/chat';

export type CallStage = 'connecting' | 'waiting' | 'in-call' | 'reconnecting' | 'ended' | 'error';

export type { ChatItem };

/** Payload broadcast over the LiveKit data channel (topic 'chat') for instant delivery. */
type ChatWire = ChatItem & { senderId: string };

const CHAT_TOPIC = 'chat';

/** Deep link used by push notifications to open the call screen directly. */
export function buildTelemedicineDeepLink(turnoId: string, role: 'patient' | 'professional') {
  return `medisync://video-call?turnoId=${encodeURIComponent(turnoId)}&role=${role}`;
}

/**
 * Drives a LiveKit (SFU) video consultation for a turno: connection lifecycle,
 * local/remote tracks, mic/camera toggles, and an in-call chat (persisted to the
 * turno via the API + broadcast over the LiveKit data channel for instant delivery).
 *
 * Replaces the old hand-rolled WebRTC P2P + `/ws/video` signaling: the API is now
 * stateless for video and only issues a LiveKit access token + server url.
 */
export function useVideoCall(turnoId: string) {
  const [stage, setStage] = useState<CallStage>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | undefined>(undefined);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<VideoTrack | undefined>(undefined);
  const [hasRemote, setHasRemote] = useState(false);

  // Chat
  const [items, setItems] = useState<ChatItem[]>([]);
  const [myUserId, setMyUserId] = useState('');
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');

  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const chatOpenRef = useRef(false);
  const myIdRef = useRef('');

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, []);

  /** Append an item unless we've already shown it (dedupes echoes / history overlap). */
  const addItem = useCallback((item: ChatItem) => {
    if (seenIdsRef.current.has(item.id)) return;
    seenIdsRef.current.add(item.id);
    setItems((prev) => sortChatItems([...prev, item]));
  }, []);

  const broadcast = useCallback((wire: ChatWire) => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;
    try {
      room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(wire)), {
        reliable: true,
        topic: CHAT_TOPIC,
      });
    } catch {
      // delivery is best-effort; the message is already persisted
    }
  }, []);

  // ── Connect to the LiveKit room ────────────────────────────────────────────
  useEffect(() => {
    closingRef.current = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    // Show the call as soon as the other participant is present — even audio-only.
    const markInCall = () => {
      setStage((prev) => (prev === 'ended' || prev === 'error' ? prev : 'in-call'));
      startTimer();
    };

    room
      .on(RoomEvent.ParticipantConnected, markInCall)
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(track as RemoteVideoTrack);
          setHasRemote(true);
        }
        markInCall();
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(undefined);
          setHasRemote(false);
        }
      })
      .on(RoomEvent.ParticipantDisconnected, () => {
        setHasRemote(false);
        setRemoteVideoTrack(undefined);
        stopTimer();
        setStage('ended');
      })
      .on(RoomEvent.Reconnecting, () => setStage('reconnecting'))
      .on(RoomEvent.Reconnected, () =>
        setStage((prev) =>
          prev === 'reconnecting' ? (room.remoteParticipants.size > 0 ? 'in-call' : 'waiting') : prev,
        ),
      )
      .on(RoomEvent.Disconnected, () => {
        if (!closingRef.current && roomRef.current === room) {
          stopTimer();
          setStage((prev) => (prev === 'error' ? prev : 'ended'));
        }
      })
      .on(RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
        if (topic !== CHAT_TOPIC) return;
        try {
          const wire = JSON.parse(new TextDecoder().decode(payload)) as ChatWire;
          addItem(wire);
          if (!chatOpenRef.current) setUnread((u) => u + 1);
        } catch {
          // ignore malformed data
        }
      });

    const loadHistory = async () => {
      try {
        const [mensajes, archivos] = await Promise.all([
          api.chat.getMensajes(turnoId),
          api.archivos.getByTurno(turnoId),
        ]);
        mensajes.forEach((m) =>
          addItem({ kind: 'text', id: m.id, senderId: m.remitenteId, text: m.contenido, at: m.createdAt }),
        );
        archivos.forEach((a) =>
          addItem({
            kind: 'file',
            id: a.id,
            name: a.nombreOriginal ?? 'archivo',
            url: resolveUploadUrl(a.url),
            mime: a.mimeType,
            at: a.createdAt ?? new Date().toISOString(),
          }),
        );
      } catch {
        // history is best-effort
      }
    };

    (async () => {
      try {
        await AudioSession.startAudioSession();
        // Auth-gated by turno + join window.
        const { token, url } = await api.turnos.getVideoToken(turnoId);
        if (roomRef.current !== room || closingRef.current) return;

        // The LiveKit signal connection can fail transiently; retry a few times.
        let lastErr: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
          if (roomRef.current !== room || closingRef.current) return;
          try {
            await room.connect(url, token);
            lastErr = undefined;
            break;
          } catch (e) {
            lastErr = e;
            if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
          }
        }
        if (lastErr) throw lastErr;
        if (roomRef.current !== room || closingRef.current) return;

        const id = room.localParticipant.identity;
        myIdRef.current = id;
        setMyUserId(id);
        if (room.remoteParticipants.size > 0) markInCall();
        else setStage('waiting');

        // Publish camera + mic (degrade gracefully if a device is unavailable).
        try {
          const pub = await room.localParticipant.setCameraEnabled(true);
          setLocalVideoTrack(pub?.videoTrack);
          setCameraEnabled(true);
        } catch {
          setCameraEnabled(false);
        }
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          setMicEnabled(true);
        } catch {
          setMicEnabled(false);
        }

        void loadHistory();
      } catch (err) {
        if (roomRef.current === room && !closingRef.current) {
          setError(err instanceof Error ? err.message : null);
          setStage('error');
        }
      }
    })();

    return () => {
      closingRef.current = true;
      stopTimer();
      const r = roomRef.current;
      roomRef.current = null;
      r?.disconnect();
      AudioSession.stopAudioSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoId]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
    } catch {
      // ignore
    }
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraEnabled;
    try {
      const pub: LocalTrackPublication | undefined = await room.localParticipant.setCameraEnabled(next);
      setLocalVideoTrack(next ? pub?.videoTrack : undefined);
      setCameraEnabled(next);
    } catch {
      // ignore
    }
  }, [cameraEnabled]);

  const hangUp = useCallback(() => {
    closingRef.current = true;
    stopTimer();
    setStage('ended');
    roomRef.current?.disconnect();
    AudioSession.stopAudioSession();
  }, [stopTimer]);

  // ── Chat ────────────────────────────────────────────────────────────────────
  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);
      setChatError('');
      try {
        const saved = await api.chat.enviar(turnoId, trimmed); // persisted to the turno
        const item: ChatItem = { kind: 'text', id: saved.id, senderId: myIdRef.current, text: trimmed, at: saved.createdAt };
        addItem(item);
        broadcast({ ...item, senderId: myIdRef.current });
      } catch (err) {
        setChatError(err instanceof Error ? err.message : '');
      } finally {
        setSending(false);
      }
    },
    [sending, turnoId, addItem, broadcast],
  );

  const sendFile = useCallback(
    async (file: { uri: string; name: string; type: string }) => {
      setSending(true);
      setChatError('');
      try {
        const archivo = await api.archivos.subir(turnoId, file, 'OTRO'); // validated + persisted
        const item: ChatItem = {
          kind: 'file',
          id: archivo.id,
          senderId: myIdRef.current,
          name: archivo.nombreOriginal ?? file.name,
          url: resolveUploadUrl(archivo.url),
          mime: archivo.mimeType,
          at: archivo.createdAt ?? new Date().toISOString(),
        };
        addItem(item);
        broadcast({ ...item, senderId: myIdRef.current });
      } catch (err) {
        setChatError(err instanceof Error ? err.message : '');
      } finally {
        setSending(false);
      }
    },
    [turnoId, addItem, broadcast],
  );

  /** Tell the hook whether the chat panel is open (clears the unread badge on open). */
  const notifyChatOpen = useCallback((open: boolean) => {
    chatOpenRef.current = open;
    if (open) setUnread(0);
  }, []);

  return useMemo(
    () => ({
      stage,
      error,
      duration,
      micEnabled,
      cameraEnabled,
      localVideoTrack,
      remoteVideoTrack,
      hasRemote,
      // chat
      items,
      myUserId,
      unread,
      sending,
      chatError,
      // actions
      toggleMic,
      toggleCamera,
      hangUp,
      sendText,
      sendFile,
      notifyChatOpen,
    }),
    [
      stage,
      error,
      duration,
      micEnabled,
      cameraEnabled,
      localVideoTrack,
      remoteVideoTrack,
      hasRemote,
      items,
      myUserId,
      unread,
      sending,
      chatError,
      toggleMic,
      toggleCamera,
      hangUp,
      sendText,
      sendFile,
      notifyChatOpen,
    ],
  );
}
