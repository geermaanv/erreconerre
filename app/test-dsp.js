const Dsp = require('./dsp.js');
const sr = 48000, n = 32768;
function gen(modHz, depth, pitch = 140, noise = 0.02) {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = 1 - depth * (0.5 + 0.5 * Math.sin(2 * Math.PI * modHz * t));
    b[i] = 0.3 * env * Math.sin(2 * Math.PI * pitch * t) + noise * (Math.random() - 0.5);
  }
  return b;
}
const cases = [
  ['sostenida (sin vibración)', gen(0, 0)],
  ['trino 25 Hz profundo', gen(25, 0.8)],
  ['trino 30 Hz medio', gen(30, 0.5)],
  ['sílabas 5 Hz', gen(5, 0.8)],
  ['silencio', new Float32Array(n)],
];
let ok = true;
for (const [name, buf] of cases) {
  const r = Dsp.analyze(buf, sr);
  console.log(name.padEnd(28), 'idx=' + r.index.toFixed(2), 'f=' + r.freq, 'lvl=' + r.level.toFixed(3));
}
const a = Dsp.analyze(cases[0][1], sr), b = Dsp.analyze(cases[1][1], sr), c = Dsp.analyze(cases[3][1], sr);
ok = a.index < 0.15 && b.index > 0.3 && Math.abs(b.freq - 25) <= 1 && c.index < 0.15;
console.log(ok ? 'OK' : 'FALLO'); process.exit(ok ? 0 : 1);
