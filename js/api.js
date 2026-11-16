// Fuentes de datos reales: NASA FIRMS + Open-Meteo.
class NASAFirmsAPI {
    constructor() {
        this.apiKey = CONFIG.NASA_FIRMS_API.MAP_KEY;
        this.baseUrl = CONFIG.NASA_FIRMS_API.BASE_URL;
        this.cache = [];
        this.lastFetch = null;
        this.lastError = null;
        this.mode = this.hasApiKey() ? 'REAL' : 'SIMULACIÓN';
        this.weatherCache = new Map();
        this.powerCache = new Map();
        this.sensorsOk = 0;
    }

    hasApiKey() {
        return Boolean(this.apiKey && !this.apiKey.includes('YOUR_NASA'));
    }

    isInsidePeru(latitude, longitude) {
        const box = CONFIG.NASA_FIRMS_API.PERU_BBOX;
        return latitude >= box.minLatitude && latitude <= box.maxLatitude &&
            longitude >= box.minLongitude && longitude <= box.maxLongitude;
    }

    buildURL(source = CONFIG.NASA_FIRMS_API.SOURCES[0]) {
        const { AREA, DAY_RANGE } = CONFIG.NASA_FIRMS_API;
        return `${this.baseUrl}${this.apiKey}/${source}/${AREA}/${DAY_RANGE}`;
    }

