/**
 * Zoom UI Component
 * Provides real-time zoom level feedback and UI
 */

AFRAME.registerComponent('zoom-ui', {
    schema: {
        initialDistance: { type: 'number', default: 3.5 },
        fadeTimeout: { type: 'number', default: 1000 }
    },

    init: function() {
        // Add zoom tracking
        this.zoomDisplay = document.getElementById('zoomValue');
        this.zoomContainer = document.getElementById('zoomDisplay');
        this.initialDistance = this.data.initialDistance;
        this.lastZoomPercent = null;
        this.zoomTimeout = null;
        this.isZooming = false;
        this._boundOnZoom = this.onZoom.bind(this); // For removal
        this.lastDistance = null; // Track last camera distance

        const camera = document.querySelector('#camera');
        if (camera) {
            // Attach immediately if orbit-controls already initialized
            if (camera.components && camera.components['orbit-controls'] && camera.components['orbit-controls'].controls) {
                camera.components['orbit-controls'].controls.addEventListener('change', this._boundOnZoom);
                //console.log('[zoom-ui] Attached change listener immediately');
            }
            // Also listen for future initialization
            camera.addEventListener('componentinitialized', (e) => {
                if (e.detail.name === 'orbit-controls') {
                    const controls = camera.components['orbit-controls'].controls;
                    controls.addEventListener('change', this._boundOnZoom);
                    //console.log('[zoom-ui] Attached change listener on componentinitialized');
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
        // Only show UI if distance changed (i.e., zoom, not pan/rotate)
        const camera = document.querySelector('#camera');
        if (!camera) return;
        const controls = camera.components['orbit-controls'];
        if (!controls || !controls.controls) return;
        const threeControls = controls.controls;
        const currentDistance = threeControls.object.position.distanceTo(threeControls.target);

        if (this.lastDistance !== null && Math.abs(currentDistance - this.lastDistance) < 1e-5) {
            // No zoom, just pan/rotate
            return;
        }
        this.lastDistance = currentDistance;

        //console.log('[zoom-ui] Zoom event detected');
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
        
        // Prefer global config for min/max distance
        let minDistance = 0.01;
        let maxDistance = 0.085;
        if (window.currentModelConfig && window.currentModelConfig.orbitControls) {
            minDistance = window.currentModelConfig.orbitControls.minDistance ?? minDistance;
            maxDistance = window.currentModelConfig.orbitControls.maxDistance ?? maxDistance;
        } else {
            // Fallback to orbit-controls attribute if present
            const orbitAttr = camera.getAttribute('orbit-controls');
            if (orbitAttr.minDistance) minDistance = orbitAttr.minDistance;
            if (orbitAttr.maxDistance) maxDistance = orbitAttr.maxDistance;
        }
        
        let zoomPercent = ((maxDistance - currentDistance) / (maxDistance - minDistance)) * 100;
        zoomPercent = Math.max(0, Math.min(100, Math.round(zoomPercent)));

        // Always update zoom value
        if (this.zoomDisplay) {
            this.zoomDisplay.textContent = zoomPercent + '%';
        }
    },

    remove: function() {
        // Clean up timeout and event listeners
        if (this.zoomTimeout) {
            clearTimeout(this.zoomTimeout);
        }
        const camera = document.querySelector('#camera');
        if (camera && camera.components && camera.components['orbit-controls'] && camera.components['orbit-controls'].controls) {
            camera.components['orbit-controls'].controls.removeEventListener('change', this._boundOnZoom);
            //console.log('[zoom-ui] Removed change listener');
        }
    }
}); 