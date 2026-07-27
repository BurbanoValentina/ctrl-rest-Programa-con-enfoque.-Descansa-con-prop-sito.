export interface PostureState {
  status: "ok" | "no_frame" | "no_person";
  neckAngle?: number;
  slouchRatio?: number;
  shoulderTilt?: number;
  isGood?: boolean;
  triggerPause?: boolean;
}
