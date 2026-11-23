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
  text: 'Hola. Esto es un entrenamiento para la R múltiple (la de "perro"), pensado para adultos.\n\nSe basa en un método simple: separar la doble R para que no te trabes, y practicar mucho, en ratos cortos.\n\nTe recomiendo leer "Cómo funciona" antes de empezar. Son cinco pantallas cortas.',
  kb: [[B('Cómo funciona', 'in:0')], [B('Empezar ya', 'ts')]],
});
function intro(i) {
  const t = C.INTRO.length; i = Math.max(0, Math.min(i, t - 1));
  const nav = [];
  if (i > 0) nav.push(B('◀ Anterior', `in:${i - 1}`));
  nav.push(i < t - 1 ? B('Siguiente ▶', `in:${i + 1}`) : B('Empezar', 'ts'));
  return { text: C.INTRO[i], kb: [nav, [B('Saltar', 'ts')]] };
}
const test1 = () => ({ text: `Una pregunta para saber por dónde empezar. No es un diagnóstico y podés cambiarla después.\n\n${C.TEST1.q}`, kb: [...C.TEST1.a.map(([t], i) => [B(t, `t1:${i}`)]), [B('Saltar: empiezo desde el principio', 't1:x')]] });
const test2 = () => ({ text: C.TEST2.q, kb: C.TEST2.a.map(([t], i) => [B(t, `t2:${i}`)]) });

function perfilScreen(u) {
  const pf = C.PERFILES[u.perfil];
  const where = u.fase2Start ? 'Empezamos por Habla, la etapa de llevar la R a situaciones reales.' : `Empezamos por la práctica ${u.start}: ${C.PRACTICES[u.start - 1].name.toLowerCase()}.`;
  const extra = u.mantAbierto ? '\n\nMantenimiento ya está abierto para vos: ahí repasás las palabras que se traban.' : '';
  return { text: `${pf ? `Tu punto de partida: ${pf.name}\n\n${pf.texto}\n\n` : ''}${where} Todas las demás prácticas están abiertas cuando quieras.${extra}`, kb: [[B('Ir al menú', 'm')]] };
}

function menu(u, prefix = '') {
  const today = L.dayKey(), h = L.hoy(u);
  const days = [...new Set(u.minutes.map((e) => e.day))].sort();
  let head = h ? `Hoy: práctica ${h} · ${C.PRACTICES[h - 1].name}.\nObjetivo: ${C.PRACTICES[h - 1].objetivo}` : 'Completaste las nueve prácticas. Seguí en Habla y Mantenimiento, o repetí cualquiera.';
  head += `\n\nLlevás ${L.fmtMin(L.totalMinutes(u))}.`;
  if (days.length) {
    const gap = Math.round((Date.parse(today) - Date.parse(days[days.length - 1])) / 86400000);
    if (gap >= 3) head += ` Hace ${gap} días que no practicás.`;
  }
  if (!days.includes(today)) head += ' Cinco minutos alcanzan.';
  const btn = (p) => B((p.n === h ? '▶ ' : '') + p.label, `p:${p.n}`);
  const P = C.PRACTICES;
  return {
    text: prefix + head,
    kb: [[btn(P[0]), btn(P[1]), btn(P[2])], [btn(P[3]), btn(P[4]), btn(P[5])], [btn(P[6]), btn(P[7]), btn(P[8])],
      [B('Mi progreso', 'pr'), B('Mantenimiento', 'ma'), B('Comunidad', 'co')], [B('Habla', 'f2'), B('Práctica libre', 'fr'), B('Ajustes', 'se')]],
  };
}

function theory(n, i) {
  const p = C.PRACTICES[n - 1], t = p.teoria.length; i = Math.max(0, Math.min(i, t - 1));
  const nav = [];
  if (i > 0) nav.push(B('◀', `th:${n}:${i - 1}`));
  nav.push(i < t - 1 ? B('Siguiente ▶', `th:${n}:${i + 1}`) : B('Entendí, a practicar', `l:${n}:0`));
  return { text: `Práctica ${n} · ${p.name}  (${i + 1}/${t})\nObjetivo: ${p.objetivo}\n\n${p.teoria[i]}`, kb: [nav, MENU] };
}

