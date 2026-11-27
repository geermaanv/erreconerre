// Bot de Telegram (prototipo). Sin dependencias. Token por variable de entorno TELEGRAM_BOT_TOKEN.
// Dos circuitos: "Aprender" (nueve prácticas) y "Mantener" (repaso de palabras y uso al hablar).
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
const dots = (n, max) => '●'.repeat(Math.min(n, max)) + '○'.repeat(Math.max(max - n, 0));
const practiceName = (n) => C.PRACTICES[n - 1].name;

const modeScreen = (prefix = '') => ({ text: prefix + C.MODO.q, kb: [[B(C.MODO.aprender, 'mo:a')], [B(C.MODO.mantener, 'mo:m')]] });
const welcome = () => modeScreen('Hola, soy Germán. Aprendí la R múltiple (la de "perro") a los 42 años y armé este entrenamiento para adultos.\n\nNo reemplaza a un fonoaudiólogo. Guardo tus minutos y avances; los podés borrar cuando quieras.\n\n');

function intro(i) {
  const t = C.INTRO.length; i = clamp(i, t);
  const nav = [];
  if (i > 0) nav.push(B('◀ Anterior', `in:${i - 1}`));
  if (i < t - 1) nav.push(B('Siguiente ▶', `in:${i + 1}`));
  return { text: C.INTRO[i], kb: [nav, HOME] };
}

const partidaScreen = () => ({ text: C.PARTIDA.q, kb: C.PARTIDA.a.map(([t, v]) => [B(t, `pf:${v}`)]) });
function perfilScreen(u) {
  const pf = C.PERFILES[u.perfil], h = L.hoy(u) || 1;
  return { text: `${pf.name}\n\n${pf.texto}\n\nEmpezás por la práctica ${h} · ${practiceName(h)}.`, kb: [[B('▶ Practicar', `ej:${h}`)], [B('Ir al inicio', 'm')]] };
}

function daysAway(u, today) {
  const days = [...L.practiceDays(u)].sort();
  return days.length ? Math.round((Date.parse(today) - Date.parse(days[days.length - 1])) / 86400000) : 0;
}
function statusLine(u) {
  const today = L.dayKey(), gap = daysAway(u, today);
  let t = `Llevás ${L.fmtMin(L.totalMinutes(u))}.`;
  if (gap >= 3) t += ` Hace ${gap} días que no practicás.`;
  if (!L.practiceDays(u).has(today)) t += ' Cinco minutos alcanzan.';
  return t;
}
const bottomRow = () => [B('Mi avance', 'pr'), B('Más', 'mas')];

function learnHome(u, prefix) {
  const h = L.hoy(u);
  if (!h) {
    return { text: `${prefix}🟢 Aprender\n\nCompletaste las nueve prácticas. Podés pasar a Mantener o repetir la que quieras.\n\n${statusLine(u)}`, kb: [[B('Pasar a Mantener', 'mo:m')], [B('Elegir una práctica', 'el')], bottomRow()] };
  }
  return {
    text: `${prefix}🟢 Aprender\n\nPráctica ${h} de 9 · ${practiceName(h)}\nObjetivo: ${C.PRACTICES[h - 1].objetivo}\n\n${statusLine(u)}`,
    kb: [[B('▶ Practicar', `ej:${h}`)], [B('Practicar sin mirar el teléfono', `me:${h}:0`)], bottomRow()],
  };
}

const ensureDeck = (u) => { if (!u.deck) u.deck = {}; if (!u.flags.mazo) { u.flags.mazo = true; const today = L.dayKey(); for (const w of C.seedDeck()) u.deck[w] = u.deck[w] || { box: 0, due: today }; } };
function keepHome(u, prefix) {
  ensureDeck(u);
  const n = L.dueCards(u, L.dayKey()).length;
  return {
    text: `${prefix}🔵 Mantener\n\n${n ? `Hoy tenés ${n} ${n === 1 ? 'palabra' : 'palabras'} para repasar.` : 'Hoy no quedan palabras para repasar.'}\n\n${statusLine(u)}`,
    kb: [...(n ? [[B('▶ Repasar palabras', 'mi')]] : []), [B('Usarla al hablar', 'hb')], [B('Agregar una palabra que se me traba', 'mad')], bottomRow()],
  };
}

