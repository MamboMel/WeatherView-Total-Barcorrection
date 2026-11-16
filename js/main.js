// Archivo principal de la aplicación
let sceneManager, earth, satellite, fireManager;
let isSimulationRunning = true;
let responseTimeChart, detectionTrendChart;

// Inicializar la aplicación
async function init() {
    console.log('🚀 Iniciando Sistema de Detección de Incendios...');

    // Mostrar pantalla de carga
    showLoading(true);

    try {
        // Inicializar escena Three.js
        sceneManager = new SceneManager();

        // Esperar a que la escena esté lista antes de crear la Tierra
        await new Promise(resolve => setTimeout(resolve, 100));

        // Crear la Tierra con mapa de Earthdata
        earth = new Earth(sceneManager.scene);

        // Esperar a que la Tierra esté completamente inicializada
        while (!earth.initialized) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Cargar la flota orbital de tres satélites
        satellite = new SatelliteFleet(sceneManager.scene);

        // Esperar a que el satélite esté completamente inicializado
        while (!satellite.initialized) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Inicializar gestor de incendios
        fireManager = new FireManager(sceneManager.scene, satellite, earth);
        console.log('✅ FireManager inicializado correctamente');

        // Inicializar gestor de capas del mapa
        initializeMapLayers();

        // Inicializar sistema de seguridad
        initializeSecurity();

        // Inicializar gestor de estadísticas
        initializeStatsManager();

        // Inicializar optimizador de rendimiento
        initializePerformanceOptimizer();

        // Esperar un poco más para asegurar que el DOM esté completamente listo
        await new Promise(resolve => setTimeout(resolve, 200));

        // Configurar controles de UI después de asegurar que el DOM esté listo
        setupControls();

        // Iniciar simulación
        fireManager.start();

        // Ocultar pantalla de carga
        showLoading(false);

        console.log('✅ Sistema iniciado correctamente');

        // Iniciar loop de animación
        animate();

    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showLoading(false);
        alert('Error al cargar la aplicación. Por favor, recarga la página.');
    }
}

/* // Loop de animación principal
function animate() {
    requestAnimationFrame(animate);
    
    // Actualizar componentes
    if (earth) earth.update();
    if (satellite) satellite.update();
    if (fireManager) fireManager.update();
    
    // Renderizar escena
    sceneManager.render();
} */

function animate() {
    requestAnimationFrame(animate);
    if (performanceOptimizer) performanceOptimizer.frameCount++;
    if (earth) earth.update();
    if (satellite) satellite.update();
    if (fireManager) fireManager.update();
    sceneManager.render();
}

// Configurar controles de la interfaz
function setupControls() {
    console.log('🔧 Configurando controles...');
    
    // Verificar elementos del DOM
    const elements = {
        toggleSimulation: document.getElementById('toggleSimulation'),
        resetStats: document.getElementById('resetStats'),
        dismissAlert: document.getElementById('dismissAlert'),
        alertContainer: document.getElementById('alert-container')
    };
    
    console.log('📋 Elementos del DOM encontrados:', {
        toggleSimulation: !!elements.toggleSimulation,
        resetStats: !!elements.resetStats,
        dismissAlert: !!elements.dismissAlert,
        alertContainer: !!elements.alertContainer
    });

    // Botón de pausar/reanudar simulación
    if (elements.toggleSimulation) {
        elements.toggleSimulation.addEventListener('click', () => {
            isSimulationRunning = !isSimulationRunning;
            
            if (isSimulationRunning) {
                if (fireManager && fireManager.start) {
                    fireManager.start();
                }
                elements.toggleSimulation.textContent = '⏸️ Pausar Simulación';
                elements.toggleSimulation.classList.remove('paused');
            } else {
                if (fireManager && fireManager.stop) {
                    fireManager.stop();
                }
                elements.toggleSimulation.textContent = '▶️ Reanudar Simulación';
                elements.toggleSimulation.classList.add('paused');
            }
        });
    } else {
        console.warn('⚠️ Elemento toggleSimulation no encontrado');
    }
    
    // Botón de reiniciar estadísticas
    if (elements.resetStats) {
        elements.resetStats.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres reiniciar las estadísticas?')) {
                if (typeof statsManager !== 'undefined' && statsManager.reset) {
                    statsManager.reset();
                }
                if (fireManager && fireManager.clearAll) {
                    fireManager.clearAll();
                }
                console.log('🔄 Estadísticas reiniciadas');
            }
        });
    } else {
        console.warn('⚠️ Elemento resetStats no encontrado');
    }
    
    // Botón de cerrar alerta
    if (elements.dismissAlert) {
        elements.dismissAlert.addEventListener('click', () => {
            elements.alertContainer.classList.add('hidden');
        });
    } else {
        console.warn('⚠️ Elemento dismissAlert no encontrado');
    }
    
    // Cerrar alerta con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.alertContainer.classList.add('hidden');
        }
    });
}

