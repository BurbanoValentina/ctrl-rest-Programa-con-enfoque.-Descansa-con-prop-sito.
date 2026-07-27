"""Cálculos de postura a partir de los landmarks de MediaPipe Pose."""
import math
from dataclasses import dataclass

NOSE = 0
LEFT_EYE_INNER = 1
LEFT_EYE = 2
LEFT_EYE_OUTER = 3
RIGHT_EYE_INNER = 4
RIGHT_EYE = 5
RIGHT_EYE_OUTER = 6
LEFT_EAR = 7
RIGHT_EAR = 8
MOUTH_LEFT = 9
MOUTH_RIGHT = 10
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

DRAW_LANDMARKS = [
    NOSE, LEFT_EYE_INNER, LEFT_EYE, LEFT_EYE_OUTER,
    RIGHT_EYE_INNER, RIGHT_EYE, RIGHT_EYE_OUTER,
    LEFT_EAR, RIGHT_EAR, MOUTH_LEFT, MOUTH_RIGHT,
    LEFT_SHOULDER, RIGHT_SHOULDER,
]

DRAW_CONNECTIONS = [
    (LEFT_EYE_INNER, LEFT_EYE), (LEFT_EYE, LEFT_EYE_OUTER),
    (RIGHT_EYE_INNER, RIGHT_EYE), (RIGHT_EYE, RIGHT_EYE_OUTER),
    (LEFT_EYE_OUTER, LEFT_EAR), (RIGHT_EYE_OUTER, RIGHT_EAR),
    (MOUTH_LEFT, MOUTH_RIGHT),
    (NOSE, LEFT_EYE_INNER), (NOSE, RIGHT_EYE_INNER),
    (LEFT_EAR, LEFT_SHOULDER), (RIGHT_EAR, RIGHT_SHOULDER),
    (LEFT_SHOULDER, RIGHT_SHOULDER),
]


@dataclass
class PostureReading:
    neck_angle: float
    slouch_ratio: float
    shoulder_tilt: float
    head_drop: float
    is_good: bool
    reason: str


def compute_posture(landmarks) -> PostureReading:
    """
    Solo marca mala postura en casos EXTREMOS e inequívocos.
    Por defecto = buena postura.
    
    Solo dice "mala postura" si:
    - La nariz está casi al nivel de los hombros (super encorvado)
    - O los hombros están inclinados más de 20% (inclinación extrema)
    """
    nose = landmarks[NOSE]
    l_ear = landmarks[LEFT_EAR]
    r_ear = landmarks[RIGHT_EAR]
    l_sh = landmarks[LEFT_SHOULDER]
    r_sh = landmarks[RIGHT_SHOULDER]

    mid_sh_x = (l_sh.x + r_sh.x) / 2
    mid_sh_y = (l_sh.y + r_sh.y) / 2
    shoulder_width = math.hypot(l_sh.x - r_sh.x, l_sh.y - r_sh.y) or 1e-6

    # Slouch Ratio — distancia nariz a hombros normalizada
    nose_to_mid = math.hypot(nose.x - mid_sh_x, nose.y - mid_sh_y)
    slouch_ratio = nose_to_mid / shoulder_width

    # Neck Angle
    mid_ear_x = (l_ear.x + r_ear.x) / 2
    mid_ear_y = (l_ear.y + r_ear.y) / 2
    dx = mid_sh_x - mid_ear_x
    dy = mid_sh_y - mid_ear_y
    neck_angle = abs(math.degrees(math.atan2(dx, dy))) if abs(dy) > 1e-6 else 90.0

    # Shoulder Tilt — normalizado
    shoulder_tilt = abs(l_sh.y - r_sh.y) / shoulder_width * 100

    # Head Drop — nariz vs hombros (vertical)
    head_drop = (mid_sh_y - nose.y) / shoulder_width

    # --- EVALUACIÓN ULTRA-TOLERANTE ---
    # Solo marca mala postura si es EXTREMADAMENTE obvio
    reasons = []

    # Solo si la cabeza está CASI al nivel de los hombros (slouch extremo)
    if slouch_ratio < 0.2:
        reasons.append("muy encorvado")

    # Solo si la cabeza cae tanto que casi toca los hombros
    if head_drop < 0.08:
        reasons.append("cabeza muy caída")

    # Solo si los hombros están MUY inclinados (>20%)
    if shoulder_tilt > 20:
        reasons.append("hombros muy inclinados")

    # Neck angle — solo si es extremo (>50°)
    if neck_angle > 50:
        reasons.append("cabeza muy adelantada")

    is_good = len(reasons) == 0
    reason = ", ".join(reasons) if reasons else "postura correcta"

    return PostureReading(
        neck_angle=round(neck_angle, 1),
        slouch_ratio=round(slouch_ratio, 3),
        shoulder_tilt=round(shoulder_tilt, 2),
        head_drop=round(head_drop, 3),
        is_good=is_good,
        reason=reason,
    )


def get_drawable_landmarks(landmarks) -> dict:
    points = []
    for idx in DRAW_LANDMARKS:
        lm = landmarks[idx]
        points.append({"x": round(lm.x, 4), "y": round(lm.y, 4), "id": idx})

    connections = []
    for start, end in DRAW_CONNECTIONS:
        s = landmarks[start]
        e = landmarks[end]
        connections.append({
            "x1": round(s.x, 4), "y1": round(s.y, 4),
            "x2": round(e.x, 4), "y2": round(e.y, 4),
        })

    return {"points": points, "connections": connections}
