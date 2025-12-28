/**
 * Interactions Module
 * Handles scroll animations, intersection observers, and touch feedback
 * Beautiful interactions that work on all devices
 */

/**
 * Configuration
 */
const CONFIG = {
    scroll: {
        threshold: 0.15,           // How much of element must be visible
        rootMargin: '-50px',       // Trigger slightly before element enters view
        staggerDelay: 100          // Delay between staggered animations
    },
    ripple: {
        duration: 600,             // Ripple animation duration
        maxSize: 200               // Maximum ripple size
    }
};

/**
 * Intersection Observer for scroll-triggered animations
 */
class ScrollAnimations {
    constructor() {
        this.observer = null;
        this.animatedElements = new Set();
        this.init();
    }

    init() {
        // Create intersection observer
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: CONFIG.scroll.threshold,
                rootMargin: CONFIG.scroll.rootMargin
            }
        );

        // Observe elements that should animate on scroll
        this.observeElements();
    }

    observeElements() {
        // Cards and images
        const elements = document.querySelectorAll(
            '.card-img-1, .card-img-2, .card-text-1, .card-text-2, .painting-img'
        );

        elements.forEach((el, index) => {
            // Add stagger delay based on index
            el.style.transitionDelay = `${index * CONFIG.scroll.staggerDelay}ms`;
            this.observer.observe(el);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                // Add visible class for animation
                entry.target.classList.add('visible');
                this.animatedElements.add(entry.target);

                // Optionally unobserve after animation (performance)
                // this.observer.unobserve(entry.target);
            }
        });
    }

    // Re-observe an element (useful for dynamic content)
    observe(element) {
        this.observer.observe(element);
    }

    // Stop observing
    unobserve(element) {
        this.observer.unobserve(element);
        this.animatedElements.delete(element);
    }

    // Cleanup
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.animatedElements.clear();
    }
}

/**
 * Touch Ripple Effect
 * Beautiful ripple feedback on touch interactions
 */
class TouchRipple {
    constructor() {
        this.rippleElements = [];
        this.init();
    }

    init() {
        // Add ripple to interactive elements
        const interactiveElements = document.querySelectorAll(
            '.contact-btn, .painting-img'
        );

        interactiveElements.forEach(el => {
            el.style.position = 'relative';
            el.style.overflow = 'hidden';
            this.addRippleListeners(el);
        });
    }

    addRippleListeners(element) {
        // Touch start creates ripple
        element.addEventListener('touchstart', (e) => this.createRipple(e, element), { passive: true });
        element.addEventListener('mousedown', (e) => this.createRipple(e, element));
    }

    createRipple(e, element) {
        // Get position relative to element
        const rect = element.getBoundingClientRect();
        let x, y;

        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // Create ripple element
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        // Calculate size (should cover the whole element)
        const size = Math.max(rect.width, rect.height) * 2;

        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
        `;

        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, CONFIG.ripple.duration);
    }
}

/**
 * Smooth Scroll Handler
 * Enhanced smooth scrolling with easing
 */
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Handle anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleAnchorClick(e));
        });
    }

    handleAnchorClick(e) {
        const href = e.currentTarget.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            this.scrollTo(target);
        }
    }

    scrollTo(element, offset = 0) {
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * Parallax on scroll (subtle, performant)
 */
class ScrollParallax {
    constructor() {
        this.elements = [];
        this.ticking = false;
        this.init();
    }

    init() {
        // Only enable on devices with good performance
        if (this.prefersReducedMotion()) return;

        // Find parallax elements
        this.elements = Array.from(document.querySelectorAll('[data-parallax]'));

        if (this.elements.length > 0) {
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        }
    }

    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    handleScroll() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.updateParallax();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updateParallax() {
        const scrollY = window.pageYOffset;

        this.elements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.1;
            const rect = el.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const offset = (centerY - viewportCenter) * speed;

            el.style.transform = `translateY(${offset}px)`;
        });
    }
}

/**
 * Pull to Refresh Prevention (for PWA-like feel)
 */
class OverscrollPrevention {
    constructor() {
        this.init();
    }

    init() {
        // Prevent overscroll on iOS using standard CSS only
        // Removed custom touchmove logic as it interferes with native scrolling
        document.documentElement.style.overscrollBehavior = 'none';
    }
}

/**
 * Haptic Feedback (if available)
 */
class HapticFeedback {
    constructor() {
        this.isSupported = 'vibrate' in navigator;
    }

    light() {
        if (this.isSupported) {
            navigator.vibrate(10);
        }
    }

    medium() {
        if (this.isSupported) {
            navigator.vibrate(25);
        }
    }

    heavy() {
        if (this.isSupported) {
            navigator.vibrate(50);
        }
    }

    pattern(pattern) {
        if (this.isSupported) {
            navigator.vibrate(pattern);
        }
    }
}

/**
 * Main Interactions Controller
 */
class InteractionsController {
    constructor() {
        this.scrollAnimations = null;
        this.touchRipple = null;
        this.smoothScroll = null;
        this.scrollParallax = null;
        this.overscrollPrevention = null;
        this.haptic = null;
    }

    init() {
        // Initialize all interaction modules
        this.scrollAnimations = new ScrollAnimations();
        this.touchRipple = new TouchRipple();
        this.smoothScroll = new SmoothScroll();
        this.scrollParallax = new ScrollParallax();
        this.overscrollPrevention = new OverscrollPrevention();
        this.haptic = new HapticFeedback();

        // Add haptic feedback to buttons
        this.addHapticToButtons();

        console.log('Interactions initialized');
        return this;
    }

    addHapticToButtons() {
        document.querySelectorAll('.contact-btn').forEach(btn => {
            btn.addEventListener('touchstart', () => this.haptic.light(), { passive: true });
        });
    }

    // Get haptic controller for external use
    getHaptic() {
        return this.haptic;
    }

    // Cleanup
    destroy() {
        if (this.scrollAnimations) {
            this.scrollAnimations.destroy();
        }
    }
}

/**
 * Initialize interactions
 */
export function initInteractions() {
    const controller = new InteractionsController();
    return controller.init();
}

/**
 * Export individual classes for granular control
 */
export {
    ScrollAnimations,
    TouchRipple,
    SmoothScroll,
    ScrollParallax,
    HapticFeedback
};