const stuck = (u, n) => L.lastRatings(u, n, 3).join('') === 'nnn';
const showRutas = (u, n) => n <= 4 && (stuck(u, n) || u.perfil === 'sinsimple' || u.perfil === 'sustitucion' || u.rutas.length > 0);

function listPage(u, n, i) {
  const p = C.PRACTICES[n - 1], pages = C.pagesFor(n, u.sinSeparar), t = pages.length;
  i = Math.max(0, Math.min(i, t - 1));
  const kb = [];
  if (t > 1) kb.push([B('◀', `l:${n}:${Math.max(0, i - 1)}`), B(`${i + 1}/${t}`, `l:${n}:${i}`), B('▶', `l:${n}:${Math.min(t - 1, i + 1)}`)]);
  if (p.split) kb.push([B(u.sinSeparar ? 'Ver separada' : 'Ver sin separar', `sp:${n}:${i}`)]);
  kb.push([B('Empecé', `go:${n}:${i}`), B('Ver teoría', `th:${n}:0`)]);
  const tools = [B('Modo memoria', `me:${n}:${i}`)];
  if (L.guidedSessions(u) >= 1) tools.push(B('Preparación', `pp:${n}`));
  kb.push(tools);
  const more = [];
  if (showRutas(u, n)) more.push(B('Si no sale', `sn:${n}:0`));
  if (n >= 5) more.push(B('Escucha', `es:${n}`));
  if (more.length) kb.push(more);
  kb.push(MENU);
  return { text: `Práctica ${n} · ${p.name}${t > 1 ? `  (${i + 1}/${t})` : ''}\n\n${pages[i]}\n\nUna línea, varias veces, lento. Cuando sale, pasá a la siguiente.`, kb };
}

