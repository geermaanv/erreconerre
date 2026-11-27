// Prueba de la lógica con una API de Telegram simulada (sin red y sin token).
process.env.BOT_DATA = require('path').join(require('os').tmpdir(), `bot-test-${process.pid}.json`);
const assert = require('assert');
const { handle, sendReminders, kbJson } = require('./bot.js');
const L = require('./logic.js');
const C = require('./content.js');
const store = require('./store.js');

const CHAT = 42;
// Chat simulado: guarda cada mensaje por id, como lo vería la persona.
let chat = new Map(), last = null, nextId = 100;
const api = {
  answer: async () => {},
  send: async (_c, s) => { last = { ...s, id: nextId++ }; chat.set(last.id, last); check(last); },
  edit: async (_c, id, s) => { last = { ...s, id }; chat.set(id, last); check(last); },
};
function check(s) {
  assert(s.text.length <= 4096, 'mensaje demasiado largo');
  for (const b of (s.kb || []).flat()) assert(Buffer.byteLength(b.d) <= 64, b.d);
  assert((s.kb || []).every((r) => r.length), 'fila de botones vacía');
}
const msg = (text) => handle({ message: { chat: { id: CHAT, type: 'private' }, text } }, api);
const tapOn = (id, data) => handle({ callback_query: { id: 'x', data, message: { chat: { id: CHAT, type: 'private' }, message_id: id } } }, api);
const tap = (data) => tapOn(last ? last.id : 1, data);
const labels = (s = last) => (s.kb || []).flat().map((b) => b.t);
const find = (re) => [...chat.values()].filter((s) => re.test(s.text));
const user = () => store.get(CHAT);
const patch = (fn) => { const u = user(); fn(u); store.set(CHAT, u); };
const daysAgo = (n) => L.addDays(L.dayKey(), -n);