function menu(u, prefix = '') {
  if (u.mode === 'aprender') return learnHome(u, prefix);
  if (u.mode === 'mantener') return keepHome(u, prefix);
  return modeScreen(prefix || (u.testDone ? 'Cambié el menú para que sea más simple.\n\n' : ''));
}

// ---------- ejercicio ----------
const stuck = (u, n) => L.lastRatings(u, n, 3).join('') === 'nnn';

// open = false: el mismo ejercicio, ya cerrado (sin botones), para que quede a la vista.
function exerciseScreen(n, i, s, open = true) {
  const pages = C.pagesFor(n), t = pages.length;
  i = clamp(i, t);
  const text = [`Práctica ${n} · ${practiceName(n)}${t > 1 ? `  (${i + 1}/${t})` : ''}`, s && s.cue, s && s.extra, pages[i],
    open ? 'Una línea, varias veces, lento. Cuando termines, tocá Terminé.' : null].filter(Boolean).join('\n\n');
  if (!open) return { text, kb: [] };
  const kb = [];
  if (t > 1) kb.push([B('◀', `pg:${n}:${Math.max(0, i - 1)}`), B(`${i + 1}/${t}`, `pg:${n}:${i}`), B('▶', `pg:${n}:${Math.min(t - 1, i + 1)}`)]);
  kb.push([B('Terminé', `fin:${n}`)], [B('Cómo se hace', `th:${n}`), B('No me sale', `ns:${n}`)]);
  return { text, kb };
}

const theoryText = (n) => `Cómo se hace · Práctica ${n}\n\n${C.PRACTICES[n - 1].teoria.join('\n\n')}`;

function startExercise(u, n) {
  const p = C.PRACTICES[n - 1];
  if (!p) return menu(u);
  const cue = p.cues[L.guidedSessions(u) % p.cues.length];
  const extra = n === 3 && stuck(u, 3) && u.perfil !== 'gutural' ? p.extra : null;
  const firstTime = !u.flags[`th${n}`] && !L.hasHistory(u, n);
  u.flags[`th${n}`] = true;
  u.pending = null;
  u.session = { practice: n, start: Date.now(), page: 0, cue, extra };
  const ex = exerciseScreen(n, 0, u.session);
  return firstTime ? [{ text: theoryText(n), kb: [] }, fresh(ex)] : ex;
}

function helpScreen(u, n, i) {
  if (n >= 5) return { text: C.AYUDA_PALABRAS, kb: [[B(`Ir a la práctica ${n - 1}`, `ej:${n - 1}`)]] };
  const order = (C.PERFILES[u.perfil] || C.PERFILES.simple).rutas, t = order.length;
  i = clamp(i, t);
  const r = C.RUTAS[order[i]];
  if (!u.rutas.includes(r.n)) u.rutas.push(r.n);
  const nav = [];
  if (i > 0) nav.push(B('◀ Anterior', `ns:${n}:${i - 1}`));
  if (i < t - 1) nav.push(B('Otro camino ▶', `ns:${n}:${i + 1}`));
  return { text: `No me sale  (${i + 1}/${t})\n\nSon caminos distintos al mismo sonido. Probá uno varios días; si no funciona, pasá al siguiente.\n\n${r.name}\n\n${r.texto}`, kb: [nav] };
}

// ---------- usarla al hablar (Mantener) ----------
function speakScreen(u, open = true) {
  const [name, txt] = C.FASE2[u.fase2];
  return {
    text: `Usarla al hablar · Paso ${u.fase2 + 1} de ${C.FASE2.length}: ${name}\n\n${txt}`,
    kb: open ? [[B('Terminé', 'fin:10')], HOME] : [],
  };
}