const hhmm = (ts) => new Intl.DateTimeFormat('es-AR', { timeZone: process.env.BOT_TZ || 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' }).format(ts);
function practicing(u) {
  const s = u.session;
  const what = s.practice === 10 ? ` Habla: ${C.FASE2[u.fase2][0].toLowerCase()}` : s.practice ? ` la práctica ${s.practice}` : ' (libre)';
  let t = `Practicando${what}. Empezaste a las ${hhmm(s.start)}.`;
  if (s.cue) t += `\n\n${s.cue}`;
  if (s.extra) t += `\n\n${s.extra}`;
  if (s.practice >= 1 && s.practice <= 9) {
    t += '\n\nSi querés, contá los intentos de una línea: 5 intentos, y si salen 4 pasás a la siguiente.';
    if (s.ok + s.ko) t += `\nBloque: ${'✓'.repeat(s.ok)}${'✗'.repeat(s.ko)} (${s.ok + s.ko}/5)`;
    if (s.msg) t += `\n${s.msg}`;
  }
  const kb = [];
  if (s.practice >= 1 && s.practice <= 9) kb.push([B('✓ Salió', 'ok'), B('✗ No', 'ko')]);
  kb.push([B('Terminé', 'end'), B('Cancelar', 'cx')]);
  return { text: t, kb };
}

function rutasScreen(u, n, i) {
  const order = (C.PERFILES[u.perfil] || C.PERFILES.simple).rutas, t = order.length;
  i = Math.max(0, Math.min(i, t - 1));
  const r = C.RUTAS[order[i]];
  if (!u.rutas.includes(r.n)) u.rutas.push(r.n);
  return {
    text: `Si no sale (${i + 1}/${t})\n\nSon caminos distintos al mismo sonido. Probá uno varios días; si no funciona, pasá al siguiente. Quedate con el que te sirva.\n\n${r.name}\n\n${r.texto}`,
    kb: [[B('◀', `sn:${n}:${Math.max(0, i - 1)}`), B(`${i + 1}/${t}`, `sn:${n}:${i}`), B('▶', `sn:${n}:${Math.min(t - 1, i + 1)}`)],
      [B('Empecé', `go:${n}:0`), B('Volver a la práctica', `l:${n}:0`)], MENU],
  };
}

function memoryScreen(n, i) {
  const ls = C.memoryLines(n, i);
  return {
    text: `Modo memoria · Práctica ${n}\n\nMemorizá estas líneas y practicalas sin mirar el teléfono: caminando, en el auto, donde sea. Después cargás los minutos.\n\n${ls.join('\n')}\n\nSi estás manejando, la vista en el camino. No toques el teléfono hasta llegar.`,
    kb: [[B('Cargar minutos', `mm:${n}`)], [B('Volver a la práctica', `l:${n}:${i}`)], MENU],
  };
}
const minutesKb = (n) => [[5, 10, 20, 30].map((m) => B(String(m), `mn:${m}:${n}`)).concat([B('Otro', `mn:o:${n}`)]), MENU];

function fase2Screen(u) {
  const [name, txt] = C.FASE2[u.fase2];
  return {
    text: `Habla · Escalón ${u.fase2 + 1} de ${C.FASE2.length}: ${name}\n\nAcá llevás la R a situaciones reales, con cada vez más presión. Subís de escalón cuando el actual es estable (5 días distintos en una semana).\n\n${txt}`,
    kb: [[B('Empecé', 'go:10:0')], [B('Bajar escalón', 'f2:d'), B('Subir escalón', 'f2:u')], MENU],
  };
}

function consultaResumen(u) {
  const pf = C.PERFILES[u.perfil];
  const days = u.minutes.map((e) => e.day).sort();
  const weeks = days.length ? Math.max(1, Math.round((Date.parse(L.dayKey()) - Date.parse(days[0])) / (7 * 86400000))) : 0;
  const per = [1, 2, 3].map((p) => { const r = u.ratings.filter((x) => x.practice === p); return `  práctica ${p}: ${r.length} sesiones, ${r.filter(L.salioOk).length} salió`; }).join('\n');
  const rutas = u.rutas.length ? u.rutas.map((n) => C.RUTAS[n].name.split(' · ')[1]).join(', ') : 'ninguna';
  return {
    text: `Qué llevar a la consulta\n\nCopiá esto o mostralo en el teléfono:\n\n· Qué pasa con la R: ${pf ? pf.name : 'sin indicar'}\n· Práctica: ${L.fmtMin(L.totalMinutes(u))} en ${weeks} semanas\n${per}\n· Rutas alternativas probadas: ${rutas}\n\nAgregá vos:\n· desde cuándo te pasa\n· si tuviste fisura de paladar, problemas de audición u ortodoncia\n· si alguien en tu familia tiene la misma dificultad`,
    kb: [[B('Volver', 'se')]],
  };
}

function progress(u) {
  const today = L.dayKey(), d7 = L.daysInLast7(u, today);
  const wk = [0, 1, 2].map((k) => L.minutesInWindow(u, today, k * 7, k * 7 + 6)), mx = Math.max(...wk, 1), h = L.hoy(u);
  const marks = C.PRACTICES.map((p) => `${p.n} ${L.superada(u, p.n) ? '✓' : p.n === h ? '▶' : '·'}`).join('  ');
  return {
    text: `Mi progreso\n\nTotal: ${L.fmtMin(L.totalMinutes(u))}\nRacha: ${L.streak(u, today)} días\nÚltimos 7 días: ${d7} de 5 días practicados  ${bar(Math.min(d7, 5), 5, 5)}\n\nMinutos por semana (de la más reciente a la más antigua):\n${wk.map((m, k) => `  ${k === 0 ? 'esta  ' : `-${k}     `}${bar(m, mx)}  ${m}`).join('\n')}\n\nPrácticas (✓ superada: salió en 3 días distintos):\n${marks}\n\nHabla: escalón ${u.fase2 + 1} de ${C.FASE2.length}`,
    kb: [[B('Mis hitos', 'hi'), B('Notas', 'nt')], MENU],
  };
}
const hitosScreen = (u) => ({
  text: 'Mis hitos\n\n' + C.HITOS.map(([k, name]) => {
    const h = u.hitos[k] || {};
    return `${name.padEnd(24)} ${h.estable ? `✓ primera vez ${h.primera} · estable ${h.estable}` : h.primera ? `✓ primera vez ${h.primera}` : '· todavía no'}`;
  }).join('\n') + '\n\nPrimera vez: salió una vez. Estable: sale en al menos 5 días distintos dentro de una semana. Los marcás vos.',
  kb: [...C.HITOS.reduce((rows, [k, name], i) => { if (i % 2 === 0) rows.push([]); rows[rows.length - 1].push(B(name, `hk:${k}`)); return rows; }, []), MENU],
});

const sepText = (w) => w.split(' ').map((x) => { const p = C.splitTrill(x); return p ? p.join(' · ') : x; }).join(' ');
function cardScreen(u) {
  const d = u.dose, w = d.queue[d.i];
  return { text: `Tarjeta ${d.i + 1}/${d.queue.length}\n\nDecila en voz alta. Si se traba, mirala separada.\n\n  ${d.sep ? sepText(w) : w}`, kb: [[B(d.sep ? 'Ver junta' : 'Ver separada', 'ms')], [B('Salió', 'mg:s'), B('Costó', 'mg:c'), B('No salió', 'mg:n')]] };
}

function logMinutes(u, practice, min, source) {
  u.minutes.push({ day: L.dayKey(), min, practice, source });
  return `Anotado: ${min} min. Total: ${L.fmtMin(L.totalMinutes(u))}. Racha: ${L.streak(u, L.dayKey())} días.`;
}
const rateKb = [[B('Salió', 'rt:s'), B('A medias', 'rt:m'), B('No salió', 'rt:n')]];

// ---------- enrutador ----------
function route(u, data, ctx) {
  const [a, x, y] = data.split(':');
  const today = L.dayKey();
  switch (a) {
    case 'm': return menu(u);
    case 'in': return intro(+x || 0);
    case 'how': return intro(0);
    case 'ts': return test1();
    case 't1': {
      u.testDone = true; u.fase2Start = false;
      if (x === 'x') { u.perfil = null; u.start = 1; return perfilScreen(u); }
      u.perfil = C.TEST1.a[+x][1]; u.start = 1;
      if (u.perfil === 'intermitente') return test2();
      return perfilScreen(u);
    }
    case 't2': {
      const v = C.TEST2.a[+x][1];
      if (v === 'fase2') { u.fase2Start = true; u.start = 1; u.mantAbierto = true; }
      else { u.start = v; if (v === 6) u.mantAbierto = true; }
      return perfilScreen(u);
    }
    case 'p': return L.hasHistory(u, +x) ? listPage(u, +x, 0) : theory(+x, 0);
    case 'th': return theory(+x, +y || 0);
    case 'l': return listPage(u, +x, +y);
    case 'sp': u.sinSeparar = !u.sinSeparar; return listPage(u, +x, +y);
    case 'pp': return { text: C.PREPARACION, kb: [[B('Volver a la práctica', `l:${x}:0`)], MENU] };
    case 'sn': return rutasScreen(u, +x, +y || 0);
    case 'es': return { text: C.ESCUCHA, kb: [...(COMMUNITY_URL ? [[{ t: 'Ir al grupo', url: COMMUNITY_URL }]] : []), [B('Volver a la práctica', `l:${x}:0`)], MENU] };
    case 'me': return memoryScreen(+x, +y || 0);
    case 'mm': return { text: '¿Cuántos minutos practicaste?', kb: minutesKb(+x) };
    case 'go': {
      const n = +x, p = C.PRACTICES[n - 1];
      const k = L.guidedSessions(u);
      const cue = p ? p.cues[k % p.cues.length] : null;
      const extra = n === 3 && stuck(u, 3) && u.perfil !== 'gutural' ? p.extra : null;
      u.session = { practice: n, start: Date.now(), ok: 0, ko: 0, cue, extra };
      return practicing(u);
    }
    case 'ok': case 'ko': {
      const s = u.session; if (!s) return menu(u);
      s[a]++; s.msg = null;
      if (s.ok + s.ko >= 5) {
        s.msg = s.ok >= 4 ? `${s.ok} de 5. Pasá a la línea siguiente.` : `${s.ok} de 5. Repetí la línea, más lento. Si vuelve a pasar, bajá a la anterior.`;
        s.ok = 0; s.ko = 0;
      }
      return practicing(u);
    }
    case 'f2': {
      if (x === 'u') u.fase2 = Math.min(u.fase2 + 1, C.FASE2.length - 1);
      if (x === 'd') u.fase2 = Math.max(u.fase2 - 1, 0);
      return fase2Screen(u);
    }
    case 'fr': {
      if (x === 't') { u.session = { practice: 0, start: Date.now(), ok: 0, ko: 0 }; return practicing(u); }
      if (x === 'c') return { text: '¿Cuántos minutos practicaste?', kb: minutesKb(0) };
      return { text: 'Práctica libre\n\nPara cuando practicás por tu cuenta, sin la guía. Los minutos suman igual.', kb: [[B('Empezar cronómetro', 'fr:t')], [B('Cargar minutos', 'fr:c')], MENU] };
    }
    case 'mn': {
      const n = +y || 0;
      if (x === 'o') { u.awaiting = 'minutes'; u.awaitingPractice = n; return { text: 'Escribí cuántos minutos practicaste (un número).', kb: [MENU] }; }
      return { text: logMinutes(u, n, +x, n ? 'memoria' : 'manual'), kb: [[B('Dejar nota', 'note'), B('Menú', 'm')]] };
    }
    case 'cx': u.session = null; return menu(u);
    case 'end': {
      const s = u.session;
      if (!s) return menu(u);
      const min = Math.max(1, Math.round((Date.now() - s.start) / 60000));
      u.session = null;
      if (!s.practice) return { text: logMinutes(u, 0, min, 'cronómetro'), kb: [[B('Dejar nota', 'note'), B('Menú', 'm')]] };
      u.pending = { practice: s.practice, min, ctrl: null };
      if (L.guidedSessions(u) >= 1 && s.practice <= 9) {
        return { text: `Terminaste. Fueron ${min} minutos.\n\nAntes de calificar: cuando salió mejor, ¿se sintió una vibración continua, más de un golpe?`, kb: [[B('Sí, vibró', 'ct:y'), B('No, un solo golpe', 'ct:n')], [B('No sé', 'ct:q')]] };
      }
      return { text: `Terminaste. Fueron ${min} minutos.\n\n¿Cómo te fue?`, kb: rateKb };
    }
    case 'ct': {
      if (!u.pending) return menu(u);
      u.pending.ctrl = x;
      let t = '¿Cómo te fue?';
      if (x === 'n') t = 'Un solo golpe es la R simple: el lugar es el correcto, falta la vibración. Va por buen camino.\n\n¿Cómo te fue?';
      if (x === 'q') t = 'Para salir de la duda: grabate diciendo "pero" y "perro" y escuchá si la segunda vibra. Está en "Escucha", desde la práctica 5.\n\n¿Cómo te fue?';
      return { text: t, kb: rateKb };
    }
    case 'rt': {
      const pd = u.pending; if (!pd) return menu(u);
      u.pending = null;
      const before = L.hoy(u);
      let t = logMinutes(u, pd.practice, pd.min, 'guiada');
      u.ratings.push({ practice: pd.practice, rating: x, day: today, ctrl: pd.ctrl });
      const after = L.hoy(u), kb = [];
      if (pd.practice === 10) {
        const days = new Set(); for (let i = 0; i < 7; i++) days.add(L.addDays(today, -i));
        const n = new Set(u.ratings.filter((r) => r.practice === 10 && r.rating === 's' && days.has(r.day)).map((r) => r.day)).size;
        if (n >= 5 && u.fase2 < C.FASE2.length - 1) { t += '\n\nEste escalón ya parece estable. ¿Subimos?'; kb.push([B('Subir escalón', 'f2:u'), B('Ahora no', 'm')]); }
        kb.push([B('Dejar nota', 'note'), B('Menú', 'm')]);
        return { text: t, kb };
      }
      if (after !== before) t += after ? `\n\nPasaste a la práctica ${after}: ${C.PRACTICES[after - 1].name.toLowerCase()}.` : '\n\nCompletaste las nueve prácticas. Seguí en Habla.';
      if (x === 's' && pd.ctrl !== 'n' && !u.flags.grabate) {
        u.flags.grabate = true;
        t += '\n\nPrimera vez que sale: buen momento para grabarte y escucharte. Así tenés una referencia de cómo suena cuando sale.';
      }
      if (x === 'n' && stuck(u, pd.practice)) {
        t += '\n\nLas últimas tres veces no salió. Es normal en algún momento del camino. Hay otros caminos al mismo sonido en "Si no sale", o podés volver unos minutos a la práctica anterior.';
        const row = [];
        if (pd.practice <= 4) row.push(B('Si no sale', `sn:${pd.practice}:0`));
        if (pd.practice > 1) row.push(B(`Ir a la ${pd.practice - 1}`, `p:${pd.practice - 1}`));
        if (row.length) kb.push(row);
      }
      if (!u.flags.derivacion && L.derivacion(u, today)) {
        u.flags.derivacion = true;
        t += '\n\nHace varias semanas que practicás sin que salga. A veces hay causas físicas que la práctica sola no resuelve. Una evaluación con un fonoaudiólogo puede ayudar. Podés seguir practicando igual.';
        kb.push([B('Cuándo consultar', 'cs'), B('Qué llevar', 'cq')]);
      }
      const hk = Object.keys(C.HITO_PRACTICAS).find((k) => C.HITO_PRACTICAS[k].includes(pd.practice));
      if (x === 's' && hk && !(u.hitos[hk] || {}).estable) {
        const days = new Set(); for (let i = 0; i < 7; i++) days.add(L.addDays(today, -i));
        const n = new Set(u.ratings.filter((r) => L.salioOk(r) && C.HITO_PRACTICAS[hk].includes(r.practice) && days.has(r.day)).map((r) => r.day)).size;
        if (n >= 5) { t += '\n\nParece que ya es estable. ¿Lo marcamos?'; kb.push([B('Marcar estable', `hs:${hk}:e`), B('Ahora no', 'm')]); }
      }
      kb.push([B('Dejar nota', 'note'), B('Menú', 'm')]);
      return { text: t, kb };
    }
    case 'note': u.awaiting = 'note'; return { text: 'Escribí tu nota (opcional). Por ejemplo, qué te ayudó hoy.', kb: [MENU] };
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
      if (x === 'o') u.mantAbierto = true;
      if (!u.mantAbierto && !(u.hitos.frases || {}).estable) {
        return { text: 'Mantenimiento\n\nEs para cuando la R ya sale y hay que automatizarla: repasás las palabras y frases que se traban, con intervalos que se alargan cuando salen.\n\nSe abre cuando marcás el hito "En frases" como estable. Si ya te sale y querés usarlo, abrilo ahora.', kb: [[B('Abrir igual', 'ma:o')], MENU] };
      }
      if (!u.deck) { u.deck = {}; for (const w of C.seedDeck()) u.deck[w] = { box: 0, due: today }; }
      return { text: `Mantenimiento\n\nRepaso de las palabras y frases que te cuestan. Cuando una sale, vuelve en más días (1, 2, 4, 8, 16). Cuando no sale, vuelve mañana.\n\nHoy toca: ${L.dueCards(u, today).length} tarjetas.`, kb: [[B('Empezar', 'mi'), B('Mi mazo', 'mz')], MENU] };
    }
    case 'mi': {
      const queue = L.dueCards(u, today);
      if (!queue.length) return { text: 'No hay tarjetas para hoy.', kb: [MENU] };
      u.dose = { queue, i: 0, s: 0, c: 0, n: 0, sep: false };
      return cardScreen(u);
    }
    case 'ms': if (!u.dose) return menu(u); u.dose.sep = !u.dose.sep; return cardScreen(u);
    case 'mg': {
      const d = u.dose; if (!d) return menu(u);
      L.grade(u.deck[d.queue[d.i]], x, today); d[x]++; d.i++; d.sep = false;
      if (d.i >= d.queue.length) { const t = `Listo. Salió ${d.s}, costó ${d.c}, no salió ${d.n}.`; u.dose = null; return { text: t, kb: [MENU] }; }
      return cardScreen(u);
    }
    case 'mz': return { text: `Mi mazo: ${Object.keys(u.deck || {}).length} tarjetas\n\nPodés agregar palabras o frases que se te traben en el día a día.`, kb: [[B('Agregar', 'mad'), B('Ver difíciles', 'mhd')], [B('Volver', 'ma')]] };
    case 'mad': u.awaiting = 'addword'; return { text: 'Escribí la palabra o frase que querés agregar.', kb: [MENU] };
    case 'mhd': return { text: 'Difíciles (primer escalón):\n\n' + (Object.entries(u.deck || {}).filter(([, c]) => c.box === 0).map(([w]) => w).slice(0, 40).join(', ') || 'Ninguna.'), kb: [[B('Volver', 'mz')]] };
    case 'co': return { text: 'Comunidad\n\nUn grupo de personas que están en lo mismo. Podés mandar una nota de voz para que otros te digan si la R vibra. Respetá la privacidad de los demás.' + (COMMUNITY_URL ? '' : '\n\n(Todavía no hay grupo configurado.)'), kb: [...(COMMUNITY_URL ? [[{ t: 'Entrar al grupo', url: COMMUNITY_URL }]] : []), MENU] };
    case 'cs': return { text: C.CONSULTA, kb: [[B('Qué llevar a la consulta', 'cq')], [B('Volver', 'se')]] };
    case 'cq': return consultaResumen(u);
    case 'sg': return { text: C.SEGURIDAD, kb: [[B('Volver', 'se')]] };
    case 'se': return { text: 'Ajustes', kb: [[B('Cómo funciona', 'in:0'), B('Rehacer el test', 'ts')], [B('Cuándo consultar', 'cs'), B('Qué llevar a la consulta', 'cq')], [B('Seguridad', 'sg')], [B('Exportar mis datos', 'ex'), B('Borrar mis datos', 'dl')], MENU] };
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
  if (cmd === '/ayuda') return intro(0);
  if (cmd === '/borrar') return route(u, 'dl', ctx);
  const aw = u.awaiting; u.awaiting = null;
  if (aw === 'minutes') {
    const n = parseInt(t, 10), p = u.awaitingPractice || 0;
    if (!(n >= 1 && n <= 600)) { u.awaiting = 'minutes'; return { text: 'Escribí un número de minutos entre 1 y 600.', kb: [MENU] }; }
    u.awaitingPractice = 0;
    return { text: logMinutes(u, p, n, p ? 'memoria' : 'manual'), kb: [[B('Dejar nota', 'note'), B('Menú', 'm')]] };
  }
  if (aw === 'note') { u.notes.push({ day: L.dayKey(), text: t.slice(0, 500) }); return menu(u, 'Nota guardada.\n\n'); }
  if (aw === 'addword') {
    const w = t.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
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
