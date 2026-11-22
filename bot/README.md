# Bot de Telegram (prototipo)

Prototipo sin dependencias (Node 18 o superior). Implementa las pantallas de `docs/pantallas-bot.md`.

## Cómo correrlo

1. Creá el bot con @BotFather y copiá el token.
2. **El token es un secreto.** No lo pegues en un chat, en un issue ni en un archivo del repositorio.
3. Desde la raíz del repositorio:

```bash
cd bot
TELEGRAM_BOT_TOKEN="<tu token>" node bot.js
```

4. Abrí el bot en Telegram y escribí `/start`.

El bot usa long polling, así que corre mientras la terminal esté abierta. Para detenerlo: Ctrl+C.

Variables opcionales:

| Variable | Para qué |
|---|---|
| `COMMUNITY_URL` | Enlace de invitación al grupo (botón Comunidad). |
| `BOT_TZ` | Zona horaria (por defecto `America/Argentina/Buenos_Aires`). |
| `BOT_DATA` | Ruta del archivo de estado (por defecto `bot/data/state.json`, ignorado por git). |

## Pruebas

```bash
node bot/test.js
```

Simula Telegram sin red y sin token. Cubre el flujo completo: bienvenida, test, menú, práctica, minutos, racha, avance de la práctica de hoy, sugerencia de repetir la anterior, hitos, notas, mantenimiento, comunidad, exportar y borrar.

## Qué incluye el prototipo

Bienvenida, test inicial de una pregunta, menú 3 por 3 con la práctica de hoy marcada con ▶, las nueve prácticas con listas paginadas y separación de la doble R (con paso intermedio), "Empecé" y "Terminé", calificación, práctica libre, progreso, hitos, notas, mantenimiento con escalera 1, 2, 4, 8 y 16 días, comunidad, ajustes (exportar y borrar).

## Qué falta o difiere del boceto

- No hay recordatorios programados ni "Pausa" en el cronómetro.
- Los minutos cargados a mano se guardan como práctica libre y no piden calificación.
- "Mantenimiento" está siempre visible. En el diseño se abre al marcar el hito "En frases".
- La sugerencia de consultar a un profesional por semanas sin avanzar no está implementada.
- La asociación entre prácticas e hitos para sugerir "Estable" cubre sílabas, palabras y frases. La de R simple y R aislada queda sin sugerencia.
- Los textos de teoría son borrador y los tiene que revisar el autor del método.
- El estado se guarda en un archivo local. No es adecuado para producción.
- Aún no se probó contra la API real de Telegram. Solo contra una simulada.
