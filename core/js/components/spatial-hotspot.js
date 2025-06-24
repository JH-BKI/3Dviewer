/**
 * Flexible SpatialHotspot Component
 * Supports 3D model or primitive as marker, with scale control and fallback.
 */

AFRAME.registerComponent('spatial-hotspot', {
    schema: {
        hotspotID: {type: 'string'},
        label: {type: 'string', default: ''},
        color: {type: 'color', default: '#2196f3'},
        radius: {type: 'number', default: 0.08},
        modelUrl: {type: 'string', default: './core/assets/3d/map_pointer_3d_icon.glb'}, // Path relative to viewer.html
        modelScale: {type: 'vec3', default: {x: 0.01, y: 0.01, z: 0.01}}, // TEST: Large scale for visibility
        primitive: {type: 'string', default: 'sphere'}, // e.g. 'sphere', 'box', etc.
        primitiveScale: {type: 'vec3', default: {x: 1, y: 1, z: 1}} // Scale for primitive
    },

    init: function() {
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init():', this.data);
        // Create the marker (model or primitive)
        if (this.data.modelUrl) {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Creating model marker with URL:', this.data.modelUrl);
            // Parent entity holds the transform
            this.hotspotEl = document.createElement('a-entity');
            this.hotspotEl.setAttribute('visible', 'true');
            this.hotspotEl.setAttribute('scale', `${this.data.modelScale.x} ${this.data.modelScale.y} ${this.data.modelScale.z}`);

            // Child entity loads the model
            const modelEl = document.createElement('a-entity');
            const absoluteModelUrl = window.resolveViewerPath ? window.resolveViewerPath(this.data.modelUrl) : this.data.modelUrl;
            modelEl.setAttribute('gltf-model', absoluteModelUrl);
            modelEl.setAttribute('visible', 'true');
            this.hotspotEl.appendChild(modelEl);

            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Created model entity as child:', modelEl);
        } else {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Creating primitive marker');
            // Use specified primitive or fallback to sphere
            const primitiveType = this.data.primitive || 'sphere';
            this.hotspotEl = document.createElement(`a-${primitiveType}`);
            if (primitiveType === 'sphere') {
                this.hotspotEl.setAttribute('radius', this.data.radius);
            }
            this.hotspotEl.setAttribute('color', this.data.color);
            this.hotspotEl.setAttribute('opacity', 0.85);
            this.hotspotEl.setAttribute('shader', 'flat');
            this.hotspotEl.setAttribute('scale', `${this.data.primitiveScale.x} ${this.data.primitiveScale.y} ${this.data.primitiveScale.z}`);
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Created primitive entity:', this.hotspotEl);
        }
        this.hotspotEl.setAttribute('cursor-listener', '');
        this.hotspotEl.setAttribute('class', 'hotspot-marker');
        this.el.appendChild(this.hotspotEl);
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Appended hotspot to parent:', this.el);
        // Log world position, scale, and children after a short delay
        setTimeout(() => {
            if (this.hotspotEl && this.hotspotEl.object3D) {
                const pos = this.hotspotEl.object3D.getWorldPosition(new THREE.Vector3());
                const scale = this.hotspotEl.object3D.getWorldScale(new THREE.Vector3());
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] World position:', pos, 'World scale:', scale);
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Children:', this.hotspotEl.object3D.children);
            }
        }, 1500);

        // Listen for model-loaded event and log transforms and children
        this.hotspotEl.addEventListener('model-loaded', (e) => {
            const pos = this.hotspotEl.object3D.getWorldPosition(new THREE.Vector3());
            const scale = this.hotspotEl.object3D.getWorldScale(new THREE.Vector3());
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] (model-loaded) World position:', pos, 'World scale:', scale);
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] (model-loaded) Children:', this.hotspotEl.object3D.children);
        });

        // Create the label (optional)
        if (this.data.label) {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Creating label:', this.data.label);
            this.labelEl = document.createElement('a-entity');
            this.labelEl.setAttribute('text', {
                value: this.data.label,
                align: 'center',
                color: '#fff',
                width: 0.3, // Smaller width
                baseline: 'top'
            });
            this.labelEl.setAttribute('scale', '0.2 0.2 0.2'); // Explicit small scale
            // Place label above the marker (primitive or model)
            this.labelEl.setAttribute('position', `0 ${this.data.radius + 0.06} 0`);
            this.el.appendChild(this.labelEl);
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Appended label to parent:', this.el);
        }

        // Interactivity
        this.hotspotEl.addEventListener('mouseenter', this.onMouseEnter.bind(this));
        this.hotspotEl.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.hotspotEl.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.hotspotEl.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.hotspotEl.addEventListener('click', this.onClick.bind(this));
    },

    onMouseEnter: function() {
        this.hotspotEl.setAttribute('scale', '1.2 1.2 1.2'); // Grow on hover
        this.hotspotEl.setAttribute('opacity', 1.0);
        this.hotspotEl.setAttribute('glow', 'color: #244f94; intensity: 1.9;');
    },

    onMouseLeave: function() {
        this.hotspotEl.setAttribute('scale', '1 1 1'); // Return to normal size
        this.hotspotEl.setAttribute('opacity', 0.85);
        this.hotspotEl.setAttribute('glow', 'color: #244f94; intensity: 0.9;');
    },

    onMouseDown: function() {
        this.hotspotEl.setAttribute('color', '#4a90e2'); // Active color
    },

    onMouseUp: function() {
        this.hotspotEl.setAttribute('color', '#244f94'); // Return to normal color
    },

    onClick: function() {
        console.log(`[HOTSPOT_DEBUG] [spatial-hotspot] onClick(): Clicked. Emitting event for hotspot ID: ${this.data.hotspotID}`);
        window.dispatchEvent(new CustomEvent('hotspot-clicked', {
            detail: { hotspotID: this.data.hotspotID }
        }));
    },

    update: function (oldData) {
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] update():', this.data);
        // Primitives are already created in init(), no need to recreate
        // this.createPrimitiveMarker();
    },

    createPrimitiveMarker: function () {
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] createPrimitiveMarker():', this.data.primitive, this.data.primitiveScale);
        
        // Use specified primitive or fallback to sphere
        const primitiveType = this.data.primitive || 'sphere';
        this.hotspotEl = document.createElement(`a-${primitiveType}`);
        
        if (primitiveType === 'sphere') {
            this.hotspotEl.setAttribute('radius', this.data.radius);
        }
        
        this.hotspotEl.setAttribute('color', this.data.color);
        this.hotspotEl.setAttribute('opacity', 0.85);
        this.hotspotEl.setAttribute('shader', 'flat');
        this.hotspotEl.setAttribute('scale', `${this.data.primitiveScale.x} ${this.data.primitiveScale.y} ${this.data.primitiveScale.z}`);
        this.hotspotEl.setAttribute('cursor-listener', '');
        this.hotspotEl.setAttribute('class', 'hotspot-marker');
        
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] createPrimitiveMarker(): Created primitive entity:', this.hotspotEl);
        
        this.el.appendChild(this.hotspotEl);
    }
}); 