// ---------- final de una sesión: una sola pregunta ----------
function finish(u, n) {
  const s = u.session;
  if (!s || s.practice !== n) return fresh(menu(u, 'Ese ejercicio ya estaba cerrado.\n\n'));
  const min = L.elapsedMin(s.start);
  u.session = null;
  u.minutes.push({ day: L.dayKey(), min, practice: n, source: 'guiada' });
  u.pending = { practice: n };
  const speak = n === 10;
  return [
    speak ? speakScreen(u, false) : exerciseScreen(n, s.page || 0, s, false),
    fresh({
      text: `${min} min anotados. ${speak ? '¿Cómo te fue?' : '¿La R vibró? (más de un golpe seguido)'}`,
      kb: [speak ? [B('Sin trabas', 'r:s'), B('Se trabó', 'r:n')] : [B('Sí, vibró', 'r:s'), B('Todavía no', 'r:n')]],
    }),
  ];
}

const lastWeek = (today) => { const d = new Set(); for (let i = 0; i < 7; i++) d.add(L.addDays(today, -i)); return d; };

function answerSpeak(u, x, today) {
  u.ratings.push({ practice: 10, rating: x, day: today, step: u.fase2 });
  const here = u.ratings.filter((r) => r.practice === 10 && r.step === u.fase2);
  const week = lastWeek(today);
  const good = new Set(here.filter((r) => r.rating === 's' && week.has(r.day)).map((r) => r.day)).size;
  const kb = [];
  let t = x === 's' ? 'Muy bien. Queda anotado.' : 'Anotado. Si alguna palabra se trabó, agregala para repasarla.';
  if (x === 'n') kb.push([B('Agregar palabra', 'mad')]);
  if (x === 's' && good >= 5 && u.fase2 < C.FASE2.length - 1) { t += '\n\nEste paso ya parece estable.'; kb.push([B('Pasar al siguiente paso', 'hb:u')]); }
  if (u.fase2 > 0 && here.slice(-3).map((r) => r.rating).join('') === 'nnn') { t += '\n\nSe trabó las últimas tres veces. Podés volver al paso anterior.'; kb.push([B('Volver al paso anterior', 'hb:d')]); }
  kb.push([B('Listo', 'm')]);
  return { text: t, kb };
}

function answer(u, x) {
  const pd = u.pending;
  if (!pd) return menu(u);
  u.pending = null;
  x = x === 's' ? 's' : 'n';
  const today = L.dayKey(), n = pd.practice;
  if (n === 10) return answerSpeak(u, x, today);

  const before = L.hoy(u), was = L.superada(u, n);
  u.ratings.push({ practice: n, rating: x, day: today });
  const after = L.hoy(u), kb = [];
  let t;
  if (x === 's') {
    if (!was && L.superada(u, n)) {
      t = `¡Superaste la práctica ${n}!`;
      if (after && after !== before) t += ` Ahora sigue la ${after} · ${practiceName(after)}.`;
      if (!after) { t += ' Completaste las nueve.\n\n¿Pasás a Mantener, para que la R no se te trabe?'; kb.push([B('Pasar a Mantener', 'mo:m')]); }
    } else if (was) t = 'Bien. Esta práctica ya la tenías superada.';
    else t = `Bien. Práctica ${n}, días en los que vibró: ${L.salioDays(u, n).size} de 3.`;
    if (!u.flags.grabate) {
      u.flags.grabate = true;
      t += '\n\nPrimera vez que vibra: buen momento para grabarte. Así tenés una referencia de cómo suena cuando sale.';
    }
  } else {
    t = 'Anotado. Cada intento suma.';
    if (stuck(u, n)) {
      t += '\n\nLas últimas tres veces no vibró. Es normal en algún momento del camino. Probá otra forma de llegar al sonido, o volvé unos minutos a la práctica anterior.';
      const row = [B('No me sale', `ns:${n}`)];
      if (n > 1) row.push(B(`Ir a la ${n - 1}`, `ej:${n - 1}`));
      kb.push(row);
    }
  }
  if (!u.flags.derivacion && L.derivacion(u, today)) {
    u.flags.derivacion = true;
    t += '\n\nHace varias semanas que practicás sin que salga. A veces hay causas físicas que la práctica sola no resuelve. Una evaluación con un fonoaudiólogo puede ayudar. Podés seguir practicando igual.';
    kb.push([B('Cuándo consultar', 'cs')]);
  }
  kb.push([B('Listo', 'm')]);
  return { text: t, kb };
}

