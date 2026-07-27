# Spec: monitor-postura

## Contexto
Servicio Python que usa la cámara web y MediaPipe Pose para vigilar la
postura del desarrollador en segundo plano, y disparar una PausaActiva
cuando detecta mala postura sostenida.

## Requisitos (EARS)

1. CUANDO el servicio detecte una persona frente a la cámara, EL SISTEMA
   DEBE calcular el ángulo de cuello, la relación de encorvamiento
   (nariz vs. hombros) y la inclinación de hombros en cada frame procesado.

2. CUANDO la relación de encorvamiento se desvíe de la línea base en más
   de 0.12, EL SISTEMA DEBE marcar el frame como "mala postura".

3. CUANDO la mala postura se mantenga durante 20 segundos consecutivos,
   EL SISTEMA DEBE enviar `triggerPause: true` al frontend.

4. CUANDO la postura vuelva a estar dentro del rango correcto, EL SISTEMA
   DEBE reiniciar el contador de tiempo en mala postura.

5. SI no se detecta a ninguna persona en el frame, EL SISTEMA DEBE
   reportar `status: "no_person"` y no acumular tiempo de mala postura.

6. EL SISTEMA NO DEBE enviar imágenes ni video por la red — solo valores
   numéricos derivados de los landmarks.

## Fuera de alcance (v1)
- Calibración automática de la línea base por usuario (por ahora, valor
  fijo `baseline_slouch=0.55`).
- Detección de somnolencia (EAR/MAR) — spec separado `monitor-somnolencia`.
