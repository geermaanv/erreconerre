# Boceto de pantallas del bot: v0.1

Estado: boceto para revisar. Fecha: 2026-11-22. Complementa `camino-de-lecciones.md` (v0.3).

Convenciones:

- `[ Botón ]` es un botón bajo el mensaje. Una fila de botones se escribe en una línea.
- El texto fuera de los botones es el mensaje del bot.
- Voseo rioplatense, tono sobrio.
- **[propuesta]** se puede cambiar. **[por validar]** depende de lo que permita Telegram, que no está verificado.

## Reglas generales

1. Cada pantalla edita el mensaje anterior en lugar de mandar uno nuevo, para que el chat no se llene. [por validar]
2. Los botones llevan etiquetas cortas. Las listas largas se paginan (`[ ◀ ]  [ ▶ ]`) porque los mensajes tienen un largo máximo. [por validar]
3. Siempre hay un botón `[ Menú ]` para volver a la pantalla principal.
4. El bot nunca muestra "nivel". Muestra práctica de hoy, minutos, racha e hitos.
5. Los recordatorios los manda el bot, solo si la persona los activó.

## 1. Bienvenida

```
Hola. Esto es un entrenamiento para la R múltiple, pensado para adultos.

Antes de empezar:
· No reemplaza a un fonoaudiólogo. Si hace mucho que no sale ningún
  sonido de R, conviene una evaluación.
· Guardo tus minutos y tus avances para seguirte. Podés borrarlos
  cuando quieras con /borrar.

[ Empezar ]   [ Cómo funciona ]
```

`Cómo funciona` explica en cuatro líneas: el método de separar la doble R, las nueve prácticas, los minutos y los hitos.

## 2. Test inicial

Una pregunta por pantalla, solo botones. Fija la práctica de hoy. No se muestra como resultado.

```
1/4  ¿Qué te cuesta?
[ La R simple (pero, cara) ]
[ La R múltiple (perro, carro) ]
[ Las dos ]
[ No estoy seguro ]
```

```
2/4  ¿Qué sale cuando intentás la R múltiple?
[ Un sonido de garganta ]   [ Una L o una D ]
[ Una sola tocada ]         [ Nada o no sé ]
```

```
3/4  Probá esto: decí "ar" varias veces con el aire pasando
     por la lengua. ¿Qué pasa?
[ Sale una tocada clara ]  [ Se traba ]  [ Suena distinto cada vez ]
```

```
4/4  Probá "arra". ¿Vibra la lengua alguna vez?
[ Sí, a veces ]  [ Sí, siempre ]  [ Nunca ]
```

Resultado (ejemplo):

```
Listo. Empezamos por la práctica 1. Todas las demás están abiertas
cuando quieras.

[ Ir al menú ]
```

Si en la pregunta 2 la persona elige "Nada o no sé" y en la 4 "Nunca", se agrega: "Si hace tiempo que no sale ningún sonido, una evaluación con un fonoaudiólogo puede descartar causas físicas. Podés practicar igual." [propuesta]

## 3. Menú principal

La práctica de hoy lleva "▶". [por validar]

```
Hoy: práctica 3. Llevás 4 h 20 min.

[ 1 · ar er ir ]     [ 2 · ra re ri ]    [ ▶ 3 · Unión ]
[ 4 · Cadenas ]      [ 5 · RR en palabras ] [ 6 · N, L, S + R ]
[ 7 · R inicial ]    [ 8 · Frases ]      [ 9 · Textos ]

[ Mi progreso ]  [ Mantenimiento ]  [ Comunidad ]
```

- `Mantenimiento` aparece solo cuando existe el hito correspondiente. [propuesta]
- Si la persona no practicó en varios días, el encabezado cambia a: "Hace 3 días que no practicás. Cinco minutos alcanzan para retomar." Sin reproches. [propuesta]

## 4. Pantalla de una práctica

### 4.1 Teoría (primera vez en esa práctica)

```
Práctica 3 · Unión (10 min)

Ahora unís las dos mitades: la sílaba que cierra con R y la que
abre con R.

  ar + ra  →  arra
  er + re  →  erre
  ir + ri  →  irri

Hacelo con la pausa mínima entre las dos mitades. De a poco,
acortá la pausa hasta que se unan.

[ Entendí ]   [ Menú ]
```

