import { useCallback, useMemo, useRef, useState } from 'react';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} from 'react-native-webrtc';
import type { MediaStream } from 'react-native-webrtc';

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

interface SDPInit {
  sdp: string;
  type: string | null;
}

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export function useWebRTC() {
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('new');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const getLocalStream = useCallback(async () => {
    try {
      const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setCameraEnabled(true);
      setMicEnabled(true);
      return stream;
    } catch {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setCameraEnabled(false);
      setMicEnabled(true);
      return stream;
    }
  }, []);

  const attachLocalStream = useCallback(async () => {
    let stream = streamRef.current;
    if (!stream) {
      stream = await getLocalStream();
    }
    return stream;
  }, [getLocalStream]);

  const createPeerConnection = useCallback((
    _remoteVideoRef: undefined,
    sendIceCandidate: (candidate: RTCIceCandidateInit) => void,
    iceServers: RTCIceServer[],
  ) => {
    const stream = streamRef.current;
    if (!stream) return;

    const pc = new RTCPeerConnection({ iceServers: iceServers?.length ? iceServers : FALLBACK_ICE_SERVERS });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    (pc as any).addEventListener('icecandidate', (e: any) => {
      if (e.candidate) {
        sendIceCandidate({ candidate: e.candidate.candidate, sdpMLineIndex: e.candidate.sdpMLineIndex, sdpMid: e.candidate.sdpMid });
      }
    });

    (pc as any).addEventListener('track', (e: any) => {
      if (e.streams?.[0]) {
        setRemoteStream(e.streams[0]);
        setHasRemoteStream(true);
      }
    });

    (pc as any).addEventListener('connectionstatechange', () => {
      setConnectionState(pc.connectionState as WebRTCConnectionState);
    });

    pcRef.current = pc;
    pendingCandidatesRef.current = [];
  }, []);

  const setRemoteDescription = useCallback(async (sdp: any) => {
    const pc = pcRef.current;
    if (!pc) throw new Error('WebRTC no disponible');

    await pc.setRemoteDescription(new RTCSessionDescription({ sdp: sdp.sdp, type: sdp.type }));

    const candidates = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (pc && pc.remoteDescription) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* ignore */ }
    } else {
      pendingCandidatesRef.current.push(candidate);
    }
  }, []);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) throw new Error('WebRTC no disponible');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return pc.localDescription?.toJSON() as SDPInit;
  }, []);

  const createAnswer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) throw new Error('WebRTC no disponible');
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return pc.localDescription?.toJSON() as SDPInit;
  }, []);

  const toggleMic = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return false;
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
      return track.enabled;
    }
    return false;
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraEnabled(track.enabled);
      return track.enabled;
    }
    return false;
  }, []);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current.release(true);
      streamRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setHasRemoteStream(false);
    setRemoteStream(null);
    setConnectionState('closed');
    setMicEnabled(true);
    setCameraEnabled(true);
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
