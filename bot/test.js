// Prueba de la lógica con una API de Telegram simulada (sin red y sin token).
process.env.BOT_DATA = require('path').join(require('os').tmpdir(), `bot-test-${process.pid}.json`);
const assert = require('assert');
const { handle } = require('./bot.js');
const L = require('./logic.js');
const store = require('./store.js');

const CHAT = 42;
let last = null, nextId = 100;
const api = {
  answer: async () => {},
  send: async (_c, s) => { last = { ...s, id: nextId++ }; },
  edit: async (_c, id, s) => { last = { ...s, id }; },
};
const msg = (text) => handle({ message: { chat: { id: CHAT, type: 'private' }, text } }, api);
const tap = (data) => handle({ callback_query: { id: 'x', data, message: { chat: { id: CHAT, type: 'private' }, message_id: last ? last.id : 1 } } }, api);
const labels = () => (last.kb || []).flat().map((b) => b.t);
const callbacks = () => (last.kb || []).flat().map((b) => b.d);
const body = () => last.text.split('\n\n').slice(1).join('\n\n');
const maxCb = () => Math.max(...callbacks().filter(Boolean).map((d) => Buffer.byteLength(d)));

(async () => {
  await msg('/start'); assert(/entrenamiento para la R múltiple/.test(last.text));
  await tap('ts'); assert(/arra/.test(last.text) && last.kb.length === 5);
  await tap('tr:1'); assert(/práctica 3/.test(last.text));
  await tap('m'); assert(/Hoy: práctica 3/.test(last.text));
  assert(labels().includes('▶ 3 · Unión') && last.kb.slice(0, 3).every((r) => r.length === 3), 'menú 3x3 con ▶');

  await tap('p:3'); assert(/Entendí/.test(labels().join()), 'teoría la primera vez');
  await tap('l:3:0'); assert(/Unión/.test(last.text));
  await tap('p:5'); await tap('l:5:0'); assert(/→/.test(last.text) && /·/.test(body()), 'separación con paso intermedio');
  await tap('sp:5:0'); assert(!/·/.test(body()), 'ver sin separar');
  await tap('sp:5:0');

  // Una práctica guiada con 3 "Salió" en 3 días distintos supera la práctica de hoy
  for (let d = 0; d < 3; d++) {
    await tap('go:3'); assert(/Practicando/.test(last.text));
    await tap('end'); assert(/¿Cómo te fue\?/.test(last.text));
    // llevar la sesión a un día distinto simulando el día en el registro
    await tap('rt:s');
    const u = store.get(CHAT); u.minutes[u.minutes.length - 1].day = L.addDays(L.dayKey(), -(2 - d)); u.ratings[u.ratings.length - 1].day = L.addDays(L.dayKey(), -(2 - d));
    store.set(CHAT, u);
  }
  const u1 = store.get(CHAT); assert.strictEqual(L.hoy(u1), 4, 'la práctica de hoy avanza a la 4');
  assert(L.streak(u1, L.dayKey()) >= 3, 'racha');

  // Tres "No salió" seguidos en la práctica de hoy sugieren volver a la anterior
  for (let i = 0; i < 3; i++) { await tap('go:4'); await tap('end'); await tap('rt:n'); }
  assert(/Ir a la práctica 3/.test(labels().join()), 'sugerencia de repetir la anterior');

  // Práctica libre y minutos manuales
  await tap('fr'); await tap('fr:c'); await tap('mn:20'); assert(/Anotado: 20 min/.test(last.text));
  await tap('fr:c'); await tap('mn:o'); await msg('abc'); assert(/número de minutos/.test(last.text)); await msg('15'); assert(/Anotado: 15 min/.test(last.text));

  // Progreso, hitos, notas
  await tap('pr'); assert(/Total:/.test(last.text) && /Racha:/.test(last.text));
  await tap('hs:silabas:p'); assert(/primera vez/.test(last.text));
  await tap('hs:silabas:e'); assert(/estable/.test(last.text));
  await tap('hs:silabas:x'); assert(!/primera vez \d/.test(last.text.split('\n').find((l) => /sílabas/.test(l))));
  await tap('note'); await msg('hoy me costó más'); assert(/Nota guardada/.test(last.text));
  await tap('nt'); assert(/hoy me costó más/.test(last.text));

  // Mantenimiento
  await tap('ma'); assert(/Hoy toca: 7 tarjetas/.test(last.text), last.text);
  await tap('mi'); assert(/Tarjeta 1\/7/.test(last.text));
  await tap('ms'); assert(/·/.test(last.text) || /no tiene R/.test(last.text));
  for (let i = 0; i < 7; i++) await tap('mg:s');
  assert(/Salió 7/.test(last.text), last.text);
  await tap('mz'); await tap('mad'); await msg('Israel'); assert(/Agregada: israel/.test(last.text));
  await tap('ma'); assert(/Hoy toca: (\d+) tarjetas/.test(last.text));

  // Comunidad y ajustes
  await tap('co'); assert(/Todavía no hay grupo/.test(last.text));
  await tap('se'); await tap('ex'); assert(/minutes/.test(last.text) || /demasiado largos/.test(last.text));

  // Largo de callback_data (límite de Telegram: 64 bytes) en todas las pantallas probadas
  for (const d of ['m', 'p:5', 'l:9:9', 'hk:espontanea', 'pr', 'ma']) { await tap(d); assert(maxCb() <= 64, d); }

  // Borrar datos
  await tap('dl'); assert(/No se puede deshacer/.test(last.text));
  await tap('dl!'); assert(/Se borraron/.test(last.text)); assert.strictEqual(store.get(CHAT), undefined);

  // Grupos: se ignoran
  last = null; await handle({ message: { chat: { id: 7, type: 'group' }, text: '/start' } }, api); assert.strictEqual(last, null);

  console.log('OK: flujo completo');
  require('fs').rmSync(process.env.BOT_DATA, { force: true });
})().catch((e) => { console.error('FALLO:', e.message); console.error(e.stack.split('\n').slice(1, 4).join('\n')); process.exit(1); });
