import { useCallback, useMemo, useRef, useState } from 'react';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  type MediaStream,
  type MediaStreamTrack,
} from 'react-native-webrtc';

type RTCIceCandidateInit = {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
};

type RTCSessionDescriptionInit = {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string | null;
};

type MediaStreamTrackEvent = {
  streams?: MediaStream[];
};

type NativePeerConnection = any;

type IceServer = { urls: string | string[]; username?: string; credential?: string };

const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

type RemoteTrackCallback = (stream: MediaStream) => void;

export function useWebRTC() {
  const pcRef = useRef<NativePeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const onIceCandidateRef = useRef<((candidate: RTCIceCandidateInit) => void) | null>(null);
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('new');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const cleanup = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());

    pcRef.current = null;
    streamRef.current = null;
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    onIceCandidateRef.current = null;
    setHasRemoteStream(false);
    setRemoteStream(null);
    setConnectionState('closed');
    setMicEnabled(true);
    setCameraEnabled(true);
  }, []);

  const getLocalStream = useCallback(async () => {
    if (streamRef.current) return streamRef.current;

    const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
    streamRef.current = stream;
    return stream;
  }, []);

  const attachLocalStream = useCallback(async () => {
    const stream = await getLocalStream();
    setMicEnabled(Boolean(stream.getAudioTracks()[0]?.enabled ?? true));
    setCameraEnabled(Boolean(stream.getVideoTracks()[0]?.enabled ?? true));
    return stream;
  }, [getLocalStream]);

  const createPeerConnection = useCallback((onRemoteTrack?: RemoteTrackCallback, onIceCandidate?: (candidate: RTCIceCandidateInit) => void, iceServers?: IceServer[]) => {
    const servers = iceServers && iceServers.length > 0 ? iceServers : DEFAULT_ICE_SERVERS;
    const pc = new (RTCPeerConnection as unknown as { new(options: unknown): NativePeerConnection })({ iceServers: servers });

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, stream));
    }

    onIceCandidateRef.current = onIceCandidate ?? null;

    (pc as NativePeerConnection).onicecandidate = (event: { candidate?: { toJSON: () => RTCIceCandidateInit } } | null) => {
      if (event?.candidate && onIceCandidateRef.current) {
        onIceCandidateRef.current(event.candidate.toJSON());
      }
    };

    (pc as NativePeerConnection).ontrack = (event: MediaStreamTrackEvent) => {
      const remoteStream = event.streams?.[0];
      if (remoteStream) {
        setHasRemoteStream(true);
        remoteStreamRef.current = remoteStream as MediaStream;
        setRemoteStream(remoteStream as MediaStream);
        onRemoteTrack?.(remoteStream as MediaStream);
      }
    };

    (pc as NativePeerConnection).onconnectionstatechange = () => {
      setConnectionState(pc.connectionState as WebRTCConnectionState);
    };

    pcRef.current = pc;
    setConnectionState('connecting');
    return pc;
  }, []);

  const setRemoteDescription = useCallback(async (description: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) throw new Error('Peer connection not initialized');

    await pc.setRemoteDescription(new RTCSessionDescription(description as any));

    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate as any));
      } catch {
        // ignore stale candidates
      }
    }

    pendingCandidatesRef.current = [];
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!pc) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    if (pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate as any));
      } catch {
        // ignore malformed candidate
      }
      return;
    }

    pendingCandidatesRef.current.push(candidate);
  }, []);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) throw new Error('Peer connection not initialized');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return pc.localDescription as RTCSessionDescriptionInit;
  }, []);

  const createAnswer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) throw new Error('Peer connection not initialized');

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return pc.localDescription as RTCSessionDescriptionInit;
  }, []);

  const toggleMic = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()?.[0] as MediaStreamTrack | undefined;
    if (!track) return false;

    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
    return track.enabled;
  }, []);

  const toggleCamera = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()?.[0] as MediaStreamTrack | undefined;
    if (!track) return false;

    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
    return track.enabled;
  }, []);

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
    pendingCandidates: pendingCandidatesRef.current,
    pcRef,
    setRemoteDescription,
    streamRef,
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