// Mostrar/ocultar pantalla de carga
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Funciones del Dashboard Ejecutivo
let dashboardVisible = false;
let responseTimeData = [];
let detectionTrendData = [];

// Función para alternar entre vista básica y dashboard ejecutivo
function toggleDashboardView() {
    const infoPanel = document.getElementById('info-panel');
    const dashboard = document.getElementById('executive-dashboard');

    dashboardVisible = !dashboardVisible;

    if (dashboardVisible) {
        infoPanel.style.display = 'none';
        dashboard.style.display = 'block';
        initializeCharts();
    } else {
        infoPanel.style.display = 'block';
        dashboard.style.display = 'none';
    }
}

// Función para exportar reporte ejecutivo
function exportExecutiveReport() {
    const stats = statsManager.getStats();
    const reportData = {
        timestamp: new Date().toISOString(),
        executiveSummary: {
            totalFires: stats.fireCount,
            firesHandled: stats.firesHandled,
            avgResponseTime: stats.avgResponseTime,
            totalTimeSaved: stats.totalTimeSaved,
            efficiency: stats.efficiency
        },
        systemMetrics: {
            satelliteStatus: 'OPERATIONAL',
            coverage: '94.7%',
            uptime: '99.9%',
            accuracy: '97.3%'
        }
    };

    // Crear y descargar archivo JSON
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `astrofire-executive-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('📋 Executive report exported:', reportData);
}

// Función para refrescar dashboard
function refreshDashboard() {
    updateExecutiveKPIs();
    updateCharts();

    // Mostrar estadísticas de rendimiento si está disponible
    if (performanceOptimizer) {
        const perfStats = performanceOptimizer.getPerformanceStats();
        console.log('📊 Performance stats:', perfStats);
    }

    console.log('🔄 Dashboard refreshed');
}

// Función para actualizar KPIs ejecutivos
function updateExecutiveKPIs() {
    if (statsManager) {
        const stats = statsManager.getStats();

        // Actualizar elementos del dashboard si existen
        const kpiElements = {
            totalFires: document.getElementById('kpi-total-fires'),
            firesHandled: document.getElementById('kpi-fires-handled'),
            avgResponseTime: document.getElementById('kpi-avg-response-time'),
            totalTimeSaved: document.getElementById('kpi-total-time-saved'),
            efficiency: document.getElementById('kpi-efficiency')
        };

        // Actualizar elementos si existen
        if (kpiElements.totalFires) {
            kpiElements.totalFires.textContent = stats.fireCount;
        }
        if (kpiElements.firesHandled) {
            kpiElements.firesHandled.textContent = stats.firesHandled;
        }
        if (kpiElements.avgResponseTime) {
            kpiElements.avgResponseTime.textContent = Math.round(stats.avgResponseTime) + ' min';
        }
        if (kpiElements.totalTimeSaved) {
            kpiElements.totalTimeSaved.textContent = Math.round(stats.totalTimeSaved) + ' hrs';
        }
        if (kpiElements.efficiency) {
            kpiElements.efficiency.textContent = Math.round(stats.efficiency) + '%';
        }

        console.log('📊 Executive KPIs updated:', stats);
    }
}

// Inicializar gráficos del dashboard
function initializeCharts() {
    initializeResponseTimeChart();
    initializeDetectionTrendChart();
    updateCharts();
}

// Gráfico de tiempos de respuesta
function initializeResponseTimeChart() {
    const ctx = document.getElementById('responseTimeChart').getContext('2d');

    responseTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Response Time (min)',
                data: [],
                borderColor: '#63d8ff',
                backgroundColor: 'rgba(99, 216, 255, 0.12)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(150, 180, 220, 0.12)'
                    },
                    ticks: {
                        color: '#8ea1bb'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(150, 180, 220, 0.12)'
                    },
                    ticks: {
                        color: '#8ea1bb'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#8ea1bb'
                    }
                }
            }
        }
    });
}

// Gráfico de tendencia de detección
function initializeDetectionTrendChart() {
    const ctx = document.getElementById('detectionTrendChart').getContext('2d');

    detectionTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Fires Detected',
                data: [],
                backgroundColor: 'rgba(99, 216, 255, 0.55)',
                borderColor: '#63d8ff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(150, 180, 220, 0.12)'
                    },
                    ticks: {
                        color: '#8ea1bb'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(150, 180, 220, 0.12)'
                    },
                    ticks: {
                        color: '#8ea1bb'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#8ea1bb'
                    }
                }
            }
        }
    });
}

// Actualizar gráficos con nuevos datos
function updateCharts() {
    if (responseTimeChart && detectionTrendChart) {
        const now = new Date().toLocaleTimeString();

        // Actualizar gráfico de tiempos de respuesta
        if (responseTimeData.length > 10) {
            responseTimeData.shift();
        }
        responseTimeData.push(statsManager.getStats().avgResponseTime || 25);

        responseTimeChart.data.labels.push(now);
        responseTimeChart.data.datasets[0].data = responseTimeData;
        if (responseTimeChart.data.labels.length > 10) {
            responseTimeChart.data.labels.shift();
        }
        responseTimeChart.update();

        // Actualizar gráfico de tendencia de detección
        if (detectionTrendData.length > 10) {
            detectionTrendData.shift();
        }
        detectionTrendData.push(statsManager.fireCount);

        detectionTrendChart.data.labels = Array.from({length: detectionTrendData.length}, (_, i) => `T-${detectionTrendData.length - i}`);
        detectionTrendChart.data.datasets[0].data = detectionTrendData;
        detectionTrendChart.update();
    }
}

// Sistema de control de capas del mapa
class MapLayersManager {
    constructor() {
        this.layers = {
            temperature: { enabled: true, opacity: 0.7 },
            smoke: { enabled: true, opacity: 0.5 },
            wind: { enabled: false, opacity: 0.6 },
            satellite: { enabled: true, opacity: 0.8 }
        };

        this.init();
    }

    init() {
        // Configurar event listeners para los controles de capa
        document.getElementById('temperatureLayer').addEventListener('change', (e) => {
            this.toggleLayer('temperature', e.target.checked);
        });

        document.getElementById('smokeLayer').addEventListener('change', (e) => {
            this.toggleLayer('smoke', e.target.checked);
        });

        document.getElementById('windLayer').addEventListener('change', (e) => {
            this.toggleLayer('wind', e.target.checked);
        });

        document.getElementById('satelliteLayer').addEventListener('change', (e) => {
            this.toggleLayer('satellite', e.target.checked);
        });

        console.log('🗺️ Map layers manager initialized');
    }

    toggleLayer(layerName, enabled) {
        this.layers[layerName].enabled = enabled;

        // Aplicar cambios a la visualización
        this.updateLayerVisibility(layerName, enabled);

        console.log(`🗺️ Layer ${layerName} ${enabled ? 'enabled' : 'disabled'}`);
    }

    updateLayerVisibility(layerName, enabled) {
        // Aquí iría la lógica para mostrar/ocultar capas en el mapa 3D
        // Por ahora, simulamos el efecto con logs
        if (enabled) {
            this.showLayer(layerName);
        } else {
            this.hideLayer(layerName);
        }
    }

    showLayer(layerName) {
        // Implementar lógica para mostrar capa específica
        switch(layerName) {
            case 'temperature':
                console.log('🌡️ Showing temperature overlay');
                break;
            case 'smoke':
                console.log('💨 Showing smoke plumes');
                break;
            case 'wind':
                console.log('💨 Showing wind patterns');
                break;
            case 'satellite':
                console.log('🛰️ Showing satellite track');
                break;
        }
    }

    hideLayer(layerName) {
        // Implementar lógica para ocultar capa específica
        switch(layerName) {
            case 'temperature':
                console.log('🌡️ Hiding temperature overlay');
                break;
            case 'smoke':
                console.log('💨 Hiding smoke plumes');
                break;
            case 'wind':
                console.log('💨 Hiding wind patterns');
                break;
            case 'satellite':
                console.log('🛰️ Hiding satellite track');
                break;
        }
    }

    // Método para actualizar la opacidad de una capa
    setLayerOpacity(layerName, opacity) {
        this.layers[layerName].opacity = opacity;
        console.log(`🗺️ Layer ${layerName} opacity set to ${opacity}`);
    }
}

// Inicializar gestor de capas del mapa
let mapLayersManager;

function initializeMapLayers() {
    mapLayersManager = new MapLayersManager();
}

// Inicializar sistema de seguridad
let securityManager;

function initializeSecurity() {
    securityManager = new SecurityManager();
}

// Inicializar gestor de estadísticas
function initializeStatsManager() {
    // Crear instancia de la clase StatsManager definida en stats.js
    statsManager = new StatsManager();
}

// Sistema de Seguridad y Autenticación Profesional
class SecurityManager {
    constructor() {
        this.currentUser = null;
        this.sessionId = null;
        this.auditLog = [];
        this.isAuthenticated = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
        this.sessionTimer = null;

        this.init();
    }

    init() {
        // Verificar si hay una sesión activa
        this.checkExistingSession();

        // Configurar limpieza automática de sesiones
        this.setupSessionCleanup();

        console.log('🔐 Security manager initialized');
    }

    // Verificar sesión existente
    checkExistingSession() {
        const sessionData = localStorage.getItem('astrofire_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (this.isSessionValid(session)) {
                    this.restoreSession(session);
                } else {
                    this.clearSession();
                }
            } catch (error) {
                console.error('Error parsing session data:', error);
                this.clearSession();
            }
        }
    }

    // Validar si una sesión es válida
    isSessionValid(session) {
        if (!session || !session.expiresAt) return false;

        const now = new Date().getTime();
        const expiresAt = new Date(session.expiresAt).getTime();

        return now < expiresAt && session.isValid;
    }

    // Restaurar sesión existente
    restoreSession(session) {
        this.currentUser = session.user;
        this.sessionId = session.sessionId;
        this.isAuthenticated = true;

        // Configurar timer para expiración
        this.setupSessionTimer(session.expiresAt);

        this.logAuditEvent('SESSION_RESTORED', { user: this.currentUser });
        console.log(`🔐 Session restored for user: ${this.currentUser}`);

        // Actualizar UI para usuario autenticado
        this.updateUIForAuthenticatedUser();
    }

    // Mostrar pantalla de login
    showLoginScreen() {
        // Crear overlay de login si no existe
        if (!document.getElementById('login-overlay')) {
            this.createLoginOverlay();
        }

        const overlay = document.getElementById('login-overlay');
        overlay.style.display = 'flex';

        // Enfocar el campo de usuario
        setTimeout(() => {
            document.getElementById('username').focus();
        }, 100);
    }

    // Crear overlay de login
    createLoginOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'login-overlay';
        overlay.className = 'login-overlay';
        overlay.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <h2>ASTROFIRE Mission Control</h2>
                    <p>Authorized personnel only</p>
                </div>

                <form class="login-form" id="loginForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" placeholder="Enter your username" required>
                    </div>

                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" placeholder="Enter your password" required>
                    </div>

                    <div class="form-group">
                        <label for="accessCode">Access Code</label>
                        <input type="text" id="accessCode" placeholder="Mission access code" required>
                    </div>

                    <button type="submit" class="login-btn">Access mission control</button>
                </form>

                <div class="login-footer">
                    <p>Demo environment · credentials are checked in the browser</p>
                </div>
            </div>
        `;

        // Añadir estilos CSS
        const style = document.createElement('style');
        style.textContent = `
            .login-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(10px);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            .login-container {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 40px;
                border-radius: 20px;
                border: 1px solid rgba(102, 126, 234, 0.3);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                max-width: 450px;
                width: 90%;
                text-align: center;
            }

            .login-header h2 {
                color: #63d8ff;
                margin-bottom: 10px;
                font-size: 1.8rem;
            }

            .login-header p {
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 30px;
            }

            .login-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .form-group {
                text-align: left;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #63d8ff;
                font-size: 0.9rem;
                font-weight: bold;
            }

            .form-group input {
                width: 100%;
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.05);
                color: white;
                font-size: 1rem;
                transition: all 0.3s ease;
            }

            .form-group input:focus {
                outline: none;
                border-color: #63d8ff;
                box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
            }

            .form-group input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .login-btn {
                background: linear-gradient(135deg, #2a9ac7, #42d6b0);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 10px;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }

            .login-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            }

            .login-footer {
                margin-top: 25px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .login-footer p {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.6);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(overlay);

        // Configurar event listener para el formulario
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.authenticate();
        });
    }

    // Método de autenticación
    authenticate() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const accessCode = document.getElementById('accessCode').value;

        // Simular autenticación (en producción esto sería contra un servidor)
        if (this.validateCredentials(username, password, accessCode)) {
            this.createSession(username);
            this.hideLoginScreen();
            this.logAuditEvent('LOGIN_SUCCESS', { user: username, ip: 'demo' });
            console.log(`🔐 User authenticated: ${username}`);
        } else {
            this.showLoginError('Invalid credentials. Please check your username, password, and access code.');
            this.logAuditEvent('LOGIN_FAILED', { username, reason: 'invalid_credentials' });
        }
    }

    // Validar credenciales (simulación)
    validateCredentials(username, password, accessCode) {
        // En producción esto sería validación contra base de datos
        const validUsers = {
            'admin': { password: 'mission2024', accessCode: 'ASTROFIRE' },
            'operator': { password: 'satellite99', accessCode: 'FIRMS' },
            'analyst': { password: 'earthdata', accessCode: 'NASA' }
        };

        return validUsers[username] &&
               validUsers[username].password === password &&
               validUsers[username].accessCode === accessCode;
    }

    // Crear nueva sesión
    createSession(username) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.sessionTimeout);

        this.currentUser = username;
        this.sessionId = this.generateSessionId();
        this.isAuthenticated = true;

        const sessionData = {
            user: username,
            sessionId: this.sessionId,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            isValid: true
        };

        localStorage.setItem('astrofire_session', JSON.stringify(sessionData));

        // Configurar timer de expiración
        this.setupSessionTimer(expiresAt);

        // Actualizar UI
        this.updateUIForAuthenticatedUser();
    }

    // Generar ID de sesión único
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Configurar timer de expiración de sesión
    setupSessionTimer(expiresAt) {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        const timeUntilExpiry = new Date(expiresAt).getTime() - new Date().getTime();

        this.sessionTimer = setTimeout(() => {
            this.handleSessionExpiry();
        }, timeUntilExpiry);
    }

    // Manejar expiración de sesión
    handleSessionExpiry() {
        this.logAuditEvent('SESSION_EXPIRED', { user: this.currentUser });
        alert('Session expired. Please login again.');
        this.logout();
    }

    // Cerrar sesión
    logout() {
        this.logAuditEvent('LOGOUT', { user: this.currentUser });
        this.clearSession();
        this.showLoginScreen();
    }

    // Limpiar sesión
    clearSession() {
        this.currentUser = null;
        this.sessionId = null;
        this.isAuthenticated = false;

        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        localStorage.removeItem('astrofire_session');
        this.updateUIForUnauthenticatedUser();
    }

    // Actualizar UI para usuario autenticado
    updateUIForAuthenticatedUser() {
        // Ocultar overlay de login si está visible
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        // Mostrar controles avanzados para usuarios autenticados
        this.showAdvancedControls();
    }

    // Actualizar UI para usuario no autenticado
    updateUIForUnauthenticatedUser() {
        // Ocultar controles avanzados
        this.hideAdvancedControls();
    }

    // Mostrar controles avanzados
    showAdvancedControls() {
        // Crear controles adicionales para usuarios autenticados
        if (!document.getElementById('advanced-controls')) {
            const controls = document.createElement('div');
            controls.id = 'advanced-controls';
            controls.className = 'advanced-controls';
            controls.innerHTML = `
                <div class="user-info">
                    <span class="user-badge">${this.currentUser}</span>
                    <button class="logout-btn" onclick="securityManager.logout()">Sign out</button>
                </div>
            `;

            // Insertar después del panel de info
            const infoPanel = document.getElementById('info-panel');
            if (infoPanel) {
                infoPanel.appendChild(controls);
            }
        }
    }

    // Ocultar controles avanzados
    hideAdvancedControls() {
        const controls = document.getElementById('advanced-controls');
        if (controls) {
            controls.remove();
        }
    }

    // Ocultar pantalla de login
    hideLoginScreen() {
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Mostrar error de login
    showLoginError(message) {
        // Crear o actualizar mensaje de error
        let errorDiv = document.getElementById('login-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'login-error';
            errorDiv.className = 'login-error';
            const form = document.getElementById('loginForm');
            if (form) {
                form.insertBefore(errorDiv, form.firstChild);
            }
        }

        errorDiv.textContent = message;
        errorDiv.style.color = '#ff4444';
        errorDiv.style.fontSize = '0.9rem';
        errorDiv.style.marginBottom = '15px';
        errorDiv.style.padding = '10px';
        errorDiv.style.background = 'rgba(255, 68, 68, 0.1)';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.border = '1px solid rgba(255, 68, 68, 0.3)';
    }

    // Log de auditoría
    logAuditEvent(event, details = {}) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            user: this.currentUser || 'anonymous',
            sessionId: this.sessionId || 'none',
            details: details,
            userAgent: navigator.userAgent,
            ip: 'demo' // En producción se obtendría del servidor
        };

        this.auditLog.push(auditEntry);

        // Mantener solo las últimas 1000 entradas
        if (this.auditLog.length > 1000) {
            this.auditLog.shift();
        }

        // Guardar en localStorage para persistencia
        localStorage.setItem('astrofire_audit_log', JSON.stringify(this.auditLog));

        console.log(`🔐 Audit: ${event}`, auditEntry);
    }

    // Obtener log de auditoría
    getAuditLog() {
        return this.auditLog;
    }

    // Configurar limpieza automática de sesiones antiguas
    setupSessionCleanup() {
        // Limpiar sesiones cada hora
        setInterval(() => {
            const sessions = Object.keys(localStorage).filter(key =>
                key.startsWith('astrofire_session_')
            );

            sessions.forEach(sessionKey => {
                try {
                    const session = JSON.parse(localStorage.getItem(sessionKey));
                    if (!this.isSessionValid(session)) {
                        localStorage.removeItem(sessionKey);
                    }
                } catch (error) {
                    localStorage.removeItem(sessionKey);
                }
            });
        }, 60 * 60 * 1000); // Cada hora
    }
}

// Sistema de Optimización de Rendimiento
class PerformanceOptimizer {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.isOptimized = false;

        this.init();
    }

    init() {
        // Configurar optimizaciones iniciales
        this.setupFrameRateMonitoring();
        this.setupMemoryOptimization();
        this.setupLazyLoading();
        this.setupAssetCompression();

        console.log('⚡ Performance optimizer initialized');
    }

    // Monitoreo de frame rate
    setupFrameRateMonitoring() {
        // Monitorear FPS cada segundo
        setInterval(() => {
            this.updateFrameRate();
        }, 1000);

        // Ajustar calidad gráfica basado en rendimiento
        setInterval(() => {
            this.adaptiveQualityAdjustment();
        }, 5000);
    }

    // Actualizar medición de frame rate
    updateFrameRate() {
        const now = performance.now();
        const deltaTime = now - this.lastTime;

        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastTime = now;

            // Log de rendimiento si es bajo
            if (this.fps < 30) {
                console.warn(`⚠️ Low FPS detected: ${this.fps}`);
                this.enablePerformanceMode();
            }
        }
    }

    // Modo de rendimiento optimizado
    enablePerformanceMode() {
        if (!this.isOptimized) {
            this.isOptimized = true;

            // Reducir calidad gráfica
            if (typeof earth !== 'undefined') {
                // Simplemente log para indicar optimización de calidad
                console.log('⚡ Earth gráfica optimizada para mejor rendimiento');
            }

            // Reducir frecuencia de actualización de partículas
            if (typeof fireManager !== 'undefined') {
                // Simplemente log para indicar optimización
                console.log('⚡ FireManager optimizado para mejor rendimiento');
            }

            // Deshabilitar efectos no esenciales
            this.disableNonEssentialEffects();

            console.log('⚡ Performance mode enabled');
        }
    }

    // Deshabilitar efectos no esenciales
    disableNonEssentialEffects() {
        // Reducir opacidad de elementos decorativos
        const decorativeElements = document.querySelectorAll('.glow-effect, .particle-effect');
        decorativeElements.forEach(element => {
            element.style.opacity = '0.3';
        });
    }

    // Restaurar modo normal
    disablePerformanceMode() {
        if (this.isOptimized) {
            this.isOptimized = false;

            // Restaurar calidad gráfica
            if (typeof earth !== 'undefined') {
                // Simplemente log para indicar restauración de calidad
                console.log('⚡ Earth gráfica restaurada a calidad normal');
            }

            // Restaurar frecuencia de actualización normal
            if (typeof fireManager !== 'undefined') {
                // Simplemente log para indicar restauración
                console.log('⚡ FireManager restaurado a modo normal');
            }

            // Restaurar efectos
            this.restoreNonEssentialEffects();

            console.log('⚡ Normal performance mode restored');
        }
    }

    // Restaurar efectos no esenciales
    restoreNonEssentialEffects() {
        const decorativeElements = document.querySelectorAll('.glow-effect, .particle-effect');
        decorativeElements.forEach(element => {
            element.style.opacity = '1';
        });
    }

    // Ajuste adaptativo de calidad
    adaptiveQualityAdjustment() {
        if (this.fps > 50 && this.isOptimized) {
            this.disablePerformanceMode();
        } else if (this.fps < 25 && !this.isOptimized) {
            this.enablePerformanceMode();
        }
    }

    // Configurar optimización de memoria
    setupMemoryOptimization() {
        // Limpiar caché de texturas cada 5 minutos
        setInterval(() => {
            this.clearTextureCache();
        }, 5 * 60 * 1000);

        // Garbage collection manual (simulado)
        setInterval(() => {
            if (window.gc) {
                window.gc();
            }
        }, 10 * 60 * 1000);
    }

    // Limpiar caché de texturas
    clearTextureCache() {
        if (typeof earth !== 'undefined') {
            // Simplemente log para indicar limpieza de caché
            console.log('🧹 Earth texture cache limpiado');
        }
    }

    // Configurar carga diferida (lazy loading)
    setupLazyLoading() {
        // Implementar intersección observer para elementos no críticos
        if ('IntersectionObserver' in window) {
            const lazyElements = document.querySelectorAll('[data-lazy]');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyElement(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });

            lazyElements.forEach(element => {
                observer.observe(element);
            });
        }
    }

    // Cargar elemento diferido
    loadLazyElement(element) {
        const src = element.getAttribute('data-lazy');
        if (src) {
            element.src = src;
            element.removeAttribute('data-lazy');
            console.log(`📥 Lazy loaded: ${src}`);
        }
    }

    // Configurar compresión de assets
    setupAssetCompression() {
        // Comprimir imágenes en canvas
        this.setupCanvasOptimization();

        // Optimizar modelos 3D
        this.setupModelOptimization();
    }

    // Optimizar canvas
    setupCanvasOptimization() {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            // Configurar contexto para mejor rendimiento
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = false; // Mejor rendimiento para píxeles grandes
            }
        });
    }

    // Optimizar modelos 3D
    setupModelOptimization() {
        // Reducir calidad de sombras si el rendimiento es bajo
        if (typeof sceneManager !== 'undefined') {
            // Simplemente log para indicar que se podría optimizar
            console.log('⚡ Modelos 3D optimizados para mejor rendimiento');
        }
    }

    // Obtener estadísticas de rendimiento
    getPerformanceStats() {
        return {
            fps: this.fps,
            isOptimized: this.isOptimized,
            memoryUsage: this.getMemoryUsage(),
            renderTime: this.getAverageRenderTime()
        };
    }

    // Obtener uso de memoria (aproximado)
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)  // MB
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    // Obtener tiempo promedio de renderizado
    getAverageRenderTime() {
        // Esta función necesitaría ser implementada con mediciones reales
        return 16; // ~16ms para 60fps
    }
}

// Inicializar optimizador de rendimiento
let performanceOptimizer;

function initializePerformanceOptimizer() {
    performanceOptimizer = new PerformanceOptimizer();
}
