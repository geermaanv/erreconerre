// Bot de Telegram (prototipo). Sin dependencias. Token por variable de entorno TELEGRAM_BOT_TOKEN.
const store = require('./store');
const L = require('./logic');
const C = require('./content');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
const COMMUNITY_URL = process.env.COMMUNITY_URL || '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tg(method, body = {}) {
  const res = await fetch(`${BASE}/bot${TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
}

const kbJson = (kb) => ({ inline_keyboard: (kb || []).map((r) => r.map((b) => (b.url ? { text: b.t, url: b.url } : { text: b.t, callback_data: b.d }))) });
const realApi = {
  answer: (id) => tg('answerCallbackQuery', { callback_query_id: id }).catch(() => {}),
  send: (chat, s) => tg('sendMessage', { chat_id: chat, text: s.text, reply_markup: kbJson(s.kb) }),
  async edit(chat, msgId, s) {
    try { await tg('editMessageText', { chat_id: chat, message_id: msgId, text: s.text, reply_markup: kbJson(s.kb) }); }
    catch (e) { if (!/not modified/.test(e.message)) await realApi.send(chat, s); }
  },
};

const B = (t, d) => ({ t, d });
const MENU = [B('Menú', 'm')];
const bar = (n, max, len = 8) => '▰'.repeat(max ? Math.round((n / max) * len) : 0) + '▱'.repeat(len - (max ? Math.round((n / max) * len) : 0));

// ---------- pantallas ----------
const welcome = () => ({
  text: 'Hola. Esto es un entrenamiento para la R múltiple, pensado para adultos.\n\nAntes de empezar:\n· No reemplaza a un fonoaudiólogo. Si hace mucho que no sale ningún sonido de R, conviene una evaluación.\n· Guardo tus minutos y tus avances para seguirte. Podés borrarlos cuando quieras con /borrar.',
  kb: [[B('Empezar', 'ts'), B('Cómo funciona', 'how')]],
});
const how = () => ({
  text: 'Cómo funciona\n\n· El método: separar la doble R. "arroz" de corrido no sale; se practica ar + roz y se van uniendo.\n· Hay nueve prácticas. Todas están abiertas. La marcada con ▶ es la de hoy.\n· Sumás minutos de práctica. Es lo que más cuenta.\n· Marcás tus hitos cuando algo te sale por primera vez y cuando es estable.',
  kb: [[B('Empezar', 'ts')]],
});
const testQ = () => ({
  text: 'Probá decir en voz alta "arra" y "arroz". ¿Qué pasa?',
  kb: [[B('No sale, o sale sin vibrar', 'tr:0')], [B('"arra" me sale a veces', 'tr:1')], [B('Me salen las dos', 'tr:2')],
    [B('Me salen palabras y frases, a veces me falla', 'tr:3')], [B('Saltar: empiezo desde el principio', 'tr:4')]],
});
const TEST_START = [1, 3, 5, 8, 1];

function menu(u, prefix = '') {
  const today = L.dayKey(), h = L.hoy(u);
  const days = [...new Set(u.minutes.map((e) => e.day))].sort();
  let head = h ? `Hoy: práctica ${h}. Llevás ${L.fmtMin(L.totalMinutes(u))}.` : `Completaste las nueve prácticas. Llevás ${L.fmtMin(L.totalMinutes(u))}. Podés repetir cualquiera.`;
  if (days.length) {
    const gap = Math.round((Date.parse(today) - Date.parse(days[days.length - 1])) / 86400000);
    if (gap >= 3) head += `\nHace ${gap} días que no practicás. Cinco minutos alcanzan para retomar.`;
  }
  const btn = (p) => B((p.n === h ? '▶ ' : '') + p.label, `p:${p.n}`);
  const P = C.PRACTICES;
  return {
    text: prefix + head,
    kb: [[btn(P[0]), btn(P[1]), btn(P[2])], [btn(P[3]), btn(P[4]), btn(P[5])], [btn(P[6]), btn(P[7]), btn(P[8])],
      [B('Mi progreso', 'pr'), B('Mantenimiento', 'ma'), B('Comunidad', 'co')], [B('Práctica libre', 'fr'), B('Ajustes', 'se')]],
  };
}

const theory = (n) => {
  const p = C.PRACTICES[n - 1];
  return { text: `Práctica ${n} · ${p.name} (${p.min} min)\n\n${p.teoria}`, kb: [[B('Entendí', `l:${n}:0`), B('Menú', 'm')]] };
};

function listPage(u, n, i) {
  const p = C.PRACTICES[n - 1], pages = C.pagesFor(n, u.sinSeparar), t = pages.length;
  i = Math.max(0, Math.min(i, t - 1));
  const kb = [];
  if (t > 1) kb.push([B('◀', `l:${n}:${Math.max(0, i - 1)}`), B(`${i + 1}/${t}`, `l:${n}:${i}`), B('▶', `l:${n}:${Math.min(t - 1, i + 1)}`)]);
  if (p.split) kb.push([B(u.sinSeparar ? 'Ver separada' : 'Ver sin separar', `sp:${n}:${i}`)]);
  kb.push([B('Empecé', `go:${n}`), B('Ver teoría', `th:${n}`)], MENU);
  return { text: `Práctica ${n} · ${p.name}${t > 1 ? `  (${i + 1}/${t})` : ''}\n\n${pages[i]}`, kb };
}

const hhmm = (ts) => new Intl.DateTimeFormat('es-AR', { timeZone: process.env.BOT_TZ || 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' }).format(ts);
const practicing = (s) => ({ text: `Practicando${s.practice ? ` la práctica ${s.practice}` : ' (libre)'}. Empezaste a las ${hhmm(s.start)}.`, kb: [[B('Terminé', 'end'), B('Cancelar', 'cx')]] });

function progress(u) {
  const today = L.dayKey(), d7 = L.daysInLast7(u, today);
  const wk = [0, 1, 2].map((k) => L.minutesInWindow(u, today, k * 7, k * 7 + 6)), mx = Math.max(...wk, 1), h = L.hoy(u);
  const marks = C.PRACTICES.map((p) => `${p.n} ${L.superada(u, p.n) ? '✓' : p.n === h ? '▶' : '·'}`).join('  ');
  return {
    text: `Mi progreso\n\nTotal: ${L.fmtMin(L.totalMinutes(u))}\nRacha: ${L.streak(u, today)} días\nÚltimos 7 días: ${d7} de 5 días practicados  ${bar(Math.min(d7, 5), 5, 5)}\n\nMinutos por semana (de la más reciente a la más antigua):\n${wk.map((m, k) => `  ${k === 0 ? 'esta  ' : `-${k}     `}${bar(m, mx)}  ${m}`).join('\n')}\n\nPrácticas:\n${marks}`,
    kb: [[B('Mis hitos', 'hi'), B('Notas', 'nt')], MENU],
  };
}
const hitosScreen = (u) => ({
  text: 'Mis hitos\n\n' + C.HITOS.map(([k, name]) => {
    const h = u.hitos[k] || {};
    return `${name.padEnd(24)} ${h.estable ? `✓ primera vez ${h.primera} · estable ${h.estable}` : h.primera ? `✓ primera vez ${h.primera}` : '· todavía no'}`;
  }).join('\n') + '\n\nEstable: que salga en al menos 5 días distintos dentro de una semana.',
  kb: [...C.HITOS.reduce((rows, [k, name], i) => { if (i % 2 === 0) rows.push([]); rows[rows.length - 1].push(B(name, `hk:${k}`)); return rows; }, []), MENU],
});

function cardScreen(u) {
  const d = u.dose, w = d.queue[d.i], parts = d.sep ? C.splitTrill(w) : null;
  const shown = d.sep ? (parts ? parts.join(' · ') : `${w}\n(no tiene R que vibre en el medio)`) : w;
  return { text: `Tarjeta ${d.i + 1}/${d.queue.length}\n\n  ${shown}`, kb: [[B('Ver separada', 'ms')], [B('Salió', 'mg:s'), B('Costó', 'mg:c'), B('No salió', 'mg:n')]] };
}

function logMinutes(u, practice, min, source) {
  u.minutes.push({ day: L.dayKey(), min, practice, source });
  return `Anotado: ${min} min. Total: ${L.fmtMin(L.totalMinutes(u))}. Racha: ${L.streak(u, L.dayKey())} días.`;
}

// ---------- enrutador ----------
function route(u, data, ctx) {
  const [a, x, y] = data.split(':');
  const today = L.dayKey();
  switch (a) {
    case 'm': return menu(u);
    case 'how': return how();
    case 'ts': return testQ();
    case 'tr': {
      const i = +x; u.start = TEST_START[i]; u.testDone = true;
      let t = `Listo. Empezamos por la práctica ${u.start}. Todas las demás están abiertas cuando quieras.`;
      if (i === 0) t += '\n\nSi hace tiempo que no sale ningún sonido de R, una evaluación con un fonoaudiólogo puede descartar causas físicas. Podés practicar igual.';
      if (i === 3) t += '\n\nSi ya te sale en frases, podés marcar tus hitos en Mi progreso y usar Mantenimiento.';
      return { text: t, kb: [[B('Ir al menú', 'm')]] };
    }
    case 'p': return L.hasHistory(u, +x) ? listPage(u, +x, 0) : theory(+x);
    case 'th': return theory(+x);
    case 'l': return listPage(u, +x, +y);
    case 'sp': u.sinSeparar = !u.sinSeparar; return listPage(u, +x, +y);
    case 'go': u.session = { practice: +x, start: Date.now() }; return practicing(u.session);
    case 'fr': {
      if (x === 't') { u.session = { practice: 0, start: Date.now() }; return practicing(u.session); }
      if (x === 'c') return { text: '¿Cuántos minutos practicaste?', kb: [[B('5', 'mn:5'), B('10', 'mn:10'), B('20', 'mn:20'), B('30', 'mn:30'), B('Otro', 'mn:o')], MENU] };
      return { text: 'Práctica libre\n\nPara cuando practicás por tu cuenta, sin la guía.', kb: [[B('Empezar cronómetro', 'fr:t')], [B('Cargar minutos', 'fr:c')], MENU] };
    }
    case 'mn':
      if (x === 'o') { u.awaiting = 'minutes'; return { text: 'Escribí cuántos minutos practicaste (un número).', kb: [MENU] }; }
      return { text: logMinutes(u, 0, +x, 'manual'), kb: [[B('Dejar nota', 'note'), B('Menú', 'm')]] };
    case 'cx': u.session = null; return menu(u);
    case 'end': {
      const s = u.session;
      if (!s) return menu(u);
      const min = Math.max(1, Math.round((Date.now() - s.start) / 60000));
      u.session = null;
      if (!s.practice) return { text: logMinutes(u, 0, min, 'cronómetro'), kb: [[B('Dejar nota', 'note'), B('Menú', 'm')]] };
      u.pending = { practice: s.practice, min };
      return { text: `Terminaste. Fueron ${min} minutos.\n\n¿Cómo te fue?`, kb: [[B('Salió', 'rt:s'), B('A medias', 'rt:m'), B('No salió', 'rt:n')]] };
    }
    case 'rt': {
      const pd = u.pending; if (!pd) return menu(u);
      u.pending = null;
      const before = L.hoy(u);
      let t = logMinutes(u, pd.practice, pd.min, 'guiada');
      u.ratings.push({ practice: pd.practice, rating: x, day: today });
      const after = L.hoy(u), kb = [];
      if (after !== before) t += after ? `\n\nPasaste a la práctica ${after}.` : '\n\nCompletaste las nueve prácticas.';
      if (x === 'n' && pd.practice === before && pd.practice > 1 && L.lastRatings(u, pd.practice, 3).join('') === 'nnn') {
        t += '\n\nLas últimas tres veces no salió. Puede ayudar volver unos minutos a la práctica anterior.';
        kb.push([B(`Ir a la práctica ${pd.practice - 1}`, `p:${pd.practice - 1}`), B(`Seguir con la ${pd.practice}`, `p:${pd.practice}`)]);
      }
      const hk = Object.keys(C.HITO_PRACTICAS).find((k) => C.HITO_PRACTICAS[k].includes(pd.practice));
      if (x === 's' && hk && !(u.hitos[hk] || {}).estable) {
        const days = new Set(); for (let i = 0; i < 7; i++) days.add(L.addDays(today, -i));
        const n = new Set(u.ratings.filter((r) => r.rating === 's' && C.HITO_PRACTICAS[hk].includes(r.practice) && days.has(r.day)).map((r) => r.day)).size;
        if (n >= 5) { t += '\n\nParece que ya es estable. ¿Lo marcamos?'; kb.push([B('Marcar estable', `hs:${hk}:e`), B('Ahora no', 'm')]); }
      }
      kb.push([B('Dejar nota', 'note'), B('Menú', 'm')]);
      return { text: t, kb };
    }
    case 'note': u.awaiting = 'note'; return { text: 'Escribí tu nota (opcional).', kb: [MENU] };
    case 'nt': return { text: 'Notas\n\n' + (u.notes.slice(-5).map((n) => `${n.day}: ${n.text}`).join('\n') || 'Todavía no hay notas.'), kb: [[B('Volver', 'pr')]] };
    case 'pr': return progress(u);
    case 'hi': return hitosScreen(u);
    case 'hk': return { text: C.HITOS.find((h) => h[0] === x)[1], kb: [[B('Me salió por primera vez', `hs:${x}:p`)], [B('Me sale estable', `hs:${x}:e`)], [B('Desmarcar', `hs:${x}:x`)], [B('Volver', 'hi')]] };
    case 'hs': {
      const h = u.hitos[x] || {};
      if (y === 'p') h.primera = h.primera || today;
      if (y === 'e') { h.primera = h.primera || today; h.estable = today; }
      if (y === 'x') { delete h.primera; delete h.estable; }
      u.hitos[x] = h;
      return hitosScreen(u);
    }
    case 'ma': {
      if (!u.deck) { u.deck = {}; for (const w of C.seedDeck()) u.deck[w] = { box: 0, due: today }; }
      return { text: `Mantenimiento\n\nRepaso de las palabras que te cuestan, con intervalos que se alargan cuando te salen.\n\nHoy toca: ${L.dueCards(u, today).length} tarjetas.`, kb: [[B('Empezar', 'mi'), B('Mi mazo', 'mz')], MENU] };
    }
    case 'mi': {
      const queue = L.dueCards(u, today);
      if (!queue.length) return { text: 'No hay tarjetas para hoy.', kb: [MENU] };
      u.dose = { queue, i: 0, s: 0, c: 0, n: 0, sep: false };
      return cardScreen(u);
    }
    case 'ms': u.dose.sep = !u.dose.sep; return cardScreen(u);
    case 'mg': {
      const d = u.dose; if (!d) return menu(u);
      L.grade(u.deck[d.queue[d.i]], x, today); d[x]++; d.i++; d.sep = false;
      if (d.i >= d.queue.length) { const t = `Listo. Salió ${d.s}, costó ${d.c}, no salió ${d.n}.`; u.dose = null; return { text: t, kb: [MENU] }; }
      return cardScreen(u);
    }
    case 'mz': return { text: `Mi mazo: ${Object.keys(u.deck || {}).length} palabras`, kb: [[B('Agregar palabra', 'mad'), B('Ver difíciles', 'mhd')], [B('Volver', 'ma')]] };
    case 'mad': u.awaiting = 'addword'; return { text: 'Escribí la palabra que querés agregar.', kb: [MENU] };
    case 'mhd': return { text: 'Difíciles (primer escalón):\n\n' + (Object.entries(u.deck || {}).filter(([, c]) => c.box === 0).map(([w]) => w).slice(0, 40).join(', ') || 'Ninguna.'), kb: [[B('Volver', 'mz')]] };
    case 'co': return { text: 'Comunidad\n\nUn grupo de personas que están en lo mismo. Respetá la privacidad de los demás.' + (COMMUNITY_URL ? '' : '\n\n(Todavía no hay grupo configurado.)'), kb: [...(COMMUNITY_URL ? [[{ t: 'Entrar al grupo', url: COMMUNITY_URL }]] : []), MENU] };
    case 'se': return { text: 'Ajustes', kb: [[B('Exportar mis datos', 'ex')], [B('Borrar mis datos', 'dl')], MENU] };
    case 'ex': { const j = JSON.stringify(u); return { text: j.length < 3800 ? j : `Tus datos son demasiado largos para mostrarlos acá (${j.length} caracteres). En esta versión de prueba, la exportación completa no está disponible.`, kb: [[B('Volver', 'se')]] }; }
    case 'dl': return { text: 'Se borrarán todos tus datos: minutos, hitos, notas y mazo. No se puede deshacer.', kb: [[B('Sí, borrar todo', 'dl!'), B('Cancelar', 'se')]] };
    case 'dl!': ctx.deleted = true; return { text: 'Listo. Se borraron todos tus datos. Escribí /start para empezar de nuevo.', kb: [] };
    default: return menu(u);
  }
}

function onText(u, text, ctx) {
  const t = text.trim(), cmd = t.split(/[ @]/)[0];
  if (cmd === '/start') { u.awaiting = null; return u.testDone ? menu(u) : welcome(); }
  if (cmd === '/menu') { u.awaiting = null; return menu(u); }
  if (cmd === '/ayuda') return how();
  if (cmd === '/borrar') return route(u, 'dl', ctx);
  const aw = u.awaiting; u.awaiting = null;
  if (aw === 'minutes') {
    const n = parseInt(t, 10);
    if (!(n >= 1 && n <= 600)) { u.awaiting = 'minutes'; return { text: 'Escribí un número de minutos entre 1 y 600.', kb: [MENU] }; }
    return { text: logMinutes(u, 0, n, 'manual'), kb: [[B('Dejar nota', 'note'), B('Menú', 'm')]] };
  }
  if (aw === 'note') { u.notes.push({ day: L.dayKey(), text: t.slice(0, 500) }); return menu(u, 'Nota guardada.\n\n'); }
  if (aw === 'addword') {
    const w = t.toLowerCase().slice(0, 40);
    if (!u.deck) u.deck = {};
    u.deck[w] = u.deck[w] || { box: 0, due: L.dayKey() };
    return { text: `Agregada: ${w}`, kb: [[B('Agregar otra', 'mad'), B('Mi mazo', 'mz')]] };
  }
  return menu(u, 'Usá los botones para moverte.\n\n');
}

async function handle(update, api) {
  const cb = update.callback_query, msg = update.message;
  const m = cb ? cb.message : msg;
  if (!m || !m.chat || m.chat.type !== 'private') return;
  const chat = m.chat.id, ctx = {};
  const u = store.get(chat) || L.newUser();
  let screen, msgId = null;
  if (cb) { await api.answer(cb.id); msgId = m.message_id; screen = route(u, cb.data || 'm', ctx); }
  else if (msg.text) screen = onText(u, msg.text, ctx);
  else return;
  if (ctx.deleted) store.del(chat); else store.set(chat, u);
  if (msgId) await api.edit(chat, msgId, screen); else await api.send(chat, screen);
}

async function main() {
  if (!TOKEN) { console.error('Falta la variable de entorno TELEGRAM_BOT_TOKEN. Ver bot/README.md.'); process.exit(1); }
  const me = await tg('getMe');
  console.log(`Bot en línea: @${me.username}`);
  await tg('setMyCommands', { commands: [{ command: 'menu', description: 'Menú principal' }, { command: 'ayuda', description: 'Cómo funciona' }, { command: 'borrar', description: 'Borrar mis datos' }] }).catch(() => {});
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

module.exports = { handle, route, onText, menu, tg };
if (require.main === module) main();
