// Bot de Telegram (prototipo). Sin dependencias. Token por variable de entorno TELEGRAM_BOT_TOKEN.
// Versión mínima, dos circuitos: "Aprender" (nueve prácticas) y "Practicar" (repaso de palabras; en el código, mode "mantener").
const store = require('./store');
const L = require('./logic');
const C = require('./content');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tg(method, body = {}) {
  const res = await fetch(`${BASE}/bot${TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
}

// Sin botones no se manda reply_markup: al editar, eso quita los botones del mensaje.
const kbJson = (kb) => (kb && kb.length ? { inline_keyboard: kb.map((r) => r.map((b) => ({ text: b.t, callback_data: b.d }))) } : undefined);
const realApi = {
  answer: (id) => tg('answerCallbackQuery', { callback_query_id: id }).catch(() => {}),
  send: (chat, s) => tg('sendMessage', { chat_id: chat, text: s.text, reply_markup: kbJson(s.kb) }),
  async edit(chat, msgId, s) {
    try { await tg('editMessageText', { chat_id: chat, message_id: msgId, text: s.text, reply_markup: kbJson(s.kb) }); }
    catch (e) { if (!/not modified/.test(e.message)) await realApi.send(chat, s); }
  },
};

// ---------- pantallas ----------
// Cada pantalla es { text, kb, fresh }. Por defecto reemplaza el mensaje tocado; con fresh se manda como mensaje nuevo.
// Regla: el mensaje del ejercicio nunca se reemplaza por otra cosa.
const B = (t, d) => ({ t, d });
const HOME = [B('Volver', 'm')];
const fresh = (s) => ({ ...s, fresh: true });
const clamp = (i, t) => Math.max(0, Math.min(i, t - 1));
const practiceName = (n) => C.PRACTICES[n - 1].name;

const modeScreen = (prefix = '') => ({ text: prefix + C.MODO.q, kb: [[B(C.MODO.aprender, 'mo:a'), B(C.MODO.mantener, 'mo:m')]] });
const welcome = () => modeScreen(`${C.SALUDO}\n\n`);

const totalLine = (u) => `Llevás ${L.fmtMin(L.totalMinutes(u))}.`;
const MORE = [B('Más', 'mas')];

function learnHome(u, prefix) {
  const h = L.hoy(u);
  if (!h) return { text: `${prefix}🟢 Aprender\n\nCompletaste los nueve ejercicios.\n${totalLine(u)}`, kb: [[B('Pasar a Practicar', 'mo:m')], MORE] };
  return { text: `${prefix}🟢 Aprender\n\nEjercicio ${h} de 9 · ${practiceName(h)}\n${totalLine(u)}`, kb: [[B('▶ Empezar ejercicio', `ej:${h}`)], MORE] };
}

const ensureDeck = (u) => { if (!u.deck) u.deck = {}; if (!u.flags.mazo) { u.flags.mazo = true; const today = L.dayKey(); for (const w of C.seedDeck()) u.deck[w] = u.deck[w] || { box: 0, due: today }; } };
function keepHome(u, prefix) {
  ensureDeck(u);
  const n = L.dueCards(u, L.dayKey()).length;
  return {
    text: `${prefix}🔵 Practicar\n\n${n ? `Hoy: ${n} ${n === 1 ? 'palabra' : 'palabras'} para repasar.` : 'Hoy no quedan palabras para repasar.'}\n${totalLine(u)}`,
    kb: [...(n ? [[B('▶ Repasar', 'mi')]] : []), [B('Agregar mis palabras', 'mad')], MORE],
  };
}

function menu(u, prefix = '') {
  if (u.mode === 'aprender') return learnHome(u, prefix);
  if (u.mode === 'mantener') return keepHome(u, prefix);
  return modeScreen(prefix);
}

// ---------- ejercicio ----------
const stuck = (u, n) => L.lastRatings(u, n, 3).join('') === 'nnn';

// open = false: el mismo ejercicio, ya cerrado (sin botones), para que quede a la vista.
function exerciseScreen(n, i, s, open = true) {
  const pages = C.pagesFor(n), t = pages.length;
  i = clamp(i, t);
  const text = [`Ejercicio ${n} · ${practiceName(n)}${t > 1 ? `  (${i + 1}/${t})` : ''}`, s && s.cue, s && s.extra, pages[i],
    open ? `${C.PRACTICES[n - 1].pie || (C.PRACTICES[n - 1].split && pages[i].includes(' · ') ? 'Leé la palabra, decila por partes y volvé a unirla.' : 'Una línea, varias veces, lento.')} Cuando termines, tocá Terminé.` : null].filter(Boolean).join('\n\n');
  if (!open) return { text, kb: [] };
  const kb = [];
  if (t > 1) kb.push([B('◀', `pg:${n}:${Math.max(0, i - 1)}`), B(`${i + 1}/${t}`, `pg:${n}:${i}`), B('▶', `pg:${n}:${Math.min(t - 1, i + 1)}`)]);
  kb.push([B('Terminé', `fin:${n}`)], [B('Ayuda', `th:${n}`)]);
  return { text, kb };
}

const theoryText = (n) => `Cómo se hace · Ejercicio ${n}\n\n${C.PRACTICES[n - 1].teoria.join('\n\n')}`;
// Ayuda: cómo se hace y, en las primeras cuatro, otros caminos al sonido.
const helpScreen = (n) => (n <= 4
  ? { text: theoryText(n), kb: [[B('Otros caminos', `ns:${n}:0`)]] }
  : { text: theoryText(n), kb: [] });

function pathScreen(n, i) {
  const t = C.RUTAS.length;
  i = clamp(i, t);
  const r = C.RUTAS[i];
  const nav = [];
  if (i > 0) nav.push(B('◀ Anterior', `ns:${n}:${i - 1}`));
  if (i < t - 1) nav.push(B('Otro camino ▶', `ns:${n}:${i + 1}`));
  return { text: `Otros caminos  (${i + 1}/${t})\n\nSon formas distintas de llegar al mismo sonido. Probá uno varios días; si no funciona, pasá al siguiente.\n\n${r.name}\n\n${r.texto}`, kb: [nav] };
}

function startExercise(u, n) {
  if (u.mode !== 'aprender' || n !== L.hoy(u)) return menu(u); // solo la práctica de hoy
  const p = C.PRACTICES[n - 1];
  const cue = p.cues[L.guidedSessions(u) % p.cues.length];
  const extra = n === 3 && stuck(u, 3) ? p.extra : null;
  const firstTime = !u.flags[`th${n}`] && !L.hasHistory(u, n);
  u.flags[`th${n}`] = true;
  u.pending = null;
  u.session = { practice: n, start: Date.now(), page: 0, cue, extra };
  const ex = exerciseScreen(n, 0, u.session);
  return firstTime ? [{ text: theoryText(n), kb: [] }, fresh(ex)] : ex;
}

// ---------- final de una sesión: una sola pregunta ----------
function finish(u, n) {
  const s = u.session;
  if (!s || s.practice !== n || !C.PRACTICES[n - 1]) return fresh(menu(u, 'Ese ejercicio ya estaba cerrado.\n\n'));
  const min = L.elapsedMin(s.start);
  u.session = null;
  u.minutes.push({ day: L.dayKey(), min, practice: n, source: 'guiada' });
  u.pending = { practice: n };
  return [
    exerciseScreen(n, s.page || 0, s, false),
    fresh({ text: `${min} min ${min === 1 ? 'anotado' : 'anotados'}. ¿La R vibró? (más de un golpe seguido)`, kb: [[B('Sí, vibró', 'r:s'), B('Todavía no', 'r:n')]] }),
  ];
}

function answer(u, x) {
  const pd = u.pending;
  u.pending = null;
  if (!pd || !C.PRACTICES[pd.practice - 1]) return menu(u);
  x = x === 's' ? 's' : 'n';
  const today = L.dayKey(), n = pd.practice;
  const before = L.hoy(u), was = L.superada(u, n);
  u.ratings.push({ practice: n, rating: x, day: today });
  const after = L.hoy(u), kb = [];
  let t;
  if (x === 's') {
    if (!was && L.superada(u, n)) {
      t = `¡Superaste el ejercicio ${n}!`;
      if (after && after !== before) t += ` Ahora sigue el ${after} · ${practiceName(after)}.`;
      if (!after) { t += ' Completaste los nueve.\n\n¿Pasás a Practicar, para ganar precisión y soltura?'; kb.push([B('Pasar a Practicar', 'mo:m')]); }
    } else if (was) t = 'Bien. Este ejercicio ya lo tenías superado.';
    else t = `Bien. Para superar el ejercicio ${n} tiene que vibrar en 3 días distintos. Llevás ${L.salioDays(u, n).size}.`;
    if (!u.flags.grabate) {
      u.flags.grabate = true;
      t += '\n\nPrimera vez que vibra: buen momento para grabarte. Así tenés una referencia de cómo suena cuando sale.';
    }
  } else {
    t = 'Anotado. Cada intento suma.';
    if (stuck(u, n)) {
      t += '\n\nLas últimas tres veces no vibró. Es normal en algún momento del camino.';
      if (n <= 4) { t += ' Probá otra forma de llegar al sonido.'; kb.push([B('Otros caminos', `ns:${n}`)]); }
    }
  }
  if (!u.flags.derivacion && L.derivacion(u, today)) {
    u.flags.derivacion = true;
    t += '\n\nHasta ahora no vibró en ningún intento. A veces hay causas físicas que no se resuelven solo ejercitando. Una evaluación con un fonoaudiólogo puede ayudar. Podés seguir ejercitando igual.';
  }
  kb.push([B('Listo', 'm')]);
  return { text: t, kb };
}

// ---------- repaso de palabras (Practicar) ----------
// En el repaso la palabra o frase va entera: separarla es parte de Aprender.
function cardScreen(u) {
  const d = u.dose;
  return { text: `Repaso ${d.i + 1} de ${d.queue.length}: ${d.queue[d.i]}\n\nDecila en voz alta.`, kb: [[B('Salió bien', 'mg:s'), B('Me costó', 'mg:n')]] };
}
function reviewSummary(d) {
  const missed = d.missed || [];
  let t = `Listo: repasaste ${d.i}. Salieron bien: ${d.s || 0}. Te costaron: ${missed.length}.`;
  if (missed.length) t += `\n\nPara repetir mañana:\n${missed.map((w) => `· ${w}`).join('\n')}`;
  return { text: t, kb: [[B('Listo', 'm')]] };
}

// ---------- Más ----------
const moreScreen = (u) => ({
  text: 'Más',
  kb: [[B('Recordatorio', 'rm')], [u.mode === 'mantener' ? B('Cambiar a Aprender', 'mo:a') : B('Cambiar a Practicar', 'mo:m')], [B('Mis datos', 'md')], HOME],
});

// ---------- recordatorios ----------
const hh = (h) => String(h).padStart(2, '0') + ':00';
function reminderScreen(u, justSet) {
  const r = u.rem, on = r && r.on;
  const text = on
    ? `Recordatorio diario\n\nActivado a las ${hh(r.hour)}, hora de Argentina.${justSet ? ' Empieza mañana.' : ''} Te escribo una vez por día, solo si todavía no ejercitaste. Si pasan 5 días sin que ejercites, lo pauso solo.\n\nPodés cambiar la hora o apagarlo.`
    : 'Recordatorio diario\n\nEstá apagado. Si lo activás, te escribo una vez por día a la hora que elijas, solo si todavía no ejercitaste. Empieza mañana.\n\nElegí la hora (de Argentina):';
  const hours = [8, 12, 18, 20, 21].map((h) => B((on && r.hour === h ? '✓ ' : '') + hh(h), `rm:h:${h}`));
  return { text, kb: [hours.slice(0, 3), hours.slice(3), ...(on ? [[B('Apagar', 'rm:off')]] : []), [B('Volver', 'mas')]] };
}

function reminderText(u) {
  let what = 'Entrá y elegí cómo seguir.', button = B('Empezar', 'm');
  const h = L.hoy(u);
  if (u.mode === 'mantener') what = 'Hoy podés repasar tus palabras.';
  else if (u.mode === 'aprender' && h) { what = `Hoy: ejercicio ${h} · ${practiceName(h)}.\nObjetivo: ${C.PRACTICES[h - 1].objetivo}`; button = B('▶ Empezar ejercicio', `ej:${h}`); }
  return { text: `Es la hora de ejercitar.\n\n${what}\n\nCinco minutos alcanzan.`, kb: [[button], [B('Pausar recordatorios', 'rm:off')]] };
}

// Envía los recordatorios que toquen. Una vez por día por persona; se pausa solo tras 5 días sin practicar.
async function sendReminders(api, now = Date.now()) {
  for (const [chat, u0] of Object.entries(store.all())) {
    const u = Object.assign(L.newUser(), u0);
    if (!L.reminderDue(u, now)) continue;
    const r = u.rem, today = L.dayKey(now);
    r.ignored = r.last && !L.practiceDays(u).has(r.last) ? (r.ignored || 0) + 1 : 0;
    if (r.ignored >= 5) {
      r.on = false; r.ignored = 0; store.set(chat, u);
      await api.send(chat, { text: 'Pausé los recordatorios porque pasaron varios días sin ejercitar. Cuando quieras, los volvés a activar en "Más". Sin apuro.', kb: [[B('Ir al inicio', 'm')]] }).catch(() => {});
      continue;
    }
    r.last = today;
    try { await api.send(chat, reminderText(u)); }
    catch (e) { if (/blocked|deactivated|not found/i.test(e.message)) r.on = false; else { r.last = null; console.error('recordatorio:', e.message); } }
    store.set(chat, u);
  }
}

// ---------- enrutador ----------
function route(u, data, ctx) {
  const [a, x, y] = data.split(':');
  const today = L.dayKey();
  switch (a) {
    case 'm': return menu(u);
    case 'mo': {
      if (x !== 'a' && x !== 'm') return menu(u);
      u.mode = x === 'a' ? 'aprender' : 'mantener';
      u.testDone = true; u.session = null; u.pending = null;
      return menu(u);
    }
    case 'ej': return startExercise(u, +x);
    case 'pg': {
      const s = u.session && u.session.practice === +x ? u.session : null;
      if (!C.PRACTICES[+x - 1]) return menu(u);
      if (s) s.page = +y || 0;
      return exerciseScreen(+x, +y || 0, s);
    }
    // La ayuda llega en un mensaje aparte, para no tapar la lista; las flechas editan ese mensaje.
    case 'th': return C.PRACTICES[+x - 1] ? fresh(helpScreen(+x)) : menu(u);
    case 'ns': return y === undefined ? fresh(pathScreen(+x, 0)) : pathScreen(+x, +y);
    case 'fin': return finish(u, +x);
    case 'r': return answer(u, x);
    case 'mi': {
      ensureDeck(u);
      const queue = L.dueCards(u, today);
      if (!queue.length) return menu(u);
      u.dose = { queue, i: 0, s: 0, missed: [], start: Date.now() };
      return cardScreen(u);
    }
    case 'mg': {
      const d = u.dose; if (!d) return menu(u);
      const g = x === 's' ? 's' : 'n';
      if (u.deck[d.queue[d.i]]) L.grade(u.deck[d.queue[d.i]], g, today);
      if (g === 's') d.s = (d.s || 0) + 1; else (d.missed = d.missed || []).push(d.queue[d.i]);
      d.i++;
      if (d.i < d.queue.length) return cardScreen(u);
      u.dose = null;
      u.minutes.push({ day: today, min: L.elapsedMin(d.start || Date.now()), practice: 11, source: 'repaso' });
      return reviewSummary(d);
    }
    case 'mad': u.awaiting = 'addword'; return { text: 'Escribí una palabra o frase que se te traba.', kb: [HOME] };
    case 'mas': case 'se': return moreScreen(u);
    case 'rm': {
      if (x === 'h' && [8, 12, 18, 20, 21].includes(+y)) u.rem = { ...u.rem, on: true, hour: +y, last: today, ignored: 0 };
      if (x === 'off') u.rem = { ...u.rem, on: false, ignored: 0 };
      return reminderScreen(u, x === 'h' && u.rem.on);
    }
    case 'md': return { text: 'Mis datos\n\nGuardo tu identificador de Telegram, cuándo entraste y desde qué enlace, tus minutos, tus avances, tus palabras y tu recordatorio.', kb: [[B('Exportar', 'ex'), B('Borrar', 'dl')], [B('Volver', 'mas')]] };
    case 'ex': { const j = JSON.stringify(u); return { text: j.length < 3800 ? j : `Tus datos son demasiado largos para mostrarlos acá (${j.length} caracteres). En esta versión de prueba, la exportación completa no está disponible.`, kb: [[B('Volver', 'md')]] }; }
    case 'dl': return { text: 'Se borrarán todos tus datos: minutos, avances y palabras. No se puede deshacer.', kb: [[B('Sí, borrar todo', 'dl!'), B('Cancelar', 'md')]] };
    case 'dl!': ctx.deleted = true; return { text: 'Listo. Se borraron todos tus datos. Escribí /start para empezar de nuevo.', kb: [] };
    default: return menu(u); // incluye botones de mensajes viejos
  }
}

function onText(u, text, ctx) {
  const t = text.trim(), cmd = t.split(/[ @]/)[0];
  if (cmd === '/start') {
    u.awaiting = null;
    // Origen de la visita (ej. t.me/mesalio_la_r_bot?start=dia1). Solo se guarda la etiqueta, la primera vez.
    if (!u.joined) { u.joined = L.dayKey(); const p = (t.split(/\s+/)[1] || '').toLowerCase(); u.source = /^[a-z0-9_-]{1,32}$/.test(p) ? p : 'directo'; }
    return u.testDone ? menu(u) : welcome();
  }
  if (cmd === '/menu') { u.awaiting = null; return menu(u); }
  if (cmd === '/borrar') { u.awaiting = null; return route(u, 'dl', ctx); }
  const aw = u.awaiting; u.awaiting = null;
  if (aw === 'addword') {
    const typed = t.replace(/\s+/g, ' ').slice(0, 80);
    ensureDeck(u);
    // Se respetan las mayúsculas; si ya estaba escrita de otra forma, no se duplica.
    const w = Object.keys(u.deck).find((k) => k.toLocaleLowerCase('es') === typed.toLocaleLowerCase('es')) || typed;
    u.deck[w] = u.deck[w] || { box: 0, due: L.dayKey() };
    return { text: `Agregada: ${w}`, kb: [[B('Agregar otra', 'mad'), B('Listo', 'm')]] };
  }
  return menu(u, 'Usá los botones para moverte.\n\n');
}

async function handle(update, api) {
  const cb = update.callback_query, msg = update.message;
  const m = cb ? cb.message : msg;
  if (!m || !m.chat || m.chat.type !== 'private') return;
  const chat = m.chat.id, ctx = {};
  const u = Object.assign(L.newUser(), store.get(chat) || {}); // completa campos de versiones anteriores
  let out, msgId = null;
  if (cb) { await api.answer(cb.id); msgId = m.message_id; u.awaiting = null; out = route(u, cb.data || 'm', ctx); }
  else if (msg.text) out = onText(u, msg.text, ctx);
  else return;
  if (ctx.deleted) store.del(chat); else store.set(chat, u);
  for (const s of [].concat(out)) {
    if (msgId && !s.fresh) await api.edit(chat, msgId, s); else await api.send(chat, s);
  }
}

async function main() {
  if (!TOKEN) { console.error('Falta la variable de entorno TELEGRAM_BOT_TOKEN. Ver bot/README.md.'); process.exit(1); }
  const me = await tg('getMe');
  console.log(`Bot en línea: @${me.username}`);
  await tg('setMyCommands', { commands: [{ command: 'menu', description: 'Inicio' }, { command: 'borrar', description: 'Borrar mis datos' }] }).catch(() => {});
  sendReminders(realApi).catch((e) => console.error('recordatorios:', e.message));
  setInterval(() => sendReminders(realApi).catch((e) => console.error('recordatorios:', e.message)), 5 * 60 * 1000);
  let offset = 0;
  for (;;) {
    try {
      const ups = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
      for (const up of ups) {
        offset = up.update_id + 1;
        try { await handle(up, realApi); } catch (e) { console.error('handle:', e.message); }
      }
    } catch (e) { console.error('poll:', e.message); await sleep(3000); }
  }
}

module.exports = { handle, route, onText, menu, tg, sendReminders, kbJson };
if (require.main === module) main();
