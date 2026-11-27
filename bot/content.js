// Contenido del método v1.3 (docs/metodo-v1.md). Textos para revisar por el autor del método.
const LESSONS = require('../app/lessons.js');
const { splitTrill } = require('../app/split.js');

const byTitle = (re) => LESSONS.flatMap((l) => l.blocks || []).filter((b) => re.test(b.title || ''));
const uniq = (a) => [...new Set(a)];
function chunk(arr, n) { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }

function intermediate(head, tail) {
  const m = /^r[aeiouáéíóúü]/i.exec(tail);
  return m && m[0] !== tail ? `${head} · ${m[0]}` : null;
}

// "ar · ra → ar · roz → arroz": la lista muestra el camino completo, de separada a unida.
function wordSteps(w) {
  const parts = splitTrill(w);
  if (!parts) return w;
  const mid = intermediate(parts[0], parts[1]);
  return `${mid ? `${mid} → ` : ''}${parts[0]} · ${parts[1]} → ${w}`;
}

// Una página por bloque. split: muestra la palabra partida antes de la R que vibra.
function wordPages(blocks, split) {
  return blocks.map((b) => {
    const items = uniq(b.items);
    const body = split ? items.map(wordSteps).join('\n') : chunk(items, 3).map((row) => row.join('   ')).join('\n');
    return `${b.title || ''}\n\n${body}`.trim();
  });
}
const lines = (b) => b.items.join('\n');

// ---------- Cómo funciona ----------
const INTRO = [
  'Cómo funciona (1/2) · La R que vibra\n\n' +
  'La R de "perro" no es una R más fuerte: es la punta de la lengua golpeando varias veces seguidas detrás de los dientes de arriba, empujada por el aire. La lengua va relajada.\n\n' +
  'El método es separar. "Arroz" de corrido no sale al principio, así que se corta justo antes de la R que vibra:\n\n' +
  '  ar · roz\n\n' +
  'Primero cada mitad, después con una pausa corta que se va achicando.',
  'Cómo funciona (2/2) · Cómo se practica\n\n' +
  '· Tocás "Practicar" y te aparece el ejercicio, con una sola cosa en qué fijarte.\n' +
  '· Al terminar tocás "Terminé" y respondés una sola pregunta.\n' +
  '· Una práctica se supera cuando vibra en 3 días distintos. Son 9, de sílabas a textos.\n' +
  '· Cinco minutos cuentan. Lo que más ayuda es practicar seguido.\n\n' +
  'Cuidate: si te mareás al soplar, frená y respirá normal. Si duele la lengua o la mandíbula, cortá. No uses el teléfono manejando.\n\n' +
  'Esto no reemplaza a un fonoaudiólogo.',
];

// ---------- Inicio: modo y punto de partida ----------
const MODO = {
  q: '¿En qué estás?\n\n· Aprender: todavía no te sale la R de "perro", o te sale solo a veces.\n· Mantener: ya te sale y querés que no se te trabe.',
  aprender: 'Estoy aprendiendo la R', mantener: 'Ya me sale: quiero mantenerla',
};
const PARTIDA = {
  q: 'Decí "pero" en voz alta. ¿Te sale esa R, la de un solo golpe?',
  a: [['Sí', 'simple'], ['No, o suena como otra letra', 'sinsimple'], ['Me vibra en la garganta', 'gutural']],
};

// rutas: orden en que se ofrecen las rutas alternativas
const PERFILES = {
  simple: { name: 'R simple sin vibrar', rutas: [3, 4, 1, 5, 2, 0],
    texto: 'Tenés la R simple: la lengua ya sabe ir al lugar correcto. Lo que falta es que el aire la haga vibrar más de una vez. Es el punto de partida más común.' },
  gutural: { name: 'R gutural', rutas: [1, 2, 3, 4, 5, 0],
    texto: 'Tu R vibra atrás, en la garganta. El trabajo es llevar la vibración adelante, a la punta de la lengua.\n\nDos reglas para vos: no empujes con más aire (refuerza la vibración de atrás) y andá lento. Cuando aceleres, la garganta va a querer volver; es normal.' },
  sustitucion: { name: 'R reemplazada por otro sonido', rutas: [0, 1, 2, 3, 4, 5],
    texto: 'Cuando la R se reemplaza siempre por otro sonido, conviene una evaluación con un fonoaudiólogo. En algunas personas influye la forma de la boca, y ahí puede hacer falta también un ortodoncista o un cirujano maxilofacial.\n\nPodés practicar igual mientras tanto. En "Más" → "Consultar a un fonoaudiólogo" hay un resumen para llevar.' },
  sinsimple: { name: 'Sin R simple', rutas: [0, 1, 2, 3, 4, 5],
    texto: 'Primero vamos a conseguir la R simple (la de "pero"), que es la base de la R que vibra. Para eso está la ruta 0: en el ejercicio, tocá "No me sale".\n\nSi la R se reemplaza siempre por otro sonido, o hace tiempo que no sale ninguno, conviene una evaluación con un fonoaudiólogo. En algunas personas influye la forma de la boca. Podés practicar igual mientras tanto.' },
  intermitente: { name: 'Sale a veces', rutas: [5, 3, 4, 1, 2, 0],
    texto: 'Ya la tenés. El trabajo ahora es que salga siempre: en las palabras que se traban y cuando hablás rápido o con presión.' },
};

