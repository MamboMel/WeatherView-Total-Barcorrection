# ASTROFIRE · un ecosistema para dos desafíos NASA Space Apps 2026
1. **Armonización de focos MODIS + VIIRS** → `fuego.html` (calendario de actividad por área de interés).
2. **Adaptación de granjas con datos NASA** → `agro.html` (plan de rotación de 3 temporadas, NDVI, alertas y asistente).

Un mismo polígono de chacra alimenta ambos módulos: el calendario de fuego define las semanas críticas que se sombrean en la línea de tiempo de rotación, y el asistente cita fichas de cultivos, rotación, fuego y datos vivos de la chacra.

## Ejecutar
`python3 -m http.server 8000` y abrir `index.html`, `fuego.html` o `agro.html` (botón "Probar con una chacra de ejemplo").
- **Focos reales:** clave en `js/config.local.js` (ver `REAL_DATA_SETUP.md`). Fuentes: VIIRS NOAA-20, NOAA-21 y MODIS (Suomi NPP dejó de entregar datos el 2-nov-2026).
- **Histórico real:** `FIRMS_KEY=... python tools/build_fire_history.py --start 2018-01-01`.
- **Asistente con LLM (opcional):** `GEMINI_API_KEY=... node tools/rag_proxy.js` usa **Gemini 4 Hydrogen** (`gemini-4-hydrogen`; razonamiento `THINKING=LOW|MEDIUM|HIGH|XHIGH`, por defecto LOW). Con `ANTHROPIC_API_KEY` usa Claude. En `localhost` el asistente se conecta solo al proxy; en un sitio publicado, aloja el proxy y define `window.RAG_ENDPOINT`. Sin proxy funciona offline (BM25 + citas). Nunca pongas la clave en el navegador ni en el repositorio.

## Datos: qué es real y qué es simulado
| Dato | Estado |
|---|---|
| Focos FIRMS en vivo | Real (requiere clave) |
| Histórico de fuego | Simulado hasta generar `data/fire_history_peru.json` |
| Clima y tendencia (NASA POWER), NDVI (GIBS) | Real |
| Clima actual y elevación (Open-Meteo) | Real, no es producto NASA |
| Margen de ingreso, suelo, reglas agronómicas | Referencia/simulado: validar con INIA o un agrónomo |

> La clave de prueba está en `tools/.env` (ignorado por git). No publiques el proyecto sin borrar ese archivo, y revoca la clave al terminar el evento.
