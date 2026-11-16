// Configuración de la aplicación
const CONFIG = {
    // NASA FIRMS API (para datos reales de incendios)
    NASA_FIRMS_API: {
        BASE_URL: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/',
        MAP_KEY: window.NASA_FIRMS_API_KEY || 'YOUR_NASA_API_KEY_HERE',
        SOURCE: 'VIIRS_NOAA20_NRT',
        SOURCES: ['VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT', 'MODIS_NRT'], // Suomi NPP dejó de entregar datos el 2-nov-2026
        AREA: '-81.5,-18.5,-68.5,0', // oeste,sur,este,norte (Perú)
        DAY_RANGE: '1', // últimas 24 h
        UPDATE_INTERVAL_MS: 15 * 60 * 1000,
        PERU_BBOX: { minLatitude: -18.5, maxLatitude: 0.0, minLongitude: -81.5, maxLongitude: -68.5 }
    },

    // NASA Earthdata GIBS API para mapas con incendios
    EARTHDATA_GIBS: {
        // GIBS proporciona imágenes de la Tierra con capas de incendios
        BASE_URL: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/',
        LAYER: 'VIIRS_SNPP_Thermal_Anomalies_375m_Day', // Capa de anomalías térmicas
        TILE_MATRIX_SET: 'EPSG4326_500m',
        FORMAT: 'image/png'
    },

    // Modelo 3D del satélite
    SATELLITE_MODEL: {
        PATH: './assets/satellite.glb', // Ruta al modelo 3D
        SCALE: 0.002 // Escala del modelo (reducido a 1/10 del tamaño anterior)
    },

    // Configuración de la escena 3D
    SCENE: {
        EARTH_RADIUS: 2,
        SATELLITE_ORBIT_RADIUS: 4.0, // Reducido para acercar el satélite a la Tierra
        SATELLITE_SPEED: 0.004,
        EARTH_ROTATION_SPEED: 0.001,
        CAMERA_DISTANCE: 6
    },

    // Configuración de simulación
    SIMULATION: {
        // Tiempo entre detecciones (ms) - para modo simulación
        DETECTION_INTERVAL_MIN: 8000,
        DETECTION_INTERVAL_MAX: 15000,
        // Tiempo de vida de un punto de calor (ms)
        FIRE_LIFETIME: 12000,
        // Tiempo promedio de respuesta sin satélite (minutos)
        TRADITIONAL_RESPONSE_TIME: 120,
        // Rango de tiempo de respuesta con satélite (minutos)
        SATELLITE_RESPONSE_MIN: 15,
        SATELLITE_RESPONSE_MAX: 35
    },

    // Reglas geográficas y visuales del generador local de incendios
    FIRE_GENERATION: {
        POLAR_LIMIT: 66,
        LATITUDE_MIN: -66,
        LATITUDE_MAX: 66,
        MAX_ATTEMPTS: 250,
        GROWTH_PER_SECOND: 0.005,
        MAX_SCALE: 1.5,
        SCAN_LENGTH: 3.2,
        SCAN_BASE_RADIUS: 1.15,
        DETECTION_MARGIN: 0.18
    },

    // Detección de incendios
    FIRE_DETECTION: {
        // Umbral de color rojo para detectar incendios (0-255)
        RED_THRESHOLD: 200,
        // Sensibilidad de detección
        SENSITIVITY: 0.8,
        // Intervalo de escaneo del satélite (ms)
        SCAN_INTERVAL: 3000
    },

    // Generación automática de puntos rojos en el mapa
    AUTO_FIRE_GENERATION: {
        ENABLED: true,
        // Intervalo para generar nuevos puntos rojos (ms)
        INTERVAL: 15000,
        // Cantidad de puntos a generar por intervalo
        POINTS_PER_INTERVAL: 1,
        // Tamaño del punto rojo en píxeles
        POINT_SIZE: 12,
        // Tiempo de vida del punto (ms) - null para permanente hasta ser detectado
        LIFETIME: null,  // Permanente hasta que el satélite lo detecte
        // Delay antes de que el satélite pueda detectar un nuevo incendio (ms)
        DETECTION_DELAY: 500  // Reducido a 0.5 segundos para pruebas más rápidas
    },

    // Assets personalizados
    CUSTOM_ASSETS: {
        // Modelo 3D de la Tierra (opcional)
        EARTH_MODEL: './assets/earth.glb', // Modelo 3D de la Tierra
        // Textura personalizada de la Tierra (opcional, si no usas modelo)
        EARTH_TEXTURE: null, // Ej: 'assets/textures/earth_custom.jpg'
        // Textura de nubes (opcional)
        CLOUDS_TEXTURE: null, // Ej: 'assets/textures/clouds.png'
        // Overlay de incendios (opcional)
        FIRE_OVERLAY: null // Ej: 'assets/textures/fires_overlay.png'
    },

    // Usar modelo 3D de la Tierra en vez de esfera con textura
    USE_EARTH_MODEL: true,

    // Modo de operación
    MODE: 'REAL_DATA',
    USE_REAL_API: true,
    
    // Configuración de internacionalización
    INTERNATIONALIZATION: {
        DEFAULT_LANGUAGE: 'en', // Inglés por defecto
        ENABLED: false // Deshabilitar sistema de cambio de idioma
    },
    // Agregar dentro de CONFIG en config.js
    NASA_POWER_API: {
        BASE_URL: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
        COMMUNITY: 'AG', // Agroclimatología
        PARAMETERS: 'RH2M,T2M', // RH2M: Humedad Relativa a 2m (%), T2M: Temperatura a 2m (°C)
        FORMAT: 'JSON'
    },
};
