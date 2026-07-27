"""
Ping Pong AR — ambas manos son raquetas.

Mano izquierda (visual) = raqueta azul
Mano derecha (visual) = raqueta roja
La pelota rebota entre ambas. Pierde rally si cae al suelo.
"""
import math
import time
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Ball:
    x: float = 0.5
    y: float = 0.3
    vx: float = 0.1
    vy: float = 0.2
    radius: float = 0.025
    active: bool = True

    def update(self, dt: float) -> None:
        if not self.active:
            return
        # Gravedad suave
        self.vy += 0.8 * dt
        self.x += self.vx * dt
        self.y += self.vy * dt

        # Rebote en paredes laterales
        if self.x < self.radius:
            self.x = self.radius
            self.vx = abs(self.vx) * 0.9
        elif self.x > 1.0 - self.radius:
            self.x = 1.0 - self.radius
            self.vx = -abs(self.vx) * 0.9

        # Rebote en techo
        if self.y < self.radius:
            self.y = self.radius
            self.vy = abs(self.vy) * 0.9

    def reset(self) -> None:
        self.x = 0.5
        self.y = 0.3
        self.vx = 0.1
        self.vy = 0.2
        self.active = True

    def hit_paddle(self, px: float, py: float, paddle_r: float) -> bool:
        """Checa colisión con una raqueta y rebota."""
        dist = math.hypot(self.x - px, self.y - py)
        if dist < (self.radius + paddle_r):
            # Rebote: la pelota se aleja de la raqueta
            angle = math.atan2(self.y - py, self.x - px)
            speed = math.hypot(self.vx, self.vy)
            speed = max(speed, 0.4)  # Velocidad mínima
            speed = min(speed * 1.05, 1.5)  # Acelera un poco cada hit
            self.vx = math.cos(angle) * speed
            self.vy = math.sin(angle) * speed
            # Empujar fuera de la raqueta
            self.x = px + math.cos(angle) * (self.radius + paddle_r + 0.01)
            self.y = py + math.sin(angle) * (self.radius + paddle_r + 0.01)
            return True
        return False


@dataclass
class PingPongGame:
    ball: Ball = field(default_factory=Ball)
    # Dos raquetas
    left_paddle_x: float = 0.3
    left_paddle_y: float = 0.5
    right_paddle_x: float = 0.7
    right_paddle_y: float = 0.5
    paddle_radius: float = 0.055
    rally: int = 0
    record: int = 0
    last_update: float = 0.0
    last_hit: str = ""  # "left" o "right" — evita doble hit

    def reset(self) -> None:
        self.ball.reset()
        self.rally = 0
        self.last_update = time.time()
        self.last_hit = ""

    def update(self, hands_data: list) -> dict:
        now = time.time()
        dt = min(now - self.last_update, 0.1) if self.last_update > 0 else 0.016
        self.last_update = now

        # Procesar manos — NO espejar aquí, el frontend se encarga
        for hand in hands_data:
            handedness = hand["handedness"]
            lm = hand["landmarks"]
            palm_x = lm[9]["x"]
            palm_y = lm[9]["y"]

            # MediaPipe "Left" = mano derecha del usuario (visual) = raqueta ROJA
            # MediaPipe "Right" = mano izquierda del usuario (visual) = raqueta AZUL
            if handedness == "Left":
                self.right_paddle_x = palm_x
                self.right_paddle_y = palm_y
            elif handedness == "Right":
                self.left_paddle_x = palm_x
                self.left_paddle_y = palm_y

        # Física
        self.ball.update(dt)

        # Colisión con raqueta izquierda (azul)
        if self.last_hit != "left":
            if self.ball.hit_paddle(self.left_paddle_x, self.left_paddle_y, self.paddle_radius):
                self.rally += 1
                self.last_hit = "left"
                if self.rally > self.record:
                    self.record = self.rally

        # Colisión con raqueta derecha (roja)
        if self.last_hit != "right":
            if self.ball.hit_paddle(self.right_paddle_x, self.right_paddle_y, self.paddle_radius):
                self.rally += 1
                self.last_hit = "right"
                if self.rally > self.record:
                    self.record = self.rally

        # Si la pelota cae (y > 1.1), reset rally
        if self.ball.y > 1.1:
            self.rally = 0
            self.last_hit = ""
            self.ball.reset()

        return self.get_state(hands_data)

    def get_state(self, hands_data: list) -> dict:
        hands_draw = []
        for hand in hands_data:
            points = []
            for lm in hand["landmarks"]:
                points.append({"x": round(lm["x"], 4), "y": round(lm["y"], 4)})
            hands_draw.append({
                "handedness": hand["handedness"],
                "points": points,
            })

        return {
            "ball": {"x": round(self.ball.x, 4), "y": round(self.ball.y, 4)},
            "leftPaddle": {"x": round(self.left_paddle_x, 4), "y": round(self.left_paddle_y, 4)},
            "rightPaddle": {"x": round(self.right_paddle_x, 4), "y": round(self.right_paddle_y, 4)},
            "rally": self.rally,
            "record": self.record,
            "hands": hands_draw,
        }
