/**
 * GLSL Shaders for Three.js Background
 * Vertex and Fragment shaders for the animated painting effect
 */

export const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fragmentShader = `
    uniform sampler2D uTex1;  // Current texture
    uniform sampler2D uTex2;  // Target texture
    uniform float uMix;       // Mix factor (0.0 to 1.0)
    uniform float uTime;
    uniform vec2 uResolution; // Screen resolution
    varying vec2 vUv;

    // Simple noise function for organic movement
    float random(in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
               (c - a) * u.y * (1.0 - u.x) +
               (d - b) * u.x * u.y;
    }

    void main() {
        // Aspect Ratio Correction (Cover Mode)
        // Assumes textures are roughly 16:9 or landscape. 
        // Realistically, we should pass texture aspect, but a general fix handles most cases.
        vec2 uv = vUv;
        
        // Calculate aspect ratios
        float screenAspect = uResolution.x / uResolution.y;
        float imageAspect = 1.77; // Assuming 16:9 standard for wallpapers
        
        // Scale UVs to cover
        if (screenAspect > imageAspect) {
            // Screen is wider than image (crop top/bottom)
            float scale = imageAspect / screenAspect;
            uv.y = (uv.y - 0.5) * scale + 0.5;
        } else {
            // Screen is taller than image (crop sides)
            float scale = screenAspect / imageAspect;
            uv.x = (uv.x - 0.5) * scale + 0.5;
        }

        // Create a flow effect by distorting UVs
        float flowStrength = 0.015;

        // Generate flow patterns based on time and position
        float n1 = noise(uv * 8.0 + uTime * 0.15);   // Large scale
        float n2 = noise(uv * 20.0 - uTime * 0.3);  // Small scale details

        // Offset UVs for organic movement
        vec2 distortion = vec2(sin(n1 * 6.28), cos(n2 * 6.28)) * flowStrength;

        vec4 c1 = texture2D(uTex1, uv + distortion);
        vec4 c2 = texture2D(uTex2, uv + distortion);

        // Cross-fade between textures
        vec4 color = mix(c1, c2, uMix);

        // Subtle vignette effect
        float vignette = 1.0 - length(vUv - 0.5) * 0.4; // Use original vUv for vignette
        color.rgb *= vignette;

        gl_FragColor = color;
    }
`;