// ---------- sin mirar el teléfono ----------
function memoryScreen(n, i) {
  const t = C.pagesFor(n).length; i = clamp(i, t);
  return {
    text: `Sin mirar el teléfono · Práctica ${n}\n\nMemorizá estas líneas y practicalas donde sea: caminando, en el auto. Después cargás los minutos.\n\n${C.memoryLines(n, i).join('\n')}\n\nSi estás manejando, la vista en el camino. No toques el teléfono hasta llegar.`,
    kb: [[B('Cargar minutos', `mm:${n}`)], ...(t > 1 ? [[B('Otras líneas', `me:${n}:${(i + 1) % t}`)]] : []), HOME],
  };
}
const minutesKb = (n) => [[5, 10, 20, 30].map((m) => B(String(m), `mn:${m}:${n}`)).concat([B('Otro', `mn:o:${n}`)]), HOME];
function logMinutes(u, practice, min, source) {
  u.minutes.push({ day: L.dayKey(), min, practice, source });
  return { text: `Anotado: ${min} min. Total: ${L.fmtMin(L.totalMinutes(u))}. Racha: ${L.streak(u, L.dayKey())} días.`, kb: [[B('Listo', 'm')]] };
}

// ---------- repaso de palabras (Mantener) ----------
// Una palabra: separada → unida. Una frase: entera y, abajo, las palabras que llevan la R que vibra.
function showCard(w) {
  if (!w.includes(' ')) return C.wordSteps(w);
  const hard = w.split(' ').filter((x) => C.splitTrill(x)).map(C.wordSteps);
  return [w, ...(hard.length ? ['', ...hard] : [])].join('\n');
}
function cardScreen(u) {
  const d = u.dose;
  return { text: `Palabra ${d.i + 1} de ${d.queue.length}\n\nDecila en voz alta.\n\n${showCard(d.queue[d.i])}`, kb: [[B('Bien', 'mg:s'), B('Se trabó', 'mg:n')]] };
}

// ---------- avance y Más ----------
function progress(u) {
  const today = L.dayKey(), d7 = L.daysInLast7(u, today);
  let t = `Mi avance\n\n⏱ Total: ${L.fmtMin(L.totalMinutes(u))}\n🔥 Racha: ${L.streak(u, today)} días\n📅 Últimos 7 días: ${d7} de 5 practicados\n${dots(d7, 5)}`;
  if (u.mode === 'mantener') {
    const cards = Object.values(u.deck || {});
    t += `\n\nPalabras en tu repaso: ${cards.length}\nFirmes: ${cards.filter((c) => c.box >= 3).length}\n\nUsarla al hablar: paso ${u.fase2 + 1} de ${C.FASE2.length}`;
    return { text: t, kb: [HOME] };
  }
  const h = L.hoy(u);
  const mark = (p) => `${L.superada(u, p.n) ? '✅' : p.n === h ? '▶️' : '⚪'}${p.n}`;
  t += `\n\nPrácticas\n${[C.PRACTICES.slice(0, 5), C.PRACTICES.slice(5)].map((r) => r.map(mark).join('   ')).join('\n')}\n✅ superada: vibró en 3 días distintos`;
  return { text: t, kb: [[B('Elegir otra práctica', 'el')], HOME] };
}
const chooseScreen = () => ({ text: 'Elegí una práctica. Todas están abiertas.', kb: [...C.PRACTICES.map((p) => [B(`${p.n} · ${p.name}`, `ej:${p.n}`)]), HOME] });

const moreScreen = (u) => ({
  text: 'Más',
  kb: [[u.mode === 'mantener' ? B('Cambiar a Aprender', 'mo:a') : B('Cambiar a Mantener', 'mo:m')], [B('Recordatorio', 'rm')], [B('Cómo funciona', 'in:0')],
    [B('Consultar a un fonoaudiólogo', 'cs')], [B('Mis datos', 'md')], HOME],
});

