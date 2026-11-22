const TZ = process.env.BOT_TZ || 'America/Argentina/Buenos_Aires';
const INTERVALOS = [1, 2, 4, 8, 16];

const dayKey = (ts = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(ts);
function addDays(key, n) { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function fmtMin(total) { const h = Math.floor(total / 60), m = total % 60; return h ? `${h} h ${m} min` : `${m} min`; }

const newUser = () => ({
  start: 1, testDone: false, minutes: [], ratings: [], hitos: {}, notes: [],
  deck: null, dose: null, sinSeparar: false, session: null, pending: null, awaiting: null,
});

const totalMinutes = (u) => u.minutes.reduce((s, e) => s + e.min, 0);
const practiceDays = (u) => new Set(u.minutes.map((e) => e.day));

function streak(u, today) {
  const days = practiceDays(u);
  let d = days.has(today) ? today : addDays(today, -1), n = 0;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
const daysInLast7 = (u, today) => {
  const days = practiceDays(u); let n = 0;
  for (let i = 0; i < 7; i++) if (days.has(addDays(today, -i))) n++;
  return n;
};
const minutesInWindow = (u, today, from, to) => {
  const lo = addDays(today, -to), hi = addDays(today, -from);
  return u.minutes.filter((e) => e.day >= lo && e.day <= hi).reduce((s, e) => s + e.min, 0);
};

// Una práctica se supera con "Salió" en 3 días distintos.
const salioDays = (u, p) => new Set(u.ratings.filter((r) => r.practice === p && r.rating === 's').map((r) => r.day));
const superada = (u, p) => salioDays(u, p).size >= 3;
function hoy(u) {
  for (let p = u.start; p <= 9; p++) if (!superada(u, p)) return p;
  return null;
}
const lastRatings = (u, p, n) => u.ratings.filter((r) => r.practice === p).slice(-n).map((r) => r.rating);
const hasHistory = (u, p) => u.ratings.some((r) => r.practice === p) || u.minutes.some((e) => e.practice === p);

// Mantenimiento: escalera de intervalos 1, 2, 4, 8, 16 días.
function dueCards(u, today, max = 7) {
  if (!u.deck) return [];
  return Object.entries(u.deck).filter(([, c]) => c.due <= today).sort((a, b) => a[1].due.localeCompare(b[1].due)).slice(0, max).map(([w]) => w);
}
function grade(card, g, today) {
  if (g === 's') card.box = Math.min(card.box + 1, INTERVALOS.length - 1);
  else if (g === 'n') card.box = 0;
  card.due = addDays(today, INTERVALOS[card.box]);
}

module.exports = { dayKey, addDays, fmtMin, newUser, totalMinutes, streak, daysInLast7, minutesInWindow, salioDays, superada, hoy, lastRatings, hasHistory, dueCards, grade, INTERVALOS };
