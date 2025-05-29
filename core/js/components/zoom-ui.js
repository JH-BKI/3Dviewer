/**
 * Zoom UI Component
 * Provides real-time zoom level feedback and UI
 */

AFRAME.registerComponent('zoom-ui', {
    schema: {
        initialDistance: { type: 'number', default: 3.5 },
        fadeTimeout: { type: 'number', default: 2000 }
    },

    init: function() {
        // Add zoom tracking
        this.zoomDisplay = document.getElementById('zoomValue');
        this.zoomContainer = document.getElementById('zoomDisplay');
        this.initialDistance = this.data.initialDistance;
        this.lastZoomPercent = null;
        this.zoomTimeout = null;
        this.isZooming = false;

        // Add zoom event listeners
        const camera = document.querySelector('#camera');
        if (camera) {
            // Listen to orbit-controls events directly
            camera.addEventListener('componentinitialized', (e) => {
                if (e.detail.name === 'orbit-controls') {
                    const controls = camera.components['orbit-controls'].controls;
                    controls.addEventListener('change', this.onZoom.bind(this));
                }
            });
        }

        // Initialize zoom display
        if (this.zoomContainer) {
            this.zoomContainer.style.opacity = '0';
        }
        if (this.zoomDisplay) {
            this.zoomDisplay.textContent = '0%';
        }
    },

    onZoom: function() {
        console.log('[zoom-ui] Zoom event detected');
        this.isZooming = true;

        // Show zoom panel
        if (this.zoomContainer) {
            this.zoomContainer.style.opacity = '1';
        }

        // Clear any existing timeout
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
        }

        // Set new timeout to hide the panel
        this.zoomTimeout = setTimeout(() => {
            if (this.zoomContainer) {
                this.zoomContainer.style.opacity = '0';
            }
            this.zoomTimeout = null;
            this.isZooming = false;
        }, this.data.fadeTimeout);
    },

    tick: function() {
        // Real-time zoom update
        const camera = document.querySelector('#camera');
        if (!camera) return;
        
        const controls = camera.components['orbit-controls'];
        if (!controls || !controls.controls) return;
        
        const threeControls = controls.controls;
        const currentDistance = threeControls.object.position.distanceTo(threeControls.target);
        
        // Get min and max distance from orbit-controls attribute
        const orbitAttr = camera.getAttribute('orbit-controls');
        const minDistance = orbitAttr.minDistance || 0.01;
        const maxDistance = orbitAttr.maxDistance || 0.085;
        
        let zoomPercent = ((maxDistance - currentDistance) / (maxDistance - minDistance)) * 100;
        zoomPercent = Math.max(0, Math.min(100, Math.round(zoomPercent)));

        // Update zoom value if we're zooming
        if (this.isZooming && this.zoomDisplay) {
            this.zoomDisplay.textContent = zoomPercent + '%';
        }
    },

    remove: function() {
        // Clean up timeout and event listeners
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
        }
        const camera = document.querySelector('#camera');
        if (camera) {
            const controls = camera.components['orbit-controls'];
            if (controls && controls.controls) {
                controls.controls.removeEventListener('change', this.onZoom);
            }
        }
    }
}); 