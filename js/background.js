/**
 * Three.js Animated Background Module
 * Handles the WebGL background with texture transitions
 */

import { vertexShader, fragmentShader } from './shaders.js';

/**
 * Configuration for the background animation
 */
const CONFIG = {
    transitionSpeed: 0.01,
    timeStep: 0.01,
    textures: {
        default: 'images/backgrounds/starry-night.jpg',
        orange: 'images/backgrounds/orangeSN.png',
        graduation: 'images/VG/graduationVG.png'
    }
};

/**
 * Background class manages the Three.js animated background
 */
class Background {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.material = null;
        this.textures = {};

        // Transition state
        this.targetTexture = null;
        this.currentSourceTexture = null;
        this.transitionProgress = 0;
        this.isTransitioning = false;
        this.time = 0;

        this.init();
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Load textures and setup
        this.loadTextures().then(() => {
            this.setupMaterial();
            this.setupInteractions();
            this.animate();
        });

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Load all textures with error handling
     */
    async loadTextures() {
        const loader = new THREE.TextureLoader();

        const loadTex = (url) => new Promise((resolve) => {
            loader.load(
                url,
                (tex) => resolve(tex),
                undefined,
                (err) => {
                    console.error(`Failed to load texture: ${url}`, err);
                    resolve(null);
                }
            );
        });

        const [texDefault, texOrange, texGrad] = await Promise.all([
            loadTex(CONFIG.textures.default),
            loadTex(CONFIG.textures.orange),
            loadTex(CONFIG.textures.graduation)
        ]);

        // Handle fallbacks
        this.textures.default = texDefault || new THREE.Texture();
        this.textures.orange = texOrange || this.textures.default;
        this.textures.graduation = texGrad || this.textures.default;

        if (!texDefault) {
            console.error('Critical: Default texture failed to load.');
        }

        this.targetTexture = this.textures.default;
        this.currentSourceTexture = this.textures.default;
    }

    /**
     * Setup shader material
     */
    setupMaterial() {
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTex1: { value: this.textures.default },
                uTex2: { value: this.textures.default },
                uMix: { value: 0.0 },
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
    }

    /**
     * Setup card hover interactions
     */
    setupInteractions() {
        const card1 = document.getElementById('card1-base');
        const card2 = document.getElementById('card2-base');

        if (card1) {
            card1.addEventListener('mouseenter', () => this.setTarget('orange'));
            card1.addEventListener('mouseleave', () => this.setTarget('default'));
        }

        if (card2) {
            card2.addEventListener('mouseenter', () => this.setTarget('graduation'));
            card2.addEventListener('mouseleave', () => this.setTarget('default'));
        }
    }

    /**
     * Set target texture for transition
     * @param {string} textureName - Name of texture to transition to
     */
    setTarget(textureName) {
        const newTex = this.textures[textureName];
        if (!newTex || this.targetTexture === newTex) return;

        this.currentSourceTexture = this.targetTexture;
        this.targetTexture = newTex;

        this.material.uniforms.uTex1.value = this.currentSourceTexture;
        this.material.uniforms.uTex2.value = this.targetTexture;
        this.material.uniforms.uMix.value = 0.0;
        this.transitionProgress = 0.0;
        this.isTransitioning = true;
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += CONFIG.timeStep;
        this.material.uniforms.uTime.value = this.time;

        // Handle texture transition
        if (this.isTransitioning) {
            this.transitionProgress += CONFIG.transitionSpeed;

            if (this.transitionProgress >= 1.0) {
                this.transitionProgress = 1.0;
                this.isTransitioning = false;
            }

            this.material.uniforms.uMix.value = this.transitionProgress;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.material) {
            this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        }
    }
}

/**
 * Initialize the background
 * @param {string} containerId - ID of the container element
 * @returns {Background} Background instance
 */
export function initBackground(containerId = 'canvas-bg') {
    return new Background(containerId);
}
