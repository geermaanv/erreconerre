# Bot de Telegram (prototipo)

Prototipo sin dependencias (Node 18 o superior). Implementa el método v1.3 (`docs/metodo-v1.md`) sobre las pantallas de `docs/pantallas-bot.md`.

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

Simula Telegram sin red y sin token. Cubre el flujo completo: introducción, test de dos preguntas y perfiles, teoría por páginas, modo memoria, escucha, conteo de 5 intentos, pregunta de control, avance de la práctica de hoy, rutas alternativas, preparación, Habla, consulta, hitos, notas, mantenimiento con frases, exportar y borrar.

## Qué incluye el prototipo

- **Introducción** de 5 pantallas: qué es la R múltiple, el método de separar, cómo es una sesión, cómo se mide y cuándo consultar.
- **Test de dos preguntas** que asigna un perfil (R simple, gutural, sustitución, sin R simple o intermitente) y explica el punto de partida.
- **Menú 3 por 3** con la práctica de hoy (▶) y su objetivo.
- **Cada práctica** tiene teoría por páginas (por qué, cómo, en qué fijarte), lista paginada con separación de la doble R, modo memoria y una indicación distinta por sesión.
- **Presentación progresiva:** "Preparación" aparece desde la segunda sesión; "Si no sale" (rutas alternativas según el perfil), tras 3 "No salió" o desde el inicio para los perfiles sin R simple o con sustitución; "Escucha", desde la práctica 5.
- **Sesión:** conteo opcional de 5 intentos (4 de 5 para avanzar), pregunta de control antes de calificar (un "Salió" con un solo golpe no cuenta para superar), sugerencia de grabarse tras el primer "Salió".
- **Derivación:** aviso tras 12 sesiones o 4 semanas en las prácticas 1 a 3 sin "Salió", después de probar las rutas. En Ajustes: "Cuándo consultar", "Qué llevar a la consulta" (resumen generado) y "Seguridad".
- **Habla** (fase 2): escalera de 5 escalones de presión.
- **Mantenimiento** con escalera de 1, 2, 4, 8 y 16 días, palabras y frases. Se abre con el hito "En frases" estable, con el test, o a pedido.
- **Recordatorio diario** opcional (Ajustes → Recordatorio): una vez por día, a la hora que elija la persona, solo si todavía no practicó. Empieza al día siguiente de activarlo y se pausa solo después de 5 días sin practicar. Necesita que el bot esté corriendo todo el día.
- Práctica libre, progreso, hitos, notas, comunidad, exportar y borrar.

## Qué falta o difiere del método

- No hay "Pausa" en el cronómetro.
- No hay audio: la escucha es con pares para leer y grabándose con el teléfono.
- Los minutos cargados a mano no piden calificación.
- Habla se sube de escalón a mano. El bot sugiere subir tras 5 días con "Salió" en una semana.
- La asociación entre prácticas e hitos para sugerir "Estable" cubre sílabas, palabras y frases.
- Los textos son propuestas y los tiene que revisar el autor del método.
- El estado se guarda en un archivo local. No es adecuado para producción.

## Dejarlo corriendo siempre (macOS)

Los recordatorios solo salen si el bot está encendido a esa hora. En una Mac, un servicio de usuario (`launchd`) lo arranca al iniciar sesión y lo reinicia si se cae. Mientras la Mac esté prendida y con la sesión abierta, funciona; si se apaga o duerme, los recordatorios de ese rato no salen.

1. Guardá el token en un archivo privado (no en el repositorio):

```bash
mkdir -p ~/.config/porfinlar && printf 'TELEGRAM_BOT_TOKEN=%s\n' 'PEGAR_TOKEN' > ~/.config/porfinlar/bot.env && chmod 600 ~/.config/porfinlar/bot.env
```

2. Copiá la plantilla, reemplazando `RUTA_DEL_REPO` y `HOME` por tus rutas, y activala:

```bash
sed -e "s#RUTA_DEL_REPO#$PWD#" -e "s#HOME#$HOME#" bot/launchd/com.porfinlar.bot.plist.template > ~/Library/LaunchAgents/com.porfinlar.bot.plist
launchctl load ~/Library/LaunchAgents/com.porfinlar.bot.plist
```

(ejecutado desde la raíz del repositorio). Para apagarlo: `launchctl unload ~/Library/LaunchAgents/com.porfinlar.bot.plist`. El registro queda en `~/Library/Logs/porfinlar-bot.log`.

Para que no dependa de tu Mac, la alternativa es un servidor que esté siempre encendido (por ejemplo una máquina virtual gratuita de algún proveedor). El bot no tiene dependencias: solo necesita Node 18 o superior y la variable `TELEGRAM_BOT_TOKEN`.
