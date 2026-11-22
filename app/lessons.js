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
    id: 'multiple', title: '4. R múltiple (vibrante, "rr")', trill: true,
    intro: 'Lo más difícil: la lengua vibra por el aire, no por el músculo. Hay que darle flexibilidad y flujo de aire.',
    steps: [
      'Lengua relajada, punta cerca de los alvéolos, bordes laterales tocando los dientes de arriba.',
      'Soplá aire de forma continua y firme mientras decís "d-d-d-d" o "trrr".',
      'Probá "tdr-tdr-tdr" o "ddrrr": el aire hace vibrar la punta sola.',
      'Sostené la vibración 1 segundo. El medidor muestra la vibración detectada por el micrófono (heurístico).',
      'Si no sale: practicá a diario unos minutos. Puede tardar semanas o meses.',
    ],
    words: ['rrr', 'drrr', 'perro', 'carro', 'correr', 'torre', 'arroz', 'rosa', 'rápido', 'ferrocarril', 'guitarra', 'borracho'],
  },
  {
    id: 'final', title: '5. R al final de sílaba', trill: false,
    intro: 'Al final de sílaba o palabra, la R suele ser simple o apenas vibrada.',
    steps: [
      'Terminá la palabra con un toque corto de la lengua.',
      'No alargues ni arrastres la R final.',
    ],
    words: ['mar', 'comer', 'amor', 'carta', 'puerta', 'dormir', 'verde', 'cuerda', 'árbol', 'invierno'],
  },
  {
    id: 'frases', title: '6. Frases y trabalenguas', trill: true,
    intro: 'Integrar todo en frases de ritmo natural.',
    steps: [
      'Primero lento, marcando cada R. Después aumentá el ritmo.',
      'Grabate y escuchá la grabación.',
    ],
    words: [
      'El perro de San Roque no tiene rabo',
      'Tres tristes tigres tragaban trigo',
      'Erre con erre cigarro, erre con erre barril',
      'Rápido ruedan los carros cargados de azúcar del ferrocarril',
      'Pablito clavó un clavito',
    ],
  },
];
