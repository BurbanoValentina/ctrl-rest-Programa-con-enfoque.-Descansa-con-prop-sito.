# Spec: validar-ejercicio-pausa

## Contexto
Cuando el monitor de postura dispara `triggerPause`, el frontend muestra
la pantalla de PausaActiva con un ejercicio simple (giro de cuello) y el
mismo servicio de Pose valida en vivo que el usuario lo realizó.

## Requisitos (EARS)

1. CUANDO el frontend abra la pantalla de pausa, EL SISTEMA DEBE cambiar
   el WebSocket a modo "exercise" enviando el mensaje `start_exercise`,
   sin abrir una segunda conexión de cámara.

2. CUANDO la posición horizontal de la cabeza (nariz) respecto al centro
   de los hombros supere el umbral de giro (15% del ancho de hombros),
   EL SISTEMA DEBE registrar el lado ("left" o "right").

3. CUANDO la cabeza pase por un lado y regrese al centro, EL SISTEMA DEBE
   contar una repetición completa.

4. CUANDO el contador de repeticiones alcance el objetivo (3), EL SISTEMA
   DEBE marcar `completed: true` y notificar al frontend.

5. CUANDO el usuario cierre la pantalla de pausa (completada o no),
   EL SISTEMA DEBE volver al modo "postura" enviando `stop_exercise`.

6. SI no se detecta a la persona durante el ejercicio, EL SISTEMA DEBE
   reportar `status: "no_person"` sin sumar ni restar repeticiones.

## Fuera de alcance (v1)
- Más de un tipo de ejercicio.
- Persistencia de puntos — spec separado (Lambda + DynamoDB).
