// Tierra 3D, máscara de tierra y puntos de calor geográficamente estáticos
class Earth {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.model = null;
        this.initialized = false;
        this.redPoints = [];
        this.nextPointId = 1;
        this.init();
    }

    async init() {
        this.scene.add(this.mesh);
        try {
            const loader = new THREE.GLTFLoader();
            const gltf = await new Promise((resolve, reject) => loader.load(CONFIG.CUSTOM_ASSETS.EARTH_MODEL, resolve, undefined, reject));
            this.model = gltf.scene;
            this.model.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) node.material.needsUpdate = true;
                }
            });
            const box = new THREE.Box3().setFromObject(this.model);
            const size = box.getSize(new THREE.Vector3());
            this.model.scale.setScalar((CONFIG.SCENE.EARTH_RADIUS * 2) / (Math.max(size.x, size.y, size.z) || 1));
            const centeredBox = new THREE.Box3().setFromObject(this.model);
            this.model.position.sub(centeredBox.getCenter(new THREE.Vector3()));
            this.mesh.add(this.model);
            console.log('✅ Modelo 3D de la Tierra cargado');
        } catch (error) {
            console.warn('⚠️ Tierra GLB no disponible; usando respaldo geométrico.', error);
            this.model = new THREE.Mesh(
                new THREE.SphereGeometry(CONFIG.SCENE.EARTH_RADIUS, 64, 64),
                new THREE.MeshStandardMaterial({ color: 0x2454a6, roughness: 0.72, metalness: 0.08 })
            );
            this.mesh.add(this.model);
        }
        this.mesh.add(new THREE.Mesh(
            new THREE.SphereGeometry(CONFIG.SCENE.EARTH_RADIUS * 1.035, 48, 48),
            new THREE.MeshBasicMaterial({ color: 0x3a9cff, transparent: true, opacity: 0.08, side: THREE.BackSide })
        ));
        this.initialized = true;
    }

    update() {
        this.mesh.rotation.y += CONFIG.SCENE.EARTH_ROTATION_SPEED;
        this.redPoints.forEach(point => {
            if (!point.marker || point.detected) return;
            const elapsed = (Date.now() - point.createdAt) / 1000;
            const growth = Math.min(CONFIG.FIRE_GENERATION.MAX_SCALE, 1 + elapsed * CONFIG.FIRE_GENERATION.GROWTH_PER_SECOND);
            point.marker.scale.setScalar(growth);
            point.glow.scale.setScalar(growth * 1.5);
        });
    }

    geoToCartesian(latitude, longitude, radius) {
        const phi = (90 - latitude) * Math.PI / 180;
        const theta = (longitude + 180) * Math.PI / 180;
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    // Polígonos continentales simplificados para una validación local, rápida y determinista.
    isLandCoordinate(latitude, longitude) {
        if (Math.abs(latitude) > CONFIG.FIRE_GENERATION.POLAR_LIMIT) return false;
        const regions = [
            [[-168, 15], [-168, 55], [-142, 72], [-52, 70], [-52, 15], [-82, 7]], // Norteamérica
            [[-82, 13], [-35, 13], [-34, -55], [-75, -56], [-82, -10]], // Sudamérica
            [[-18, 36], [52, 36], [52, -35], [10, -35], [-18, 0]], // África
            [[-11, 35], [42, 72], [180, 72], [180, 15], [135, 6], [85, 8], [45, 25], [10, 35]], // Europa-Asia
            [[95, 25], [145, 25], [153, -10], [112, -10], [95, 5]], // Sudeste asiático
            [[112, -10], [154, -10], [154, -44], [112, -44]] // Australia
        ];
        return regions.some(polygon => this.pointInPolygon(longitude, latitude, polygon));
    }

    pointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            const intersects = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
            if (intersects) inside = !inside;
        }
        return inside;
    }

    createFirePoint() {
        for (let attempt = 0; attempt < CONFIG.FIRE_GENERATION.MAX_ATTEMPTS; attempt++) {
            const latitude = CONFIG.FIRE_GENERATION.LATITUDE_MIN + Math.random() * (CONFIG.FIRE_GENERATION.LATITUDE_MAX - CONFIG.FIRE_GENERATION.LATITUDE_MIN);
            const longitude = -180 + Math.random() * 360;
            if (!this.isLandCoordinate(latitude, longitude)) continue;

            const point = {
                pointId: `fire-${this.nextPointId++}`,
                latitude, longitude, x: longitude, y: latitude,
                brightness: 330 + Math.random() * 70,
                confidence: 78 + Math.random() * 20,
                createdAt: Date.now(), detected: false
            };
            const position = this.geoToCartesian(latitude, longitude, CONFIG.SCENE.EARTH_RADIUS + 0.055);
            point.marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.055, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xff4b2b, transparent: true, opacity: 0.95 })
            );
            point.marker.position.copy(position);
            point.glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 1 })
            );
            point.marker.add(point.glow);
            this.mesh.add(point.marker);
            this.redPoints.push(point);
            console.log(`🔥 Incendio terrestre creado en ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
            return point;
        }
        console.warn('⚠️ No se encontró una ubicación continental válida para el nuevo incendio.');
        return null;
    }

    addFirePointFromData(fireData) {
        const point = {
            ...fireData,
            pointId: fireData.pointId || `firms-${fireData.latitude.toFixed(3)}-${fireData.longitude.toFixed(3)}-${fireData.acq_date}-${fireData.acq_time}`,
            x: fireData.longitude,
            y: fireData.latitude,
            createdAt: Date.now(),
            detected: false
        };
        const position = this.geoToCartesian(point.latitude, point.longitude, CONFIG.SCENE.EARTH_RADIUS + 0.055);
        point.marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff4b2b, transparent: true, opacity: 0.95 })
        );
        point.marker.position.copy(position);
        point.glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 1 })
        );
        point.marker.add(point.glow);
        this.mesh.add(point.marker);
        this.redPoints.push(point);
        return point;
    }

    detectRedPixels(satelliteFleet) {
        if (CONFIG.MODE !== 'REAL_DATA' && CONFIG.AUTO_FIRE_GENERATION.ENABLED && this.redPoints.length === 0) this.createFirePoint();
        if (!satelliteFleet) return [];
        return this.redPoints.filter(point => !point.detected && satelliteFleet.isPointCovered(point, this));
    }

    markPointAsDetected(pointId) {
        const point = this.redPoints.find(item => item.pointId === pointId);
        if (point) {
            point.detected = true;
            point.marker.material.color.setHex(0xffd166);
        }
    }

    removeRedPoint(x, y) {
        const index = this.redPoints.findIndex(point => Math.abs(point.x - x) < 0.01 && Math.abs(point.y - y) < 0.01);
        if (index === -1) return false;
        const point = this.redPoints[index];
        this.mesh.remove(point.marker);
        point.marker.geometry.dispose();
        point.marker.material.dispose();
        point.glow.geometry.dispose();
        point.glow.material.dispose();
        this.redPoints.splice(index, 1);
        return true;
    }
}
