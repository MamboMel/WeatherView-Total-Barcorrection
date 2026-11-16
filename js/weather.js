// Monitor meteorológico de Perú usando Open-Meteo.
// Open-Meteo ofrece acceso gratuito sin API key para uso no comercial.
const PERU_WEATHER_POINTS = [
    { id: 'tumbes', name: 'Tumbes', zone: 'Litoral norte', latitude: -3.57, longitude: -80.45 },
    { id: 'piura', name: 'Paita / Piura', zone: 'Litoral norte', latitude: -5.09, longitude: -81.11 },
    { id: 'chiclayo', name: 'Chiclayo', zone: 'Litoral norte', latitude: -6.77, longitude: -79.84 },
    { id: 'trujillo', name: 'Trujillo', zone: 'Litoral norte', latitude: -8.11, longitude: -79.03 },
    { id: 'chimbote', name: 'Chimbote', zone: 'Litoral centro', latitude: -9.07, longitude: -78.59 },
    { id: 'lima', name: 'Lima / Callao', zone: 'Litoral centro', latitude: -12.05, longitude: -77.04 },
    { id: 'pisco', name: 'Pisco / Paracas', zone: 'Litoral centro', latitude: -13.71, longitude: -76.20 },
    { id: 'ica', name: 'Ica', zone: 'Costa sur', latitude: -14.07, longitude: -75.73 },
    { id: 'mollendo', name: 'Mollendo', zone: 'Litoral sur', latitude: -17.02, longitude: -72.01 },
    { id: 'ilo', name: 'Ilo', zone: 'Litoral sur', latitude: -17.64, longitude: -71.34 },
    { id: 'tacna', name: 'Tacna', zone: 'Litoral sur', latitude: -18.01, longitude: -70.25 },
    { id: 'cajamarca', name: 'Cajamarca', zone: 'Interior norte', latitude: -7.16, longitude: -78.51 },
    { id: 'tarapoto', name: 'Tarapoto', zone: 'Bosque amazónico', latitude: -6.49, longitude: -76.36 },
    { id: 'pucallpa', name: 'Pucallpa', zone: 'Bosque amazónico', latitude: -8.38, longitude: -74.55 },
    { id: 'cusco', name: 'Cusco', zone: 'Interior sur', latitude: -13.53, longitude: -71.97 },
    { id: 'puerto_maldonado', name: 'Puerto Maldonado', zone: 'Bosque amazónico', latitude: -12.59, longitude: -69.19 }
];

class PeruWeatherMonitor {
    constructor(points = PERU_WEATHER_POINTS) {
        this.points = points;
        this.data = [];
        this.selectedPoint = points[5];
        this.endpoint = 'https://api.open-meteo.com/v1/forecast';
    }

    async fetchForecast() {
        const latitudes = this.points.map(point => point.latitude).join(',');
        const longitudes = this.points.map(point => point.longitude).join(',');
        const params = new URLSearchParams({
            latitude: latitudes,
            longitude: longitudes,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code',
            hourly: 'temperature_2m,precipitation_probability,relative_humidity_2m',
            forecast_days: '2',
            timezone: 'auto',
            temperature_unit: 'celsius',
            wind_speed_unit: 'kmh'
        });
        const response = await fetch(`${this.endpoint}?${params}`);
        if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
        const payload = await response.json();
        const records = Array.isArray(payload) ? payload : [payload];
        this.data = records.map((record, index) => this.normalize(record, this.points[index])).filter(Boolean);
        return this.data;
    }

