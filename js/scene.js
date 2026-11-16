// Configuración de la escena Three.js
class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.init();
    }

    init() {
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Configurar cámara
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = CONFIG.SCENE.CAMERA_DISTANCE;

        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Agregar luces
        this.setupLights();

        // Configurar controles de órbita
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;
        this.controls.enablePan = false;

        // Agregar estrellas de fondo
        this.addStars();

        // Manejar redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLights() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Luz direccional (simula el sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);

        // Luz puntual adicional
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-5, -3, -5);
        this.scene.add(pointLight);
    }

    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true
        });

        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(starsVertices, 3)
        );

        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
