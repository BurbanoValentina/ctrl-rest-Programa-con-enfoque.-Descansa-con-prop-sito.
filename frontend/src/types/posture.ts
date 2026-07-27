export interface LandmarkPoint {
  x: number;
  y: number;
  id: number;
}

export interface LandmarkConnection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DrawableLandmarks {
  points: LandmarkPoint[];
  connections: LandmarkConnection[];
}

export interface ExerciseState {
  currentReps: number;
  targetReps: number;
  completed: boolean;
  currentSide: string | null;
  position: string;
  deviation: number;
}

export interface HandPoint {
  x: number;
  y: number;
}

export interface HandData {
  handedness: string;
  points: HandPoint[];
}

export interface PingPongGameState {
  ball: { x: number; y: number };
  leftPaddle: { x: number; y: number };
  rightPaddle: { x: number; y: number };
  rally: number;
  record: number;
  hands: HandData[];
}

export interface PostureState {
  status: "ok" | "no_frame" | "no_person" | "exercise_started" | "exercise_stopped" | "pingpong_started" | "pingpong_stopped" | "error";
  mode?: "postura" | "exercise" | "pingpong";
  neckAngle?: number;
  slouchRatio?: number;
  shoulderTilt?: number;
  headDrop?: number;
  isGood?: boolean;
  reason?: string;
  triggerPause?: boolean;
  landmarks?: DrawableLandmarks;
  exercise?: ExerciseState;
  game?: PingPongGameState;
}
