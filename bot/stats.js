// Estadísticas agregadas del bot, sin datos personales.
// Uso: node bot/stats.js   (o BOT_DATA=/ruta/state.json node bot/stats.js)
// Cuenta personas por origen (t.me/mesalio_la_r_bot?start=<origen>) y cuántas siguen activas.
// No imprime ids de chat, notas ni palabras: solo números.
const fs = require('fs');
const path = require('path');
const FILE = process.env.BOT_DATA || path.join(__dirname, 'data', 'state.json');
const L = require('./logic.js');

let db = {};
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { console.log('Todavía no hay datos.'); process.exit(0); }

const users = Object.values(db);
const today = L.dayKey();
const rows = {};
const row = (k) => (rows[k] = rows[k] || { llegaron: 0, test: 0, practicaron: 0, tresDias: 0, activos7: 0 });

for (const u of users) {
  const r = row(u.source || 'sin dato');
  const days = new Set((u.minutes || []).map((e) => e.day));
  r.llegaron++;
  if (u.testDone) r.test++;
  if (days.size >= 1) r.practicaron++;
  if (days.size >= 3) r.tresDias++;
  if (L.daysInLast7(u, today) >= 1) r.activos7++;
}

console.log(`Personas en total: ${users.length}\n`);
console.log('origen'.padEnd(14), 'llegaron  hicieron test  practicaron  3+ días  activos 7 d');
for (const [k, r] of Object.entries(rows).sort((a, b) => b[1].llegaron - a[1].llegaron)) {
  console.log(k.padEnd(14), String(r.llegaron).padEnd(9), String(r.test).padEnd(14), String(r.practicaron).padEnd(12), String(r.tresDias).padEnd(8), r.activos7);
}
