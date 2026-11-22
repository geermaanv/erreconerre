// Cada lección tiene bloques: { title?, items[] }. `words` se normaliza a un bloque.
// split: separar la doble R en palabras sueltas. noTts: sin audio modelo. long: ítems de varias líneas.
const METHOD = 'No intentes decir la palabra completa de corrido al principio: "arroz" de corrido no va a salir. Primero separá antes de la R que vibra.';
const LESSONS = [
  {
    id: 'lengua', title: '1. Posición de la lengua', trill: false,
    intro: 'Antes de la R: ubicar la punta de la lengua en los alvéolos (la cresta detrás de los dientes superiores).',
    steps: [
      'Apoyá la punta de la lengua en los alvéolos, justo detrás de los dientes de arriba.',
      'Decí "t-d-t-d" lento, sintiendo el toque de la lengua en ese punto.',
      'Repetí "ta-da-ta-da" cada vez más rápido, con la lengua relajada.',
    ],
    words: ['ta', 'da', 'tada', 'tadada', 'ladrar', 'todo', 'dedo', 'lado'],
  },
  {
    id: 'simple', title: '2. R simple (una sola tocada)', trill: false,
    intro: 'La R de "pero" es un toque rápido de la lengua, igual que la D de "todo" dicha rápido.',
    steps: [
      'Decí "ca-da" varias veces rápido. Ese toque de la D es la R simple.',
      'Cambiá la D por R: "ca-ra", manteniendo el mismo toque corto.',
      'Que el toque sea breve y suelto, sin empujar la lengua.',
    ],
    words: ['cada', 'cara', 'pero', 'toro', 'arena', 'mira', 'para', 'oro', 'lira', 'mero'],
  },
  {
    id: 'grupos', title: '3. Grupos con R (tr, dr, pr, br, cr, gr, fr)', trill: false,
    intro: 'La R después de otra consonante. El toque de la R sigue siendo corto.',
    steps: [
      'Decí "t" + "r" pegados, sin vocal en el medio: "tre".',
      'Mantené la lengua en los alvéolos entre las dos consonantes.',
      'Pasá a las demás: dr, pr, br, cr, gr, fr.',
    ],
    words: ['tres', 'tren', 'drama', 'madre', 'premio', 'brazo', 'cobre', 'crema', 'gracias', 'frase', 'libro', 'otro'],
  },
  {
    id: 'silabas', title: '4. Sílabas con R múltiple', trill: true, noTts: true,
    intro: 'Cadenas de sílabas: de una consonante fácil (L, N) a la R múltiple, y de la R hacia atrás.',
    steps: [
      'Leé cada línea en voz alta, lento: primera sílaba y luego las cinco sílabas en cadena.',
      'En los bloques que empiezan con "RA la lo lu…" se parte de la R y se baja a una consonante fácil.',
      'Aumentá la velocidad solo cuando la R salga pareja.',
    ],
    blocks: [
      { title: 'L + rr', items: ['LA rra rro rru rre rri', 'LO rra rro rru rre rri', 'LE rra rro rru rre rri', 'LU rra rro rru rre rri', 'LI rra rro rru rre rri'] },
      { title: 'R + l', items: ['RA la lo lu le li', 'RO la lo lu le li', 'RE la lo lu le li', 'RU la lo lu le li', 'RI la lo lu le li'] },
      { title: 'R + rr', items: ['RA rra rro rru rre rri', 'RO rra rro rru rre rri', 'RE rra rro rru rre rri', 'RU rra rro rru rre rri', 'RI rra rro rru rre rri'] },
      { title: 'N + rr', items: ['NA rra rro rru rre rri', 'NO rra rro rru rre rri', 'NE rra rro rru rre rri', 'NU rra rro rru rre rri', 'NI rra rro rru rre rri'] },
      { title: 'R + n', items: ['RA na no nu ne ni', 'RO na no nu ne ni', 'RE na no nu ne ni', 'RU na no nu ne ni', 'RI na no nu ne ni'] },
    ],
  },
  {
    id: 'palabras', title: '5. Palabras con R múltiple', trill: true, split: true,
    intro: 'Método: separar la doble R. Con "separar" activado, la palabra se muestra partida justo antes de la R que vibra.',
    steps: [
      METHOD,
      'Separá: "ar" + "roz". La segunda parte empieza directamente con la R.',
      'Practicá la segunda parte sola ("roz", "roz", "roz") y después la primera ("ar").',
      'Decí las dos partes con una pausa mínima y de a poco acortá la pausa hasta unirlas.',
      'Lo mismo con "en·redar", "al·rededor", "des·rabe", etc. Al hacer clic en 🔊 se escucha: primera parte, segunda parte, palabra completa.',
    ],
    blocks: [
      { title: 'R inicial', items: ['raiz', 'raton', 'rifa', 'roto', 'rama', 'recibo', 'recta', 'risa', 'remedio', 'ritual', 'rebeca', 'Ricardo', 'Roberto', 'Ruben', 'Rafaela'] },
      { title: 'Mezcla 1', items: ['aburrido', 'arropar', 'carreta', 'ocurrir', 'agarradera', 'carro', 'puerro', 'carretilla', 'barriles', 'arrastrar', 'gorrion', 'birrete', 'torre', 'tarro', 'tierra', 'arrimar', 'ahorrando'] },
      { title: 'R inicial 2', items: ['rudo', 'riel', 'respiro', 'ruidoso', 'remera', 'relojeria', 'rompecabezas', 'recreo', 'ramo', 'rojo', 'rosado', 'raqueta', 'regadera'] },
      { title: 'Mezcla 2', items: ['agarrar', 'turrón', 'cerrado', 'arrancar', 'arrojar', 'arroces', 'arroyo', 'burro', 'enterrado', 'barro', 'arriba', 'cerro', 'horror', 'perro', 'zorro', 'corrió', 'gorra', 'forrada', 'arruga', 'carro'] },
      { title: 'Mezcla 3', items: ['reina', 'recibió', 'rey', 'retó', 'redondo', 'realizó', 'alrededor', 'Israel', 'enriquecido', 'enredes', 'rusia', 'retornar', 'enredo'] },
      { title: 'N, L, S + R (1)', items: ['Enrique', 'Manrique', 'Alrededor', 'Sonrosado', 'Enrolar', 'Enredadera', 'Sonreír', 'Enredar', 'Enrevesado', 'Enraizar', 'Enrabiar', 'Enrarecer', 'Enredo', 'Enrojecer', 'Enroscar', 'Israel', 'Honra', 'Honrado'] },
      { title: 'N, L, S + R (2)', items: ['enrabiar', 'enraizar', 'enramar', 'enrarecer', 'enredar', 'enrejar', 'enrevesado', 'enrojecer', 'enrolar', 'enrollar', 'enroscar', 'jonrón', 'ronronear', 'runrún', 'sinrazón', 'sonrosar', 'disruptivo', 'posromántico'] },
      { title: 'N, L, S + R (3)', items: ['Israel', 'desrabe', 'desrame', 'israelí', 'desrabar', 'desraízo', 'desramar', 'desrabote', 'desraizar', 'desranche', 'desratice', 'desratizo', 'desriñone', 'israelita', 'trasrosco', 'desrabotar', 'desranchar', 'desratizar', 'desriñonar', 'desrostrar', 'disruptivo', 'trasroscar'] },
      { title: 'RR (1)', items: ['Jarra', 'Burra', 'Barra', 'Parra', 'Perra', 'Sierra', 'Tierra', 'Guerra', 'Carraca', 'Marrano', 'Barraca'] },
      { title: 'RR (2)', items: ['Macarra', 'Serranía', 'Carracuca', 'Perro', 'Corro', 'Jarro', 'Sarro', 'Carro', 'Guitarra'] },
      { title: 'RR (3)', items: ['Gorro', 'Morro', 'Morron', 'Carroza', 'Barroco', 'Garrote', 'Macarron', 'Arroba', 'Arroyo'] },
      { title: 'RR (4)', items: ['Arruga', 'Serrucho', 'Berruga', 'Garrulo', 'Arrullo', 'Urraca', 'Virrey', 'Correa', 'Carrete'] },
      { title: 'RR (5)', items: ['Barrena', 'Correo', 'Terreno', 'Carrera', 'Guerrera', 'Carretera', 'Correcaminos', 'Carri', 'Barrio'] },
      { title: 'RR (6)', items: ['Barril', 'Barrido', 'Barriga', 'Carrito', 'Parrilla', 'Barriada', 'Perrera', 'Barrilete', 'Barrigo'] },
    ],
  },
  {
    id: 'final', title: '6. R al final de sílaba', trill: false,
    intro: 'Al final de sílaba o palabra, la R suele ser simple o apenas vibrada.',
    steps: [
      'Terminá la palabra con un toque corto de la lengua.',
      'No alargues ni arrastres la R final.',
    ],
    words: ['mar', 'comer', 'amor', 'carta', 'puerta', 'dormir', 'verde', 'cuerda', 'árbol', 'invierno'],
  },
  {
    id: 'frases', title: '7. Frases cortas', trill: true,
    intro: 'Frases con R en grupos de tres. Primero lento, marcando cada R.',
    steps: [
      'Si una palabra se traba, volvé a practicarla separada en la lección 5.',
      'Grabate y escuchá la grabación.',
    ],
    blocks: [
      ['Ricardo come queso', 'Dame la rosa pequeña', 'Coge la rana'],
      ['El rabo es del gato', 'El león ruge mucho', 'El niño está en la rama'],
      ['Este racimo es de uva', 'Dame el recibo que está en la mesa', 'Antonio está en el río'],
      ['La rodilla me duele', 'Tengo ropa de otoño', 'El Sol es rojo'],
      ['La raqueta es de tenis', 'Coge la rana de la pecera', 'Juego con la ruleta'],
      ['El rebaño está en el campo', 'Dame el radar que tienes', 'Dice mamá que hagas un recado'],
      ['La receta del pastel es muy buena', 'La vaca tiene un rabo que se mueve mucho', 'Este vestido es de rebaja'],
      ['La ráfaga de viento se ha llevado el tejado', 'Este poema que has recitado es muy bonito', 'Dame el juguete que está roto'],
      ['Redondo es el balón', 'Tengo un regalo que me gusta mucho', 'El pez está en la red'],
      ['Este relato es de miedo', 'Este animal se llama reno y vive en el rio', 'Este chiste da mucha risa'],
    ].map((items) => ({ items })),
  },
  {
    id: 'textos', title: '8. Poemas y trabalenguas', trill: true, long: true,
    intro: 'Textos largos con muchas R. Leelos lento y subí el ritmo de a poco.',
    steps: ['Leé una línea por vez antes de leer el texto completo.'],
    blocks: [{ items: [
      'Erre con erre, guitarra;\nerre con erre, carril;\nmira que rápido ruedan,\nlas redondas ruedas del ferrocarril.',
      'Un burro comia berros\ny el perro se los robó,\nel burro lanzó un rebuzno,\ny el perro al barro cayó.',
      'El perro de San Roque no tiene rabo\nporque Ramón Rodríguez se lo ha robado.',
      'El terrateniente Ramón Pueyrredón Aguirre\narreaba rumiantes en su remoto rancho.\nSe aburría Ramón encerrado en su recurrente rutina.\nResuelto a romperla, arrancó rumbo a tierras rimbombantes.\n¡¡ARRE!!\nRecorriendo Recoleta, Ramón reparó en un rodaje.\nY de repente, una revelación: ¡¡RAYOS!!!\nResolvió arrimarse al reconocido realizador Rasputín Romanof,\ny correr el riesgo de requerirle un rol de reparto en su relato.\nRomanof sonrió: “Eres aburrido e impertinente”,\nRamón, zorro, le regaló un riquísimo Navarro Correas\nrecelosamente reservado que recordaba el terruño,\ny el ruso regodeándose respondió: “Rendirás”.\n¡¡A RODAR!!!\nY resultó que en el Romance Río Arriba,\nRamón representó a un terrateniente\nque arreaba rumiantes en su remoto rancho.\nRamón, realizado, recuperó su sonrisa.\n¿Cuantas erres tenía su vino?',
      'Estando Curro en un corro, con el Guerra y con Chicorro,\ndijo Curro: – Yo me escurro de este corro, con el Guerra y con Chicorro,\nen el carro de Socorro.',
      'Borracho un ratón robó un ramo de rosas rojas.\nEl rabo se le enredó y rodó de rosa en rosa.',
      'El cielo está enladrillado, quién lo desenladrillará.\nEl desenladrillador que lo desenladrille, buen desenladrillador será.',
      'Había un perro debajo de un carro,\nvino otro perro y le mordió el rabo.\ncorre, corre por la calle arriba, corre, corre por la calle abajo.',
      'El tapón está enroscado, ¿quién lo desenroscará?\nEl desenroscador que lo desenrosque, buen desenroscador será.',
      'Por la calle de Carretas pasaba un perrito;\npasó una carreta y le pisó el rabito.\n¡Pobre perrito, cómo lloraba por su rabito!',
    ] }],
  },
];
