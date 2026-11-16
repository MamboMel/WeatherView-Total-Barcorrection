# Activar datos reales de incendios

WeatherView consulta NASA FIRMS con `VIIRS_SNPP_NRT` y filtra los resultados al rectángulo de Perú. Cada detección se enriquece con temperatura, humedad, viento y precipitación de Open-Meteo. La actualización está configurada cada 15 minutos.

1. Copia `js/config.local.js` y conserva el mismo nombre.
2. Sustituye `TU_CLAVE_DE_NASA_FIRMS` por tu propia clave de NASA FIRMS.
3. No subas ese archivo a GitHub ni lo incluyas en paquetes públicos.
4. Si NASA FIRMS no tiene detecciones o la consulta falla, la interfaz muestra `SIMULACIÓN` y usa el respaldo simulado.

La clave usada durante la prueba no se incluye en el paquete final.
