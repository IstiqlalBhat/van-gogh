/**
 * Advanced GLSL Shaders with Post-Processing
 */

export const advancedVertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normal;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const hallucinationFragmentShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uIntensity;
    varying vec2 vUv;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
        
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                               dot(x12.zw, x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
    
    void main() {
        vec2 uv = vUv;
        
        // Van Gogh-style brush strokes
        float strokeSize = 0.01 * uIntensity;
        float strokeDirection = sin(uTime * 0.5 + uv.y * 10.0) * 0.5 + 0.5;
        
        // Multiple layers of noise for organic feel
        float noise1 = snoise(uv * 8.0 + uTime * 0.1);
        float noise2 = snoise(uv * 15.0 - uTime * 0.2);
        float noise3 = snoise(uv * 3.0 + uTime * 0.05);
        
        // Combine noises for complex pattern
        float combinedNoise = (noise1 * 0.4 + noise2 * 0.3 + noise3 * 0.3);
        
        // Create brush stroke effect
        vec2 distortedUV = uv + combinedNoise * strokeSize * strokeDirection;
        
        // Sample texture with distortion
        vec4 color = texture2D(uTexture, distortedUV);
        
        // Add chromatic aberration (Van Gogh color separation)
        float aberration = 0.003 * uIntensity;
        color.r = texture2D(uTexture, distortedUV + vec2(aberration, 0.0)).r;
        color.g = texture2D(uTexture, distortedUV).g;
        color.b = texture2D(uTexture, distortedUV - vec2(aberration, 0.0)).b;
        
        // Add canvas texture overlay
        float canvasGrain = snoise(uv * 100.0) * 0.1;
        color.rgb += canvasGrain * 0.1;
        
        // Vignette effect
        float vignette = 1.0 - length(uv - 0.5) * 0.5;
        vignette = smoothstep(0.0, 1.0, vignette);
        color.rgb *= vignette;
        
        // Subtle color temperature shift based on time
        float warmth = sin(uTime * 0.2) * 0.05;
        color.r += warmth;
        color.b -= warmth;
        
        gl_FragColor = color;
    }
`;

// Post-processing effects
export const postProcessingShader = `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uBloomIntensity;
    
    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = texture2D(tDiffuse, uv);
        
        // Simple bloom effect
        float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        if (brightness > 0.9) {
            color.rgb *= (1.0 + uBloomIntensity);
        }
        
        outputColor = color;
    }
`;
