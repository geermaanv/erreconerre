# Bot de Telegram (prototipo)

Prototipo sin dependencias (Node 18 o superior). Implementa el método v1.3 (`docs/metodo-v1.md`) con un menú simplificado en dos circuitos: Aprender y Practicar.

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
| `BOT_TZ` | Zona horaria (por defecto `America/Argentina/Buenos_Aires`). |
| `BOT_DATA` | Ruta del archivo de estado (por defecto `bot/data/state.json`, ignorado por git). |

## Pruebas

```bash
node bot/test.js
```

Simula Telegram sin red y sin token. Cubre los dos circuitos, que el ejercicio quede a la vista, el avance entre prácticas, el repaso de palabras, personas que venían de menús anteriores, datos y recordatorios.

## Qué incluye (versión mínima)

Al empezar pregunta el objetivo. Son dos circuitos y se cambia desde "Más".

**Aprender** (nueve prácticas, en orden)

- Inicio: práctica de hoy, minutos, "Empezar ejercicio" y "Más". Si ya ejercitó ese día, lo dice, muestra en cuántos días vibró y ofrece seguir. Con las nueve completas se puede repetir la 9.
- El mensaje del ejercicio queda siempre a la vista. Botones: "Terminé" y "Ayuda" (cómo se hace y, en las prácticas 1 a 4, otros caminos al sonido; llega en un mensaje aparte). La primera vez de cada práctica, la explicación llega antes del ejercicio.
- El tiempo corre desde "Empezar ejercicio", con un tope de 30 minutos por sesión.
- Al terminar hay una sola pregunta: "¿La R vibró?". Una práctica se supera cuando vibra en 3 días distintos. Al completar las nueve, propone pasar a Practicar.
- Aviso de consulta tras 12 sesiones o 4 semanas en las prácticas 1 a 3 sin que vibre nunca.

**Practicar** (en el código, modo `mantener`)

- Repaso de palabras y frases con intervalos de 1, 2, 4, 8 y 16 días. La palabra se muestra entera ("Salió bien" o "Me costó") y al final se listan las que costaron. El repaso suma minutos con cada palabra, aunque no se termine.
- La persona agrega las palabras que se le traban.

**Más:** recordatorio diario, cambiar de circuito y mis datos (exportar y borrar).

**Recordatorio diario** (opcional): una vez por día, a la hora que elija la persona, solo si todavía no practicó (en Practicar, además, solo si hay palabras para ese día). Empieza al día siguiente y se pausa solo después de 5 días sin practicar. Necesita que el bot esté corriendo todo el día.

## Qué falta o difiere del método

Esta versión no incluye varias cosas de `docs/metodo-v1.md` y `docs/pantallas-bot.md`: perfiles según el sonido, elegir práctica, practicar de memoria y cargar minutos, uso al hablar, conteo de intentos, hitos, notas, práctica libre y comunidad. Una versión con parte de eso está en el commit `9e17cf9`.

- No hay audio: la escucha es con pares para leer y grabándose con el teléfono.
- La exportación de datos falla si son muy largos.
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
