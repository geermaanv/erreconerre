# Camino de lecciones: borrador v0.3

Estado: borrador para revisar. Fecha: 2026-11-22. Cambios en v0.3: menú abierto con práctica de hoy resaltada, repetición libre, plataforma decidida (bot de Telegram primero), secciones de test inicial, datos y comunidad.

Este documento no es un tratamiento clínico ni reemplaza a un fonoaudiólogo. Es la reconstrucción, hecha de memoria 14 años después, del método que usó el autor del proyecto para lograr la R múltiple a los 42 años.

Cada parte lleva una etiqueta de confianza:

- **[recordado]**: lo contó el autor.
- **[inferido]**: deducido del orden de su lista de palabras (`Lista_de_Palabras.pdf`).
- **[propuesta]**: lo agregó el equipo de diseño para decidir. Hay que revisarlo.
- **[por validar]**: depende de probarlo con usuarios reales.

## Principios

1. **Separar la doble R.** No se intenta decir la palabra completa de corrido al principio. "Arroz" de corrido no sale. Se parte justo antes de la R que vibra: `ar` + `roz`. [recordado]
2. **Volumen de práctica.** Lo que funcionó fue practicar muchas horas, solo, en momentos libres. La métrica central son los minutos acumulados ("horas de vuelo"). [recordado]
3. **Sin niveles visibles.** La persona ve minutos, racha e hitos. Internamente hay un orden de lecciones que solo decide cuál es la práctica de hoy. [decidido]
4. **Libertad total.** Todas las prácticas están abiertas desde el principio. La persona puede repetir cualquiera cuando quiera. [decidido]
5. **Público adulto.** Tono sobrio, sin gamificación infantil. [decidido]

## Menú y navegación

Pantalla principal del bot:

- Una grilla de 3 por 3 con las nueve prácticas (las lecciones 1 a 9 de la Fase 1), nombradas por su contenido. Ninguna está bloqueada. [decidido]
- La práctica de hoy aparece resaltada. Si los botones no admiten estilos propios, se marca con un símbolo en la etiqueta (por ejemplo "▶"). [por validar, depende de lo que permita Telegram]
- Debajo de la grilla, una fila de accesos: "Mi progreso", "Mantenimiento" y "Comunidad". "Mantenimiento" podría ocultarse hasta que se marque el hito correspondiente. [propuesta]
- Dentro de cada práctica: teoría con botón "Entendí", las listas, "Empecé" y "Terminé", y la pregunta "¿Cómo te fue?".

## Test inicial

Una sola pregunta, sin micrófono: la persona prueba decir "arra" y "arroz" y elige qué pasa. Solo fija cuál es la práctica de hoy al empezar. Se puede saltar. No se muestra como nivel ni como diagnóstico, y no bloquea ninguna práctica. El detalle de las respuestas está en `pantallas-bot.md`. [propuesta]

Si responde que no sale, el bot recomienda además una evaluación con un fonoaudiólogo, por la posibilidad de causas estructurales.

## Hitos

Cada hito tiene dos momentos, y lo marca la persona:

| Hito | Primera vez | Estable |
|---|---|---|
| R simple | sale una vez | ver criterio |
| R múltiple aislada ("rrr") | sale una vez | ver criterio |
| R múltiple en sílabas | sale una vez | ver criterio |
| En palabras | sale una vez | ver criterio |
| En frases | sale una vez | ver criterio |
| En habla espontánea | sale una vez | ver criterio |

**Estable:** que salga en al menos 5 días distintos dentro de una semana. [recordado, definido por el autor]

Marcar "Primera vez" no cambia cuál es la práctica de hoy. Marcar "Estable" sí puede adelantarla. Nunca bloquea nada. Todo hito se puede desmarcar sin consecuencias. [propuesta]

Hitos de constancia (horas acumuladas, semanas seguidas) van aparte de los de habilidad. Los umbrales serían arbitrarios y la app no debe prometer ninguna cifra de horas necesarias.

## Fase 1: Conseguirla

Los minutos son orientativos. [propuesta]

| # | Lección | Contenido | Min | Confianza |
|---|---|---|---|---|
| 1 | Sílabas que cierran con R | `ar er ir or ur`, pronunciando la R con el aire pasando por la lengua | 10 | recordado |
| 2 | Sílabas que abren con R | `ra re ri ro ru` | 10 | recordado |
| 3 | Unión | `arra erre irri orro urru`, con pausa mínima entre mitades; luego `arroz` | 10 | recordado (el paso intermedio y `arra` ~ `arroz`) |
| 4 | Cadenas de sílabas | `LA rra rro rru rre rri`, `RA la lo lu le li`, `NA rra…`, `RA na no…` | 10 | inferido |
| 5 | Palabras con RR, separadas | `ar · roz`, `car · ro`, acortando la pausa hasta unirlas | 15 | recordado (arroz) / inferido (resto de la lista) |
| 6 | N, L, S + R | `en · redar`, `al · rededor`, `Is · rael`, `des · rabe` | 15 | inferido |
| 7 | Palabras con R inicial | `rama`, `rojo`, `ritual` | 10 | inferido |
| 8 | Frases cortas | grupos de tres frases | 15 | inferido |
| 9 | Poemas y trabalenguas | textos largos | 15 | inferido |

Notas:

