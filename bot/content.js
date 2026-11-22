// Contenido de las 9 prácticas. Los textos de teoría son borrador para revisar por el autor del método.
const LESSONS = require('../app/lessons.js');
const { splitTrill } = require('../app/split.js');

const byTitle = (re) => LESSONS.flatMap((l) => l.blocks || []).filter((b) => re.test(b.title || ''));
const uniq = (a) => [...new Set(a)];

function chunk(arr, n) { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }

function intermediate(head, tail) {
  const m = /^r[aeiouáéíóúü]/i.exec(tail);
  return m && m[0] !== tail ? `${head} · ${m[0]}` : null;
}

// Una página por bloque. split: muestra la palabra partida antes de la R que vibra.
function wordPages(blocks, split, sinSeparar) {
  return blocks.map((b) => {
    const lines = chunk(uniq(b.items), 3).map((row) => row.map((w) => {
      const parts = split && !sinSeparar ? splitTrill(w) : null;
      if (!parts) return w;
      const mid = intermediate(parts[0], parts[1]);
      return mid ? `${mid} → ${parts[0]} · ${parts[1]}` : `${parts[0]} · ${parts[1]}`;
    }));
    // cuando hay separación se muestra una palabra por línea para que se lea bien
    const body = split && !sinSeparar ? lines.flat().join('\n') : lines.map((r) => r.join('   ')).join('\n');
    return `${b.title || ''}\n\n${body}`.trim();
  });
}

const lines = (b) => b.items.map((x) => x).join('\n');

const PRACTICES = [
  { n: 1, label: '1 · ar er ir', name: 'Sílabas que cierran con R', min: 10, split: false,
    teoria: 'Sílabas que cierran con R: ar, er, ir, or, ur.\n\nPronunciá la R bien, con el aire pasando por la lengua. Repetí cada sílaba varias veces, lento, antes de pasar a la siguiente.',
    pages: () => ['ar   er   ir   or   ur\n\nRepetí cada una varias veces.\nar ar ar ar\ner er er er\nir ir ir ir\nor or or or\nur ur ur ur'] },
  { n: 2, label: '2 · ra re ri', name: 'Sílabas que abren con R', min: 10, split: false,
    teoria: 'Sílabas que abren con R: ra, re, ri, ro, ru.\n\nAhora la R está al principio de la sílaba. Repetí cada una varias veces, lento.',
    pages: () => ['ra   re   ri   ro   ru\n\nra ra ra ra\nre re re re\nri ri ri ri\nro ro ro ro\nru ru ru ru'] },
  { n: 3, label: '3 · Unión', name: 'Unión', min: 10, split: false,
    teoria: 'Ahora unís las dos mitades: la sílaba que cierra con R y la que abre con R.\n\n  ar + ra → arra\n  er + re → erre\n  ir + ri → irri\n\nHacelo con la pausa mínima entre las dos mitades. De a poco, acortá la pausa hasta que se unan. Después, probá con una palabra: arroz.',
    pages: () => ['ar · ra      er · re      ir · ri\nor · ro      ur · ru\n\nDespués, unidas:\narra   erre   irri   orro   urru\n\nY una palabra:\nar · roz   →   arroz'] },
  { n: 4, label: '4 · Cadenas', name: 'Cadenas de sílabas', min: 10, split: false,
    teoria: 'Cadenas de sílabas: una consonante fácil (L, N) seguida de las cinco sílabas con R, y el camino inverso.\n\nLeé cada línea en voz alta, lento. Subí la velocidad solo cuando la R salga pareja.',
    pages: () => LESSONS.find((l) => l.id === 'silabas').blocks.map((b) => `${b.title}\n\n${lines(b)}`) },
  { n: 5, label: '5 · RR en palabras', name: 'Palabras con RR, separadas', min: 15, split: true,
    teoria: 'No intentes decir la palabra completa de corrido al principio: "arroz" de corrido no va a salir.\n\nSeparala justo antes de la R que vibra: ar + roz. Practicá la segunda parte sola y después la primera. Después decí las dos con una pausa mínima y de a poco acortala hasta unirlas.',
    blocks: () => byTitle(/^RR \(|^Mezcla [12]$/) },
  { n: 6, label: '6 · N, L, S + R', name: 'N, L, S + R', min: 15, split: true,
    teoria: 'Cuando la R viene después de N, L o S, también vibra: en·redar, al·rededor, Is·rael, des·rabe.\n\nSeparalas igual, justo antes de la R, y después unilas de a poco.',
    blocks: () => byTitle(/^N, L, S|^Mezcla 3$/) },
  { n: 7, label: '7 · R inicial', name: 'Palabras con R inicial', min: 10, split: true,
    teoria: 'Palabras que empiezan con R: rama, rojo, ritual.\n\nSi la R inicial se traba, volvé a las sílabas ra, re, ri, ro, ru y de ahí pasá a la palabra.',
    blocks: () => byTitle(/^R inicial/) },
  { n: 8, label: '8 · Frases', name: 'Frases cortas', min: 15, split: false,
    teoria: 'Frases con R, en grupos de tres. Primero lento, marcando cada R. Si una palabra se traba, volvé a practicarla separada en las prácticas 5 y 6.',
    pages: () => LESSONS.find((l) => l.id === 'frases').blocks.map((b, i) => `Grupo ${i + 1}\n\n${lines(b)}`) },
  { n: 9, label: '9 · Textos', name: 'Poemas y trabalenguas', min: 15, split: false,
    teoria: 'Textos largos con muchas R. Leelos lento, una línea por vez, y subí el ritmo de a poco.',
    pages: () => LESSONS.find((l) => l.id === 'textos').blocks[0].items },
];

function pagesFor(n, sinSeparar) {
  const p = PRACTICES[n - 1];
  return p.pages ? p.pages() : wordPages(p.blocks(), p.split, sinSeparar);
}

// Palabras para el mazo inicial de mantenimiento: N, L, S + R.
function seedDeck() {
  return uniq(byTitle(/^N, L, S/).flatMap((b) => b.items).map((w) => w.toLowerCase()));
}

const HITOS = [
  ['simple', 'R simple'], ['aislada', 'R múltiple aislada'], ['silabas', 'R múltiple en sílabas'],
  ['palabras', 'En palabras'], ['frases', 'En frases'], ['espontanea', 'En habla espontánea'],
];
// Prácticas asociadas a cada hito para sugerir "Estable". 1 y 2 no sugieren (asociación ambigua).
const HITO_PRACTICAS = { silabas: [3, 4], palabras: [5, 6, 7], frases: [8, 9] };

module.exports = { PRACTICES, pagesFor, seedDeck, HITOS, HITO_PRACTICAS, splitTrill };
