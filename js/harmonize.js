// Armonización MODIS + VIIRS: esquema común, celda de ~1 km × día = un evento.
// sensors: 'M' (solo MODIS), 'V' (solo VIIRS) o 'MV' (ambos lo ven).
const Harmonize = {
  fam: s => /MODIS/i.test(s || '') ? 'M' : 'V',
  cell: (la, lo) => Math.round(la / .01) + ':' + Math.round(lo / .01),
  merge(rows) {
    const m = new Map();
    for (const r of rows) {
      const f = this.fam(r.sensor || r.instrument), k = this.cell(r.latitude, r.longitude) + ':' + r.acq_date, e = m.get(k);
      if (!e) m.set(k, { ...r, sensors: f });
      else { if (e.sensors !== f) e.sensors = 'MV'; e.frp = Math.max(e.frp || 0, r.frp || 0); e.confidence = Math.max(e.confidence, r.confidence); }
    }
    return [...m.values()];
  },
  inside(p, poly) { // poly: [[lat,lng],...]
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
      if ((poly[i][0] > p[0]) !== (poly[j][0] > p[0]) && p[1] < (poly[j][1] - poly[i][1]) * (p[0] - poly[i][0]) / (poly[j][0] - poly[i][0]) + poly[i][1]) c = !c;
    return c;
  },
  farmPoly(c, d = .09) { // entorno de ~10 km alrededor de la chacra
    const la = c.corners.map(p => p.lat), lo = c.corners.map(p => p.lng), a = Math.min(...la) - d, b = Math.min(...lo) - d, e = Math.max(...la) + d, f = Math.max(...lo) + d;
    return [[a, b], [a, f], [e, f], [e, b]];
  },
  async history(poly) {
    const b = poly.reduce((a, p) => [Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])], [90, 180, -90, -180]);
    try { // histórico real: generado con tools/build_fire_history.py
      const r = await fetch('data/fire_history_peru.json'); if (!r.ok) throw 0;
      const ev = (await r.json()).events.filter(e => e[0] >= b[0] && e[0] <= b[2] && e[1] >= b[1] && e[1] <= b[3] && this.inside([e[0], e[1]], poly))
        .map(e => ({ lat: e[0], lon: e[1], date: e[2], sensors: e[3] }));
      return { real: true, events: ev };
    } catch { return { real: false, events: this.synth(poly, b) }; }
  },
  synth(poly, b) { // SIMULADO: temporada seca jul–oct (pico a inicios de sep); el año en curso sale anómalo
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const f = Math.min(1, Math.max(.01, (b[2] - b[0]) * (b[3] - b[1]) * 12300 / 1.3e6)), now = new Date(), Y = now.getFullYear(), ev = [];
    for (let y = Y - 10; y <= Y; y++) {
      const yf = (.6 + rnd()) * (y === Y ? 1.8 : 1);
      for (let d = new Date(Date.UTC(y, 0, 1)); d <= now && d.getUTCFullYear() === y; d.setUTCDate(d.getUTCDate() + 1)) {
        const doy = (d - Date.UTC(y, 0, 1)) / 864e5, n = Math.floor((Math.exp(-(((doy - 245) / 45) ** 2)) + .03) * yf * 30 * f * (.4 + rnd()) + rnd());
        for (let i = 0; i < n; i++) {
          const la = b[0] + rnd() * (b[2] - b[0]), lo = b[1] + rnd() * (b[3] - b[1]);
          if (this.inside([la, lo], poly)) ev.push({ lat: la, lon: lo, date: d.toISOString().slice(0, 10), sensors: ['V', 'MV', 'V', 'M'][Math.floor(rnd() * 4)] });
        }
      }
    }
    return ev;
  },
  week: iso => Math.min(52, Math.floor((Date.parse(iso) - Date.UTC(+iso.slice(0, 4), 0, 1)) / 6048e5)),
  label: w => new Date(Date.UTC(2001, 0, 1 + 7 * w)).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  // Matriz año×semana, climatología de años previos, semanas inusuales (z ≥ 1,5) y críticas (4 picos históricos)
  calendar(events) {
    const M = {};
    for (const e of events) (M[e.date.slice(0, 4)] ??= Array(53).fill(0))[this.week(e.date)]++;
    const ys = Object.keys(M).sort();
    if (!ys.length) return { M, ys, cur: null, mean: [], unusual: [], critical: [] };
    const cur = ys.at(-1), prev = ys.slice(0, -1), mean = [], sd = [];
    for (let w = 0; w < 53; w++) {
      const v = prev.map(y => M[y][w]), m = v.reduce((a, b) => a + b, 0) / (v.length || 1);
      mean.push(m); sd.push(Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length || 1)));
    }
    const W = [...Array(53).keys()];
    return { M, ys, cur, mean, unusual: W.filter(w => M[cur][w] > 0 && (M[cur][w] - mean[w]) / Math.max(sd[w], 1) >= 1.5), critical: W.sort((a, b) => mean[b] - mean[a]).slice(0, 4).sort((a, b) => a - b) };
  },
  csv: ev => 'fecha,lat,lon,sensores\n' + ev.map(e => [e.date, e.lat.toFixed(4), e.lon.toFixed(4), e.sensors].join(',')).join('\n')
};
