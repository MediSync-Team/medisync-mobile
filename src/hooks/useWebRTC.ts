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
      console.log('[webrtc] getLocalStream: requesting audio+video');
      const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('[webrtc] getLocalStream: success, tracks:', stream.getTracks().length);
      stream.getTracks().forEach(t => console.log('[webrtc]   track kind:', t.kind));
      streamRef.current = stream;
      setCameraEnabled(true);
      setMicEnabled(true);
      return stream;
    } catch (err) {
      console.log('[webrtc] getLocalStream: video failed, trying audio-only', err);
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('[webrtc] getLocalStream: audio-only success, tracks:', stream.getTracks().length);
      stream.getTracks().forEach(t => console.log('[webrtc]   track kind:', t.kind));
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
    onConnectionStateChange?: (state: WebRTCConnectionState) => void,
  ) => {
    const stream = streamRef.current;
    console.log('[webrtc] createPeerConnection: stream is', stream ? 'SET' : 'NULL', 'tracks:', stream?.getTracks().length);
    if (!stream) {
      console.log('[webrtc] createPeerConnection: EARLY RETURN - no stream');
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: iceServers?.length ? iceServers : FALLBACK_ICE_SERVERS });
    console.log('[webrtc] PC created, iceServers:', iceServers?.length || 'fallback');

    stream.getTracks().forEach(track => {
      try {
        const sender = pc.addTrack(track, stream);
        console.log('[webrtc]   added track', track.kind, 'sender id:', sender?.id);
      } catch (err) {
        console.log('[webrtc]   FAILED to add track', track.kind, err);
      }
    });

    (pc as any).addEventListener('icecandidate', (e: any) => {
      if (e.candidate) {
        console.log('[webrtc] icecandidate:', e.candidate.candidate?.slice(0, 60));
        sendIceCandidate({
          candidate: e.candidate.candidate,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          sdpMid: e.candidate.sdpMid,
          usernameFragment: e.candidate.usernameFragment,
        });
      } else {
        console.log('[webrtc] icecandidate: null (gathering done)');
      }
    });

    (pc as any).addEventListener('track', (e: any) => {
      console.log('[webrtc] TRACK EVENT received', 'streams:', !!(e.streams?.[0]), 'e.stream:', !!e.stream);
      const stream = e.streams?.[0] || e.stream;
      if (stream) {
        console.log('[webrtc]   remote stream id:', stream.id, 'tracks:', stream.getTracks().length);
        setRemoteStream(stream);
        setHasRemoteStream(true);
      } else {
        console.log('[webrtc]   no stream in track event');
      }
    });

    (pc as any).addEventListener('connectionstatechange', () => {
      const state = pc.connectionState as WebRTCConnectionState;
      console.log('[webrtc] connectionstatechange ->', state);
      setConnectionState(state);
      if (onConnectionStateChange) onConnectionStateChange(state);
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
    const pc = pcRef.current;
    if (pc) {
      pc.close();
    }
    pcRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
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
    setRemoteDescription,
    toggleCamera,
    toggleMic,
  ]);
}
