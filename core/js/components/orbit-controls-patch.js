/**
 * Orbit Controls Patch
 * Extends the original orbit-controls component to fully support setting camera angles
 */

AFRAME.registerComponent('orbit-controls-patch', {
    schema: {
        // Add new schema properties for initial angles
        initialAzimuthalAngle: { type: 'number', default: 0 },
        initialPolarAngle: { type: 'number', default: 45 }
    },

    init: function() {
        // Store pending angles
        this._pendingAzimuthal = undefined;
        this._pendingPolar = undefined;

        // Wait for the original orbit-controls to be initialized
        this.el.addEventListener('componentinitialized', (event) => {
            if (event.detail.name === 'orbit-controls') {
                this.patchOrbitControls();
            }
        });

        // Listen for model changes
        this.el.sceneEl.addEventListener('model-loaded', () => {
            // Re-apply patch after model load
            setTimeout(() => {
                this.patchOrbitControls();
            }, 100);
        });

        // Also try to patch immediately in case orbit-controls is already initialized
        this.patchOrbitControls();
    },

    update: function() {
        // Store new angles from schema
        if (this.data.initialAzimuthalAngle !== undefined) {
            this._pendingAzimuthal = THREE.MathUtils.degToRad(this.data.initialAzimuthalAngle);
        }
        if (this.data.initialPolarAngle !== undefined) {
            this._pendingPolar = THREE.MathUtils.degToRad(this.data.initialPolarAngle);
        }
        // Try to apply them
        this.patchOrbitControls();
    },

    patchOrbitControls: function() {
        const orbitControls = this.el.components['orbit-controls'];
        if (!orbitControls || !orbitControls.controls) return;

        const controls = orbitControls.controls;
        if (!controls.spherical) return;

        // Store the original update method if not already stored
        if (!controls._originalUpdate) {
            controls._originalUpdate = controls.update;
        }

        // Add new methods to set angles if not already added
        if (!controls.setAzimuthalAngle) {
            controls.setAzimuthalAngle = function(angle) {
                if (this.spherical) {
                    this.spherical.theta = angle;
                    this.update();
                }
            };
        }

        if (!controls.setPolarAngle) {
            controls.setPolarAngle = function(angle) {
                if (this.spherical) {
                    this.spherical.phi = angle;
                    this.update();
                }
            };
        }

        // Override the update method to ensure angles are properly applied
        if (!controls._updatePatched) {
            const self = this;
            controls.update = function() {
                // Apply any pending angle changes
                if (self._pendingAzimuthal !== undefined && this.spherical) {
                    this.spherical.theta = self._pendingAzimuthal;
                    self._pendingAzimuthal = undefined;
                }
                if (self._pendingPolar !== undefined && this.spherical) {
                    this.spherical.phi = self._pendingPolar;
                    self._pendingPolar = undefined;
                }
                // Call original update
                this._originalUpdate.call(this);
            };
            controls._updatePatched = true;
        }

        // Apply any pending angles
        if (this._pendingAzimuthal !== undefined) {
            controls.setAzimuthalAngle(this._pendingAzimuthal);
        }
        if (this._pendingPolar !== undefined) {
            controls.setPolarAngle(this._pendingPolar);
        }

        // Force an update and ensure controls are enabled
        controls.update();
        controls.enabled = true;
        this.el.setAttribute('orbit-controls', 'enableRotate', true);

        // Ensure initial angles are applied
        if (this.data.initialAzimuthalAngle !== undefined || this.data.initialPolarAngle !== undefined) {
            const azimuthalAngle = this.data.initialAzimuthalAngle !== undefined ? 
                THREE.MathUtils.degToRad(this.data.initialAzimuthalAngle) : 
                controls.getAzimuthalAngle();
            const polarAngle = this.data.initialPolarAngle !== undefined ? 
                THREE.MathUtils.degToRad(this.data.initialPolarAngle) : 
                THREE.MathUtils.degToRad(45);
            
            controls.setAzimuthalAngle(azimuthalAngle);
            controls.setPolarAngle(polarAngle);
            controls.update();
        }
    }
}); 