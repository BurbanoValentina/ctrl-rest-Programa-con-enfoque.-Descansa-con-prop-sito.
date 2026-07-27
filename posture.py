"""Cálculos de postura a partir de los landmarks de MediaPipe Pose."""
import math
from dataclasses import dataclass

# Índices de landmarks de MediaPipe Pose que usamos
NOSE = 0
LEFT_EAR = 7
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12


@dataclass
class PostureReading:
    neck_angle: float
    slouch_ratio: float
    shoulder_tilt: float
    is_good: bool


def _angle_between(p1, p2, p3) -> float:
    """Ángulo en p2 formado por p1-p2-p3, en grados."""
    v1 = (p1.x - p2.x, p1.y - p2.y)
    v2 = (p3.x - p2.x, p3.y - p2.y)
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1, mag2 = math.hypot(*v1), math.hypot(*v2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    cos_angle = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_angle))


def compute_posture(
    landmarks, baseline_slouch: float = 0.55, tolerance: float = 0.12
) -> PostureReading:
    """Calcula ángulo de cuello, relación de encorvamiento e inclinación de hombros."""
    nose = landmarks[NOSE]
    l_sh = landmarks[LEFT_SHOULDER]
    r_sh = landmarks[RIGHT_SHOULDER]
    l_ear = landmarks[LEFT_EAR]

    mid_shoulder_x = (l_sh.x + r_sh.x) / 2
    mid_shoulder_y = (l_sh.y + r_sh.y) / 2

    # Distancia nariz-hombros normalizada por el ancho de hombros
    shoulder_width = math.hypot(l_sh.x - r_sh.x, l_sh.y - r_sh.y) or 1e-6
    nose_to_shoulder = math.hypot(nose.x - mid_shoulder_x, nose.y - mid_shoulder_y)
    slouch_ratio = nose_to_shoulder / shoulder_width

    neck_angle = _angle_between(l_ear, l_sh, r_sh)
    shoulder_tilt = abs(l_sh.y - r_sh.y) * 100

    is_good = abs(slouch_ratio - baseline_slouch) <= tolerance and shoulder_tilt < 6

    return PostureReading(
        neck_angle=round(neck_angle, 1),
        slouch_ratio=round(slouch_ratio, 3),
        shoulder_tilt=round(shoulder_tilt, 2),
        is_good=is_good,
    )
