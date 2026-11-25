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
  await msg('/start'); assert(/armé este entrenamiento/.test(last.text) && /Cómo funciona/.test(labels().join()));
  // introducción de 5 pantallas
  await tap('in:0'); assert(/1\/5/.test(last.text));
  for (let i = 1; i < 5; i++) await tap(`in:${i}`);
  assert(/5\/5/.test(last.text) && labels().includes('Empezar'));
  for (const t of require('./content.js').INTRO) assert(t.length < 1500, 'pantalla de intro corta');

  // test de 2 preguntas: intermitente -> falla en "arra" -> práctica 3
  await tap('ts'); assert(/perro/.test(last.text) && last.kb.length === 6);
  await tap('t1:4'); assert(/Dónde te falla/.test(last.text));
  await tap('t2:0'); assert(/Sale a veces/.test(last.text) && /práctica 3/.test(last.text));
  await tap('m'); assert(/Hoy: práctica 3/.test(last.text) && /Objetivo:/.test(last.text));
  assert(labels().includes('▶ 3 · Unión') && last.kb.slice(0, 3).every((r) => r.length === 3), 'menú 3x3 con ▶');

  // perfil gutural: explicación propia
  await tap('ts'); await tap('t1:1'); assert(/garganta/.test(last.text));
  // perfil sustitución: alerta de consulta
  await tap('ts'); await tap('t1:2'); assert(/fonoaudiólogo/.test(last.text) && /ortodoncista/.test(last.text));
  // intermitente con fallas en palabras: práctica 6 y mantenimiento abierto
  await tap('ts'); await tap('t1:4'); await tap('t2:1'); assert(/práctica 6/.test(last.text) && /Mantenimiento ya está abierto/.test(last.text));
  await tap('ts'); await tap('t1:4'); await tap('t2:0');

  // teoría por páginas
  await tap('p:3'); assert(/\(1\/3\)/.test(last.text) && /Objetivo:/.test(last.text));
  await tap('th:3:1'); await tap('th:3:2'); assert(labels().includes('Entendí, a practicar'));
  await tap('l:3:0'); assert(/Unión/.test(last.text) && labels().includes('Modo memoria') && !labels().includes('Preparación'));
  await tap('me:3:0'); assert(/Modo memoria/.test(last.text) && /arra/.test(last.text));
  await tap('mm:3'); await tap('mn:10:3'); assert(/Anotado: 10 min/.test(last.text));
  assert.strictEqual(store.get(CHAT).minutes.slice(-1)[0].practice, 3, 'minutos de memoria van a la práctica');
  await tap('p:5'); await tap('th:5:0'); await tap('l:5:0'); assert(/→/.test(last.text) && /·/.test(body()), 'separación con paso intermedio');
  assert(labels().includes('Escucha'));
  await tap('es:5'); assert(/pero \/ perro/.test(last.text));
  await tap('l:5:0'); await tap('sp:5:0'); assert(!/·/.test(body().split('\n\n')[1] || ''), 'ver sin separar');
  await tap('sp:5:0');

  // conteo de 5 intentos
  await tap('go:3:0'); assert(/Hoy fijate solo/.test(last.text) && labels().includes('✓ Salió'));
  for (let i = 0; i < 4; i++) await tap('ok');
  await tap('ko'); assert(/4 de 5. Pasá a la línea siguiente/.test(last.text));
  await tap('cx');

  // Una práctica guiada con 3 "Salió" en 3 días distintos supera la práctica de hoy
  for (let d = 0; d < 3; d++) {
    await tap('go:3:0'); assert(/Practicando/.test(last.text));
    await tap('end');
    if (d === 0) assert(/¿Cómo te fue\?/.test(last.text) && !/vibración continua/.test(last.text), 'sin control la primera vez');
    else { assert(/vibración continua/.test(last.text), 'pregunta de control'); await tap('ct:y'); }
    await tap('rt:s');
    if (d === 0) assert(/grabarte/.test(last.text), 'sugerencia de grabarse');
    const u = store.get(CHAT); u.minutes[u.minutes.length - 1].day = L.addDays(L.dayKey(), -(2 - d)); u.ratings[u.ratings.length - 1].day = L.addDays(L.dayKey(), -(2 - d));
    store.set(CHAT, u);
  }
  const u1 = store.get(CHAT); assert.strictEqual(L.hoy(u1), 4, 'la práctica de hoy avanza a la 4');
  assert(L.streak(u1, L.dayKey()) >= 3, 'racha');

  // Tres "No salió" seguidos en la práctica de hoy sugieren volver a la anterior
  for (let i = 0; i < 3; i++) { await tap('go:4:0'); await tap('end'); await tap('ct:n'); await tap('rt:n'); }
  assert(/Ir a la 3/.test(labels().join()) && labels().includes('Si no sale'), 'sugerencia de rutas y de la anterior');
  await tap('sn:4:0'); assert(/Si no sale \(1\/6\)/.test(last.text) && /Ruta 5/.test(last.text), 'rutas en orden del perfil intermitente');
  await tap('l:4:0'); assert(labels().includes('Si no sale') && labels().includes('Preparación'));
  await tap('pp:4'); assert(/Tres veces como máximo/.test(last.text));

  // "Salió" con un solo golpe no cuenta para superar
  const L2 = require('./logic.js');
  assert(!L2.salioOk({ rating: 's', ctrl: 'n' }) && L2.salioOk({ rating: 's', ctrl: 'y' }));

  // Habla (fase 2)
  await tap('f2'); assert(/Escalón 1 de 5/.test(last.text));
  await tap('f2:u'); assert(/Escalón 2 de 5/.test(last.text));
  await tap('go:10:0'); assert(/Habla/.test(last.text) && !labels().includes('✓ Salió'));
  await tap('end'); await tap('rt:s'); assert(/Anotado/.test(last.text));

  // Ajustes: consulta, resumen y seguridad
  await tap('se'); await tap('cs'); assert(/frenillo/.test(last.text));
  await tap('cq'); assert(/Qué llevar a la consulta/.test(last.text) && /práctica 3:/.test(last.text));
  await tap('sg'); assert(/3 soplos/.test(last.text));

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
  await tap('mad'); await msg('El perro de  Rosa'); assert(/Agregada: el perro de rosa/.test(last.text), 'mazo acepta frases');
  await tap('ma'); assert(/Hoy toca: (\d+) tarjetas/.test(last.text));

  // Comunidad y ajustes
  await tap('co'); assert(/Todavía no hay grupo/.test(last.text));
  await tap('se'); await tap('ex'); assert(/minutes/.test(last.text) || /demasiado largos/.test(last.text));

  // Largo de callback_data (límite de Telegram: 64 bytes) en todas las pantallas probadas
  for (const d of ['m', 'p:5', 'l:9:9', 'l:5:0', 'sn:4:5', 'me:5:0', 'hk:espontanea', 'pr', 'ma', 'se', 'f2']) { await tap(d); assert(maxCb() <= 64, d); }

  // Borrar datos
  await tap('dl'); assert(/No se puede deshacer/.test(last.text));
  await tap('dl!'); assert(/Se borraron/.test(last.text)); assert.strictEqual(store.get(CHAT), undefined);

  // Grupos: se ignoran
  last = null; await handle({ message: { chat: { id: 7, type: 'group' }, text: '/start' } }, api); assert.strictEqual(last, null);

  // Origen de la visita: solo etiquetas simples, la primera vez
  const startAs = (id, text) => handle({ message: { chat: { id, type: 'private' }, text } }, api);
  await startAs(901, '/start dia1'); assert.strictEqual(store.get(901).source, 'dia1');
  await startAs(901, '/start otra'); assert.strictEqual(store.get(901).source, 'dia1', 'no se pisa el origen');
  await startAs(902, '/start'); assert.strictEqual(store.get(902).source, 'directo');
  await startAs(903, '/start <script>'); assert.strictEqual(store.get(903).source, 'directo');

  // Recordatorios: opcionales, una vez por día, solo si no practicó, se pausan solos
  await tap('se'); assert(labels().includes('Recordatorio'));
  await tap('rm'); assert(/apagado/.test(last.text));
  await tap('rm:h:20'); assert(/Activado a las 20:00/.test(last.text) && /Empieza mañana/.test(last.text));
  await tap('rm:h:7'); assert(/Activado a las 20:00/.test(last.text), 'hora inválida ignorada');
  await tap('rm:off'); assert(/apagado/.test(last.text));
  await tap('rm:h:18'); assert(callbacks().includes('rm:off') && labels().includes('✓ 18:00'));

  const AR = (iso) => new Date(iso + '-03:00').getTime(); // hora de Buenos Aires
  const ru = (o = {}) => ({ ...L.newUser(), rem: { on: true, hour: 20, last: '2026-03-09', ignored: 0 }, ...o });
  assert.strictEqual(L.reminderDue(ru(), AR('2026-03-10T20:30:00')), true);
  assert.strictEqual(L.reminderDue(ru(), AR('2026-03-10T18:00:00')), false, 'antes de la hora');
  assert.strictEqual(L.reminderDue(ru(), AR('2026-03-10T23:30:00')), false, 'fuera de la ventana de 3 horas');
  assert.strictEqual(L.reminderDue(ru({ rem: { on: false, hour: 20, last: null, ignored: 0 } }), AR('2026-03-10T20:30:00')), false, 'apagado');
  assert.strictEqual(L.reminderDue(ru({ rem: { on: true, hour: 20, last: '2026-03-10', ignored: 0 } }), AR('2026-03-10T20:30:00')), false, 'ya enviado hoy');
  assert.strictEqual(L.reminderDue(ru({ minutes: [{ day: '2026-03-10', min: 5, practice: 1, source: 'manual' }] }), AR('2026-03-10T20:30:00')), false, 'ya practicó hoy');

  const { sendReminders } = require('./bot.js');
  const sent = [];
  const rapi = { send: async (c, s) => { sent.push({ c, s }); } };
  store.set(904, ru());
  await sendReminders(rapi, AR('2026-03-10T20:30:00'));
  assert.strictEqual(sent.filter((m) => m.c == 904).length, 1);
  assert(/Es la hora de tu práctica/.test(sent.find((m) => m.c == 904).s.text) && /Cinco minutos alcanzan/.test(sent.find((m) => m.c == 904).s.text));
  await sendReminders(rapi, AR('2026-03-10T20:40:00'));
  assert.strictEqual(sent.filter((m) => m.c == 904).length, 1, 'no repite el mismo día');
  // días seguidos sin practicar: cuando se acumulan 5 recordatorios ignorados (el 904 ya traía uno), avisa y se pausa solo
  for (const d of ['11', '12', '13', '14']) await sendReminders(rapi, AR(`2026-03-${d}T20:30:00`));
  assert.strictEqual(sent.filter((m) => m.c == 904).length, 5);
  assert(/Pausé los recordatorios/.test(sent.filter((m) => m.c == 904).pop().s.text));
  assert.strictEqual(store.get(904).rem.on, false);
  await sendReminders(rapi, AR('2026-03-15T20:30:00'));
  await sendReminders(rapi, AR('2026-03-16T20:30:00'));
  assert.strictEqual(sent.filter((m) => m.c == 904).length, 5, 'pausado: no manda más');

  console.log('OK: flujo completo');
  require('fs').rmSync(process.env.BOT_DATA, { force: true });
})().catch((e) => { console.error('FALLO:', e.message); console.error(e.stack.split('\n').slice(1, 4).join('\n')); process.exit(1); });
