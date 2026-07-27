"""
Validación de ejercicio: giro de cuello.

Umbrales más amplios y con histéresis para evitar falsos positivos.
"""
from dataclasses import dataclass
from typing import Optional

NOSE = 0
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

# Umbral para considerar que giró: 25% del ancho de hombros (antes era 15%)
TURN_THRESHOLD = 0.25
# Umbral para considerar que volvió al centro: 12% (histéresis)
CENTER_THRESHOLD = 0.12


@dataclass
class ExerciseTracker:
    target_reps: int = 3
    current_reps: int = 0
    completed: bool = False
    current_side: Optional[str] = None
    was_at_side: bool = False

    def reset(self) -> None:
        self.current_reps = 0
        self.completed = False
        self.current_side = None
        self.was_at_side = False

    def process_landmarks(self, landmarks) -> dict:
        if self.completed:
            return self._state()

        nose = landmarks[NOSE]
        l_sh = landmarks[LEFT_SHOULDER]
        r_sh = landmarks[RIGHT_SHOULDER]

        mid_x = (l_sh.x + r_sh.x) / 2
        shoulder_width = abs(l_sh.x - r_sh.x) or 0.001

        # Desviación normalizada
        deviation = (nose.x - mid_x) / shoulder_width

        # Determinar posición con histéresis
        if self.was_at_side:
            # Para volver a "centro" necesita estar dentro del umbral más bajo
            if abs(deviation) < CENTER_THRESHOLD:
                position = "center"
            elif deviation > TURN_THRESHOLD:
                position = "right"
            elif deviation < -TURN_THRESHOLD:
                position = "left"
            else:
                # En zona muerta — mantener estado
                position = self.current_side or "center"
        else:
            # Para registrar un giro, necesita superar el umbral alto
            if deviation > TURN_THRESHOLD:
                position = "right"
            elif deviation < -TURN_THRESHOLD:
                position = "left"
            else:
                position = "center"

        # Lógica de conteo
        if position in ("left", "right"):
            if not self.was_at_side:
                self.current_side = position
                self.was_at_side = True
        elif position == "center" and self.was_at_side:
            self.current_reps += 1
            self.was_at_side = False
            self.current_side = None

            if self.current_reps >= self.target_reps:
                self.completed = True

        return self._state(deviation=deviation, position=position)

    def _state(self, deviation: float = 0, position: str = "center") -> dict:
        return {
            "currentReps": self.current_reps,
            "targetReps": self.target_reps,
            "completed": self.completed,
            "currentSide": self.current_side,
            "position": position,
            "deviation": round(deviation, 3),
        }
