// Dataset referencial de cultivos del Perú. t = rango ideal de temperatura (°C), rh = humedad relativa mínima cómoda (%),
// st = etapas [hasta_día, nombre, kc]. kc = coeficiente de cultivo (demanda de agua respecto a la evapotranspiración).
// Son valores de referencia generales: valídalos con INIA/SENASA o un agrónomo de tu zona.
const CROPS = [
  { id: 'papa', n: 'Papa', t: [12, 22], rh: 60, st: [[30, 'Emergencia', .5], [60, 'Tuberización', 1.1], [100, 'Llenado de tubérculos', 1.1], [150, 'Maduración', .75]] },
  { id: 'maiz', n: 'Maíz', t: [18, 30], rh: 50, st: [[25, 'Emergencia', .4], [60, 'Crecimiento', .9], [100, 'Floración', 1.2], [150, 'Maduración', .6]] },
  { id: 'arroz', n: 'Arroz', t: [22, 32], rh: 65, st: [[30, 'Macollamiento', 1.05], [70, 'Formación de panícula', 1.2], [110, 'Floración', 1.2], [150, 'Maduración', .9]] },
  { id: 'quinua', n: 'Quinua', t: [10, 24], rh: 40, st: [[30, 'Emergencia', .4], [70, 'Ramificación', .8], [110, 'Panojamiento', 1], [180, 'Llenado de grano', .5]] },
  { id: 'frijol', n: 'Frijol', t: [16, 27], rh: 50, st: [[20, 'Emergencia', .4], [45, 'Vegetativa', .8], [70, 'Floración', 1.15], [110, 'Formación de vainas', .9]] },
  { id: 'cafe', n: 'Café', t: [17, 25], rh: 60, st: [[365, 'Establecimiento', .9], [99999, 'Producción', 1]] },
  { id: 'cacao', n: 'Cacao', t: [21, 30], rh: 70, st: [[365, 'Establecimiento', .9], [99999, 'Producción', 1.05]] },
  { id: 'palto', n: 'Palto', t: [15, 28], rh: 50, st: [[365, 'Establecimiento', .6], [99999, 'Producción', .85]] }
];
