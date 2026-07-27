import { useEffect, useRef, useState } from "react";
import type { PostureState } from "../types/posture";

const WS_URL = "ws://localhost:8000/ws/postura";

/**
 * Se conecta al servicio Python de sensores y expone el estado de postura
 * en tiempo real, más una bandera cuando toca disparar una PausaActiva.
 */
export function usePostureSensor() {
  const [state, setState] = useState<PostureState>({ status: "no_frame" });
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    socket.onmessage = (event) => {
      const data: PostureState = JSON.parse(event.data);
      setState(data);
    };

    return () => socket.close();
  }, []);

  return { state, connected };
}
