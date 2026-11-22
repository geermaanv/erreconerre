// Detección heurística de vibración (trino) por modulación de amplitud.
// Una R múltiple produce interrupciones periódicas de la señal a ~15-35 Hz.
const Dsp = (() => {
  const BAND_MIN = 20, BAND_MAX = 40, STEP = 0.5;

  function rms(buf, start, end) {
    let s = 0;
    for (let i = start; i < end; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / Math.max(1, end - start));
  }

  // Devuelve { level, index, freq }: nivel RMS global, profundidad de modulación
  // (amplitud del componente / media de la envolvente) y frecuencia del pico.
  function analyze(buf, sampleRate, seconds = 0.6) {
    const n = Math.min(buf.length, Math.floor(sampleRate * seconds));
    const x0 = buf.length - n;
    const level = rms(buf, x0, buf.length);
    const win = Math.round(sampleRate * 0.01);
    const hop = Math.round(sampleRate * 0.005);
    const env = [];
    for (let s = x0; s + win <= buf.length; s += hop) env.push(rms(buf, s, s + win));
    const N = env.length;
    if (N < 16) return { level, index: 0, freq: 0 };
    const rate = sampleRate / hop;
    let mean = 0;
    for (const v of env) mean += v;
    mean /= N;
    if (mean === 0) return { level, index: 0, freq: 0 };
    const w = new Float64Array(N);
    let wsum = 0;
    for (let i = 0; i < N; i++) {
      w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
      wsum += w[i];
    }
    let best = 0, bestF = 0;
    for (let f = BAND_MIN; f <= BAND_MAX; f += STEP) {
      let re = 0, im = 0;
      const k = (2 * Math.PI * f) / rate;
      for (let i = 0; i < N; i++) {
        const v = (env[i] - mean) * w[i];
        re += v * Math.cos(k * i);
        im -= v * Math.sin(k * i);
      }
      const amp = (2 * Math.hypot(re, im)) / wsum / mean;
      if (amp > best) { best = amp; bestF = f; }
    }
    return { level, index: best, freq: bestF };
  }

  return { analyze, BAND_MIN, BAND_MAX };
})();
if (typeof module !== 'undefined') module.exports = Dsp;
