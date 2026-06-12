import { useCallback, useMemo, useRef, useState } from 'react';

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export function useWebRTC() {
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('new');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [remoteStream, setRemoteStream] = useState<null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const cleanup = useCallback(() => {
    setHasRemoteStream(false);
    setRemoteStream(null);
    setConnectionState('closed');
    setMicEnabled(true);
    setCameraEnabled(true);
  }, []);

  const getLocalStream = useCallback(async () => {
    throw new Error('WebRTC no disponible');
  }, []);

  const attachLocalStream = useCallback(async () => {
    throw new Error('WebRTC no disponible');
  }, []);

  const createPeerConnection = useCallback(() => ({}), []);
  const setRemoteDescription = useCallback(async () => undefined, []);
  const addIceCandidate = useCallback(async () => undefined, []);
  const createOffer = useCallback(async () => ({}), []);
  const createAnswer = useCallback(async () => ({}), []);
  const toggleMic = useCallback(() => false, []);
  const toggleCamera = useCallback(() => false, []);

  return useMemo(() => ({
    attachLocalStream,
    addIceCandidate,
    cleanup,
    connectionState,
    createAnswer,
    createOffer,
    createPeerConnection,
    getLocalStream,
    hasRemoteStream,
    micEnabled,
    cameraEnabled,
    remoteStream,
    pendingCandidates: [],
    pcRef: { current: null },
    setRemoteDescription,
    streamRef: { current: null },
    toggleCamera,
    toggleMic,
  }), [
    addIceCandidate,
    attachLocalStream,
    cameraEnabled,
    cleanup,
    connectionState,
    createAnswer,
    createOffer,
    createPeerConnection,
    getLocalStream,
    hasRemoteStream,
    micEnabled,
    remoteStream,
    setRemoteDescription,
    toggleCamera,
    toggleMic,
  ]);
}
