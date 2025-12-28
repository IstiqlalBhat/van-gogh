/**
 * Reveal Sync Module
 * Synchronizes reveal image positions with their base counterparts
 */

/**
 * Configuration for image pairs
 */
const IMAGE_PAIRS = [
    {
        baseId: 'hero-base',
        revealId: 'hero-reveal',
        fit: 'contain'
    },
    {
        baseId: 'card1-base',
        revealId: 'card1-reveal',
        fit: 'cover'
    },
    {
        baseId: 'card2-base',
        revealId: 'card2-reveal',
        fit: 'cover'
    }
];

/**
 * RevealSync class manages position synchronization between base and reveal images
 */
class RevealSync {
    constructor(pairs = IMAGE_PAIRS) {
        this.pairs = pairs.map(pair => ({
            base: document.getElementById(pair.baseId),
            reveal: document.getElementById(pair.revealId),
            fit: pair.fit
        }));

        this.init();
    }

    /**
     * Initialize the sync loop
     */
    init() {
        this.sync();
    }

    /**
     * Synchronize all image pairs
     */
    sync() {
        this.pairs.forEach(pair => this.syncPair(pair));
        requestAnimationFrame(() => this.sync());
    }

    /**
     * Synchronize a single image pair
     * @param {Object} pair - Image pair configuration
     */
    syncPair(pair) {
        if (!pair.base || !pair.reveal) return;

        const rect = pair.base.getBoundingClientRect();

        // Update reveal image to match base image position and size
        pair.reveal.style.width = `${rect.width}px`;
        pair.reveal.style.height = `${rect.height}px`;
        pair.reveal.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
        pair.reveal.style.objectFit = pair.fit;
    }

    /**
     * Add a new image pair to sync
     * @param {string} baseId - ID of the base image
     * @param {string} revealId - ID of the reveal image
     * @param {string} fit - Object-fit value ('cover' or 'contain')
     */
    addPair(baseId, revealId, fit = 'cover') {
        const pair = {
            base: document.getElementById(baseId),
            reveal: document.getElementById(revealId),
            fit: fit
        };

        if (pair.base && pair.reveal) {
            this.pairs.push(pair);
        } else {
            console.warn(`Could not find elements for pair: ${baseId} / ${revealId}`);
        }
    }

    /**
     * Remove a pair by base ID
     * @param {string} baseId - ID of the base image to remove
     */
    removePair(baseId) {
        this.pairs = this.pairs.filter(pair =>
            pair.base && pair.base.id !== baseId
        );
    }

    /**
     * Get current pair count
     * @returns {number} Number of synced pairs
     */
    getPairCount() {
        return this.pairs.length;
    }
}

/**
 * Initialize the reveal synchronization
 * @param {Array} customPairs - Optional custom pair configuration
 * @returns {RevealSync} RevealSync instance
 */
export function initRevealSync(customPairs) {
    return new RevealSync(customPairs);
}
