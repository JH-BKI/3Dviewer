/**
 * View Cube Component (2D HUD Style, Bottom Right)
 * Renders a 3D cube as a HUD element in the bottom right of the viewport
 */

AFRAME.registerComponent('view-cube', {
    schema: {
        size: { type: 'number', default: 0.15 },
        offset: { type: 'string', default: '0.55 -0.55 -1.2' }, // bottom right
        labels: { type: 'boolean', default: true },
        transitionSpeed: { type: 'number', default: 1000 },
        enabled: { type: 'boolean', default: true },
        visible: { type: 'boolean', default: true }
    },

    init: function() {
        this.isInitialized = false;
        this.initAttempts = 0;
        this.maxInitAttempts = 10;
        this.faceEntities = [];
        this.labelEntities = [];
        this.highlightedFace = null;
        this.isDragging = false;
        this.lastPointer = null;
        this.spherical = { theta: 0, phi: Math.PI / 2 };
        this.tryInitialize();
    },

    tryInitialize: function() {
        this.camera = document.querySelector('[camera]');
        if (!this.camera) {
            this.retryInit();
            return;
        }
        this.orbitControls = this.camera.components['orbit-controls'];
        if (!this.orbitControls || !this.orbitControls.controls) {
            this.retryInit();
            return;
        }
        // Create cube container and parent to camera for HUD effect
        this.cubeContainer = document.createElement('a-entity');
        this.cubeContainer.setAttribute('position', this.data.offset);
        this.cubeContainer.setAttribute('scale', '1 1 1');
        this.camera.appendChild(this.cubeContainer); // Parent to camera
        // Create the cube body
        this.createCubeBody();
        // Create face overlays and labels
        this.createFaceOverlays();
        // Add drag listeners
        this.addDragListeners();
        // Initial update
        this.isInitialized = true;
    },

    retryInit: function() {
        if (this.initAttempts >= this.maxInitAttempts) return;
        this.initAttempts++;
        setTimeout(() => this.tryInitialize(), 500);
    },

    createCubeBody: function() {
        const box = document.createElement('a-box');
        box.setAttribute('width', this.data.size);
        box.setAttribute('height', this.data.size);
        box.setAttribute('depth', this.data.size);
        box.setAttribute('color', '#e0e0e0');
        box.setAttribute('opacity', 0.85);
        box.setAttribute('side', 'double');
        this.cubeContainer.appendChild(box);
    },

    createFaceOverlays: function() {
        // Face definitions: name, position, rotation, label, color
        const s = this.data.size / 2 + 0.001; // Slightly above the box surface
        const faces = [
            { name: 'front',   pos: `0 0 ${s}`,      rot: '0 0 0',      label: 'F', color: '#FF6666' },
            { name: 'back',    pos: `0 0 -${s}`,     rot: '0 180 0',    label: 'B', color: '#66FF66' },
            { name: 'left',    pos: `-${s} 0 0`,     rot: '0 90 0',     label: 'L', color: '#6699FF' },
            { name: 'right',   pos: `${s} 0 0`,      rot: '0 -90 0',    label: 'R', color: '#FFFF66' },
            { name: 'top',     pos: `0 ${s} 0`,      rot: '-90 0 0',    label: 'T', color: '#FF66FF' },
            { name: 'bottom',  pos: `0 -${s} 0`,     rot: '90 0 0',     label: 'B', color: '#66FFFF' }
        ];
        faces.forEach(face => {
            // Overlay plane for interaction and color
            const plane = document.createElement('a-plane');
            plane.setAttribute('width', this.data.size * 0.98);
            plane.setAttribute('height', this.data.size * 0.98);
            plane.setAttribute('position', face.pos);
            plane.setAttribute('rotation', face.rot);
            plane.setAttribute('color', face.color);
            plane.setAttribute('opacity', 0.7);
            plane.setAttribute('side', 'double');
            plane.setAttribute('class', 'view-cube-face');
            plane.setAttribute('data-face', face.name);
            plane.setAttribute('cursor-listener', '');
            // Highlight on hover
            plane.addEventListener('mouseenter', () => {
                if (!this.data.enabled || !this.isInitialized) return;
                plane.setAttribute('opacity', 1.0);
                this.highlightedFace = plane;
            });
            plane.addEventListener('mouseleave', () => {
                if (!this.data.enabled || !this.isInitialized) return;
                plane.setAttribute('opacity', 0.7);
                this.highlightedFace = null;
            });
            plane.addEventListener('click', () => {
                if (!this.data.enabled || !this.isInitialized) return;
                this.onFaceClick(face.name);
            });
            this.cubeContainer.appendChild(plane);
            this.faceEntities.push(plane);
            // Label
            if (this.data.labels) {
                const label = document.createElement('a-entity');
                label.setAttribute('text', {
                    value: face.label,
                    align: 'center',
                    color: '#222',
                    width: this.data.size * 0.7,
                    negate: true
                });
                label.setAttribute('position', face.pos);
                label.setAttribute('rotation', face.rot);
                this.cubeContainer.appendChild(label);
                this.labelEntities.push(label);
            }
        });
    },

    addDragListeners: function() {
        // Listen for pointer events on the cube container
        this.cubeContainer.addEventListener('mousedown', this.onPointerDown.bind(this));
        this.cubeContainer.addEventListener('touchstart', this.onPointerDown.bind(this));
        window.addEventListener('mousemove', this.onPointerMove.bind(this));
        window.addEventListener('touchmove', this.onPointerMove.bind(this));
        window.addEventListener('mouseup', this.onPointerUp.bind(this));
        window.addEventListener('touchend', this.onPointerUp.bind(this));
    },

    onPointerDown: function(e) {
        if (!this.data.enabled || !this.isInitialized) return;
        this.isDragging = true;
        this.lastPointer = this.getPointer(e);
        e.preventDefault();
    },

    onPointerMove: function(e) {
        if (!this.isDragging || !this.data.enabled || !this.isInitialized) return;
        const pointer = this.getPointer(e);
        if (!pointer || !this.lastPointer) return;
        // Calculate delta
        const dx = pointer.x - this.lastPointer.x;
        const dy = pointer.y - this.lastPointer.y;
        // Sensitivity factor
        const sensitivity = 0.01;
        // Update spherical angles
        this.spherical.theta -= dx * sensitivity;
        this.spherical.phi -= dy * sensitivity;
        // Clamp phi
        this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
        // Update orbit controls (camera)
        this.setCameraFromSpherical();
        this.lastPointer = pointer;
    },

    onPointerUp: function(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.lastPointer = null;
    },

    getPointer: function(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        } else if (e.clientX !== undefined && e.clientY !== undefined) {
            return { x: e.clientX, y: e.clientY };
        }
        return null;
    },

    onFaceClick: function(faceName) {
        if (!this.data.enabled || !this.isInitialized) return;
        const angles = {
            front: { polar: 90, azimuthal: 0 },
            back: { polar: 90, azimuthal: 180 },
            left: { polar: 90, azimuthal: 90 },
            right: { polar: 90, azimuthal: -90 },
            top: { polar: 0, azimuthal: 0 },
            bottom: { polar: 180, azimuthal: 0 }
        };
        const targetAngles = angles[faceName];
        if (!targetAngles) return;
        // Update spherical and camera
        this.spherical.phi = THREE.MathUtils.degToRad(targetAngles.polar);
        this.spherical.theta = THREE.MathUtils.degToRad(targetAngles.azimuthal);
        this.setCameraFromSpherical();
    },

    setCameraFromSpherical: function() {
        // Update orbit controls/camera from spherical
        const controls = this.orbitControls.controls;
        const r = controls.object.position.distanceTo(controls.target);
        const spherical = new THREE.Spherical(r, this.spherical.phi, this.spherical.theta);
        const offset = new THREE.Vector3().setFromSpherical(spherical);
        controls.object.position.copy(controls.target).add(offset);
        controls.object.lookAt(controls.target);
        if (controls.spherical) {
            controls.spherical.theta = this.spherical.theta;
            controls.spherical.phi = this.spherical.phi;
        }
        if (controls.sphericalDelta) controls.sphericalDelta.set(0, 0, 0);
        controls.update();
    },

    tick: function() {
        if (!this.data.enabled || !this.data.visible || !this.isInitialized) return;
        // Always keep the cube facing the camera (no rotation from orbit-controls)
        this.cubeContainer.object3D.rotation.set(0, 0, 0);
        // Optionally, you can scale the cube to keep it the same size regardless of FOV
        // (not implemented here, but can be added if needed)
    },

    update: function() {
        if (!this.isInitialized) return;
        this.cubeContainer.setAttribute('visible', this.data.visible);
        // Update size of overlays and labels if changed
        const s = this.data.size / 2 + 0.001;
        const faces = [
            { pos: `0 0 ${s}` },
            { pos: `0 0 -${s}` },
            { pos: `-${s} 0 0` },
            { pos: `${s} 0 0` },
            { pos: `0 ${s} 0` },
            { pos: `0 -${s} 0` }
        ];
        this.faceEntities.forEach((plane, i) => {
            plane.setAttribute('width', this.data.size * 0.98);
            plane.setAttribute('height', this.data.size * 0.98);
            plane.setAttribute('position', faces[i].pos);
        });
        this.labelEntities.forEach((label, i) => {
            label.setAttribute('position', faces[i].pos);
        });
    },

    remove: function() {
        this.faceEntities.forEach(plane => {
            plane.remove();
        });
        this.labelEntities.forEach(label => {
            label.remove();
        });
        if (this.cubeContainer) this.cubeContainer.remove();
    }
}); 