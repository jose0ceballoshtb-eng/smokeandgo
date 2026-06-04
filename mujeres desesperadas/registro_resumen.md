Resumen: Verificación de email y conectividad

Estado actual
- El mapa muestra 2 máquinas con ubicación e iconos (funciona).
- Flujo de registro: ahora valida email en cliente; el input de fecha muestra DD/MM/YYYY y se envía como YYYY-MM-DD.
- Comprobación de conexión: se hace un `fetch` corto a https://clients3.google.com/generate_204 con timeout 3s; si falla, muestra un Alert y cancela el registro.
- Si el backend devuelve `token`, la app guarda el token y redirige a `map`. Si no, muestra alerta de éxito y redirige a `login`.

Tres opciones propuestas (elegir una)
1) Implementar `NetInfo` + cola offline
- Detectar estado de red con `@react-native-community/netinfo`.
- Permitir registro offline guardando la operación en una cola local (`AsyncStorage`/archivo).
- Sincronizar automáticamente cuando haya conexión.
- Ventaja: buena UX offline; mayor trabajo.

2) Permitir registro local inmediato (rápido)
- Quitar o relajar la comprobación de red en `app/register.tsx`.
- Guardar usuario localmente (`user.json`) y redirigir a `login`/`map`.
- Verificación por email y sincronización posterior opcionales.
- Ventaja: rápido de implementar.

3) Cola de sincronización sin cambiar UI
- Mantener la comprobación actual, pero si falla la red guardar la acción como pendiente.
- Cuando se recupere la conexión, reintentar automáticamente.
- Ventaja: compromiso entre UX y seguridad.

Tres acciones para cuando despiertes
A) Implementar `NetInfo` y banner offline; crear esqueleto `src/utils/syncQueue.ts` para gestionar la cola.
B) Implementar registro local inmediato: quitar la comprobación de red en `app/register.tsx`, guardar en `src/utils/fileStorage` y probar en emulador.
C) Implementar verificación por correo en backend: añadir endpoint para envío de token y ruta de confirmación; actualizar `src/utils/auth.js` y UI en `app/register.tsx`.

Archivos clave
- `app/register.tsx` (lógica registro y comprobación de red)
- `src/utils/auth.js` (apiRegister, saveToken)

Dime cuál opción quieres que implemente ahora (A, B o C) y la hago.