function consultaResumen(u) {
  const pf = C.PERFILES[u.perfil];
  const days = u.minutes.map((e) => e.day).sort();
  const weeks = days.length ? Math.max(1, Math.round((Date.parse(L.dayKey()) - Date.parse(days[0])) / (7 * 86400000))) : 0;
  const per = [1, 2, 3].map((p) => { const r = u.ratings.filter((x) => x.practice === p); return `  práctica ${p}: ${r.length} sesiones, vibró en ${r.filter(L.salioOk).length}`; }).join('\n');
  const rutas = u.rutas.length ? u.rutas.map((n) => C.RUTAS[n].name.split(' · ')[1]).join(', ') : 'ninguna';
  return {
    text: `Qué llevar a la consulta\n\nCopiá esto o mostralo en el teléfono:\n\n· Qué pasa con la R: ${pf ? pf.name : 'sin indicar'}\n· Práctica: ${L.fmtMin(L.totalMinutes(u))} en ${weeks} semanas\n${per}\n· Rutas alternativas probadas: ${rutas}\n\nAgregá vos:\n· desde cuándo te pasa\n· si tuviste fisura de paladar, problemas de audición u ortodoncia\n· si alguien en tu familia tiene la misma dificultad`,
    kb: [[B('Volver', 'mas')]],
  };
}

// ---------- recordatorios ----------
const hh = (h) => String(h).padStart(2, '0') + ':00';
function reminderScreen(u, justSet) {
  const r = u.rem, on = r && r.on;
  const text = on
    ? `Recordatorio diario\n\nActivado a las ${hh(r.hour)}.${justSet ? ' Empieza mañana.' : ''} Te escribo una vez por día, solo si todavía no practicaste. Si pasan 5 días sin que practiques, lo pauso solo.\n\nPodés cambiar la hora o apagarlo.`
    : 'Recordatorio diario\n\nEstá apagado. Si lo activás, te escribo una vez por día a la hora que elijas, solo si todavía no practicaste. Empieza mañana.\n\nElegí la hora:';
  const hours = [8, 12, 18, 20, 21].map((h) => B((on && r.hour === h ? '✓ ' : '') + hh(h), `rm:h:${h}`));
  return { text, kb: [hours.slice(0, 3), hours.slice(3), ...(on ? [[B('Apagar', 'rm:off')]] : []), [B('Volver', 'mas')]] };
}

