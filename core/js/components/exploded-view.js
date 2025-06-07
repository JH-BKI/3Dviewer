/**
 * Exploded View Component
 * Handles the animation of model parts for exploded view visualization
 */

AFRAME.registerComponent('exploded-view', {
    schema: {
        enabled: { type: 'boolean', default: true },
        animationDuration: { type: 'number', default: 1000 },
        explosionDistance: { type: 'number', default: 0.5 },
        buttonId: { type: 'string', default: 'explode-toggle' }
    },

    init: function() {
        this.isExploded = false;
        this.originalPositions = new Map();
        this.modelParts = [];
        this.toggleButton = null;
        this.originalModel = null;
        
        // Create the toggle button (but don't show it yet)
        this.createToggleButton();
        
        // Listen for model loaded event
        this.el.sceneEl.addEventListener('model-loaded', (event) => {
            console.log('[ExplodedView] Model loaded event received');
            console.log('[ExplodedView] Model details:', {
                type: event.detail.model.type,
                name: event.detail.model.name,
                isObject3D: event.detail.model.isObject3D,
                children: event.detail.model.children?.length
            });
            this.analyzeModel(event.detail.model);
        });
    },

    createToggleButton: function() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = this.data.buttonId;
        this.toggleButton.className = 'button is-medium is-link overlay-buttons';
        this.toggleButton.setAttribute('data-balloon-pos', 'right');
        this.toggleButton.setAttribute('aria-label', 'Toggle exploded view');
        this.toggleButton.style.display = 'none'; // Hide by default
        
        // Add icon
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-arrows-up-down-left-right';
        this.toggleButton.appendChild(icon);
        
        // Add to buttons container
        const container = document.querySelector('.buttons-container');
        if (container) {
            container.appendChild(this.toggleButton);
        }
        
        // Add click handler
        this.toggleButton.addEventListener('click', () => {
            this.toggleExplodedView();
        });
    },

    analyzeModel: function(model) {
        console.log('[ExplodedView] Analyzing model:', model);
        
        // Clear previous state
        this.originalPositions.clear();
        this.modelParts = [];
        
        // Hide the button initially
        if (this.toggleButton) {
            this.toggleButton.style.display = 'none';
        }

        // Store reference to original model
        this.originalModel = this.el.object3D;
        console.log('[ExplodedView] Original model:', this.originalModel);
        
        // The model itself is an Object3D, so we can use it directly
        const object3D = model;
        if (!object3D || !object3D.isObject3D) {
            console.log('[ExplodedView] Invalid model object');
            return;
        }

        // Function to recursively find meshes
        const findMeshes = (obj) => {
            let meshes = [];
            
            // Check if this is a mesh
            if (obj.type === 'Mesh') {
                console.log('[ExplodedView] Found mesh:', obj.name || 'unnamed');
                meshes.push(obj);
            }
            
            // Check children
            if (obj.children && obj.children.length > 0) {
                obj.children.forEach(child => {
                    meshes = meshes.concat(findMeshes(child));
                });
            }
            
            return meshes;
        };

        // Find all meshes in the model
        const meshes = findMeshes(object3D);
        console.log('[ExplodedView] Found meshes:', meshes.length);
        
        // If we have multiple meshes, we can create an exploded view
        if (meshes.length > 1) {
            console.log('[ExplodedView] Creating exploded view with', meshes.length, 'parts');
            
            // Create entities for each mesh
            meshes.forEach((mesh, index) => {
                // Create a new entity for this mesh
                const entity = document.createElement('a-entity');
                entity.setAttribute('data-model-part', `part-${index}`);
                
                // Copy the mesh's position
                const position = mesh.position;
                entity.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
                
                // Store the original position
                this.originalPositions.set(entity, {
                    x: position.x,
                    y: position.y,
                    z: position.z
                });
                
                // Add the mesh to the entity
                entity.setObject3D('mesh', mesh.clone());
                
                // Hide the part initially
                entity.object3D.visible = false;
                
                // Add to our list of parts
                this.modelParts.push(entity);
                
                // Add to the scene
                this.el.appendChild(entity);
            });
            
            // Show the explode button since we have parts
            if (this.toggleButton) {
                console.log('[ExplodedView] Showing explode button');
                this.toggleButton.style.display = 'inline-block';
            }
        } else {
            console.log('[ExplodedView] Not enough meshes for exploded view');
        }
    },

    toggleExplodedView: function() {
        if (!this.data.enabled || this.modelParts.length === 0) return;
        
        this.isExploded = !this.isExploded;
        console.log('[ExplodedView] Toggling exploded view:', this.isExploded);
        
        if (this.isExploded) {
            // First show all parts
            this.modelParts.forEach(part => {
                part.object3D.visible = true;
            });
            
            // Then hide original model
            if (this.originalModel) {
                this.originalModel.visible = false;
            }
            
            // Finally animate the explosion
            this.explodeModel();
            
            if (this.toggleButton) {
                this.toggleButton.setAttribute('data-balloon', 'Collapse view');
                this.toggleButton.querySelector('i').className = 'fa-solid fa-compress';
            }
        } else {
            // First animate the collapse
            this.collapseModel();
            
            // Wait for animation to complete before switching visibility
            setTimeout(() => {
                // Hide all parts
                this.modelParts.forEach(part => {
                    part.object3D.visible = false;
                });
                
                // Show original model
                if (this.originalModel) {
                    this.originalModel.visible = true;
                }
            }, this.data.animationDuration);
            
            if (this.toggleButton) {
                this.toggleButton.setAttribute('data-balloon', 'Explode view');
                this.toggleButton.querySelector('i').className = 'fa-solid fa-arrows-up-down-left-right';
            }
        }
    },

    explodeModel: function() {
        this.modelParts.forEach(part => {
            const originalPos = this.originalPositions.get(part);
            if (!originalPos) return;
            
            // Calculate explosion direction (outward from center)
            const direction = {
                x: originalPos.x === 0 ? 1 : originalPos.x / Math.abs(originalPos.x),
                y: originalPos.y === 0 ? 1 : originalPos.y / Math.abs(originalPos.y),
                z: originalPos.z === 0 ? 1 : originalPos.z / Math.abs(originalPos.z)
            };
            
            // Set new position
            const newPos = {
                x: originalPos.x + (direction.x * this.data.explosionDistance),
                y: originalPos.y + (direction.y * this.data.explosionDistance),
                z: originalPos.z + (direction.z * this.data.explosionDistance)
            };
            
            // Animate to new position
            part.setAttribute('animation__position', {
                property: 'position',
                to: `${newPos.x} ${newPos.y} ${newPos.z}`,
                dur: this.data.animationDuration,
                easing: 'easeOutQuad'
            });
        });
    },

    collapseModel: function() {
        this.modelParts.forEach(part => {
            const originalPos = this.originalPositions.get(part);
            if (!originalPos) return;
            
            // Animate back to original position
            part.setAttribute('animation__position', {
                property: 'position',
                to: `${originalPos.x} ${originalPos.y} ${originalPos.z}`,
                dur: this.data.animationDuration,
                easing: 'easeOutQuad'
            });
        });
    },

    remove: function() {
        // Clean up button
        if (this.toggleButton && this.toggleButton.parentNode) {
            this.toggleButton.parentNode.removeChild(this.toggleButton);
        }
        
        // Clean up model parts
        this.modelParts.forEach(part => {
            if (part.parentNode) {
                part.parentNode.removeChild(part);
            }
        });
    }
}); 