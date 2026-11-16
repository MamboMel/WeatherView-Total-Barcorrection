// Motor de rotación. Valores agronómicos de REFERENCIA (validar con INIA/agrónomo). ing = margen ilustrativo 1–5 (SIMULADO).
const TRAITS = {
  papa:   { fam: 'Solanaceae',    n: -1, agua: 2, ciclo: 150, alt: [2500, 4200], ing: 4 },
  maiz:   { fam: 'Poaceae',       n: -1, agua: 2, ciclo: 150, alt: [0, 3200],    ing: 2 },
  arroz:  { fam: 'Poaceae',       n: -1, agua: 3, ciclo: 150, alt: [0, 1200],    ing: 3 },
  quinua: { fam: 'Amaranthaceae', n: 0,  agua: 1, ciclo: 180, alt: [2500, 4000], ing: 4 },
  frijol: { fam: 'Fabaceae',      n: 1,  agua: 1, ciclo: 110, alt: [0, 2800],    ing: 3 }
};
const NEED = [0, 350, 550, 900]; // mm de agua por ciclo según demanda (referencia)
const Rotation = {
  async climate(lat, lng) { // NASA POWER (climatología): T media anual (°C) y lluvia anual (mm)
    try {
      const r = await fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR&community=AG&longitude=${lng.toFixed(3)}&latitude=${lat.toFixed(3)}&format=JSON`);
      const p = (await r.json()).properties.parameter;
      return { t: p.T2M.ANN, rain: p.PRECTOTCORR.ANN * 365 };
    } catch { return null; }
  },
  async trend(lat, lng) { // NASA POWER mensual: tendencia 1990–hoy de T media y lluvia anual (por década)
    try {
      const y1 = new Date().getFullYear() - 1;
      const r = await fetch(`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR&community=AG&longitude=${lng.toFixed(3)}&latitude=${lat.toFixed(3)}&start=1990&end=${y1}&format=JSON`);
      const p = (await r.json()).properties.parameter, yrs = [];
      for (let y = 1990; y <= y1; y++) {
        const t = [], pr = [];
        for (let m = 1; m <= 12; m++) {
          const k = '' + y + String(m).padStart(2, '0'), a = p.T2M[k], b = p.PRECTOTCORR[k];
          if (a > -900 && b > -900) { t.push(a); pr.push(b * new Date(y, m, 0).getDate()); }
        }
        if (t.length === 12) yrs.push({ y, t: t.reduce((a, b) => a + b) / 12, rain: pr.reduce((a, b) => a + b) });
      }
      const slope = k => { const mx = yrs.reduce((s, o) => s + o.y, 0) / yrs.length, my = yrs.reduce((s, o) => s + o[k], 0) / yrs.length; return 10 * yrs.reduce((s, o) => s + (o.y - mx) * (o[k] - my), 0) / yrs.reduce((s, o) => s + (o.y - mx) ** 2, 0); };
      return yrs.length > 10 ? { yrs, dT: slope('t'), dRain: slope('rain') } : null;
    } catch { return null; }
  },
  fireHit: (f, ciclo) => { const h = Harmonize.week(new Date(f.sow.getTime() + ciclo * 864e5).toISOString().slice(0, 10)); return f.critical.some(w => Math.abs(w - h) <= 1); },
  score(id, hist, x) {
    const t = TRAITS[id], k = CROPS.find(c => c.id === id), last = TRAITS[hist[0]];
    let suelo = 50 + (hist.slice(0, 3).some(h => TRAITS[h]?.fam === t.fam) ? -30 : 10);
    if (last?.fam === t.fam) suelo -= 30;
    if (last?.n < 0 && t.n > 0) suelo += 30; else if (last?.n < 0 && t.n < 0) suelo -= 15;
    if (t.n > 0 && x.om === 'bajo') suelo += 10;
    const dAlt = x.elev == null ? 0 : Math.max(0, t.alt[0] - x.elev, x.elev - t.alt[1]);
    const dT = x.clim ? Math.max(0, k.t[0] - 3 - x.clim.t, x.clim.t - k.t[1] - 3) : 0;
    const fuego = x.fire ? this.fireHit(x.fire, t.ciclo) : false;
    const clima = Math.max(0, 100 - dAlt / 15 - dT * 12 - (fuego ? 15 : 0));
    const agua = Math.min(100, 100 * ((x.clim ? x.clim.rain * t.ciclo / 365 : 300) + (x.riego ? 400 : 0)) / NEED[t.agua]);
    return { suelo: Math.max(0, Math.min(100, suelo)), clima, agua, ingreso: t.ing * 20, fuego };
  },
  plan(w, hist, x) { // 3 temporadas, greedy; la siembra de cada una empieza al terminar la anterior
    const out = []; let h = [...hist], sow = new Date(x.sow);
    for (let i = 0; i < 3; i++) {
      const best = Object.keys(TRAITS).map(id => {
        const s = this.score(id, h, { ...x, fire: x.fire && { critical: x.fire.critical, sow } });
        return { id, s, tot: (w.suelo * s.suelo + w.agua * s.agua + w.ingreso * s.ingreso + w.clima * s.clima) / (w.suelo + w.agua + w.ingreso + w.clima || 1) };
      }).sort((a, b) => b.tot - a.tot)[0];
      out.push({ ...best, sow: new Date(sow) }); h.unshift(best.id); sow = new Date(sow.getTime() + TRAITS[best.id].ciclo * 864e5);
    }
    return out;
  }
};