- La separación se muestra en la app. Para las lecciones 5 y 6 se agrega el paso intermedio (`ar · ra` antes de `ar · roz`). [propuesta]
- Observación: `er + re` suena como el nombre de la letra, "erre". Puede servir de ancla. [por validar]
- La posición de la lengua (t-d), la R simple, los grupos con R (tr, dr, pr…) y la R al final de sílaba estaban en la primera versión de la app. No forman parte del método recordado. Quedan como material opcional. [propuesta]

### Criterio para avanzar [propuesta]

Al terminar una práctica la persona califica: **Salió**, **A medias**, **No salió**.

**Práctica de hoy:** la primera lección de la Fase 1 que todavía no se dio por superada.

- Una lección se da por superada con "Salió" en 3 sesiones de 3 días distintos.
- Con "A medias", la práctica de hoy sigue siendo la misma.
- Repetir otra lección es libre. No cambia la práctica de hoy. Sus calificaciones se guardan por lección y suman minutos.
- Con "No salió" 3 veces seguidas en la práctica de hoy, el bot sugiere repetir la lección anterior. Es una sugerencia, la decisión es de la persona.
- Si pasan varias semanas sin avanzar, el bot sugiere consultar a un fonoaudiólogo (umbral exacto por definir).

## Registro de práctica

Tres formas de sumar minutos:

1. **Automático**, de las sesiones guiadas: el tiempo entre "Empecé" y "Terminé".
2. **Cronómetro libre**: "empezar práctica", para cuando se practica por cuenta propia.
3. **Carga manual**, con atajos (5, 10, 20, 30 minutos).

Son minutos autoreportados. Suman sin importar qué lección se practique.

## Datos por persona

Mínimos, en un documento chico por usuario: práctica de hoy, calificaciones por lección, minutos por día con su origen, hitos con fecha y horas acumuladas, notas cortas y palabras del mantenimiento con su calendario. Se identifica por el usuario de Telegram. Habrá un comando para borrar todos los datos propios, porque son datos de salud. [propuesta]

## Fase 2: Mantenimiento

Para quienes ya logran la R múltiple y necesitan automatizarla.

- Repaso espaciado de palabras y frases, con mazo personal.
- Escalera de intervalos tipo Leitner: 1, 2, 4, 8, 16 días. "Salió" sube un escalón, "Costó" se queda, "No salió" vuelve al primero. [propuesta]
- Dosis diaria: 5 a 10 tarjetas. [propuesta]
- Mazo inicial: las palabras con N, L o S seguidas de R (`Israel`, `enredar`, `alrededor`, `desrabe`) más las que cada persona agregue.
- Entrada: hito "En frases" en estado Estable. [propuesta]
- Salida: muchos "No salió" seguidos sugieren volver al camino de lecciones. La persona decide.

## Qué dicen las fuentes consultadas

Resumen de lo leído en esta sesión (2026-11-22). No son estudios clínicos.

- Diecisiete fonoaudiólogos respondieron en Doctoralia a una consulta de una adulta de 25 años. Los que mencionan la edad dicen que se puede trabajar a cualquier edad, y uno que en adultos puede ser más lento. Casi todos recomiendan una evaluación previa. Algunos mencionan causas estructurales (frenillo corto, lengua hipotónica, respiración bucal) y derivación. Solo uno señala llevar el sonido a la vida cotidiana como el gran desafío. https://www.doctoralia.cl/preguntas-respuestas/hola-tengo-25-anos-y-tengo-problemas-con-el-fonema-r-quisiera-saber-si-el-especialista-a-acudir-es-u
- Maldita.es, sobre terapia infantil: primero la R simple; el trabajo va de sonidos a palabras y a frases. https://maldita.es/malditaciencia/20211115/pronunciar-erre-logopedia/
- Página de una universidad de EE. UU. con técnicas sin evidencia de éxito: partir de la R simple, mantener la posición de la lengua y exhalar una corriente de aire fuerte. https://faculty.chass.ncsu.edu/despain/lgv/trilled.htm

No se encontró respaldo ni contradicción para el método de separar la doble R. No se encontraron foros con testimonios de adultos.

## Preguntas abiertas

1. Duración real de cada etapa en la experiencia del autor (no recordada).
2. Sensaciones físicas que distinguen un intento correcto (no recordadas). Podrían surgir del registro de los primeros usuarios.
3. Minutos por lección y criterio de avance: confirmar o corregir las propuestas.
4. Umbral para sugerir consultar a un profesional.
5. Capacidades reales de los botones de Telegram (estilos, límites de mensajes) y de las Mini Apps: no verificadas.

## Plataforma y comunidad

- **Primera versión: bot de Telegram.** El autor asume el riesgo de depender de Telegram. Aporta recordatorios, identidad y continuidad entre dispositivos sin cuentas propias. [decidido]
- El contenido de las lecciones se guarda en un archivo estructurado, separado del código del bot, para poder reutilizarlo en una app propia más adelante. [propuesta]
- Señales para evaluar una app propia: quejas porque el chat se llena de mensajes, pedidos de gráficos, o personas que no usan Telegram. [propuesta]
- **Comunidad:** un grupo de Telegram enlazado desde el bot. Sin moderación dentro del bot por ahora. [decidido]
- **Fuera por ahora:** modo manos libres, audio modelo, micrófono y detector de vibración. [decidido]
