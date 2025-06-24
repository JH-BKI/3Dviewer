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
        this._originalScale = null;
        this._originalColor = null; // Store original color
        this._isActive = false; // Track if hotspot is clicked/active
        this._bounceAnimationId = null; // Track bounce animation
        this._isHovered = false;
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
            // Ensure raycaster targeting
            modelEl.setAttribute('cursor-listener', '');
            modelEl.classList.add('collidable');
            this.hotspotEl.setAttribute('cursor-listener', '');
            this.hotspotEl.classList.add('collidable');
            // Apply color tint after model loads
            modelEl.addEventListener('model-loaded', (e) => {
                const color = new THREE.Color(this.data.color);
                this._originalColor = color.clone(); // Store original color
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Model loaded, applying color:', this.data.color);
                e.detail.model.traverse((node) => {
                    if (node.isMesh && node.material) {
                        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Found mesh with material:', node.name, node.material);
                        // If material supports color, set it
                        if (node.material.color) {
                            node.material.color.copy(color);
                            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Applied color to material:', color);
                        }
                        // If material supports emissive, set a subtle tint
                        if (node.material.emissive) {
                            node.material.emissive.copy(color).multiplyScalar(0.2);
                            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Applied emissive to material');
                        }
                    }
                });
                // Start bounce animation on the model after it loads
                this.startBounceAnimation(modelEl);
            });
            modelEl.addEventListener('mouseenter', (evt) => {
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] modelEl mouseenter', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
                this.onMouseEnter(evt);
            });
            modelEl.addEventListener('mouseleave', (evt) => {
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] modelEl mouseleave', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
                this.onMouseLeave(evt);
            });
            modelEl.addEventListener('mousedown', (evt) => {
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] modelEl mousedown', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
                this.onMouseDown(evt);
            });
            modelEl.addEventListener('mouseup', (evt) => {
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] modelEl mouseup', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
                this.onMouseUp(evt);
            });
            modelEl.addEventListener('click', (evt) => {
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] modelEl click', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
                this.onClick(evt);
            });
            this.hotspotEl.appendChild(modelEl);

            // Add a visible proxy primitive for raycasting (for debugging/visualization)
            const proxy = document.createElement('a-sphere');
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Creating proxy sphere...');
            // Use a fixed large scale for visibility instead of relative to model scale
            const proxyScale = '2.1 2.1 2.1';
            proxy.setAttribute('scale', proxyScale);
            proxy.setAttribute('position', '0 0.4 0'); // Moved up by 0.1
            proxy.setAttribute('material', 'color: magenta; opacity: 0; transparent: true; side: double;'); // Invisible collision proxy
            proxy.setAttribute('cursor-listener', '');
            proxy.classList.add('collidable');
            // Remove animation from proxy - it's now on the model
            this.hotspotEl.appendChild(proxy);
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Proxy sphere created and appended:', proxy);
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Proxy attributes:', {
                scale: proxyScale,
                position: '0 0.11 0',
                material: 'color: magenta; opacity: 0.7; transparent: true; side: double;'
            });
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Expected proxy world scale:', {
                proxyScale: proxyScale,
                parentScale: `${this.data.modelScale.x} ${this.data.modelScale.y} ${this.data.modelScale.z}`,
                expectedWorldScale: `${1.0 * this.data.modelScale.x} ${1.0 * this.data.modelScale.y} ${1.0 * this.data.modelScale.z}`
            });
            // Debug log for proxy
            setTimeout(() => {
                if (proxy.object3D) {
                    const pos = proxy.object3D.getWorldPosition(new THREE.Vector3());
                    const scale = proxy.object3D.getWorldScale(new THREE.Vector3());
                    console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Proxy sphere world position:', pos, 'world scale:', scale);
                }
            }, 1000);

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
            this.hotspotEl.setAttribute('cursor-listener', '');
            this.hotspotEl.classList.add('collidable');
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Created primitive entity:', this.hotspotEl);
        }
        // Interactivity for parent entity (for both model and primitive)
        this.hotspotEl.addEventListener('mouseenter', (evt) => {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] hotspotEl mouseenter', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
            this.onMouseEnter(evt);
        });
        this.hotspotEl.addEventListener('mouseleave', (evt) => {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] hotspotEl mouseleave', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
            this.onMouseLeave(evt);
        });
        this.hotspotEl.addEventListener('mousedown', (evt) => {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] hotspotEl mousedown', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
            this.onMouseDown(evt);
        });
        this.hotspotEl.addEventListener('mouseup', (evt) => {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] hotspotEl mouseup', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
            this.onMouseUp(evt);
        });
        this.hotspotEl.addEventListener('click', (evt) => {
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] hotspotEl click', {event: evt, target: evt.target, currentTarget: evt.currentTarget});
            this.onClick(evt);
        });
        this.el.appendChild(this.hotspotEl);
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Appended hotspot to parent:', this.el);
        // Log world position, scale, and children after a short delay
        setTimeout(() => {
            if (this.hotspotEl && this.hotspotEl.object3D) {
                const pos = this.hotspotEl.object3D.getWorldPosition(new THREE.Vector3());
                const scale = this.hotspotEl.object3D.getWorldScale(new THREE.Vector3());
                // console.log('[HOTSPOT_DEBUG] [spatial-hotspot] World position:', pos, 'World scale:', scale);
                // console.log('[HOTSPOT_DEBUG] [spatial-hotspot] Children:', this.hotspotEl.object3D.children);
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
        // Create a parent entity for the label and stroke
        this.labelEl = document.createElement('a-entity');
            // Compute inverse scale of marker, but use 0.2 as base world scale
            let markerScale = this.data.modelUrl ? this.data.modelScale : this.data.primitiveScale;
            let invScale = {
                x: markerScale.x === 0 ? 0.2 : 0.2 / markerScale.x,
                y: markerScale.y === 0 ? 0.2 : 0.2 / markerScale.y,
                z: markerScale.z === 0 ? 0.2 : 0.2 / markerScale.z
            };
            this.labelEl.setAttribute('scale', `${invScale.x} ${invScale.y} ${invScale.z}`);
            this.labelEl.setAttribute('visible', 'false'); // Hide by default
            this.labelEl.setAttribute('position', '0 5 0.1');
        // Stroke offsets (8 directions)
        const strokeOffsets = [
            [0.02, 0, 0], [-0.02, 0, 0], [0, 0.02, 0], [0, -0.02, 0],
            [0.014, 0.014, 0], [-0.014, 0.014, 0], [0.014, -0.014, 0], [-0.014, -0.014, 0]
        ];
        strokeOffsets.forEach(offset => {
            const stroke = document.createElement('a-entity');
            stroke.setAttribute('text', {
                value: this.data.label,
                align: 'center',
                color: '#000',
                width: 2,
                baseline: 'top',
                side: 'double'
            });
            stroke.setAttribute('position', `${offset[0]} ${offset[1]} ${offset[2]}`);
            this.labelEl.appendChild(stroke);
        });
        // Main label (white, centered)
        const mainText = document.createElement('a-entity');
        mainText.setAttribute('text', {
            value: this.data.label,
            align: 'center',
            color: '#fff',
            width: 2,
            baseline: 'top',
            side: 'double'
        });
        mainText.setAttribute('position', '0 0 0');
        this.labelEl.appendChild(mainText);
        this.hotspotEl.appendChild(this.labelEl);
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Appended label with stroke to marker:', this.hotspotEl);
        }
    },

    onMouseEnter: function(evt) {
        if (this._isHovered) return;
        this._isHovered = true;
        // Only scale up if not already at hover scale (prevents compounding)
        if (this.hotspotEl && this.hotspotEl.object3D) {
            const s = this.hotspotEl.object3D.scale;
            if (!this._originalScale || (!this._isActive && (s.x !== this._originalScale.x || s.y !== this._originalScale.y || s.z !== this._originalScale.z))) {
                this._originalScale = { x: s.x, y: s.y, z: s.z };
            }
            if (!this._isActive) {
                const newScale = `${this._originalScale.x * 1.2} ${this._originalScale.y * 1.2} ${this._originalScale.z * 1.2}`;
                this.hotspotEl.setAttribute('scale', newScale);
                console.log('[HOTSPOT_DEBUG] [spatial-hotspot] onMouseEnter: scaling up', {original: this._originalScale, new: newScale});
            }
        }
        this.hotspotEl.setAttribute('opacity', 1.0);
        this.hotspotEl.setAttribute('glow', 'color: #244f94; intensity: 1.9;');
        if (this.labelEl) {
            this.labelEl.setAttribute('visible', 'true');
        }
        if (this._originalColor) {
            const lighterColor = this._originalColor.clone().multiplyScalar(1.5);
            const modelEl = this.hotspotEl.querySelector('[gltf-model]');
            if (modelEl) {
                const mesh = modelEl.getObject3D('mesh');
                if (mesh) {
                    mesh.traverse((node) => {
                        if (node.isMesh && node.material) {
                            if (node.material.color) {
                                node.material.color.copy(lighterColor);
                            }
                            if (node.material.emissive) {
                                node.material.emissive.copy(lighterColor).multiplyScalar(0.5);
                            }
                        }
                    });
                }
            }
        }
    },

    onMouseLeave: function(evt) {
        this._isHovered = false;
        if (this.hotspotEl && this.hotspotEl.object3D && this._originalScale && !this._isActive) {
            const orig = this._originalScale;
            const origScale = `${orig.x} ${orig.y} ${orig.z}`;
            this.hotspotEl.setAttribute('scale', origScale);
            console.log('[HOTSPOT_DEBUG] [spatial-hotspot] onMouseLeave: restoring scale', {restored: origScale});
        }
        this.hotspotEl.setAttribute('opacity', 0.85);
        this.hotspotEl.setAttribute('glow', 'color: #244f94; intensity: 0.9;');
        if (this.labelEl && !this._isActive) {
            this.labelEl.setAttribute('visible', 'false');
        }
        if (this._originalColor && !this._isActive) {
            const modelEl = this.hotspotEl.querySelector('[gltf-model]');
            if (modelEl) {
                modelEl.getObject3D('mesh').traverse((node) => {
                    if (node.isMesh && node.material) {
                        if (node.material.color) {
                            node.material.color.copy(this._originalColor);
                        }
                        if (node.material.emissive) {
                            node.material.emissive.copy(this._originalColor).multiplyScalar(0.2);
                        }
                    }
                });
            }
        }
    },

    onMouseDown: function() {
        this.hotspotEl.setAttribute('color', '#4a90e2'); // Active color
    },

    onMouseUp: function() {
        this.hotspotEl.setAttribute('color', '#244f94'); // Return to normal color
    },

    // Dedicated modal close handler
    handleModalClose: function() {
        console.log('[HOTSPOT_DEBUG] [handleModalClose] Called for hotspot:', this.data.hotspotID);
        this._isActive = false;
        // Hide label
        if (this.labelEl) {
            this.labelEl.setAttribute('visible', 'false');
            console.log('[HOTSPOT_DEBUG] [handleModalClose] Label hidden:', this.labelEl.getAttribute('visible'));
        }
        // Restore original scale
        if (this.hotspotEl && this.hotspotEl.object3D && this._originalScale) {
            const orig = this._originalScale;
            const origScale = `${orig.x} ${orig.y} ${orig.z}`;
            this.hotspotEl.setAttribute('scale', origScale);
            const s = this.hotspotEl.object3D.scale;
            console.log('[HOTSPOT_DEBUG] [handleModalClose] Scale restored:', s);
        }
        // Restore original color
        if (this._originalColor) {
            const modelEl = this.hotspotEl.querySelector('[gltf-model]');
            if (modelEl) {
                modelEl.getObject3D('mesh').traverse((node) => {
                    if (node.isMesh && node.material) {
                        if (node.material.color) {
                            node.material.color.copy(this._originalColor);
                            console.log('[HOTSPOT_DEBUG] [handleModalClose] Color restored:', this._originalColor);
                        }
                        if (node.material.emissive) {
                            node.material.emissive.copy(this._originalColor).multiplyScalar(0.2);
                            console.log('[HOTSPOT_DEBUG] [handleModalClose] Emissive restored:', node.material.emissive);
                        }
                    }
                });
            }
        }
        // Restart bounce animation
        const modelEl = this.hotspotEl.querySelector('[gltf-model]');
        if (modelEl) {
            this.startBounceAnimation(modelEl);
            console.log('[HOTSPOT_DEBUG] [handleModalClose] Bounce animation restarted');
        }
        // Remove the event listener
        window.removeEventListener('modal-closed', this._boundModalCloseHandler);
        console.log('[HOTSPOT_DEBUG] [handleModalClose] Modal close handler removed');
    },

    onClick: function() {
        this._isActive = true;
        // Stop bounce animation
        if (this._bounceAnimationId) {
            cancelAnimationFrame(this._bounceAnimationId);
            this._bounceAnimationId = null;
            console.log('[HOTSPOT_DEBUG] [onClick] Bounce animation stopped');
        }
        // Keep label visible when clicked
        if (this.labelEl) {
            this.labelEl.setAttribute('visible', 'true');
            console.log('[HOTSPOT_DEBUG] [onClick] Label set visible:', this.labelEl.getAttribute('visible'));
        }
        // Set scale to hover scale (and store original if not already stored)
        if (this.hotspotEl && this.hotspotEl.object3D) {
            const s = this.hotspotEl.object3D.scale;
            if (!this._originalScale) {
                this._originalScale = { x: s.x / 1.2, y: s.y / 1.2, z: s.z / 1.2 };
            }
            const newScale = `${this._originalScale.x * 1.2} ${this._originalScale.y * 1.2} ${this._originalScale.z * 1.2}`;
            this.hotspotEl.setAttribute('scale', newScale);
            console.log('[HOTSPOT_DEBUG] [onClick] Scale set to hover:', newScale);
        }
        // Apply lighter color (same as hover) when clicked
        if (this._originalColor) {
            const lighterColor = this._originalColor.clone().multiplyScalar(1.5);
            const modelEl = this.hotspotEl.querySelector('[gltf-model]');
            if (modelEl) {
                modelEl.getObject3D('mesh').traverse((node) => {
                    if (node.isMesh && node.material) {
                        if (node.material.color) {
                            node.material.color.copy(lighterColor);
                            console.log('[HOTSPOT_DEBUG] [onClick] Color set to lighter:', lighterColor);
                        }
                        if (node.material.emissive) {
                            node.material.emissive.copy(lighterColor).multiplyScalar(0.5);
                            console.log('[HOTSPOT_DEBUG] [onClick] Emissive set to lighter:', node.material.emissive);
                        }
                    }
                });
            }
        }
        // Remove any previous modal close handler
        if (this._boundModalCloseHandler) {
            window.removeEventListener('modal-closed', this._boundModalCloseHandler);
            console.log('[HOTSPOT_DEBUG] [onClick] Previous modal close handler removed');
        }
        // Bind and add the modal close handler
        this._boundModalCloseHandler = this.handleModalClose.bind(this);
        window.addEventListener('modal-closed', this._boundModalCloseHandler);
        console.log('[HOTSPOT_DEBUG] [onClick] Modal close handler bound and added');
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
        this.hotspotEl.classList.add('collidable');
        
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] createPrimitiveMarker(): Created primitive entity:', this.hotspotEl);
        
        this.el.appendChild(this.hotspotEl);
    },

    startBounceAnimation: function(modelEl) {
        let startTime = Date.now();
        const duration = 1000; // 1 second per direction
        const minScale = 1;
        const maxScale = 1.1;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % (duration * 2)) / duration; // 0 to 2, then repeats
            
            let scale;
            if (progress <= 1) {
                // Scale up (0 to 1)
                scale = minScale + (maxScale - minScale) * progress;
            } else {
                // Scale down (1 to 0)
                scale = maxScale - (maxScale - minScale) * (progress - 1);
            }
            
            modelEl.setAttribute('scale', `${scale} ${scale} ${scale}`);
            this._bounceAnimationId = requestAnimationFrame(animate);
        };
        
        this._bounceAnimationId = requestAnimationFrame(animate);
    },

    tick: function () {
        if (!this.hotspotEl || !this.el.sceneEl || !this.el.sceneEl.camera) return;
        const camera = this.el.sceneEl.camera;
        const camWorldPos = new THREE.Vector3();
        camera.getWorldPosition(camWorldPos);

        function applyRestrictedBillboard(obj3D, targetPos) {
            const objPos = new THREE.Vector3();
            obj3D.getWorldPosition(objPos);
            const dir = new THREE.Vector3().subVectors(targetPos, objPos);
            const yaw = Math.atan2(dir.x, dir.z);
            const distXZ = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
            let pitch = -Math.atan2(dir.y, distXZ); // Invert pitch
            const maxPitch = THREE.MathUtils.degToRad(15);
            pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
            obj3D.rotation.set(pitch, yaw, 0, 'YXZ');
        }
        applyRestrictedBillboard(this.hotspotEl.object3D, camWorldPos);
        // Do not touch the label in tick for this test
    }
}); 