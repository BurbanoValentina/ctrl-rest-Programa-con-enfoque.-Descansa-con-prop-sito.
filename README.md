# PausaActiva

Pausas activas para developers, validadas con visión por computadora.

## Estructura
- `backend/` — servicio Python (FastAPI + MediaPipe Pose) que recibe frames
  del navegador por WebSocket, los procesa localmente y devuelve métricas.
  No sube video a ningún lado, solo números.
- `frontend/` — app React + TypeScript + Vite que captura la webcam,
  muestra landmarks en vivo y el panel de estado.
- `.kiro/specs/` — specs en formato EARS usados para construir cada pieza
  con Kiro (spec-driven development).

## Cómo correr el backend
```
cd backend
pip install -r requirements.txt
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Cómo correr el frontend
```
cd frontend
npm install
npm run dev
```

Abre http://localhost:3000, activa la cámara y listo.

## Flujo del MVP
1. ✅ **Detecta el riesgo** — monitor de postura (MediaPipe Pose), landmarks en vivo
2. ✅ **Propone la pausa** — `PausaScreen.tsx` aparece automáticamente tras 20s de mala postura (o botón demo)
3. ✅ **Valida el movimiento** — modo "exercise" cuenta repeticiones de giro de cuello con la cámara
4. ✅ **Otorga la recompensa** — puntos locales al completar (+10 pts)

## Tecnologías
- Python 3.13, FastAPI, OpenCV, MediaPipe Tasks (PoseLandmarker)
- React 18, TypeScript, Vite
- WebSocket para comunicación en tiempo real
- Privacidad: todo se procesa localmente, solo se transmiten coordenadas numéricas

## Roadmap post-MVP
- Reto dinámico con AWS Bedrock
- Instrucciones por voz con AWS Polly
- Persistencia de puntos con DynamoDB + Lambda
- Monitor de somnolencia (Face Mesh, EAR/MAR)
