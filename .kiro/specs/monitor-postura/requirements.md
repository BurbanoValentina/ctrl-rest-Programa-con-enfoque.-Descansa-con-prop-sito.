# Spec: monitor-postura

## Contexto
Servicio Python que recibe frames de la webcam del navegador y usa
MediaPipe Pose para vigilar la postura del desarrollador en segundo plano,
y disparar una PausaActiva cuando detecta mala postura sostenida.

## Requisitos (EARS)

1. CUANDO el servicio detecte una persona en el frame, EL SISTEMA
   DEBE calcular el ángulo de cuello, la relación de encorvamiento
   (nariz vs. hombros), la inclinación de hombros y el head drop.

2. CUANDO el ángulo de cuello supere 25°, O el slouch ratio sea menor
   a 0.35, O el head drop sea menor a 0.3, O el shoulder tilt supere 8,
   EL SISTEMA DEBE marcar el frame como "mala postura" e indicar la razón.

3. CUANDO la mala postura se mantenga durante 20 segundos consecutivos,
   EL SISTEMA DEBE enviar `triggerPause: true` al frontend.

4. CUANDO la postura vuelva a estar dentro del rango correcto, EL SISTEMA
   DEBE reiniciar el contador de tiempo en mala postura.

5. SI no se detecta a ninguna persona en el frame, EL SISTEMA DEBE
   reportar `status: "no_person"` y no acumular tiempo de mala postura.

6. EL SISTEMA NO DEBE enviar imágenes ni video por la red — solo valores
   numéricos derivados de los landmarks.

7. EL SISTEMA DEBE enviar las coordenadas de landmarks relevantes para
   que el frontend los dibuje sobre el video.

## Fuera de alcance (v1)
- Calibración automática de la línea base por usuario.
- Detección de somnolencia (EAR/MAR) — spec separado.
