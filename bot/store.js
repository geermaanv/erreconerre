const fs = require('fs');
const path = require('path');
const FILE = process.env.BOT_DATA || path.join(__dirname, 'data', 'state.json');
let db = {};
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE);
}
module.exports = { all: () => db, get: (id) => db[id], set: (id, u) => { db[id] = u; save(); }, del: (id) => { delete db[id]; save(); }, save };