// ---------- Rutas alternativas ("No me sale") ----------
const RUTAS = [
  { n: 0, name: 'Ruta 0 · La R simple',
    texto: 'Para conseguir la R de "pero".\n\n1. Decí "de de de de" rápido, cada vez más rápido.\n2. Dejá que la d se ablande: "de-de-de" se va volviendo "dere-dere".\n3. Cuando suene como una R suave, probá: ara, ere, iri.\n4. Después: seré, seré, seré.\n\nNo busques todavía la vibración. Solo un golpe suave de la punta.' },
  { n: 1, name: 'Ruta 1 · Desde la t y la d',
    texto: 'Lleva la vibración adelante, a la punta de la lengua.\n\n1. "t d t d t d", con la fuerza en la t. Primero suave, con movimientos mínimos.\n2. Subí la velocidad de a poco.\n3. Pasá a "te de te de" y después "tedetedetede".\n4. Cuando la lengua empiece a temblar sola, dejala: eso es la vibración.\n\nEs la ruta principal si tu R sale en la garganta.' },
  { n: 2, name: 'Ruta 2 · Desde la l',
    texto: 'La l también se hace con la punta de la lengua en el mismo lugar.\n\n1. "la la la la" muy rápido.\n2. "t l t l t l", rápido.\n3. Probá dejar la lengua suelta mientras sale el aire entre golpe y golpe.' },
  { n: 3, name: 'Ruta 3 · Desde la R simple',
    texto: 'Si ya tenés la R de "pero", la vibración es esa misma R repetida muy rápido.\n\n1. "ere ere ere", lento.\n2. "erereré", sin cortar entre una y otra.\n3. "ararara", "iririri", cada vez más rápido.\n4. Cuando se peguen los golpes, mantené el aire parejo y dejá que siga solo.' },
  { n: 4, name: 'Ruta 4 · Vibración sostenida',
    texto: 'Primero la vibración sola, después la vocal.\n\n1. Punta de la lengua apoyada, relajada, detrás de los dientes de arriba.\n2. Soltá aire parejo hasta que la punta tiemble: rrrr…\n3. Sin cortar, agregá la vocal: rrrra, rrrre, rrrri.\n\nSi te mareás, frená y respirá normal. Máximo 3 soplos seguidos.' },
  { n: 5, name: 'Ruta 5 · Después de s',
    texto: 'En un estudio con un adulto, la R salió antes después de una s que entre vocales. Una explicación es que la s, que se dice sin voz, deja el aire en la presión justa para arrancar la vibración.\n\n1. des · ra, dis · ru, pos · ro\n2. La s bien suave y sin voz, la R pegada.\n3. Después: desregular, disruptivo, posromántico.\n\nEs una ruta para probar, no una regla: a algunas personas "Israel" les sigue costando.' },
];

// Para "No me sale" desde la práctica 5.
const AYUDA_PALABRAS =
  'No me sale\n\n' +
  '1. Decila separada, con una pausa más larga.\n' +
  '2. Si se traba, volvé un paso atrás: "ar · ra" antes de "ar · roz".\n' +
  '3. Si sigue sin salir, volvé unos minutos a la práctica anterior.';

// ---------- Preparación y escucha (van dentro de "Cómo se hace") ----------
const PREPARACION =
  'Preparación (2 minutos, opcional)\n\n' +
  '1. Aire: tomá aire por la nariz y soltalo por la boca en un soplo largo y parejo. Tres veces como máximo.\n\n' +
  '2. Lengua suelta: movela arriba, abajo y a los costados. Recorré el paladar con la punta, de adelante hacia atrás.\n\n' +
  '3. Posición: mandíbula un poco baja. Los costados de la lengua apoyados en las muelas de arriba. La punta, relajada, detrás de los dientes de arriba, en la rugosidad del paladar.\n\n' +
  'Si te mareás, frená y respirá normal.';

