// Gestión de incendios reales de NASA FIRMS con respaldo simulado explícito.
class FireManager {
    constructor(scene, satellite, earth) {
        this.scene = scene;
        this.satellite = satellite;
        this.earth = earth;
        this.fires = [];
        this.detectionInterval = null;
        this.realRefreshInterval = null;
        this.isRunning = false;
        this.realFireKeys = new Set();
        this.mode = 'REAL';
    }

    async start() {
        this.isRunning = true;
        if (CONFIG.MODE === 'REAL_DATA' && CONFIG.USE_REAL_API) {
            const loaded = await this.refreshRealData();
            if (loaded) {
                this.scheduleRealRefresh();
                this.updateSourceStatus('REAL · NASA FIRMS');
                return;
            }
        }
        this.startSimulationFallback();
    }

    stop() {
        this.isRunning = false;
        if (this.detectionInterval) clearTimeout(this.detectionInterval);
        if (this.realRefreshInterval) clearInterval(this.realRefreshInterval);
        this.detectionInterval = null;
        this.realRefreshInterval = null;
    }

    scheduleRealRefresh() {
        if (this.realRefreshInterval) clearInterval(this.realRefreshInterval);
        this.realRefreshInterval = setInterval(() => this.refreshRealData(), CONFIG.NASA_FIRMS_API.UPDATE_INTERVAL_MS);
    }

    async refreshRealData() {
        try {
            const fires = await nasaAPI.fetchRealFireData();
            if (nasaAPI.mode !== 'REAL') {
                this.mode = 'SIMULACIÓN';
                this.updateSourceStatus('SIMULACIÓN · respaldo sin conexión');
                return false;
            }
            this.mode = 'REAL';
            this.earth.redPoints.slice().forEach(point => this.earth.removeRedPoint(point.x, point.y));
            this.fires = [];
            this.updateSourceStatus(`REAL · NASA FIRMS · ${fires.length} puntos · ${nasaAPI.sensorsOk}/3 sensores · ${this.formatLastUpdate()}`);
            if (!fires.length) return true;
            const newFires = [];
            /* for (const fire of fires) {
                const point = this.earth.addFirePointFromData(fire);
                const enriched = await nasaAPI.enrichFire(point);
                this.fires.push(enriched);
                const key = this.fireKey(enriched);
                if (!this.realFireKeys.has(key)) newFires.push(enriched);
            } */
           // Dentro de refreshRealData() en fires.js, reemplaza el bucle for por:
            for (const fire of fires) {
                const point = this.earth.addFirePointFromData(fire);
                this.fires.push(point);
                const key = this.fireKey(point);
                if (!this.realFireKeys.has(key)) newFires.push(point);
            }
            this.realFireKeys = new Set(this.fires.map(fire => this.fireKey(fire)));
            this.updateSourceStatus(`REAL · NASA FIRMS · ${this.fires.length} puntos · ${nasaAPI.sensorsOk}/3 sensores · ${this.formatLastUpdate()}`);
            if (newFires[0]) await this.processFireDetection(newFires[0], false);
            return true;
        } catch (error) {
            console.error('❌ Error actualizando incendios reales:', error);
            this.startSimulationFallback();
            return false;
        }
    }

    fireKey(fire) {
        return `${fire.latitude.toFixed(3)}:${fire.longitude.toFixed(3)}:${fire.acq_date}:${fire.acq_time}`;
    }

    startSimulationFallback() {
        this.mode = 'SIMULACIÓN';
        this.updateSourceStatus('SIMULACIÓN · respaldo sin datos reales');
        if (this.detectionInterval) clearTimeout(this.detectionInterval);
        this.scheduleSimulation();
    }

    scheduleSimulation() {
        if (!this.isRunning || this.mode !== 'SIMULACIÓN') return;
        this.detectionInterval = setTimeout(async () => {
            const fire = nasaAPI.generateSimulatedFire();
            const point = this.earth.addFirePointFromData(fire);
            await this.processFireDetection(point, true);
            this.scheduleSimulation();
        }, CONFIG.AUTO_FIRE_GENERATION.INTERVAL);
    }

    formatLastUpdate() {
        return nasaAPI.lastFetch ? nasaAPI.lastFetch.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    }

    updateSourceStatus(text) {
        const node = document.getElementById('fireDataStatus');
        if (node) node.textContent = text;
        const chip = document.getElementById('liveChip');
        const label = document.getElementById('liveChipLabel');
        const isLive = this.mode === 'REAL';
        if (chip) {
            chip.classList.toggle('simulated', !isLive);
            chip.title = isLive ? 'NASA FIRMS conectada' : 'Entorno simulado';
            chip.setAttribute('aria-label', chip.title);
        }
        if (label) label.textContent = isLive ? 'Live' : 'Entorno simulado';
    }

    async processFireDetection(fireData, simulated) {
        try {
            if (!fireData.weather) await nasaAPI.enrichFire(fireData);
            fireData.isReal = !simulated;
            fireData.source = simulated ? 'SIMULACIÓN' : 'NASA FIRMS + Open-Meteo';
            this.fires.push(fireData);
            statsManager.addFireDetection(fireData);
            this.satellite.flashDetection();
            this.showAlert(fireData);
            if (simulated) {
                setTimeout(() => {
                    if (this.earth.removeRedPoint(fireData.x, fireData.y)) statsManager.markFireAsHandled();
                }, 1200);
            }
        } catch (error) {
            console.error('❌ Error al procesar detección:', error);
        }
    }

    showAlert(fireData) {
        const alertContainer = document.getElementById('alert-container');
        const alertConfidence = document.getElementById('alertConfidence');
        const alertTemp = document.getElementById('alertTemp');
        const alertMessage = document.getElementById('alertMessage');
        const alertHumidity = document.getElementById('alertHumidity');
        const alertRisk = document.getElementById('alertRisk');
        if (alertHumidity) alertHumidity.textContent = fireData.humidity !== undefined ? Number(fireData.humidity).toFixed(0) : '--';
        if (alertRisk) alertRisk.textContent = fireData.spreadRisk || 'BAJO';
        if (alertMessage) alertMessage.textContent = `Incendio detectado · ${fireData.latitude.toFixed(3)}°, ${fireData.longitude.toFixed(3)}°`;
        if (!alertContainer) return;
        if (alertConfidence) alertConfidence.textContent = Number(fireData.confidence || 50).toFixed(0);
        if (alertTemp) alertTemp.textContent = fireData.temperature !== undefined ? Number(fireData.temperature).toFixed(1) : Number(fireData.brightness || 0).toFixed(0);
        alertContainer.classList.remove('hidden');
        setTimeout(() => alertContainer.classList.add('hidden'), 8000);
    }

    update() {}

    clearAll() {
        this.earth.redPoints.slice().forEach(point => this.earth.removeRedPoint(point.x, point.y));
        this.fires = [];
        this.realFireKeys.clear();
    }
}
