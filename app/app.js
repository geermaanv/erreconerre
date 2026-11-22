(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'r-progress-v1';
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch {} };

  LESSONS.forEach((l) => { if (!l.blocks) l.blocks = [{ items: l.words }]; });
  const uniqueItems = (l) => new Set(l.blocks.flatMap((b) => b.items));
  let splitMode = true;
  try { splitMode = localStorage.getItem('r-split-v1') !== '0'; } catch {}

  let current = LESSONS[0].id;

  function renderNav() {
    const nav = $('lessons');
    nav.replaceChildren(...LESSONS.map((l) => {
      const b = document.createElement('button');
      b.textContent = l.title.split('.')[0] + '. ' + l.title.split('. ')[1].split(' (')[0];
      b.title = l.title;
      if (l.id === current) b.setAttribute('aria-current', 'true');
      b.onclick = () => { current = l.id; render(); };
      return b;
    }));
    const done = LESSONS.reduce((n, l) => n + Object.keys(progress[l.id] || {}).length, 0);
    const total = LESSONS.reduce((n, l) => n + uniqueItems(l).size, 0);
    $('total').textContent = `Logradas: ${done}/${total}`;
  }

  function speak(parts) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    [].concat(parts).forEach((t) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'es-AR'; u.rate = 0.8;
      speechSynthesis.speak(u);
    });
  }

  function renderLesson() {
    const l = LESSONS.find((x) => x.id === current);
    const sec = $('lesson');
    sec.className = 'card';
    sec.innerHTML = '';
    const h = document.createElement('h2'); h.textContent = l.title;
    const p = document.createElement('p'); p.textContent = l.intro;
    const ol = document.createElement('ol');
    l.steps.forEach((s) => { const li = document.createElement('li'); li.textContent = s; ol.append(li); });
    sec.append(h, p);
    if (l.split) {
      const lab = document.createElement('label');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = splitMode;
      cb.onchange = () => { splitMode = cb.checked; try { localStorage.setItem('r-split-v1', splitMode ? '1' : '0'); } catch {} render(); };
      lab.append(cb, 'Separar la doble R (ar · roz)');
      sec.append(lab);
    }
    sec.append(ol);
    l.blocks.forEach((b) => {
      if (b.title) { const h3 = document.createElement('h3'); h3.textContent = b.title; sec.append(h3); }
      const ul = document.createElement('ul'); ul.className = 'words' + (l.long ? ' texts' : '');
      [...new Set(b.items)].forEach((w) => {
        const parts = l.split && splitMode && !/\s/.test(w) ? Split.splitTrill(w) : null;
        const li = document.createElement('li');
        li.className = 'word' + (progress[l.id]?.[w] ? ' ok' : '');
        const say = document.createElement('button');
        say.textContent = (l.noTts ? '' : '🔊 ') + (parts ? parts.join(' · ') : w);
        if (l.long) say.className = 'long';
        if (l.noTts) { say.disabled = true; say.className = 'static'; }
        else { say.title = 'Escuchar modelo'; say.onclick = () => speak(parts ? [...parts, w] : w); }
        const done = document.createElement('button'); done.className = 'done';
        done.textContent = progress[l.id]?.[w] ? '✓' : '○'; done.title = 'Marcar como lograda';
        done.onclick = () => {
          progress[l.id] = progress[l.id] || {};
          if (progress[l.id][w]) delete progress[l.id][w]; else progress[l.id][w] = true;
          save(); render();
        };
        li.append(say, done); ul.append(li);
      });
      sec.append(ul);
    });
    $('recorder').hidden = false;
    $('trillBox').hidden = !l.trill;
  }

  function render() { renderNav(); renderLesson(); }

  // ---- Micrófono ----
  let ctx, analyser, stream, buf, raf, rec, chunks = [], lastBlobUrl, trillStart = 0, bestTrill = 0;
  const THRESH = 0.2, GATE = 0.01;

  function loop() {
    analyser.getFloatTimeDomainData(buf);
    const r = Dsp.analyze(buf, ctx.sampleRate);
    $('level').value = Math.min(1, r.level * 4);
    const trillBox = !$('trillBox').hidden;
    if (trillBox) {
      const active = r.level > GATE && r.index > THRESH;
      $('trill').value = active ? Math.min(1, r.index) : 0;
      const now = performance.now();
      if (active) {
        if (!trillStart) trillStart = now;
        const d = (now - trillStart) / 1000;
        bestTrill = Math.max(bestTrill, d);
        $('trillStatus').textContent = `Vibración ~${r.freq.toFixed(0)} Hz, ${d.toFixed(1)} s (mejor: ${bestTrill.toFixed(1)} s)`;
      } else {
        trillStart = 0;
        $('trillStatus').textContent = bestTrill ? `Mejor racha: ${bestTrill.toFixed(1)} s` : 'Sin vibración detectada';
      }
    }
    raf = requestAnimationFrame(loop);
  }

  async function micOn() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (e) { $('micMsg').textContent = 'No se pudo acceder al micrófono: ' + e.message; return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = ctx.createAnalyser(); analyser.fftSize = 32768;
    buf = new Float32Array(analyser.fftSize);
    ctx.createMediaStreamSource(stream).connect(analyser);
    bestTrill = 0; trillStart = 0;
    $('micBtn').textContent = 'Desactivar micrófono';
    $('recBtn').disabled = false;
    $('micMsg').textContent = 'El detector de vibración es una heurística aproximada; usá también el oído.';
    loop();
  }

  function micOff() {
    cancelAnimationFrame(raf);
    if (rec && rec.state === 'recording') rec.stop();
    stream?.getTracks().forEach((t) => t.stop());
    ctx?.close();
    $('micBtn').textContent = 'Activar micrófono';
    $('recBtn').disabled = true;
    $('level').value = 0; $('trill').value = 0;
    ctx = null;
  }

  $('micBtn').onclick = () => (ctx ? micOff() : micOn());

  $('recBtn').onclick = () => {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    chunks = [];
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
      lastBlobUrl = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
      $('playBtn').disabled = false;
      $('recBtn').textContent = 'Grabar'; $('recBtn').classList.remove('rec');
    };
    rec.start();
    $('recBtn').textContent = 'Detener'; $('recBtn').classList.add('rec');
  };

  $('playBtn').onclick = () => { if (lastBlobUrl) new Audio(lastBlobUrl).play(); };

  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
