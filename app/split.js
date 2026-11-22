// Separa una palabra justo antes de la R que vibra: "arroz" -> ["ar","roz"],
// "enredar" -> ["en","redar"]. Devuelve null si no hay R vibrante interna.
const Split = (() => {
  function splitTrill(word) {
    const lw = word.toLowerCase();
    const m = /rr/.exec(lw) || /[nls]r/.exec(lw);
    if (!m) return null;
    return [word.slice(0, m.index + 1), word.slice(m.index + 1)];
  }
  return { splitTrill };
})();
if (typeof module !== 'undefined') module.exports = Split;
