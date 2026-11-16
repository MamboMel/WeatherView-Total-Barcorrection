// Asistente RAG offline-first: base de conocimiento (CROPS + TRAITS + guías + contexto de la chacra) → BM25 → respuesta con citas.
// Con window.RAG_ENDPOINT (ver tools/rag_proxy.js) un LLM redacta la respuesta usando SOLO los pasajes recuperados.
const Rag = {
  STOP: new Set('de la el en y a los las un una que es por con para se del al lo como mas su sus o ni mi me mis tu tus cual cuando donde hay'.split(' ')),
  tok(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(w => w.length > 1 && !this.STOP.has(w)).map(w => w.replace(/(es|s)$/, '')); },
  kb(extra = []) {
    const d = [], tr = typeof TRAITS !== 'undefined' ? TRAITS : {};
    for (const k of CROPS) {
      d.push({ src: `Ficha · ${k.n}`, crop: k.id, text: `${k.n}: temperatura ideal ${k.t[0]}–${k.t[1]} °C y humedad relativa mínima cómoda ${k.rh}%. Etapas: ${k.st.map(s => s[1] + (s[0] > 9999 ? '' : ` (hasta el día ${s[0]})`)).join(', ')}.` });
      let prev = 0;
      for (const [hasta, nom, kc] of k.st) {
        d.push({ src: `${k.n} · ${nom}`, crop: k.id, text: `${k.n} en ${nom} (día ${prev + 1} ${hasta > 9999 ? 'en adelante' : 'a ' + hasta}): coeficiente Kc ${kc}. ${kc >= 1 ? 'Demanda de agua alta: evita que el suelo se seque y riega con frecuencia.' : kc <= .5 ? 'Demanda de agua baja: riego ligero y evita encharcar.' : 'Demanda de agua media: riega según la humedad del suelo.'}` });
        prev = hasta;
      }
      const T = tr[k.id];
      if (T) d.push({ src: `Rotación · ${k.n}`, crop: k.id, text: `Rotación de ${k.n} (familia ${T.fam}): ${T.n < 0 ? 'extrae mucho nitrógeno, conviene sembrar después una leguminosa como el frijol' : T.n > 0 ? 'fija nitrógeno y mejora el suelo, es buen antecesor de cultivos exigentes como papa o maíz' : 'efecto neutro sobre el nitrógeno'}. No repitas la familia ${T.fam} en menos de 3 temporadas. Ciclo de ${T.ciclo} días, demanda de agua ${['', 'baja', 'media', 'alta'][T.agua]}, altitud de referencia ${T.alt[0]}–${T.alt[1]} m.` });
    }
    d.push(
      { src: 'Guía · Fuego y rastrojo', text: 'Fuego y rastrojo: no quemes el rastrojo. Incorpóralo al suelo o hazlo compost: devuelve materia orgánica y evita que el fuego se escape. Si tu cosecha cae en una semana crítica de fuego (pico histórico de focos en tu zona), adelanta o retrasa la siembra y evita cualquier quema.' },
      { src: 'Guía · Calendario de fuego', text: 'El calendario de fuego armoniza detecciones de MODIS y VIIRS en una grilla de 1 km por día. Una semana crítica es un pico histórico de focos; una semana inusual supera en 1,5 desviaciones lo normal para esa semana.' },
      { src: 'Guía · Rotación', text: 'Rotación de cultivos: alterna familias botánicas, alterna cultivos que extraen nitrógeno con leguminosas que lo fijan, y elige según agua disponible, altitud y temperatura. La pestaña Rotación genera un plan de 3 temporadas según tus prioridades.' },
      { src: 'Guía · Datos y límites', text: 'Origen de los datos: clima y tendencia de NASA POWER; focos de calor de NASA FIRMS (NOAA-20, NOAA-21 y MODIS); NDVI de NASA GIBS; elevación y clima actual de Open-Meteo, que no es un producto NASA. Son simulados el margen de ingreso, el histórico de fuego cuando no hay datos de FIRMS y los datos de suelo de ejemplo. Los valores agronómicos son de referencia y deben validarse con INIA o un agrónomo.' });
    return d.concat(extra);
  },
  context(c, w, cal) { // datos vivos de la chacra
    const k = CROPS.find(x => x.id === c.crop), days = Math.max(0, Math.floor((Date.now() - new Date(c.sown)) / 864e5)), st = k.st.find(s => days <= s[0]) || k.st.at(-1), t = w?.current?.temperature_2m;
    const out = [{ src: 'Tu chacra', crop: c.crop, text: `Tu chacra ${c.name}: ${k.n}, ${Number(c.ha).toFixed(1)} ha, sembrada hace ${days} días; hoy está en la etapa ${st[1]} (Kc ${st[2]}).` }];
    if (t != null) out.push({ src: 'Tu chacra · clima hoy', crop: c.crop, text: `Clima hoy en tu chacra: ${t} °C y ${w.current.relative_humidity_2m}% de humedad relativa. ${t > k.t[1] ? `Hace más calor que el rango ideal de ${k.n}: riesgo de estrés por calor.` : t < k.t[0] ? 'Hace más frío que el rango ideal: riesgo de helada o crecimiento lento.' : 'La temperatura está dentro del rango ideal.'}` });
    if (cal?.critical?.length) out.push({ src: 'Tu chacra · fuego', text: `Semanas críticas de fuego en el entorno de tu chacra: ${cal.critical.map(Harmonize.label).join(', ')}. ${cal.unusual.length ? 'Este año hay ' + cal.unusual.length + ' semanas inusuales.' : ''}` });
    return out;
  },
  rank(q, docs, crop) { // BM25 con refuerzo por el cultivo preguntado o el de la chacra
    const qt = this.tok(q), N = docs.length, T = docs.map(d => this.tok(d.text + ' ' + d.src)), avg = T.reduce((s, t) => s + t.length, 0) / N, df = {};
    T.forEach(t => new Set(t).forEach(w => df[w] = (df[w] || 0) + 1));
    return docs.map((d, i) => {
      const tf = {}; T[i].forEach(w => tf[w] = (tf[w] || 0) + 1);
      let s = 0; for (const w of qt) if (tf[w]) s += Math.log(1 + (N - df[w] + .5) / (df[w] + .5)) * tf[w] * 2.5 / (tf[w] + 1.5 * (.25 + .75 * T[i].length / avg));
      if (CROPS.some(k => d.crop === k.id && qt.includes(this.tok(k.n)[0]))) s *= 1.5; else if (crop && d.crop === crop) s *= 1.2;
      if (d.src.startsWith('Tu chacra')) s *= 1.3;
      return { ...d, s };
    }).filter(d => d.s > 0).sort((a, b) => b.s - a.s);
  },
  async ask(q, docs, crop, history = []) {
    const prev = [...history].reverse().find(h => h.role === 'user'), qq = this.tok(q).length < 4 && prev ? prev.text + ' ' + q : q; // los seguimientos cortos heredan el tema anterior
    const top = this.rank(qq, docs, crop).slice(0, 10);
    if (!top.length) return { text: 'No encontré nada sobre eso en mi base (cultivos, rotación, fuego y datos de tu chacra). Prueba con una etapa, un cultivo o la rotación.', src: [], cited: [], followups: [], mode: 'sin resultados' };
    for (const d of docs) if (d.src.startsWith('Tu chacra') && !top.some(t => t.src === d.src)) top.push(d); // el contexto vivo siempre viaja
    if (window.RAG_ENDPOINT) try {
      const r = await fetch(window.RAG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, passages: top.map((d, i) => `[${i + 1}] ${d.src}: ${d.text}`), history: history.slice(-4) }) });
      const j = await r.json(); if (j.answer) return { text: j.answer, src: top, cited: (j.cited || []).map(Number), followups: j.followups || [], mode: j.model || 'LLM' };
    } catch {}
    return { text: top.slice(0, 3).map((d, i) => `${d.text} [${i + 1}]`).join('\n\n'), src: top, cited: [1, 2, 3], followups: [], mode: 'Offline · recuperación sin LLM' };
  },
  async status() { if (!window.RAG_ENDPOINT) return null; try { return (await (await fetch(window.RAG_ENDPOINT + '/health')).json()).model || null; } catch { return null; } }
};
