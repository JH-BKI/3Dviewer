/**
 * SpatialHotspot Component
 * A versatile hotspot component for 3D scenes that handles camera positioning and UI interactions
 */
AFRAME.registerComponent('spatial-hotspot', {
    schema: {
        isInteractable: { type: 'boolean', default: true },
        goToPosition: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
        lookAt: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
        cameraOffset: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
        duration: { type: 'number', default: 1000 },
        isTrigger: { type: 'boolean', default: false },
        triggeredElement: { type: 'selector', default: null },
        title: { type: 'string', default: '' },
        titleOffset: { type: 'vec3', default: { x: 0, y: 0.2, z: 0 } },
        label: { type: 'string', default: '' },
        labelOffset: { type: 'vec3', default: { x: 0, y: 0.1, z: 0 } },
        drawLine: { type: 'boolean', default: false },
        lineStyle: {
            type: 'string',
            default: 'color: #FF0033; style: solid; opacity: 0.5; width: 2'
        },
        orbitAzimuth: { type: 'number', default: null },
        orbitElevation: { type: 'number', default: null },
        orbitDistance: { type: 'number', default: null }
    },

    init: function() {
        // State tracking
        this.isHovered = false;
        this.isActivated = false;
        this.originalScale = new THREE.Vector3(1, 1, 1);
        
        // Create text elements for title and label
        this.createTextElements();
        
        // Create line if needed
        if (this.data.drawLine) {
            this.createLine();
        }

        // Set up event listeners
        this.setupEventListeners();

        // Start normal state animation
        this.startNormalStateAnimation();
    },

    createTextElements: function() {
        // Create title text
        if (this.data.title) {
            this.titleEl = document.createElement('a-entity');
            this.titleEl.setAttribute('text', {
                value: this.data.title,
                align: 'center',
                color: '#FFFFFF',
                width: 2
            });
            this.titleEl.setAttribute('position', this.data.titleOffset);
            this.el.appendChild(this.titleEl);
        }

        // Create label text
        if (this.data.label) {
            this.labelEl = document.createElement('a-entity');
            this.labelEl.setAttribute('text', {
                value: this.data.label,
                align: 'center',
                color: '#FFFFFF',
                width: 2
            });
            this.labelEl.setAttribute('position', this.data.labelOffset);
            this.labelEl.setAttribute('visible', false);
            this.el.appendChild(this.labelEl);
        }
    },

    createLine: function() {
        this.lineEl = document.createElement('a-entity');
        
        // Parse the line style string into an object
        const styleProps = this.data.lineStyle.split(';').reduce((acc, prop) => {
            const [key, value] = prop.split(':').map(s => s.trim());
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {});
        
        // Create line geometry
        const material = new THREE.LineBasicMaterial({
            color: new THREE.Color(styleProps.color || '#FF0033'),
            opacity: parseFloat(styleProps.opacity || 0.5),
            transparent: true
        });

        const points = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(
                this.data.goToPosition.x,
                this.data.goToPosition.y,
                this.data.goToPosition.z
            )
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        
        this.lineEl.setObject3D('line', line);
        this.el.appendChild(this.lineEl);
    },

    setupEventListeners: function() {
        // Mouse/Touch events
        this.el.addEventListener('mouseenter', this.onHoverStart.bind(this));
        this.el.addEventListener('mouseleave', this.onHoverEnd.bind(this));
        this.el.addEventListener('click', this.onActivate.bind(this));

        // VR events
        this.el.addEventListener('raycaster-intersected', this.onHoverStart.bind(this));
        this.el.addEventListener('raycaster-intersected-cleared', this.onHoverEnd.bind(this));
        this.el.addEventListener('triggerdown', this.onActivate.bind(this));

        // External trigger event
        this.el.addEventListener('hotspot-trigger', this.onActivate.bind(this));
    },

    startNormalStateAnimation: function() {
        if (!this.isHovered && !this.isActivated) {
            this.el.setAttribute('animation__pulse', {
                property: 'scale',
                from: '1 1 1',
                to: '1.1 1.1 1.1',
                dir: 'alternate',
                dur: 1000,
                loop: true,
                easing: 'easeInOutSine'
            });
        }
    },

    onHoverStart: function() {
        if (!this.data.isInteractable) return;
        
        this.isHovered = true;
        this.el.removeAttribute('animation__pulse');
        
        this.el.setAttribute('animation__hover', {
            property: 'scale',
            to: '1.1 1.1 1.1',
            dur: 250,
            easing: 'easeOutQuad'
        });

        if (this.labelEl) {
            this.labelEl.setAttribute('visible', true);
        }
    },

    onHoverEnd: function() {
        if (!this.data.isInteractable) return;
        
        this.isHovered = false;
        this.el.removeAttribute('animation__hover');
        
        if (!this.isActivated) {
            this.startNormalStateAnimation();
        }

        if (this.labelEl) {
            this.labelEl.setAttribute('visible', false);
        }
    },

    onActivate: function() {
        if (!this.data.isInteractable) return;
        
        this.isActivated = true;
        this.el.removeAttribute('animation__hover');
        this.el.removeAttribute('animation__pulse');

        // Activate animation
        this.el.setAttribute('animation__activate', {
            property: 'scale',
            to: '1.3 1.3 1.3',
            dur: 250,
            easing: 'easeOutQuad'
        });

        // Move camera
        this.animateCamera();

        // Trigger UI element if specified
        if (this.data.isTrigger && this.data.triggeredElement) {
            setTimeout(() => {
                this.data.triggeredElement.emit('hotspot-triggered');
            }, this.data.duration);
        }

        // Reset state after animation
        setTimeout(() => {
            this.isActivated = false;
            if (this.isHovered) {
                this.onHoverStart();
            } else {
                this.startNormalStateAnimation();
            }
        }, 500);
    },

    animateCamera: function() {
        let goTo = this.data.goToPosition;
        if (
            this.data.orbitAzimuth !== null &&
            this.data.orbitElevation !== null &&
            this.data.orbitDistance !== null
        ) {
            const azimuthRad = THREE.MathUtils.degToRad(this.data.orbitAzimuth);
            const elevationRad = THREE.MathUtils.degToRad(this.data.orbitElevation);
            const d = this.data.orbitDistance;
            const target = this.data.lookAt;
            goTo = {
                x: target.x + d * Math.sin(elevationRad) * Math.sin(azimuthRad),
                y: target.y + d * Math.cos(elevationRad),
                z: target.z + d * Math.sin(elevationRad) * Math.cos(azimuthRad)
            };
        }
        if (window.cameraUtils && typeof window.cameraUtils.animateCameraToTarget === 'function') {
            window.cameraUtils.animateCameraToTarget(
                goTo,
                this.data.cameraOffset,
                this.data.lookAt,
                this.data.duration
            );
        }
    },

    // Public method to trigger the hotspot programmatically
    trigger: function() {
        this.onActivate();
    }
}); 