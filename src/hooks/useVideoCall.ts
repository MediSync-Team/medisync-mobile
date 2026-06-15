import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, API_BASE } from '../api';
import { useWebRTC, type WebRTCConnectionState } from './useWebRTC';

type CallStage = 'idle' | 'connecting' | 'waiting' | 'calling' | 'in-call' | 'ended' | 'error';

type VideoCallMessage =
  | { type: 'waiting' }
  | { type: 'start-call' }
  | { type: 'peer-joined' }
  | { type: 'peer-left' }
  | { type: 'error'; message?: string }
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit };

function getWsBase(): string {
  const base = API_BASE.replace(/\/api\/?$/, '');
  return base.replace(/^https/, 'wss').replace(/^http/, 'ws');
}

function buildVideoCallUrl(ticket: string) {
  return `${getWsBase()}/ws/video?ticket=${ticket}`;
}

export function buildTelemedicineDeepLink(turnoId: string, role: 'patient' | 'professional') {
  return `medisync://video-call?turnoId=${encodeURIComponent(turnoId)}&role=${role}`;
}

export function useVideoCall(turnoId: string) {
  const rtc = useWebRTC();
  const { attachLocalStream, createPeerConnection, createOffer, createAnswer, setRemoteDescription, addIceCandidate, cleanup: cleanupRtc } = rtc;
  const wsRef = useRef<WebSocket | null>(null);
  const pcReadyRef = useRef(false);
  const [stage, setStage] = useState<CallStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<CallStage>('idle');
  const cancelledRef = useRef(false);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setDuration((value) => value + 1), 1000);
  }, [stopTimer]);

  const cleanup = useCallback(() => {
    stopTimer();
    wsRef.current?.close();
    wsRef.current = null;
    pcReadyRef.current = false;
    cleanupRtc();
  }, [cleanupRtc, stopTimer]);

  const hangUp = useCallback(() => {
    cancelledRef.current = true;
    cleanup();
    setStage('ended');
  }, [cleanup]);

  const connect = useCallback(async () => {
    cancelledRef.current = false;
    setError(null);
    setStage('connecting');

    try {
      const data = await api.turnos.getVideoToken(turnoId);
      if (cancelledRef.current) return;
      setTicket(data.ticket);
      const iceServers = data.iceServers;

      const stream = await attachLocalStream();
      if (cancelledRef.current) return;

      const ws = new WebSocket(buildVideoCallUrl(data.ticket));
      wsRef.current = ws;

      const sendIceCandidate = (candidate: RTCIceCandidateInit) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ice-candidate', candidate }));
        }
      };

      const onConnectionStateChange = (state: WebRTCConnectionState) => {
        if (cancelledRef.current) return;
        if (state === 'connected') {
          setStage('in-call');
          startTimer();
        } else if (['failed', 'disconnected', 'closed'].includes(state)) {
          cleanup();
          setStage('ended');
          stopTimer();
        }
      };

      const ensurePeerConnection = () => {
        if (pcReadyRef.current) return;
        createPeerConnection(undefined, sendIceCandidate, iceServers ?? [], onConnectionStateChange);
        pcReadyRef.current = true;
      };

      ws.onopen = () => {
        if (!cancelledRef.current) setStage('waiting');
      };

      ws.onerror = () => {
        if (cancelledRef.current) return;
        stopTimer();
        setError('Error conectando al servidor de videollamadas.');
        setStage('error');
      };

      ws.onclose = (event) => {
        if (cancelledRef.current) return;
        stopTimer();
        if (event.code !== 1000 && stageRef.current !== 'error') {
          setStage('ended');
        }
      };

      ws.onmessage = async (event) => {
        if (cancelledRef.current) return;

        let message: VideoCallMessage | null = null;
        try {
          message = JSON.parse(event.data as string) as VideoCallMessage;
        } catch {
          return;
        }

        if (!message) return;

        console.log('[video] WS message type:', message.type, message.type === 'ice-candidate' ? 'candidate:' + (message as any).candidate?.candidate?.slice(0, 40) : '');

        try {
          switch (message.type) {
            case 'waiting':
              console.log('[video] waiting for other peer');
              setStage('waiting');
              break;

            case 'peer-joined':
              console.log('[video] peer joined, now calling');
              setStage('calling');
              break;

            case 'start-call': {
              console.log('[video] start-call: creating offer');
              setStage('calling');
              ensurePeerConnection();
              console.log('[video] pcRef after ensure:', rtc.pcRef.current ? 'SET' : 'NULL');
              const offer = await createOffer();
              console.log('[video] offer created, sdp length:', offer.sdp?.length);
              ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
              break;
            }

            case 'offer': {
              console.log('[video] offer received, sdp length:', (message.sdp as any)?.sdp?.length);
              setStage('calling');
              ensurePeerConnection();
              await setRemoteDescription(message.sdp);
              const answer = await createAnswer();
              console.log('[video] answer created, sdp length:', answer.sdp?.length);
              ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
              break;
            }

            case 'answer':
              console.log('[video] answer received, setting remote description');
              await setRemoteDescription(message.sdp);
              break;

            case 'ice-candidate':
              await addIceCandidate(message.candidate);
              break;

            case 'peer-left':
              console.log('[video] peer left');
              stopTimer();
              setStage('ended');
              break;

            case 'error':
              console.log('[video] error from server:', message.message);
              stopTimer();
              setError(message.message ?? 'No se pudo iniciar la videollamada.');
              setStage('error');
              break;
          }
        } catch (err) {
          console.log('[video] ERROR in onmessage handler:', err);
          if (!cancelledRef.current) {
            stopTimer();
            setError(err instanceof Error ? err.message : 'Error en la videollamada.');
            setStage('error');
          }
        }
      };

      return stream;
    } catch (err) {
      if (cancelledRef.current) return;
      stopTimer();
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la videollamada.');
      setStage('error');
      throw err;
    }
  }, [addIceCandidate, attachLocalStream, createAnswer, createOffer, createPeerConnection, setRemoteDescription, startTimer, stopTimer, turnoId]);

  useEffect(() => {
    connect().catch(() => undefined);
    return () => {
      cancelledRef.current = true;
      cleanup();
    };
  }, [cleanup, connect]);

  const value = useMemo(() => ({
    connect,
    cleanup,
    duration,
    error,
    hangUp,
    rtc,
    stage,
    ticket,
  }), [cleanup, connect, duration, error, hangUp, rtc, stage, ticket]);

  return value;
}
