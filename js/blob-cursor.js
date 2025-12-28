/**
 * Blob Cursor Module
 * Creates the gooey blob cursor effect with touch support
 * Beautiful interactions for both desktop and mobile
 */

/**
 * Configuration for blob cursor
 */
const CONFIG = {
    // Desktop settings
    desktop: {
        count: 12,
        size: 180,
        lagPrimary: 0.25,
        lagSecondary: 0.5
    },
    // Mobile/Touch settings (optimized for instant feedback)
    mobile: {
        count: 5, // Slightly increased for better visual quality
        size: 110, // Larger touch area
        lagPrimary: 0.5, // More responsive (was 0.35)
        lagSecondary: 0.7  // More responsive (was 0.55)
    },
    initialPosition: -500,
    // Touch gesture settings
    touch: {
        holdDelay: 0,          // Instant activation (was 150)
        fadeOutDelay: 500,     // Slower fade out for fluidity
        velocityMultiplier: 1.2 // Smoother following
    }
};

/**
 * Detect if device supports touch
 */
function isTouchDevice() {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
    );
}

/**
 * BlobCursor class manages the SVG blob mask effect
 */
class BlobCursor {
    constructor(blobGroupId, cursorDotId) {
        this.blobGroup = document.getElementById(blobGroupId);
        this.cursorDot = document.getElementById(cursorDotId);
        this.blobs = [];
        this.isTouch = isTouchDevice();
        this.config = this.isTouch ? CONFIG.mobile : CONFIG.desktop;

        // Position state
        this.mouse = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
        this.target = { ...this.mouse };
        this.velocity = { x: 0, y: 0 };
        this.lastPosition = { ...this.mouse };

        // Touch state
        this.isTouching = false;
        this.touchHoldTimer = null;
        this.fadeOutTimer = null;
        this.isActive = !this.isTouch; // Start active on desktop, inactive on touch

        // Animation state
        this.rafId = null;
        this.lastTime = performance.now();

        this.init();
    }

    /**
     * Initialize the blob cursor
     */
    init() {
        this.createBlobs();
        this.bindEvents();
        this.animate();

        // Hide cursor dot on touch devices
        if (this.isTouch && this.cursorDot) {
            this.cursorDot.style.display = 'none';
        }
    }

    /**
     * Create SVG circle elements for the blob effect
     */
    createBlobs() {
        for (let i = 0; i < this.config.count; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const radius = this.config.size * (1 - i / (this.config.count + 2));

            circle.setAttribute('r', radius);
            circle.style.transition = 'opacity 0.3s ease';
            this.blobGroup.appendChild(circle);

            this.blobs.push({
                el: circle,
                x: CONFIG.initialPosition,
                y: CONFIG.initialPosition,
                radius: radius
            });
        }

        // Set initial opacity based on device type
        if (this.isTouch) {
            this.setBlobOpacity(0);
        }
    }

    /**
     * Set opacity for all blobs
     */
    setBlobOpacity(opacity) {
        this.blobs.forEach(blob => {
            blob.el.style.opacity = opacity;
        });
    }

