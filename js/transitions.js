/**
 * Advanced Page Transitions
 */
class PageTransitions {
    constructor() {
        this.transitionDuration = 1200;
        this.inProgress = false;
    }

    async curtainTransition() {
        if (this.inProgress) return;
        this.inProgress = true;

        const curtain = document.createElement('div');
        curtain.className = 'transition-curtain';
        curtain.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0b1026;
            z-index: 99999;
            transform: translateY(-100%);
            transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
        `;

        document.body.appendChild(curtain);

        // Open curtain
        requestAnimationFrame(() => {
            curtain.style.transform = 'translateY(0)';

            setTimeout(() => {
                curtain.style.transform = 'translateY(-100%)';
                setTimeout(() => curtain.remove(), 600);
                this.inProgress = false;
            }, this.transitionDuration);
        });
    }

    async paintStrokeTransition(direction = 'right') {
        const stroke = document.createElement('div');
        stroke.className = 'paint-stroke-transition';
        stroke.style.cssText = `
            position: fixed;
            top: 0;
            ${direction === 'right' ? 'left: 0' : 'right: 0'};
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #f5c747, #e74c3c, #3498db);
            z-index: 99999;
            transition: width 0.8s cubic-bezier(0.87, 0, 0.13, 1);
            mix-blend-mode: multiply;
        `;

        document.body.appendChild(stroke);

        requestAnimationFrame(() => {
            stroke.style.width = '100%';

            setTimeout(() => {
                stroke.style.opacity = '0';
                setTimeout(() => stroke.remove(), 300);
            }, 400);
        });
    }

    async dissolveTransition() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 99999;
            pointer-events: none;
        `;

        document.body.appendChild(canvas);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create noise pattern
        const particles = [];
        for (let i = 0; i < 1000; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 4 + 1,
                speed: Math.random() * 2 + 1
            });
        }

        let progress = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0b1026';

            particles.forEach(p => {
                p.y += p.speed;
                if (p.y > canvas.height) p.y = 0;

                if (Math.random() > progress) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            progress += 0.02;
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };

        animate();
    }
}

export const transitions = new PageTransitions();