function reminderText(u) {
  let what = 'Entrá y elegí cómo seguir.', button = B('Empezar', 'm');
  const h = L.hoy(u);
  if (u.mode === 'mantener') what = 'Hoy podés repasar tus palabras o usar la R al hablar.';
  else if (u.mode === 'aprender' && h) { what = `Hoy: práctica ${h} · ${practiceName(h)}.\nObjetivo: ${C.PRACTICES[h - 1].objetivo}`; button = B('▶ Practicar', `ej:${h}`); }
  return { text: `Es la hora de tu práctica.\n\n${what}\n\nCinco minutos alcanzan.`, kb: [[button], [B('Pausar recordatorios', 'rm:off')]] };
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
      await api.send(chat, { text: 'Pausé los recordatorios porque pasaron varios días sin practicar. Cuando quieras, los volvés a activar en "Más". Sin apuro.', kb: [[B('Ir al inicio', 'm')]] }).catch(() => {});
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
      if (u.mode === 'aprender' && !u.perfil) return partidaScreen();
      return menu(u);
    }
    case 'pf': {
      if (!C.PARTIDA.a.some(([, v]) => v === x)) return menu(u);
      u.perfil = x; u.mode = 'aprender'; u.testDone = true;
      return perfilScreen(u);
    }
    case 'in': return intro(+x || 0);
    case 'ej': return startExercise(u, +x);
    case 'pg': {
      const s = u.session && u.session.practice === +x ? u.session : null;
      if (s) s.page = +y || 0;
      return exerciseScreen(+x, +y || 0, s);
    }
    // Ayuda del ejercicio: la primera respuesta va en un mensaje aparte, para no tapar la lista.
    case 'th': return fresh({ text: theoryText(+x), kb: [] });
    case 'ns': return y === undefined ? fresh(helpScreen(u, +x, 0)) : helpScreen(u, +x, +y);
    case 'fin': return finish(u, +x);
    case 'r': return answer(u, x);
    case 'me': return memoryScreen(+x, +y || 0);
    case 'mm': return { text: '¿Cuántos minutos practicaste?', kb: minutesKb(+x) };
    case 'mn': {
      const n = +y || 0;
      if (x === 'o') { u.awaiting = 'minutes'; u.awaitingPractice = n; return { text: 'Escribí cuántos minutos practicaste (un número).', kb: [HOME] }; }
      return logMinutes(u, n, +x, 'memoria');
    }
    case 'hb': {
      if (x === 'u') u.fase2 = Math.min(u.fase2 + 1, C.FASE2.length - 1);
      if (x === 'd') u.fase2 = Math.max(u.fase2 - 1, 0);
      u.pending = null;
      u.session = { practice: 10, start: Date.now() };
      return speakScreen(u);
    }
    case 'mi': {
      ensureDeck(u);
      const queue = L.dueCards(u, today);
      if (!queue.length) return menu(u);
      u.dose = { queue, i: 0, s: 0, n: 0, start: Date.now() };
      return cardScreen(u);
    }
    case 'mg': {
      const d = u.dose; if (!d) return menu(u);
      const g = x === 's' ? 's' : 'n';
      if (u.deck[d.queue[d.i]]) L.grade(u.deck[d.queue[d.i]], g, today);
      d[g] = (d[g] || 0) + 1; d.i++;
      if (d.i < d.queue.length) return cardScreen(u);
      u.dose = null;
      u.minutes.push({ day: today, min: L.elapsedMin(d.start || Date.now()), practice: 11, source: 'repaso' });
      return { text: `Listo: ${d.i} ${d.i === 1 ? 'palabra' : 'palabras'}. Bien: ${d.s || 0}. Se trabaron: ${d.n || 0}.${d.n ? '\n\nLas que se trabaron vuelven mañana.' : ''}`, kb: [[B('Listo', 'm')]] };
    }
    case 'mad': u.awaiting = 'addword'; return { text: 'Escribí la palabra o frase que se te traba.', kb: [HOME] };
    case 'pr': return progress(u);
    case 'el': return chooseScreen();
    case 'mas': case 'se': return moreScreen(u);
    case 'cs': return { text: C.CONSULTA, kb: [[B('Qué llevar a la consulta', 'cq')], [B('Volver', 'mas')]] };
    case 'cq': return consultaResumen(u);
    case 'rm': {
      if (x === 'h' && [8, 12, 18, 20, 21].includes(+y)) u.rem = { ...u.rem, on: true, hour: +y, last: today, ignored: 0 };
      if (x === 'off') u.rem = { ...u.rem, on: false, ignored: 0 };
      return reminderScreen(u, x === 'h' && u.rem.on);
    }
    case 'md': return { text: 'Mis datos\n\nGuardo tus minutos, tus avances y las palabras que agregás.', kb: [[B('Exportar', 'ex'), B('Borrar', 'dl')], [B('Volver', 'mas')]] };
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
  if (cmd === '/ayuda') { u.awaiting = null; return intro(0); }
  if (cmd === '/borrar') { u.awaiting = null; return route(u, 'dl', ctx); }
  const aw = u.awaiting; u.awaiting = null;
  if (aw === 'minutes') {
    const n = parseInt(t, 10), p = u.awaitingPractice || 0;
    if (!(n >= 1 && n <= 600)) { u.awaiting = 'minutes'; return { text: 'Escribí un número de minutos entre 1 y 600.', kb: [HOME] }; }
    u.awaitingPractice = 0;
    return logMinutes(u, p, n, 'memoria');
  }
  if (aw === 'addword') {
    const w = t.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
    ensureDeck(u);
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
  await tg('setMyCommands', { commands: [{ command: 'menu', description: 'Inicio' }, { command: 'ayuda', description: 'Cómo funciona' }, { command: 'borrar', description: 'Borrar mis datos' }] }).catch(() => {});
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
