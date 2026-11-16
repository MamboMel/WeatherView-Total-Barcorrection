// Sistema de estadísticas y métricas
class StatsManager {
    constructor() {
        this.fireCount = 0;
        this.firesHandled = 0;
        this.totalResponseTime = 0;
        this.totalTimeSaved = 0;
        this.responseTimes = [];

        this.elements = {
            fireCount: document.getElementById('fireCount'),
            firesHandled: document.getElementById('firesHandled'),
            responseTime: document.getElementById('responseTime'),
            timeSaved: document.getElementById('timeSaved'),
            avgResponseTime: document.getElementById('avgResponseTime')
        };
    }

    addFireDetection(fireData) {
        console.log('📊 addFireDetection() llamado');
        console.log('Contador actual:', this.fireCount);

        this.fireCount++;

        console.log('Contador después de incrementar:', this.fireCount);

        // Calcular tiempo de respuesta con satélite (15-35 minutos)
        const responseTime = CONFIG.SIMULATION.SATELLITE_RESPONSE_MIN +
                           Math.random() * (CONFIG.SIMULATION.SATELLITE_RESPONSE_MAX -
                                          CONFIG.SIMULATION.SATELLITE_RESPONSE_MIN);

        this.responseTimes.push(responseTime);
        this.totalResponseTime += responseTime;

        // Calcular tiempo ahorrado vs método tradicional
        const timeSaved = CONFIG.SIMULATION.TRADITIONAL_RESPONSE_TIME - responseTime;
        this.totalTimeSaved += timeSaved;

        // Actualizar display inmediatamente al detectar
        this.updateDisplay();

        console.log(`✅ Incendio #${this.fireCount} detectado - Tiempo de respuesta: ${Math.round(responseTime)} min`);
    }

    markFireAsHandled() {
        this.firesHandled++;
        this.updateDisplay();
        console.log(`✅ Incendio atendido - Total atendidos: ${this.firesHandled}`);
    }

    updateDisplay() {
        // Actualizar contador de incendios detectados
        if (this.elements.fireCount) {
            this.elements.fireCount.textContent = this.fireCount;
        }

        // Actualizar incendios atendidos
        if (this.elements.firesHandled) {
            this.elements.firesHandled.textContent = this.firesHandled;
        }

        // Calcular y mostrar tiempo de respuesta promedio
        if (this.responseTimes.length > 0) {
            const avgResponse = this.totalResponseTime / this.responseTimes.length;
            if (this.elements.responseTime) {
                this.elements.responseTime.textContent = Math.round(avgResponse);
            }
            if (this.elements.avgResponseTime) {
                this.elements.avgResponseTime.textContent = `~${Math.round(avgResponse)} min`;
            }
        }

        // Mostrar tiempo total ahorrado en horas
        const hoursSaved = this.totalTimeSaved / 60;
        if (this.elements.timeSaved) {
            this.elements.timeSaved.textContent = hoursSaved.toFixed(1);
        }

        // Animar los números cuando cambian (solo si el elemento existe)
        if (this.elements.fireCount) {
            this.animateValue(this.elements.fireCount);
        }
        if (this.elements.firesHandled) {
            this.animateValue(this.elements.firesHandled);
        }
    }

    animateValue(element) {
        if (element) {
            element.style.transform = 'scale(1.2)';
            element.style.color = '#ff9a62';

            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 300);
        }
    }

    reset() {
        this.fireCount = 0;
        this.firesHandled = 0;
        this.totalResponseTime = 0;
        this.totalTimeSaved = 0;
        this.responseTimes = [];
        this.updateDisplay();

        // Resetear valores a cero
        if (this.elements.fireCount) this.elements.fireCount.textContent = '0';
        if (this.elements.firesHandled) this.elements.firesHandled.textContent = '0';
        if (this.elements.responseTime) this.elements.responseTime.textContent = '--';
        if (this.elements.timeSaved) this.elements.timeSaved.textContent = '0';
        if (this.elements.avgResponseTime) this.elements.avgResponseTime.textContent = '~25 min';
    }

    getStats() {
        return {
            fireCount: this.fireCount,
            firesHandled: this.firesHandled,
            avgResponseTime: this.responseTimes.length > 0
                ? this.totalResponseTime / this.responseTimes.length
                : 0,
            totalTimeSaved: this.totalTimeSaved,
            efficiency: this.fireCount > 0
                ? (this.firesHandled / this.fireCount * 100).toFixed(1)
                : 0
        };
    }

    exportStats() {
        const stats = this.getStats();
        const data = {
            timestamp: new Date().toISOString(),
            ...stats,
            responseTimes: this.responseTimes
        };

        console.log('📊 Estadísticas exportadas:', data);
        return data;
    }
}

// Instancia global del gestor de estadísticas (se reasignará en main.js)
let statsManager;
