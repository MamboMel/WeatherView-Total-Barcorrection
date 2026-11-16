// Satélite individual y flota orbital de tres plataformas
class Satellite {
    constructor(scene, phase = 0, index = 0) {
        this.scene = scene;
        this.phase = phase;
        this.index = index;
        // Satélite 1: órbita vertical que cruza los polos en el plano X-Y.
        // Satélites 2 y 3: órbitas horizontales alrededor del eje Y en el plano X-Z.
        this.orbitMode = index === 0 ? 'vertical-x-y' : 'horizontal-x-z';
        this.mesh = new THREE.Group();
        this.orbitAngle = phase;
        this.scanBeam = null;
        this.model = null;
        this.initialized = false;
        this.init().then(() => { this.initialized = true; }).catch(error => console.error('❌ Satélite:', error));
    }

    async init() {
        await this.loadCustomModel();
        this.addScanBeam();
        this.scene.add(this.mesh);
        this.updatePosition();
    }

    async loadCustomModel() {
        try {
            const loader = new THREE.GLTFLoader();
            const gltf = await new Promise((resolve, reject) => loader.load(CONFIG.SATELLITE_MODEL.PATH, resolve, undefined, reject));
            this.model = gltf.scene;
            this.model.traverse(node => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
            const box = new THREE.Box3().setFromObject(this.model);
            const size = box.getSize(new THREE.Vector3());
            this.model.scale.setScalar(0.72 / (Math.max(size.x, size.y, size.z) || 1));
            const centered = new THREE.Box3().setFromObject(this.model);
            this.model.position.sub(centered.getCenter(new THREE.Vector3()));
            this.mesh.add(this.model);
        } catch (error) {
            const body = new THREE.Mesh(new THREE.BoxGeometry(.34, .22, .46), new THREE.MeshStandardMaterial({ color: 0xd5dbe7, metalness: .7, roughness: .32 }));
            this.mesh.add(body);
        }
    }

    addScanBeam() {
        const height = 3.2;
        this.scanBeam = new THREE.Mesh(
            new THREE.ConeGeometry(1.15, height, 48, 1, true),
            new THREE.MeshBasicMaterial({ color: 0x36e0b0, transparent: true, opacity: .13, side: THREE.DoubleSide, depthWrite: false })
        );
        // El cono apunta por +Z después de rotar -90° sobre X; lookAt alinea +Z con la Tierra.
        this.scanBeam.rotation.x = -Math.PI / 2;
        this.scanBeam.position.z = height / 2;
        this.mesh.add(this.scanBeam);
    }

    updatePosition() {
        const r = CONFIG.SCENE.SATELLITE_ORBIT_RADIUS;
        if (this.orbitMode === 'vertical-x-y') {
            // Conserva la posición inicial actual: (x=r, y=0, z=0).
            this.mesh.position.set(r * Math.cos(this.orbitAngle), r * Math.sin(this.orbitAngle), 0);
        } else {
            this.mesh.position.set(r * Math.cos(this.orbitAngle), 0, r * Math.sin(this.orbitAngle));
        }
        this.mesh.lookAt(0, 0, 0);
    }

    update() {
        this.orbitAngle += CONFIG.SCENE.SATELLITE_SPEED;
        this.updatePosition();
        if (this.scanBeam) this.scanBeam.material.opacity = .10 + Math.sin(Date.now() * .003 + this.index) * .035;
    }

    coversPoint(point, earth) {
        if (!point || !point.marker) return false;
        const worldPoint = point.marker.getWorldPosition(new THREE.Vector3());
        const axis = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), this.mesh.position).normalize();
        const fromSatellite = new THREE.Vector3().subVectors(worldPoint, this.mesh.position);
        const distance = fromSatellite.length();
        const axialDistance = fromSatellite.dot(axis);
        if (axialDistance <= 0 || axialDistance > CONFIG.FIRE_GENERATION.SCAN_LENGTH) return false;

        // Intersección física con el volumen del cono: el radio permitido crece desde
        // la base del satélite hacia la superficie. El margen adicional representa el halo.
        const lateralDistance = fromSatellite.clone().sub(axis.clone().multiplyScalar(axialDistance)).length();
        const coneRadius = CONFIG.FIRE_GENERATION.SCAN_BASE_RADIUS * (axialDistance / CONFIG.FIRE_GENERATION.SCAN_LENGTH);
        const haloRadius = CONFIG.FIRE_GENERATION.DETECTION_MARGIN * (point.marker.scale.x || 1);
        return distance <= CONFIG.SCENE.SATELLITE_ORBIT_RADIUS + .4 && lateralDistance <= coneRadius + haloRadius;
    }

    flashDetection() {
        if (!this.scanBeam) return;
        this.scanBeam.material.color.setHex(0xff7a45);
        this.scanBeam.material.opacity = .3;
        setTimeout(() => { if (this.scanBeam) { this.scanBeam.material.color.setHex(0x36e0b0); this.scanBeam.material.opacity = .13; } }, 500);
    }
}

class SatelliteFleet {
    constructor(scene) {
        this.satellites = [0, 1, 2].map(index => new Satellite(scene, index * Math.PI * 2 / 3, index));
        this.initialized = false;
        this.waitForSatellites();
    }

    async waitForSatellites() {
        while (this.satellites.some(satellite => !satellite.initialized)) await new Promise(resolve => setTimeout(resolve, 50));
        this.initialized = true;
        console.log('✅ Flota orbital inicializada: 3 satélites');
    }

    update() { this.satellites.forEach(satellite => satellite.update()); }
    isPointCovered(point, earth) { return this.satellites.some(satellite => satellite.coversPoint(point, earth)); }
    flashDetection() { this.satellites.forEach(satellite => satellite.flashDetection()); }
}