    /**
     * Bind all events (mouse and touch)
     */
    bindEvents() {
        // Mouse events (desktop)
        if (!this.isTouch) {
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
            document.addEventListener('mousedown', () => this.handleMouseDown());
            document.addEventListener('mouseup', () => this.handleMouseUp());
            document.addEventListener('mouseleave', () => this.handleMouseLeave());
            document.addEventListener('mouseenter', () => this.handleMouseEnter());
        }

        // Touch events (mobile)
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        document.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: true });

        // Handle orientation change
        window.addEventListener('orientationchange', () => this.handleOrientationChange());

        // Handle visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(e) {
        this.updatePosition(e.clientX, e.clientY);
        this.updateCursorDot(e.clientX, e.clientY);
    }

    /**
     * Handle mouse down
     */
    handleMouseDown() {
        if (this.cursorDot) {
            this.cursorDot.classList.add('pressed');
        }
    }

    /**
     * Handle mouse up
     */
    handleMouseUp() {
        if (this.cursorDot) {
            this.cursorDot.classList.remove('pressed');
        }
    }

    /**
     * Handle mouse leave
     */
    handleMouseLeave() {
        if (this.cursorDot) {
            this.cursorDot.classList.add('hidden');
        }
    }

    /**
     * Handle mouse enter
     */
    handleMouseEnter() {
        if (this.cursorDot) {
            this.cursorDot.classList.remove('hidden');
        }
    }

    /**
     * Handle touch start - beautiful reveal effect
     */
    handleTouchStart(e) {
        if (e.touches.length === 0) return;

        const touch = e.touches[0];
        this.isTouching = true;

        // Haptic feedback for initial touch
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }

        // Clear any pending fade out
        if (this.fadeOutTimer) {
            clearTimeout(this.fadeOutTimer);
            this.fadeOutTimer = null;
        }

        // Immediately move blobs to touch position
        this.target.x = touch.clientX;
        this.target.y = touch.clientY;
        this.mouse.x = touch.clientX;
        this.mouse.y = touch.clientY;

        // Position blobs at touch point
        this.blobs.forEach(blob => {
            blob.x = touch.clientX;
            blob.y = touch.clientY;
        });

        // Instant activation
        this.isActive = true;
        this.setBlobOpacity(1);
    }

    /**
     * Handle touch move - smooth following
     */
    handleTouchMove(e) {
        if (!this.isTouching || e.touches.length === 0) return;

        const touch = e.touches[0];

        // Ensure active
        if (!this.isActive) {
            this.isActive = true;
            this.setBlobOpacity(1);
        }

        this.updatePosition(touch.clientX, touch.clientY);
    }

    /**
     * Handle touch end - beautiful fade out
     */
    handleTouchEnd(e) {
        this.isTouching = false;

        // Light release haptic
        if ('vibrate' in navigator) {
            navigator.vibrate(5);
        }

        // Fade out blob after delay
        this.fadeOutTimer = setTimeout(() => {
            this.isActive = false;
            this.setBlobOpacity(0);
        }, CONFIG.touch.fadeOutDelay);
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        // Reset positions after orientation change
        setTimeout(() => {
            this.mouse.x = window.innerWidth / 2;
            this.mouse.y = window.innerHeight / 2;
            this.target = { ...this.mouse };
        }, 100);
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animation when tab is hidden
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        } else {
            // Resume animation
            if (!this.rafId) {
                this.lastTime = performance.now();
                this.animate();
            }
        }
    }

    /**
     * Update position with velocity calculation
     */
    updatePosition(x, y) {
        // Calculate velocity for trail effect
        this.velocity.x = (x - this.lastPosition.x) * CONFIG.touch.velocityMultiplier;
        this.velocity.y = (y - this.lastPosition.y) * CONFIG.touch.velocityMultiplier;

        this.lastPosition.x = this.target.x;
        this.lastPosition.y = this.target.y;

        this.target.x = x;
        this.target.y = y;
    }

    /**
     * Update cursor dot position
     */
    updateCursorDot(x, y) {
        if (this.cursorDot) {
            this.cursorDot.style.left = `${x}px`;
            this.cursorDot.style.top = `${y}px`;
        }
    }

    /**
     * Animation loop with delta time for consistent speed
     */
    animate() {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2); // Normalize to 60fps
        this.lastTime = currentTime;

        // Smooth interpolation to target
        this.mouse.x += (this.target.x - this.mouse.x) * this.config.lagPrimary * deltaTime;
        this.mouse.y += (this.target.y - this.mouse.y) * this.config.lagPrimary * deltaTime;

        let targetX = this.mouse.x;
        let targetY = this.mouse.y;

        this.blobs.forEach((blob, index) => {
            // First blob follows mouse more closely, others trail behind
            const lag = index === 0 ? this.config.lagPrimary : this.config.lagSecondary;
            const adjustedLag = lag * deltaTime;

            // Smooth interpolation towards target
            blob.x += (targetX - blob.x) * adjustedLag;
            blob.y += (targetY - blob.y) * adjustedLag;

            // Update SVG circle position
            blob.el.setAttribute('cx', blob.x);
            blob.el.setAttribute('cy', blob.y);

            // Dynamic size based on velocity (optional enhancement)
            if (this.isActive && this.isTouching) {
                const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
                const sizeMultiplier = 1 + Math.min(speed * 0.002, 0.3);
                blob.el.setAttribute('r', blob.radius * sizeMultiplier);
            } else {
                blob.el.setAttribute('r', blob.radius);
            }

            // Each subsequent blob follows the previous one
            targetX = blob.x;
            targetY = blob.y;
        });

        // Decay velocity
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;

        this.rafId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Get current mouse/touch position
     */
    getPosition() {
        return { ...this.mouse };
    }

    /**
     * Get all blob positions
     */
    getBlobPositions() {
        return this.blobs.map(blob => ({ x: blob.x, y: blob.y }));
    }

    /**
     * Check if blob is currently active
     */
    getIsActive() {
        return this.isActive;
    }

    /**
     * Manually show blob at position
     */
    showAt(x, y) {
        this.target.x = x;
        this.target.y = y;
        this.mouse.x = x;
        this.mouse.y = y;
        this.isActive = true;
        this.setBlobOpacity(1);
    }

    /**
     * Manually hide blob
     */
    hide() {
        this.isActive = false;
        this.setBlobOpacity(0);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.touchHoldTimer) {
            clearTimeout(this.touchHoldTimer);
        }
        if (this.fadeOutTimer) {
            clearTimeout(this.fadeOutTimer);
        }
        this.blobs.forEach(blob => blob.el.remove());
        this.blobs = [];
    }
}

/**
 * Initialize the blob cursor effect
 */
export function initBlobCursor(blobGroupId = 'blob-group', cursorDotId = 'cursor-dot') {
    return new BlobCursor(blobGroupId, cursorDotId);
}
