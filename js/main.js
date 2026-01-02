/**
 * ISTIQLAL Portfolio - Main Entry Point
 * Initializes all modules with mobile-optimized interactions
 */

import { initBackground } from './background.js';
import { initBlobCursor } from './blob-cursor.js';
import { initRevealSync } from './reveal-sync.js';
import { initInteractions } from './interactions.js';
import { initLoaderScene, disposeLoaderScene } from './loader-scene.js';

/**
 * Application state and module references
 */
const app = {
    background: null,
    blobCursor: null,
    revealSync: null,
    interactions: null,
    isInitialized: false,
    isMobile: false
};

/**
 * Detect mobile device
 */
function detectMobile() {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.matchMedia('(max-width: 768px)').matches
    );
}


function detectPerformanceTier() {
    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Check for GPU tier (simplified)
    const isLowEnd = (
        navigator.hardwareConcurrency <= 4 ||
        /(android|ios)/i.test(navigator.userAgent) ||
        isIOS ||
        window.matchMedia('(max-width: 1024px)').matches
    );

    if (isLowEnd) {
        document.body.classList.add('performance-constrained', 'optimized-mobile');
        console.log('Low-end/Mobile device detected - simplifying effects');

        // Force low power mode for all iOS devices to ensure stability
        if (isIOS) {
            document.body.classList.add('is-low-power');
        }
    }
}


/**
 * Preload critical images for smoother experience
 */
async function preloadImages() {
    const criticalImages = [
        'images/main/graduate.png',
        'images/VG/graduateVG.jpg',
        'images/backgrounds/orangeSN.png',
        'images/backgrounds/starry-night.jpg',
        'images/VG/orangeVG.png',
        'images/VG/graduationVG.png',
        'images/main/clemson-headshot.jpg',
        'images/main/clemson-stage.jpg'
    ];

    const promises = criticalImages.map(src => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // Don't block on errors
            img.src = src;
        });
    });

    // Wait for critical images with timeout
    await Promise.race([
        Promise.all(promises),
        new Promise(resolve => setTimeout(resolve, 3000)) // 3s max wait
    ]);
}

/**
 * Add loading state management
 */
function setLoadingState(isLoading) {
    document.body.classList.toggle('is-loading', isLoading);

    if (!isLoading) {
        // Trigger entrance animations after load
        document.body.classList.add('is-loaded');

        // Remove loading class after animations complete
        setTimeout(() => {
            document.body.classList.remove('is-loading');
        }, 100);
    }
}

/**
 * Initialize viewport height fix for mobile browsers
 */
function initViewportFix() {
    // Fix for mobile viewport height (100vh issue)
    const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
}

/**
 * Initialize performance optimizations
 */
function initPerformanceOptimizations() {
    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
        document.body.classList.add('reduce-animations');
    }

    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduce-motion');
    }

    // Add passive event listeners hint
    document.addEventListener('touchstart', () => { }, { passive: true });
}

// Performance monitoring
function initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                console.log(`[Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
            });
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
    }

    // Log WebGL capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
        console.log('WebGL Supported:', gl.getParameter(gl.VERSION));
        console.log('Max Texture Size:', gl.getParameter(gl.MAX_TEXTURE_SIZE));
    }
}


/**
 * Initialize service worker for offline support (optional)
 */
async function initServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service worker registered');
        } catch (error) {
            // Service worker registration failed, continue without it
        }
    }
}

/**
 * Main initialization function
 */
async function init() {
    if (app.isInitialized) {
        console.warn('Application already initialized');
        return;
    }

    console.log('Initializing ISTIQLAL Portfolio...');

    // Set loading state
    setLoadingState(true);

    // Start Loader Scene Immediately
    initLoaderScene('images/backgrounds/loading.jpg');
    const loaderStartTime = Date.now();

    // Detect device type
    app.isMobile = detectMobile();
    document.body.classList.toggle('is-mobile', app.isMobile);
    document.body.classList.toggle('is-desktop', !app.isMobile);

    // Detect likely low-power device (mobile or low concurrency)
    const isLowPower = app.isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    document.body.classList.toggle('is-low-power', isLowPower);

    // Initialize viewport fix
    initViewportFix();

    // Initialize performance optimizations
    // Initialize performance optimizations
    initPerformanceOptimizations();
    detectPerformanceTier();
    initPerformanceMonitoring();


    try {
        // Preload critical images
        await preloadImages();

        // Initialize modules in parallel where possible
        const initPromises = [];

        // Initialize Three.js background
        initPromises.push(
            new Promise(resolve => {
                try {
                    app.background = initBackground('canvas-bg');
                    console.log('Background initialized');
                } catch (e) {
                    console.warn('Background initialization failed:', e);
                }
                resolve();
            })
        );

        // Initialize blob cursor
        initPromises.push(
            new Promise(resolve => {
                try {
                    app.blobCursor = initBlobCursor('blob-group', 'cursor-dot');
                    console.log('Blob cursor initialized');
                } catch (e) {
                    console.warn('Blob cursor initialization failed:', e);
                }
                resolve();
            })
        );

        // Initialize reveal sync
        initPromises.push(
            new Promise(resolve => {
                try {
                    app.revealSync = initRevealSync();
                    console.log('Reveal sync initialized');
                } catch (e) {
                    console.warn('Reveal sync initialization failed:', e);
                }
                resolve();
            })
        );

        // Wait for all modules
        await Promise.all(initPromises);

        // Wait for window load to ensure fonts/CSS are ready
        if (document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve));
        }

        // Initialize interactions (after DOM elements are ready)
        app.interactions = initInteractions();
        console.log('Interactions initialized');

        // Mark as initialized
        app.isInitialized = true;

        // Calculate elapsed time and ensure minimum 3s duration
        const elapsedTime = Date.now() - loaderStartTime;
        const minDuration = 3000;
        if (elapsedTime < minDuration) {
            await new Promise(resolve => setTimeout(resolve, minDuration - elapsedTime));
        }

        // Transition out loader
        const loaderContainer = document.getElementById('loader-container');
        if (loaderContainer) {
            loaderContainer.classList.add('fade-out');
            setTimeout(() => {
                disposeLoaderScene();
                if (loaderContainer.parentNode) loaderContainer.parentNode.removeChild(loaderContainer);
                setLoadingState(false);
            }, 1500); // 1.5s matches CSS transition
        } else {
            setLoadingState(false);
        }

        console.log('Portfolio initialization complete');

    } catch (error) {
        console.error('Failed to initialize portfolio:', error);
        setLoadingState(false);
    }
}

/**
 * Handle page visibility changes
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // Pause heavy operations when page is hidden
        console.log('Page hidden - reducing activity');
    } else {
        // Resume when page becomes visible
        console.log('Page visible - resuming');
    }
}

/**
 * Cleanup function for SPA navigation
 */
function cleanup() {
    if (app.blobCursor && app.blobCursor.destroy) {
        app.blobCursor.destroy();
    }
    if (app.interactions && app.interactions.destroy) {
        app.interactions.destroy();
    }
    app.isInitialized = false;
}

// Add visibility change listener
document.addEventListener('visibilitychange', handleVisibilityChange);

// Expose app state for debugging
window.__ISTIQLAL_APP__ = app;

// Expose cleanup for SPA usage
window.__ISTIQLAL_CLEANUP__ = cleanup;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle errors gracefully
window.addEventListener('error', (e) => {
    console.error('Runtime error:', e.message);
    // Ensure loading state is removed even on error
    setLoadingState(false);
});