Si la práctica ya se hizo antes, la teoría queda detrás de `[ Ver teoría ]`.

### 4.2 Lista de práctica

Con la separación visible. Paginada.

```
Práctica 3 · Unión   (1/2)

  ar · ra      er · re      ir · ri
  or · ro      ur · ru

Después, unidas:  arra  erre  irri  orro  urru

[ ◀ ]  [ ▶ ]
[ Empecé ]   [ Menú ]
```

En las prácticas de palabras (5 y 6) la lista se muestra por bloques y con el paso intermedio:

```
Práctica 5 · RR en palabras   (Bloque RR 1/6)

  ar · ra → ar · roz
  car · ro
  ...

[ Ver sin separar ]
[ ◀ ]  [ ▶ ]
[ Empecé ]   [ Menú ]
```

`Ver sin separar` es el interruptor que ya existe en la app web.

### 4.3 En curso

```
Practicando. Empezaste a las 18:42.

[ Terminé ]   [ Pausa ]
```

### 4.4 Cierre

```
Terminaste. Fueron 12 minutos.

¿Cómo te fue?
[ Salió ]  [ A medias ]  [ No salió ]
```

Después:

```
Anotado: 12 min. Total: 4 h 32 min. Racha: 3 días.

¿Querés dejar una nota? (opcional)
[ Escribir nota ]   [ No, gracias ]
```

Si el resultado cambia la práctica de hoy, un renglón: "Pasaste a la práctica 4." Si aparece una sugerencia, ver sección 10.

### 4.5 Casos límite

- "Terminé" sin "Empecé": el bot pregunta los minutos con atajos `[ 5 ] [ 10 ] [ 20 ] [ 30 ] [ Otro ]`.
- "Empecé" abierto más de 60 minutos: "¿Seguís practicando o te olvidaste de cerrar? ¿Cuántos minutos fueron?" [propuesta]
- Si hay un cronómetro abierto y la persona toca otra práctica, el bot pregunta si cierra el anterior.

## 5. Registrar práctica libre

Para cuando se practica por cuenta propia, sin la guía.

```
Práctica libre

[ Empezar cronómetro ]
[ Cargar minutos ]
```

`Cargar minutos`:

```
¿Cuántos minutos practicaste?
[ 5 ]  [ 10 ]  [ 20 ]  [ 30 ]  [ Otro ]
```

Después de cargar, se pregunta el cómo te fue igual que en 4.4, pero con un botón extra `[ Omitir ]`.

## 6. Mi progreso

Texto, sin gráficos.

```
Mi progreso

Total: 12 h 40 min
Racha: 5 días
Esta semana: 4 de 5 días practicados  ▰▰▰▰▱

Últimas semanas (min):
  sem 45  ▰▰▰▰▰▰▰▰  240
  sem 46  ▰▰▰▰▰▰     180
  sem 47  ▰▰▰▰       120

Prácticas:  1 ✓  2 ✓  3 ▶  4 ·  5 ·  6 ·  7 ·  8 ·  9 ·

[ Mis hitos ]  [ Notas ]  [ Menú ]
```

`✓` significa lección superada según el criterio de avance. La semana se cuenta como días distintos con práctica registrada. El criterio de 5 días distintos es el de "Estable".

## 7. Mis hitos

```
Mis hitos

R simple                     ✓ primera vez 12 oct · estable
R múltiple aislada           ✓ primera vez 3 nov
R múltiple en sílabas        · todavía no
En palabras                  · todavía no
En frases                    · todavía no
En habla espontánea          · todavía no

[ Marcar un hito ]  [ Menú ]
```

Marcar:

```
R múltiple en sílabas

[ Me salió por primera vez ]
[ Me sale estable ]
[ Desmarcar ]
[ Volver ]
```

Sugerencia automática de "Estable": cuando el bot registra "Salió" en 5 días distintos de una misma semana en las prácticas asociadas, pregunta: "Parece que ya es estable. ¿Lo marcamos?" La persona decide. [propuesta]