const ESCUCHA =
  'Escuchar ayuda\n\n' +
  'Notar la diferencia ayuda a producirla. Leé cada par en voz alta:\n\n' +
  '  pero / perro\n  caro / carro\n  coro / corro\n  para / parra\n  cero / cerro\n\n' +
  'Grabate con el teléfono y escuchate. ¿La segunda palabra tiene una vibración continua, o es un solo golpe?';

const CONSULTA =
  'Cuándo consultar\n\n' +
  'Conviene una evaluación con un fonoaudiólogo si:\n' +
  '· no te sale ningún sonido de R, ni la simple;\n' +
  '· la R se reemplaza siempre por otro sonido (una "y", una "l");\n' +
  '· hay antecedentes de fisura de paladar o problemas de audición;\n' +
  '· pasaron varias semanas de práctica sin que salga nunca.\n\n' +
  'En algunas personas influye la forma de la boca. Si el fonoaudiólogo lo sugiere, puede hacer falta un ortodoncista o un cirujano maxilofacial.\n\n' +
  'El frenillo corto suele nombrarse como causa, pero las revisiones médicas no encontraron evidencia de que cause problemas del habla.';

const FASE2 = [
  ['Leer en voz alta solo', 'Un párrafo por día: diario, libro, lo que quieras. Velocidad normal. Si una palabra se traba, separala, repetila tres veces y seguí.'],
  ['Leer grabándote', 'Lo mismo, pero grabándote. Después escuchá solo las R.'],
  ['Leerle a otra persona', 'Un párrafo en voz alta a alguien de confianza.'],
  ['Una llamada', 'Una llamada por día prestando atención a las R. No califiques el error: registralo y seguí.'],
  ['Una reunión o charla', 'Una situación con presión real. Si se traba, no pasa nada: agregá la palabra para repasarla.'],
];