    async fetchRealFireData() {
        if (!this.hasApiKey()) {
            this.mode = 'SIMULACIÓN';
            this.lastError = 'Falta la clave de NASA FIRMS';
            return [];
        }
        try {
            console.log('🛰️ Obteniendo incendios reales de NASA FIRMS…');
            // MODIS + VIIRS (NOAA-20/21) en paralelo, armonizados a una celda de ~1 km × día
            const results = await Promise.allSettled(CONFIG.NASA_FIRMS_API.SOURCES.map(async src => {
                const r = await fetch(this.buildURL(src), { cache: 'no-store' });
                if (!r.ok) throw new Error(`${src} HTTP ${r.status}`);
                return this.parseCSV(await r.text()).map(f => ({ ...f, sensor: src }));
            }));
            const ok = results.filter(r => r.status === 'fulfilled');
            if (!ok.length) throw new Error(results[0].reason?.message || 'NASA FIRMS sin respuesta');
            this.sensorsOk = ok.length;
            this.cache = Harmonize.merge(ok.flatMap(r => r.value).filter(f => this.isInsidePeru(f.latitude, f.longitude)));
            this.lastFetch = new Date();
            this.lastError = null;
            this.mode = 'REAL';
            console.log(`✅ ${this.cache.length} incendios reales de NASA FIRMS dentro de Perú`);
            return this.cache;
        } catch (error) {
            this.lastError = error.message;
            this.mode = 'SIMULACIÓN';
            console.error('❌ NASA FIRMS no disponible:', error.message);
            return [];
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(header => header.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const raw = Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()]));
            const latitude = Number(raw.latitude);
            const longitude = Number(raw.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            return {
                latitude, longitude,
                brightness: Number(raw.bright_ti4 || raw.brightness || 300),
                brightnessDay: Number(raw.bright_ti5 || 0),
                confidence: this.normalizeConfidence(raw.confidence),
                acq_date: raw.acq_date || '', acq_time: raw.acq_time || '',
                satellite: raw.satellite || 'VIIRS', instrument: raw.instrument || 'VIIRS',
                daynight: raw.daynight || '', frp: Number(raw.frp || 0),
                source: 'NASA FIRMS', isReal: true
            };
        }).filter(Boolean);
    }

    normalizeConfidence(value) {
        if (!value) return 50;
        if (!Number.isNaN(Number(value))) return Number(value);
        const v = String(value).toLowerCase()[0]; // VIIRS: l/n/h
        return v === 'h' ? 90 : v === 'n' ? 70 : 30;
    }

    dedupeFires(fires) {
        const seen = new Set();
        return fires.filter(fire => {
            const key = `${fire.latitude.toFixed(3)}:${fire.longitude.toFixed(3)}:${fire.acq_date}:${fire.acq_time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    generateSimulatedFire() {
        const landRegions = [
            { lat: [15, 55], lon: [-125, -65] },
            { lat: [-55, 12], lon: [-80, -35] },
            { lat: [-35, 35], lon: [-18, 52] },
            { lat: [5, 70], lon: [10, 145] },
            { lat: [-44, -10], lon: [112, 154] }
        ];
        let latitude, longitude;
        for (let attempt = 0; attempt < 100; attempt++) {
            const region = landRegions[Math.floor(Math.random() * landRegions.length)];
            latitude = region.lat[0] + Math.random() * (region.lat[1] - region.lat[0]);
            longitude = region.lon[0] + Math.random() * (region.lon[1] - region.lon[0]);
            if (Math.abs(latitude) < 66 && this.isLandCoordinate(latitude, longitude)) break;
        }
        return {
            latitude,
            longitude,
            brightness: 300 + Math.random() * 100, confidence: 60 + Math.random() * 40,
            acq_date: new Date().toISOString().split('T')[0],
            acq_time: new Date().toTimeString().split(' ')[0], satellite: 'SIMULATED',
            instrument: 'VIIRS-SIM', source: 'SIMULACIÓN', isReal: false
        };
    }

    isLandCoordinate(latitude, longitude) {
        const regions = [
            [[-168, 15], [-168, 55], [-142, 72], [-52, 70], [-52, 15], [-82, 7]],
            [[-82, 13], [-35, 13], [-34, -55], [-75, -56], [-82, -10]],
            [[-18, 36], [52, 36], [52, -35], [10, -35], [-18, 0]],
            [[-11, 35], [42, 72], [180, 72], [180, 15], [135, 6], [85, 8], [45, 25], [10, 35]],
            [[112, -10], [154, -10], [154, -44], [112, -44]]
        ];
        return regions.some(polygon => {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i][0], yi = polygon[i][1], xj = polygon[j][0], yj = polygon[j][1];
                const intersects = ((yi > latitude) !== (yj > latitude)) && (longitude < (xj - xi) * (latitude - yi) / ((yj - yi) || 1e-9) + xi);
                if (intersects) inside = !inside;
            }
            return inside;
        });
    }

    async getFireData() {
        if (CONFIG.MODE === 'REAL_DATA' && CONFIG.USE_REAL_API) {
            if (this.cache.length && this.lastFetch && Date.now() - this.lastFetch.getTime() < CONFIG.NASA_FIRMS_API.UPDATE_INTERVAL_MS) {
                return this.cache[Math.floor(Math.random() * this.cache.length)];
            }
            const fires = await this.fetchRealFireData();
            if (fires.length) return fires[Math.floor(Math.random() * fires.length)];
        }
        return this.generateSimulatedFire();
    }

    async getWeather(latitude, longitude) {
        const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
        if (this.weatherCache.has(cacheKey)) return this.weatherCache.get(cacheKey);
        const params = new URLSearchParams({
            latitude: latitude.toFixed(4), longitude: longitude.toFixed(4),
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code',
            hourly: 'temperature_2m,precipitation_probability', forecast_days: '2', timezone: 'auto',
            temperature_unit: 'celsius', wind_speed_unit: 'kmh'
        });
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
            const data = await response.json();
            const result = { source: 'Open-Meteo', current: data.current, hourly: data.hourly, timezone: data.timezone };
            this.weatherCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.warn('⚠️ Clima no disponible:', error.message);
            return { source: 'SIN DATOS', current: null, hourly: null, error: error.message };
        }
    }

    async enrichFire(fire) {
        const weather = await this.getWeather(fire.latitude, fire.longitude);
        fire.weather = weather;
        const current = weather.current;
        if (current) {
            fire.temperature = current.temperature_2m;
            fire.humidity = current.relative_humidity_2m;
            fire.windSpeed = current.wind_speed_10m;
            fire.precipitation = current.precipitation;
            fire.spreadRisk = fire.temperature >= 32 && fire.humidity <= 35 ? 'ALTO' : fire.temperature >= 28 && fire.humidity <= 50 ? 'MODERADO' : 'BAJO';
        }
        return fire;
    }

/*     async getHumidityClimatology(latitude, longitude) {
        const weather = await this.getWeather(latitude, longitude);
        const humidity = weather.current?.relative_humidity_2m;
        if (humidity !== undefined) return { currentMonthHumidity: humidity, annualAvgHumidity: humidity, spreadRisk: humidity < 30 ? 'CRÍTICO' : humidity < 55 ? 'MODERADO' : 'BAJO', source: 'Open-Meteo' };
        return { currentMonthHumidity: 50, annualAvgHumidity: 50, spreadRisk: 'MODERADO', source: 'SIMULATED' };
    } */

    // Reemplazar getHumidityClimatology en api.js (y agregar this.powerCache = new Map() en el constructor)
async getHumidityClimatology(latitude, longitude) {
    const cacheKey = `${latitude.toFixed(1)},${longitude.toFixed(1)}`;
    if (this.powerCache.has(cacheKey)) return this.powerCache.get(cacheKey);

    const { BASE_URL, COMMUNITY, PARAMETERS, FORMAT } = CONFIG.NASA_POWER_API;
    const url = `${BASE_URL}?parameters=${PARAMETERS}&community=${COMMUNITY}&longitude=${longitude.toFixed(4)}&latitude=${latitude.toFixed(4)}&format=${FORMAT}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NASA POWER HTTP ${response.status}`);
        const data = await response.json();
        const rh2m = data?.properties?.parameter?.RH2M;
        if (!rh2m || rh2m.ANN === -999) throw new Error('Sin datos en NASA POWER');

        const monthKeys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const currentMonthRH = rh2m[monthKeys[new Date().getMonth()]];

        const result = {
            currentMonthHumidity: currentMonthRH !== -999 ? currentMonthRH : rh2m.ANN,
            annualAvgHumidity: rh2m.ANN,
            source: 'NASA POWER'
        };
        this.powerCache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.warn('⚠️ NASA POWER no disponible:', error.message);
        return { currentMonthHumidity: null, annualAvgHumidity: null, source: 'SIN DATOS' };
    }
}

    // Actualizar enrichFire en api.js para cruzar ambas fuentes
    async enrichFire(fire) {
        const [weather, climatology] = await Promise.all([
            this.getWeather(fire.latitude, fire.longitude),
            this.getHumidityClimatology(fire.latitude, fire.longitude)
        ]);
        fire.weather = weather;
        fire.climatology = climatology;

        const current = weather.current;
        if (current) {
            fire.temperature = current.temperature_2m;
            fire.humidity = current.relative_humidity_2m;
            fire.windSpeed = current.wind_speed_10m;
            fire.precipitation = current.precipitation;
            // Diferencia entre la humedad actual y la normal histórica del mes
            fire.humidityAnomaly = climatology.currentMonthHumidity != null
                ? Number((fire.humidity - climatology.currentMonthHumidity).toFixed(1))
                : null;
            fire.spreadRisk = (fire.temperature >= 32 && fire.humidity <= 35) || (fire.humidityAnomaly !== null && fire.humidityAnomaly <= -15)
                ? 'ALTO'
                : fire.temperature >= 28 && fire.humidity <= 50 ? 'MODERADO' : 'BAJO';
        }
        return fire;
    }

    geoToCartesian(latitude, longitude, radius) {
        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);
        return { x: -radius * Math.sin(phi) * Math.cos(theta), y: radius * Math.cos(phi), z: radius * Math.sin(phi) * Math.sin(theta) };
    }
}

const nasaAPI = new NASAFirmsAPI();
