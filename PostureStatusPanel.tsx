import { usePostureSensor } from "../hooks/usePostureSensor";

/**
 * Panel de estado en vivo, inspirado en dashboards de ergonomía:
 * ángulo de cuello, relación de encorvamiento y estado general.
 */
export function PostureStatusPanel() {
  const { state, connected } = usePostureSensor();

  if (!connected) {
    return <div className="posture-panel">Conectando al sensor...</div>;
  }

  if (state.status === "no_person") {
    return (
      <div className="posture-panel">No se detecta a nadie frente a la cámara</div>
    );
  }

  const statusColor = state.isGood ? "#1D9E75" : "#E24B4A";

  return (
    <div className="posture-panel">
      <h3 style={{ color: statusColor }}>
        {state.isGood ? "Buena postura" : "Postura a corregir"}
      </h3>
      <dl>
        <dt>Ángulo de cuello</dt>
        <dd>{state.neckAngle}°</dd>
        <dt>Relación de encorvamiento</dt>
        <dd>{state.slouchRatio}</dd>
        <dt>Inclinación de hombros</dt>
        <dd>{state.shoulderTilt}</dd>
      </dl>
      {state.triggerPause && (
        <p className="alert">
          Llevas mucho tiempo en mala postura — hora de una PausaActiva
        </p>
      )}
    </div>
  );
}
