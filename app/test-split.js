const Split = require('./split.js');
global.window = undefined;
const fs = require('fs');
const src = fs.readFileSync('lessons.js', 'utf8') + '\nmodule.exports = LESSONS;';
fs.writeFileSync('/tmp/_l.js', src);
const L = require('/tmp/_l.js');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const t = [['arroz', ['ar','roz']], ['enredar', ['en','redar']], ['Israel', ['Is','rael']], ['alrededor', ['al','rededor']], ['desrabe', ['des','rabe']], ['Honra', ['Hon','ra']], ['carro', ['car','ro']], ['rama', null], ['tres', null]];
let ok = true;
for (const [w, e] of t) { const r = Split.splitTrill(w); if (!eq(r, e)) { ok = false; console.log('FALLO', w, r); } }
const pal = L.find((l) => l.id === 'palabras');
const none = [...new Set(pal.blocks.flatMap((b) => b.items))].filter((w) => !Split.splitTrill(w));
console.log('sin separación (R inicial u otras):', none.join(', '));
console.log('bloques:', L.map((l) => l.id + ':' + (l.blocks ? l.blocks.length : 1)).join(' '));
console.log(ok ? 'OK' : 'FALLO'); process.exit(ok ? 0 : 1);
