/**
 * ISTIQLAL Portfolio - Main Entry Point
 * Initializes all modules with mobile-optimized interactions
 */

import { initBackground } from './background.js';
import { initBlobCursor } from './blob-cursor.js';
import { initRevealSync } from './reveal-sync.js';
import { initInteractions } from './interactions.js';

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
        window.matchMedia('(max-width: 768px)').matches ||
        window.matchMedia('(pointer: coarse)').matches
    );
}

/**
 * Preload critical images for smoother experience
 */
async function preloadImages() {
    const criticalImages = [
        'images/main/graduate.png',
        'images/VG/graduateVG.jpg'
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
    document.addEventListener('touchstart', () => {}, { passive: true });
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

    // Detect device type
    app.isMobile = detectMobile();
    document.body.classList.toggle('is-mobile', app.isMobile);
    document.body.classList.toggle('is-desktop', !app.isMobile);

    // Initialize viewport fix
    initViewportFix();

    // Initialize performance optimizations
    initPerformanceOptimizations();

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

        // Initialize interactions (after DOM elements are ready)
        app.interactions = initInteractions();
        console.log('Interactions initialized');

        // Mark as initialized
        app.isInitialized = true;

        // Remove loading state
        setLoadingState(false);

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
