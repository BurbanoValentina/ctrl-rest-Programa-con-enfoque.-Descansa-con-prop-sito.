import { useEffect, useRef, useState, useCallback } from "react";
import type { PostureState } from "../types/posture";

const WS_URL = "ws://localhost:8000/ws/postura";
const FRAME_INTERVAL_MS = 200; // ~5 FPS
const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_ATTEMPTS = 50;

/**
 * Captura la webcam, envía frames al backend por WebSocket,
 * y recibe métricas de postura o ejercicio en tiempo real.
 * 
 * Soporta dos modos:
 * - "postura": monitoreo de fondo
 * - "exercise": validación de giro de cuello
 * 
 * NUNCA se detiene: auto-reconexión si el WebSocket se cae.
 */
export function usePostureSensor() {
  const [state, setState] = useState<PostureState>({ status: "no_frame" });
  const [connected, setConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const cameraActiveRef = useRef(false);

  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo acceder a la cámara";
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (!cameraActive || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [cameraActive]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (reconnectTimeoutRef.current) { clearTimeout(reconnectTimeoutRef.current); reconnectTimeoutRef.current = null; }
    if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    reconnectCountRef.current = 0;
    setCameraActive(false);
    setConnected(false);
    setState({ status: "no_frame" });
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    return dataUrl.split(",")[1];
  }, []);

  // --- Comandos para controlar el modo ---
  const startExercise = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send("start_exercise");
    }
  }, []);

  const stopExercise = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send("stop_exercise");
    }
  }, []);

  const startPingPong = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send("start_pingpong");
    }
  }, []);

  const stopPingPong = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send("stop_pingpong");
    }
  }, []);

  // Conexión WebSocket con auto-reconexión
  const connectWebSocket = useCallback(() => {
    if (!isMountedRef.current || !cameraActiveRef.current) return;

    if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!isMountedRef.current) return;
      setConnected(true);
      reconnectCountRef.current = 0;

      intervalRef.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          const frame = captureFrame();
          if (frame) { socket.send(frame); }
        }
      }, FRAME_INTERVAL_MS);
    };

    socket.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data: PostureState = JSON.parse(event.data);
        setState(data);
      } catch { /* ignorar */ }
    };

    socket.onclose = () => {
      if (!isMountedRef.current || !cameraActiveRef.current) return;
      setConnected(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

      if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectCountRef.current++;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, RECONNECT_DELAY_MS);
      }
    };

    socket.onerror = () => {};
  }, [captureFrame]);

  useEffect(() => {
    if (!cameraActive) return;

    const timeout = setTimeout(() => { connectWebSocket(); }, 600);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (reconnectTimeoutRef.current) { clearTimeout(reconnectTimeoutRef.current); reconnectTimeoutRef.current = null; }
      if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
      setConnected(false);
    };
  }, [cameraActive, connectWebSocket]);

  return {
    state,
    connected,
    cameraActive,
    cameraError,
    startCamera,
    stopCamera,
    startExercise,
    stopExercise,
    startPingPong,
    stopPingPong,
    videoRef,
    canvasRef,
  };
}
