/**
 * Loader Scene - Handles the "Hallucination" effect on the loading image.
 * Designed to be lightweight and disposed of quickly.
 */

let scene, camera, renderer, material, mesh, animationId;
const container = document.getElementById('loader-canvas-container');

// Shaders for the "Hallucination" effect (Wavy, dreamy distortion)
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;

    void main() {
        vec2 p = vUv;
        
        // Slower, more organic wave distortion (Fluid breathing)
        float waveStrength = 0.015; // Subtle
        // Multiple sine waves for organic feel
        float wave = sin(p.y * 5.0 + time * 0.5) * 0.5 + sin(p.y * 12.0 + time * 0.8) * 0.5;
        float wave2 = cos(p.x * 6.0 + time * 0.4) * 0.5 + cos(p.x * 15.0 + time * 0.9) * 0.5;
        
        p.x += wave * waveStrength;
        p.y += wave2 * waveStrength;

        // Subtle color shift/hallucination (Chromatic Aberration)
        // Offset RGB channels slightly based on time and position
        float r = texture2D(tDiffuse, p + vec2(0.002 * sin(time * 0.5), 0.0)).r;
        float g = texture2D(tDiffuse, p).g; // Green channel is stable-ish anchor
        float b = texture2D(tDiffuse, p - vec2(0.003 * cos(time * 0.6), 0.0)).b;
        
        // Vignette for cinematic look
        float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.5;
        
        gl_FragColor = vec4(r, g, b, 1.0) * vignette;
    }
`;

export function initLoaderScene(imageUrl) {
    if (!container) return;

    // 1. Setup Basic Three.js Scene
    scene = new THREE.Scene();

    // Orthographic camera for 2D full-screen effect
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1;
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false, // Turn off AA for performance during load
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Optimize for mobile: Cap pixel ratio
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);

    // 2. Load Texture & Create Shader
    const loader = new THREE.TextureLoader();
    loader.load(imageUrl, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Cover logic for texture equivalent to CSS background-size: cover
        const imageAspect = texture.image.width / texture.image.height;
        // We handle aspect ratio in UVs or just stretch if we want the "trippy" look to be flexible.
        // For a loading screen "hallucination", stretching is often acceptable or we can fix UVs.
        // For now, mapping to the quad plane.

        material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: texture },
                time: { value: 0 }
            },
            vertexShader,
            fragmentShader
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        animate();
    });

    // Handle Resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Determine image aspect ratio logic here if strictly needed
}

function animate() {
    animationId = requestAnimationFrame(animate);
    if (material) {
        // Much slower time increment for "breathing" effect
        material.uniforms.time.value += 0.005;
    }
    renderer.render(scene, camera);
}

export function disposeLoaderScene() {
    if (animationId) cancelAnimationFrame(animationId);

    window.removeEventListener('resize', onWindowResize);

    if (container && renderer && renderer.domElement) {
        container.removeChild(renderer.domElement);
    }

    if (material) {
        material.dispose();
        if (material.uniforms.tDiffuse.value) material.uniforms.tDiffuse.value.dispose();
    }
    if (mesh) {
        mesh.geometry.dispose();
    }
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
    }

    scene = null;
    camera = null;
    renderer = null;
    material = null;
    mesh = null;
}