    normalize(record, point) {
        if (!record || !point || !record.current) return null;
        const current = record.current;
        const hourly = record.hourly || {};
        const times = hourly.time || [];
        const currentIndex = Math.max(0, times.findIndex(time => time >= current.time));
        const forecast = [0, 3, 6, 9].map(offset => {
            const index = Math.min(currentIndex + offset, (hourly.temperature_2m || []).length - 1);
            return {
                time: times[index] || '',
                temperature: hourly.temperature_2m?.[index],
                precipitationProbability: hourly.precipitation_probability?.[index]
            };
        });
        return {
            ...point,
            timezone: record.timezone,
            current: {
                time: current.time,
                temperature: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                wind: current.wind_speed_10m,
                precipitation: current.precipitation,
                weatherCode: current.weather_code
            },
            forecast,
            dailyMin: Math.min(...(hourly.temperature_2m || []).slice(0, 24)),
            dailyMax: Math.max(...(hourly.temperature_2m || []).slice(0, 24))
        };
    }

    risk(record) {
        if (!record?.current) return { label: 'Sin datos', className: 'unknown' };
        const temperature = Number(record.current.temperature);
        const humidity = Number(record.current.humidity);
        if (temperature >= 32 && humidity <= 35) return { label: 'Alto', className: 'high' };
        if (temperature >= 28 && humidity <= 50) return { label: 'Moderado', className: 'medium' };
        return { label: 'Bajo', className: 'low' };
    }

    formatHour(value) {
        return value ? new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--';
    }

    render() {
        const status = document.getElementById('weatherStatus');
        const select = document.getElementById('weatherPoint');
        const details = document.getElementById('weatherDetails');
        const list = document.getElementById('weatherPointList');
        if (!status || !select || !details || !list) return;

        select.innerHTML = this.points.map(point => `<option value="${point.id}">${point.name} · ${point.zone}</option>`).join('');
        select.value = this.selectedPoint.id;
        select.onchange = () => {
            this.selectedPoint = this.points.find(point => point.id === select.value) || this.selectedPoint;
            this.renderDetails();
        };
        list.innerHTML = this.data.map(record => {
            const risk = this.risk(record);
            return `<button class="weather-point-row" data-weather-id="${record.id}"><span><strong>${record.name}</strong><small>${record.zone}</small></span><span class="weather-row-value"><b>${Math.round(record.current.temperature)}°</b><i class="risk-dot ${risk.className}" title="Riesgo ${risk.label}"></i></span></button>`;
        }).join('');
        list.querySelectorAll('[data-weather-id]').forEach(button => button.addEventListener('click', () => {
            this.selectedPoint = this.points.find(point => point.id === button.dataset.weatherId) || this.selectedPoint;
            select.value = this.selectedPoint.id;
            this.renderDetails();
        }));
        status.textContent = `${this.data.length} puntos actualizados · Open-Meteo`;
        this.renderDetails();
    }

    renderDetails() {
        const details = document.getElementById('weatherDetails');
        const record = this.data.find(item => item.id === this.selectedPoint.id);
        if (!details || !record) return;
        const risk = this.risk(record);
        details.innerHTML = `
            <div class="weather-main-value"><span>${Math.round(record.current.temperature)}°C</span><em class="risk-badge ${risk.className}">${risk.label}</em></div>
            <div class="weather-metrics"><span>Humedad <b>${Math.round(record.current.humidity)}%</b></span><span>Viento <b>${Math.round(record.current.wind)} km/h</b></span><span>Máx/Mín <b>${Math.round(record.dailyMax)}° / ${Math.round(record.dailyMin)}°</b></span></div>
            <div class="weather-forecast"><h5>Próximas horas</h5>${record.forecast.map(item => `<div><span>${this.formatHour(item.time)}</span><b>${item.temperature == null ? '--' : Math.round(item.temperature) + '°'}</b><small>${item.precipitationProbability == null ? '--' : Math.round(item.precipitationProbability) + '% lluvia'}</small></div>`).join('')}</div>
        `;
    }

    async init() {
        const status = document.getElementById('weatherStatus');
        try {
            if (status) status.textContent = 'Consultando Open-Meteo…';
            await this.fetchForecast();
            this.render();
        } catch (error) {
            console.error('❌ Error en monitor meteorológico:', error);
            if (status) status.textContent = 'No se pudo actualizar el clima';
        }
    }
}

const peruWeatherMonitor = new PeruWeatherMonitor();