(async () => {
  // ---------- inicio ----------
  await msg('/start dia1');
  assert(/armé este entrenamiento/.test(last.text) && /¿En qué estás\?/.test(last.text));
  assert.deepStrictEqual(labels(), [C.MODO.aprender, C.MODO.mantener]);
  await tap('mo:a'); assert(/¿Te sale esa R/.test(last.text) && labels().length === 3);
  await tap('pf:simple'); assert(/R simple sin vibrar/.test(last.text) && /práctica 1/.test(last.text));
  await tap('m'); assert(/🟢 Aprender/.test(last.text) && /Práctica 1 de 9/.test(last.text));
  assert.deepStrictEqual(labels(), ['▶ Practicar', 'Practicar sin mirar el teléfono', 'Mi avance', 'Más']);
  assert.strictEqual(user().source, 'dia1');

  // ---------- el ejercicio queda a la vista ----------
  const homeId = last.id;
  await tap('ej:1');
  assert(/Cómo se hace/.test(chat.get(homeId).text) && /Preparación/.test(chat.get(homeId).text), 'la primera vez explica antes');
  const exId = last.id; assert.notStrictEqual(exId, homeId);
  assert(/ar {3}er/.test(last.text) && /Hoy fijate solo/.test(last.text));
  assert.deepStrictEqual(labels(), ['Terminé', 'Cómo se hace', 'No me sale']);
  const exText = last.text;

  await tapOn(exId, 'th:1'); assert(last.id !== exId && /Cómo se hace/.test(last.text));
  await tapOn(exId, 'ns:1'); const helpId = last.id; assert(helpId !== exId && /No me sale {2}\(1\/6\)/.test(last.text) && /Ruta 3/.test(last.text), 'camino según el perfil');
  await tapOn(helpId, 'ns:1:1'); assert(last.id === helpId && /\(2\/6\)/.test(last.text) && /Ruta 4/.test(last.text));
  assert.strictEqual(chat.get(exId).text, exText, 'la ayuda no tapa el ejercicio');

  patch((u) => { u.session.start -= 5 * 60000; });
  await tapOn(exId, 'fin:1');
  assert(/ar {3}er/.test(chat.get(exId).text) && !chat.get(exId).kb.length, 'el ejercicio sigue, sin botones');
  assert(last.id !== exId && /5 min anotados\. ¿La R vibró\?/.test(last.text));
  assert.deepStrictEqual(labels(), ['Sí, vibró', 'Todavía no']);
  assert.strictEqual(user().minutes.length, 1, 'los minutos se anotan aunque no responda');
  await tap('r:s'); assert(/días en los que vibró: 1 de 3/.test(last.text) && /grabarte/.test(last.text));
  assert.deepStrictEqual(labels(), ['Listo']);
  await tap('r:s'); assert.strictEqual(user().ratings.length, 1, 'no se anota dos veces');
  await tapOn(exId, 'fin:1'); assert(/ya estaba cerrado/.test(last.text) && last.id !== exId);
  assert.strictEqual(user().minutes.length, 1);

  // la segunda vez no repite la explicación y edita el mismo mensaje
  await tap('m'); const h2 = last.id; await tap('ej:1'); assert(last.id === h2 && /Práctica 1/.test(last.text) && !/Cómo se hace ·/.test(last.text));
  // una sesión olvidada abierta cuenta como máximo 30 minutos
  patch((u) => { u.session.start -= 24 * 3600000; });
  await tap('fin:1'); assert(/30 min anotados/.test(last.text));
  await tap('r:n'); assert(/Cada intento suma/.test(last.text));

  // ---------- superar una práctica: 3 días distintos ----------
  patch((u) => { u.ratings = [1, 2].map((d) => ({ practice: 1, rating: 's', day: daysAgo(d) })); });
  await tap('ej:1'); await tap('fin:1'); await tap('r:s');
  assert(/Superaste la práctica 1/.test(last.text) && /Ahora sigue la 2 · Sílabas/.test(last.text), last.text);
  await tap('m'); assert(/Práctica 2 de 9/.test(last.text));

  // tres "Todavía no" seguidos: ayuda y práctica anterior
  for (let i = 0; i < 3; i++) { await tap('ej:2'); await tap('fin:2'); await tap('r:n'); }
  assert(labels().includes('No me sale') && labels().includes('Ir a la 1'), labels().join());

  // listas con páginas: separada y unida; las flechas editan el ejercicio
  await tap('ej:5'); const e5 = last.id;
  assert(/ar · ro → ar · ropar → arropar/.test(last.text) && /car · ro → carro/.test(last.text), last.text); assert(labels().includes('▶'));
  await tapOn(e5, 'pg:5:1'); assert(last.id === e5 && /\(2\//.test(last.text));
  await tapOn(e5, 'ns:5'); assert(last.id !== e5 && labels().includes('Ir a la práctica 4'));
  await tapOn(e5, 'fin:5'); assert(/\(2\//.test(chat.get(e5).text), 'queda en la página en que estaba');
  await tap('r:n');
  for (let n = 1; n <= 9; n++) for (let i = 0; i < C.pagesFor(n).length; i++) { await tap(`pg:${n}:${i}`); await tap(`me:${n}:${i}`); }
  for (let n = 1; n <= 9; n++) await tap(`th:${n}`);

  // ---------- sin mirar el teléfono ----------
  await tap('m'); await tap('me:2:0'); assert(/vista en el camino/.test(last.text));
  await tap('mm:2'); await tap('mn:10:2'); assert(/Anotado: 10 min/.test(last.text));
  await tap('mm:2'); await tap('mn:o:2'); await msg('abc'); assert(/entre 1 y 600/.test(last.text)); await msg('15'); assert(/Anotado: 15 min/.test(last.text));
  await tap('mn:o:2'); await tap('m'); await msg('15'); assert(/Usá los botones/.test(last.text), 'tocar un botón cancela lo que se esperaba escribir');

  // ---------- Mi avance y Más ----------
  await tap('pr'); assert(/Total:/.test(last.text) && /✅1/.test(last.text)); assert.deepStrictEqual(labels(), ['Elegir otra práctica', 'Volver']);
  await tap('el'); assert(labels().length === 10);
  await tap('mas'); assert.deepStrictEqual(labels(), ['Cambiar a Mantener', 'Recordatorio', 'Cómo funciona', 'Consultar a un fonoaudiólogo', 'Mis datos', 'Volver']);
  await tap('in:0'); assert(/1\/2/.test(last.text)); await tap('in:1'); assert(/2\/2/.test(last.text) && /no reemplaza/.test(last.text));
  await tap('cs'); assert(/frenillo/.test(last.text)); await tap('cq'); assert(/práctica 1:/.test(last.text));

  // al completar la 9 propone pasar a Mantener
  patch((u) => { u.ratings = []; for (let p = 1; p <= 9; p++) for (let d = 1; d <= (p === 9 ? 2 : 3); d++) u.ratings.push({ practice: p, rating: 's', day: daysAgo(d) }); });
  await tap('ej:9'); await tap('fin:9'); await tap('r:s');
  assert(/Completaste las nueve/.test(last.text) && labels().includes('Pasar a Mantener'));

  // ---------- Mantener ----------
  await tap('mo:m'); assert(/🔵 Mantener/.test(last.text) && /7 palabras/.test(last.text), last.text);
  assert.deepStrictEqual(labels(), ['▶ Repasar palabras', 'Usarla al hablar', 'Agregar una palabra que se me traba', 'Mi avance', 'Más']);
  const before = user().minutes.length;
  await tap('mi'); assert(/Palabra 1 de 7/.test(last.text) && /→/.test(last.text)); assert.deepStrictEqual(labels(), ['Bien', 'Se trabó']);
  await tap('mg:n'); for (let i = 0; i < 6; i++) await tap('mg:s');
  assert(/Bien: 6\. Se trabaron: 1/.test(last.text), last.text);
  assert.strictEqual(user().minutes.length, before + 1, 'el repaso cuenta como práctica');
  await tap('mad'); await msg('El perro de  Rosa'); assert(/Agregada: el perro de rosa/.test(last.text));
  patch((u) => { for (const [w, c] of Object.entries(u.deck)) c.due = w === 'el perro de rosa' ? daysAgo(1) : L.addDays(L.dayKey(), 5); });
  await tap('mi'); assert(/el perro de rosa\n\nper · ro → perro/.test(last.text), last.text);
  await tap('mg:s'); await tap('m'); assert(/no quedan palabras/.test(last.text) && !labels().includes('▶ Repasar palabras'));

  // usarla al hablar: el desafío queda a la vista y hay una sola pregunta
  await tap('hb'); const hbId = last.id; assert(/Paso 1 de 5/.test(last.text)); assert.deepStrictEqual(labels(), ['Terminé', 'Volver']);
  await tap('fin:10'); assert(/Paso 1 de 5/.test(chat.get(hbId).text) && !chat.get(hbId).kb.length);
  assert.deepStrictEqual(labels(), ['Sin trabas', 'Se trabó']);
  patch((u) => { u.ratings.push(...[1, 2, 3, 4].map((d) => ({ practice: 10, rating: 's', day: daysAgo(d), step: 0 }))); });
  await tap('r:s'); assert(labels().includes('Pasar al siguiente paso'), labels().join());
  await tap('hb:u'); assert(/Paso 2 de 5/.test(last.text));
  await tap('fin:10'); await tap('r:s'); assert(!labels().includes('Pasar al siguiente paso'), 'cada paso cuenta sus propios días');
  for (let i = 0; i < 3; i++) { await tap('hb'); await tap('fin:10'); await tap('r:n'); }
  assert(labels().includes('Volver al paso anterior'));
  await tap('pr'); assert(/Palabras en tu repaso/.test(last.text) && !/Prácticas/.test(last.text));
  await tap('mas'); assert(labels().includes('Cambiar a Aprender'));
  await tap('mo:a'); assert(/🟢 Aprender/.test(last.text), 'vuelve sin repetir la pregunta');

  // ---------- persona que ya usaba el bot anterior ----------
  store.set(CHAT, { testDone: true, perfil: 'intermitente', start: 3, minutes: [{ day: daysAgo(1), min: 7, practice: 3, source: 'guiada' }], ratings: [], deck: null, rem: { on: true, hour: 20, last: null, ignored: 0 } });
  await tap('go:3:0'); assert(/Cambié el menú/.test(last.text) && /¿En qué estás\?/.test(last.text), 'un botón viejo pregunta el modo');
  await tap('mo:a'); assert(/Práctica 3 de 9/.test(last.text) && /7 min/.test(last.text) && user().rem.on, 'conserva avance, minutos y recordatorio');

  // ---------- datos ----------
  await tap('md'); await tap('ex'); assert(/minutes/.test(last.text) || /demasiado largos/.test(last.text));
  await msg('/borrar'); assert(/No se puede deshacer/.test(last.text));
  await tap('dl!'); assert(/Se borraron/.test(last.text)); assert.strictEqual(user(), undefined);

  // sin botones no se manda reply_markup (así se quitan al editar)
  assert.strictEqual(kbJson([]), undefined);

  // grupos: se ignoran
  last = null; await handle({ message: { chat: { id: 7, type: 'group' }, text: '/start' } }, api); assert.strictEqual(last, null);

  // origen de la visita: solo etiquetas simples, la primera vez
  const startAs = (id, text) => handle({ message: { chat: { id, type: 'private' }, text } }, api);
  await startAs(901, '/start dia1'); assert.strictEqual(store.get(901).source, 'dia1');
  await startAs(901, '/start otra'); assert.strictEqual(store.get(901).source, 'dia1', 'no se pisa el origen');
  await startAs(902, '/start'); assert.strictEqual(store.get(902).source, 'directo');
  await startAs(903, '/start <script>'); assert.strictEqual(store.get(903).source, 'directo');

  // ---------- recordatorios: opcionales, una vez por día, solo si no practicó, se pausan solos ----------
  await msg('/start'); await tap('mas'); assert(labels().includes('Recordatorio'));
  await tap('rm'); assert(/apagado/.test(last.text));
  await tap('rm:h:20'); assert(/Activado a las 20:00/.test(last.text) && /Empieza mañana/.test(last.text));
  await tap('rm:h:7'); assert(/Activado a las 20:00/.test(last.text), 'hora inválida ignorada');
  await tap('rm:off'); assert(/apagado/.test(last.text));
  await tap('rm:h:18'); assert(labels().includes('Apagar') && labels().includes('✓ 18:00'));

  const AR = (iso) => new Date(iso + '-03:00').getTime(); // hora de Buenos Aires
  const ru = (o = {}) => ({ ...L.newUser(), rem: { on: true, hour: 20, last: '2026-03-09', ignored: 0 }, ...o });
  assert.strictEqual(L.reminderDue(ru(), AR('2026-03-10T20:30:00')), true);
  assert.strictEqual(L.reminderDue(ru(), AR('2026-03-10T18:00:00')), false, 'antes de la hora');
  assert.strictEqual(L.reminderDue(ru(), AR('2026-03-10T23:30:00')), false, 'fuera de la ventana de 3 horas');
  assert.strictEqual(L.reminderDue(ru({ rem: { on: false, hour: 20, last: null, ignored: 0 } }), AR('2026-03-10T20:30:00')), false, 'apagado');
  assert.strictEqual(L.reminderDue(ru({ rem: { on: true, hour: 20, last: '2026-03-10', ignored: 0 } }), AR('2026-03-10T20:30:00')), false, 'ya enviado hoy');
  assert.strictEqual(L.reminderDue(ru({ minutes: [{ day: '2026-03-10', min: 5, practice: 1, source: 'manual' }] }), AR('2026-03-10T20:30:00')), false, 'ya practicó hoy');

  const sent = [];
  const rapi = { send: async (c, s) => { sent.push({ c, s }); } };
  const to = (c) => sent.filter((m) => m.c == c);
  store.set(904, ru({ mode: 'aprender' }));
  store.set(905, ru({ mode: 'mantener' }));
  await sendReminders(rapi, AR('2026-03-10T20:30:00'));
  assert.strictEqual(to(904).length, 1);
  assert(/Es la hora de tu práctica/.test(to(904)[0].s.text) && /práctica 1/.test(to(904)[0].s.text));
  assert(/repasar tus palabras/.test(to(905)[0].s.text));
  await sendReminders(rapi, AR('2026-03-10T20:40:00'));
  assert.strictEqual(to(904).length, 1, 'no repite el mismo día');
  // cuando se acumulan 5 recordatorios ignorados (el 904 ya traía uno), avisa y se pausa solo
  for (const d of ['11', '12', '13', '14']) await sendReminders(rapi, AR(`2026-03-${d}T20:30:00`));
  assert.strictEqual(to(904).length, 5);
  assert(/Pausé los recordatorios/.test(to(904).pop().s.text));
  assert.strictEqual(store.get(904).rem.on, false);
  await sendReminders(rapi, AR('2026-03-15T20:30:00'));
  await sendReminders(rapi, AR('2026-03-16T20:30:00'));
  assert.strictEqual(to(904).length, 5, 'pausado: no manda más');

  console.log('OK: flujo completo');
  require('fs').rmSync(process.env.BOT_DATA, { force: true });
})().catch((e) => { console.error('FALLO:', e.message); console.error(e.stack.split('\n').slice(1, 4).join('\n')); process.exit(1); });