Asociación entre prácticas y hitos [propuesta, a revisar]:

| Prácticas | Hito sugerido |
|---|---|
| 1 y 2 | R simple y R aislada |
| 3 y 4 | En sílabas |
| 5, 6 y 7 | En palabras |
| 8 | En frases |
| 9 | En frases (y orientación para habla espontánea) |

"En habla espontánea" no tiene práctica propia y siempre se marca a mano.

## 8. Mantenimiento

Disponible cuando existe el hito "En frases". [propuesta]

### 8.1 Entrada

```
Mantenimiento

Repaso de las palabras que te cuestan, con intervalos que
se alargan cuando te salen.

Hoy toca: 7 tarjetas.

[ Empezar ]   [ Mi mazo ]   [ Menú ]
```

### 8.2 Tarjeta

```
Tarjeta 1/7

  Israel

[ Ver separada ]
[ Salió ]  [ Costó ]  [ No salió ]
```

`Ver separada` muestra `Is · rael`. Después de la calificación pasa a la siguiente tarjeta y al final muestra un resumen de la dosis.

### 8.3 Mi mazo

```
Mi mazo: 42 palabras

[ Agregar palabra ]  [ Ver difíciles ]  [ Menú ]
```

`Agregar palabra` pide el texto y lo guarda con intervalo inicial de 1 día. `Ver difíciles` lista las que están en el primer escalón.

Intervalos: 1, 2, 4, 8 y 16 días (ver `camino-de-lecciones.md`).

## 9. Comunidad

```
Comunidad

Un grupo de personas que están en lo mismo. Se entra por invitación
de Telegram. Respetá la privacidad de los demás.

[ Entrar al grupo ]   [ Menú ]
```

## 10. Mensajes automáticos

Solo si la persona los activó en Ajustes.

**Recordatorio diario** (a la hora elegida):

```
Es la hora de tu práctica. Hoy: práctica 3.

[ Empezar ]   [ Más tarde ]   [ Hoy no ]
```

`Más tarde` repite el aviso a la hora. `Hoy no` lo silencia hasta mañana. Máximo 2 avisos por día. [propuesta]

**Sugerencia de repetir la anterior** (3 "No salió" seguidos en la práctica de hoy):

```
Las últimas tres veces no salió. Puede ayudar volver unos minutos
a la práctica anterior.

[ Ir a la práctica 2 ]   [ Seguir con la 3 ]
```

**Sugerencia de consultar a un profesional** (varias semanas sin avanzar; umbral por definir):

```
Hace varias semanas que no avanzás. A veces hay causas físicas que
práctica sola no resuelve. Una evaluación con un fonoaudiólogo
puede ayudar.

[ Entendido ]   [ Ahora no ]
```

No se repite el mismo mensaje más de una vez cada cierto tiempo. [propuesta]

**Estable sugerido:** ver sección 7.

## 11. Ajustes

```
Ajustes

[ Recordatorio: 18:30 ]   [ Días: todos ]
[ Zona horaria ]
[ Exportar mis datos ]
[ Borrar mis datos ]
```

`Borrar mis datos` pide una confirmación con un botón rojo si Telegram lo permite, y si no, con texto: "Escribí BORRAR para confirmar". [por validar]

## Qué decisiones técnicas implican estas pantallas

1. El bot necesita guardar estado de conversación (en qué pantalla está cada persona) y los datos de la sección "Datos por persona".
2. Necesita un planificador de mensajes (recordatorios) con zona horaria por persona.
3. Las listas de prácticas viven en un archivo de contenido, con la separación calculada por código a partir de la palabra.
4. El interruptor "ver sin separar" y las listas paginadas requieren editar mensajes. [por validar]

## Preguntas abiertas

1. ¿La teoría de cada práctica se muestra completa o por pasos? Depende de cuánto texto escriba el autor.
2. ¿El test inicial es realmente necesario, o alcanza con empezar en la práctica 1? Cuatro preguntas añaden fricción.
3. Máximo de recordatorios por día y horarios permitidos.
4. Si "Mantenimiento" debería abrirse antes para quien lo pida.
5. Texto exacto de los avisos legales y de salud, que conviene revisar con un profesional.