// ---------- Las 9 prácticas ----------
// teoria: páginas de explicación. cues: una indicación por sesión, rota. extra: indicación solo si hay estancamiento.
const PRACTICES = [
  { n: 1, label: '1 · ar er ir', name: 'Sílabas que cierran con R', min: 30, split: false,
    objetivo: 'sentir la R al final de la sílaba, con el aire pasando por la lengua.',
    teoria: [
      'Por qué empezamos acá\n\nAl final de la sílaba la R no tiene que arrancar de golpe: llega después de la vocal, con el aire ya saliendo. Es el lugar más fácil para sentirla.',
      'Cómo\n\n1. Decí "a" y, sin cortar el aire, llevá la punta de la lengua detrás de los dientes de arriba: "ar".\n2. La lengua va apoyada y relajada. Los costados tocan las muelas de arriba.\n3. Dejá pasar el aire parejo, sin forzar, y alargá la R: "arrrr".\n4. Lo mismo con er, ir, or, ur.',
      'En qué fijarte\n\nLa R no la hace la lengua, la hace el aire. Si la lengua está tensa, no vibra.\n\nError común: empujar con fuerza. Más fuerza no da más vibración; da tensión.\n\nAlcanza con que al principio salga un golpe o dos. La vibración larga viene con la práctica.',
      PREPARACION,
    ],
    cues: ['Hoy fijate solo en que la lengua esté floja.', 'Hoy fijate solo en que el aire salga parejo, sin empujar.', 'Hoy fijate solo en dónde apoya la punta: detrás de los dientes de arriba.'],
    pages: () => ['ar   er   ir   or   ur\n\nRepetí cada una varias veces, alargando la R:\n\narrr  arrr  arrr\nerrr  errr  errr\nirrr  irrr  irrr\norrr  orrr  orrr\nurrr  urrr  urrr\n\nDespués, encadenadas:\nererere   ararara   iririri   orororo   urururu'] },
  { n: 2, label: '2 · ra re ri', name: 'Sílabas que abren con R', min: 30, split: false,
    objetivo: 'arrancar la sílaba con la R vibrando.',
    teoria: [
      'Qué cambia\n\nAhora la R va primero. Es más difícil que en "ar" porque tiene que arrancar sin una vocal que la prepare.',
      'Cómo\n\n1. Poné la lengua en posición antes de soltar el aire: punta detrás de los dientes de arriba, relajada.\n2. Soltá el aire y dejá que la punta vibre antes de abrir la vocal.\n3. Recién ahí, la vocal: "rra".\n4. Lo mismo con re, ri, ro, ru.',
      'En qué fijarte\n\nLa lengua se prepara antes que el aire.\n\nSi no arranca, probá la vibración sola primero y agregá la vocal al final: "rrrra". En "No me sale" es la ruta 4.',
    ],
    cues: ['Hoy fijate solo en preparar la lengua antes de soltar el aire.', 'Hoy fijate solo en no cortar entre la R y la vocal.', 'Hoy fijate solo en ir lento.'],
    pages: () => ['ra   re   ri   ro   ru\n\nra ra ra ra\nre re re re\nri ri ri ri\nro ro ro ro\nru ru ru ru\n\nSi no arranca, primero la vibración sola:\nrrrra   rrrre   rrrri   rrrro   rrrru'] },
  { n: 3, label: '3 · Unión', name: 'Unión', min: 30, split: false,
    objetivo: 'unir las dos mitades con una pausa mínima.',
    teoria: [
      'El paso clave\n\nAcá unís lo que practicaste: la sílaba que cierra con R y la que abre con R.\n\n  ar + ra → arra\n  er + re → erre\n  ir + ri → irri\n\nEs la práctica más difícil del camino. Si se estanca, no es que estés haciendo algo mal.',
      'Cómo\n\n1. Decí "ar", pausa corta, "ra".\n2. Repetí varias veces con la misma pausa.\n3. Achicá la pausa de a poco, sin apurarte.\n4. Cuando se unan, ya es "arra".\n5. "Arra" y "arroz" se parecen: cuando sale una, sale la otra.',
      'En qué fijarte\n\nLa pausa se achica sola cuando cada mitad sale bien. No la fuerces.\n\nUn ancla: "er + re" suena como "erre", el nombre de la letra.\n\nSi después de varios días no sale, en "No me sale" hay otros caminos al mismo sonido.',
    ],
    cues: ['Hoy fijate solo en que cada mitad salga bien, sin importar la pausa.', 'Hoy fijate solo en achicar la pausa un poquito.', 'Hoy fijate solo en mantener el aire entre las dos mitades.'],
    extra: 'Indicación extra: además de levantar la punta, la parte de atrás de la lengua va un poco hacia atrás. Probalo en "arra".',
    pages: () => ['ar · ra      er · re      ir · ri\nor · ro      ur · ru\n\nDespués, unidas:\narra   erre   irri   orro   urru\n\nY una palabra:\nar · roz   →   arroz'] },
  { n: 4, label: '4 · Cadenas', name: 'Cadenas de sílabas', min: 30, split: false,
    objetivo: 'encadenar sílabas con R entre otras consonantes.',
    teoria: [
      'Para qué\n\nEn el habla la R nunca está sola: viene antes y después de otros sonidos. Las cadenas entrenan ese cambio rápido de posición.',
      'Cómo\n\n1. Leé cada línea en voz alta, lento.\n2. La consonante fácil (L, N) marca el ritmo; la R tiene que mantenerse igual en toda la línea.\n3. Subí la velocidad solo cuando la R salga pareja en toda la línea.',
    ],
    cues: ['Hoy fijate solo en que la última R de la línea salga igual que la primera.', 'Hoy fijate solo en ir lento.'],
    pages: () => LESSONS.find((l) => l.id === 'silabas').blocks.map((b) => `${b.title}\n\n${lines(b)}`) },
  { n: 5, label: '5 · RR en palabras', name: 'Palabras con RR, separadas', min: 45, split: true,
    objetivo: 'llevar la unión a palabras reales.',
    teoria: [
      'El método, en palabras\n\nNo intentes decir la palabra completa de corrido al principio: "arroz" de corrido no va a salir.\n\nCada palabra está cortada justo antes de la R que vibra, con un paso intermedio:\n\n  ar · ra → ar · roz',
      'Cómo\n\n1. Decí el paso intermedio: "ar · ra".\n2. Después la palabra separada: "ar · roz".\n3. Achicá la pausa hasta unirla: "arroz".\n4. Si se traba, volvé un paso atrás.\n\nCuando ya salen, leelas directo, sin separar.',
      ESCUCHA,
    ],
    cues: ['Hoy fijate solo en el paso intermedio.', 'Hoy fijate solo en achicar la pausa.', 'Hoy probá leer sin separar las que ya salen.'],
    blocks: () => byTitle(/^RR \(|^Mezcla [12]$/) },
  { n: 6, label: '6 · N, L, S + R', name: 'N, L, S + R', min: 45, split: true,
    objetivo: 'la R múltiple que se escribe con una sola R.',
    teoria: [
      'Una regla que pocos saben\n\nDespués de n, l o s, la R siempre vibra, aunque se escriba con una sola:\n\n  en·redar   al·rededor   Is·rael   hon·ra\n\nSon las palabras que más cuestan, incluso a quienes ya tienen la R.',
      'Cómo\n\n1. Separá justo antes de la R: "en · redar".\n2. La primera mitad termina en n, l o s: decila suave, sin cortar el aire.\n3. La R arranca vibrando, como en "ra".\n4. Uní de a poco.',
      'Un dato para probar\n\nEn un estudio con un adulto, la R salió antes después de una s que entre vocales. Probá si a vos te pasa: des·ra, pos·ro, dis·ru.\n\nA otras personas les pasa lo contrario: "Israel" les sigue costando. Anotá las que se traben: en el modo Mantener podés agregarlas.',
    ],
    cues: ['Hoy fijate solo en no cortar el aire entre la n, l o s y la R.', 'Hoy fijate solo en las palabras con s.', 'Hoy fijate solo en las palabras con n.'],
    blocks: () => byTitle(/^N, L, S|^Mezcla 3$/) },
  { n: 7, label: '7 · R inicial', name: 'Palabras con R inicial', min: 30, split: true,
    objetivo: 'la R múltiple al principio de la palabra.',
    teoria: [
      'Qué tiene de particular\n\nAl principio de la palabra la R siempre vibra: rama, rojo, río. No hay sílaba anterior que ayude.\n\nA algunas personas les sale antes que la R del medio. Probala aunque no hayas terminado las anteriores.',
      'Cómo\n\n1. Si se traba, volvé a "ra re ri ro ru" y de ahí a la palabra.\n2. Lengua en posición antes de soltar el aire.\n3. Primero lento.',
    ],
    cues: ['Hoy fijate solo en preparar la lengua antes de empezar la palabra.', 'Hoy fijate solo en ir lento.'],
    blocks: () => byTitle(/^R inicial/) },
  { n: 8, label: '8 · Frases', name: 'Frases cortas', min: 45, split: false,
    objetivo: 'mantener la R cuando hay que pensar en lo que se dice.',
    teoria: [
      'Por qué cambia en frases\n\nEn una palabra suelta toda la atención está en la R. En una frase la atención se reparte, y la R vuelve a lo de siempre. Por eso cuesta más.',
      'Cómo\n\n1. Grupos de tres frases. Primero lento, marcando cada R.\n2. Si una palabra se traba, practicala separada (prácticas 5 y 6) y volvé a la frase.\n3. Cuando un grupo sale 4 de 5 veces sin trabarse, pasá al siguiente.',
    ],
    cues: ['Hoy fijate solo en la primera R de cada frase.', 'Hoy fijate solo en ir lento.', 'Hoy fijate solo en no frenar antes de la R.'],
    pages: () => LESSONS.find((l) => l.id === 'frases').blocks.map((b, i) => `Grupo ${i + 1}\n\n${lines(b)}`) },
  { n: 9, label: '9 · Textos', name: 'Poemas y trabalenguas', min: 45, split: false,
    objetivo: 'sostener la R en textos largos.',
    teoria: [
      'El último paso antes del habla\n\nTextos con muchas R, para sostener el sonido durante varios minutos seguidos.',
      'Cómo\n\n1. Leé en voz alta a velocidad normal.\n2. Si se traba una palabra, separala, repetila tres veces y seguí.\n3. Los trabalenguas, primero lento. La velocidad es lo último.',
    ],
    cues: ['Hoy fijate solo en no frenar ante las R.', 'Hoy leé un poco más lento que lo normal.'],
    pages: () => LESSONS.find((l) => l.id === 'textos').blocks[0].items },
];

function pagesFor(n) {
  const p = PRACTICES[n - 1];
  return p.pages ? p.pages() : wordPages(p.blocks(), p.split);
}

// Primeras líneas de una página, para el modo de memoria.
function memoryLines(n, i) {
  const page = pagesFor(n)[i] || '';
  const ls = page.split('\n').filter((l) => l.trim() && !/[:.]$/.test(l.trim()));
  return ([4, 5, 6, 7, 8].includes(n) ? ls.slice(1) : ls).slice(0, 5); // sin el título del bloque
}

function seedDeck() {
  return uniq(byTitle(/^N, L, S/).flatMap((b) => b.items).map((w) => w.toLowerCase()));
}

module.exports = { INTRO, MODO, PARTIDA, PERFILES, RUTAS, AYUDA_PALABRAS, CONSULTA, FASE2,
  PRACTICES, pagesFor, wordSteps, memoryLines, seedDeck, splitTrill };
