/**
 * Camera Utilities Component
 * Provides helper functions for camera manipulation and control
 * Consolidates all camera-related methods from across the codebase
 */

AFRAME.registerComponent('camera-utils', {
    schema: {}, // No schema needed since orbit-controls handles all camera parameters

    init: function() {
        // Bind methods to this component
        this.pointCameraAt = this.pointCameraAt.bind(this);
        this.animateCameraToTarget = this.animateCameraToTarget.bind(this);
        this.resetCamera = this.resetCamera.bind(this);
        this.setMaxZoomDistance = this.setMaxZoomDistance.bind(this);
        this.setPolarAndAzimuthalAngle = this.setPolarAndAzimuthalAngle.bind(this);
        this.setZoomLevel = this.setZoomLevel.bind(this);
        this.updateOrbitTarget = this.updateOrbitTarget.bind(this);
        this.updateInitialPosition = this.updateInitialPosition.bind(this);
        this.resetCameraAllValues = this.resetCameraAllValues.bind(this);
        this.getCameraPosition = this.getCameraPosition.bind(this);
        this.getCameraRotation = this.getCameraRotation.bind(this);
        this.getOrbitControlsConfig = this.getOrbitControlsConfig.bind(this);
        this.setUnlimitedAzimuthalRotation = this.setUnlimitedAzimuthalRotation.bind(this);

        // Expose methods globally
        window.cameraUtils = {
            pointCameraAt: this.pointCameraAt,
            animateCameraToTarget: this.animateCameraToTarget,
            resetCamera: this.resetCamera,
            setMaxZoomDistance: this.setMaxZoomDistance,
            setPolarAndAzimuthalAngle: this.setPolarAndAzimuthalAngle,
            setZoomLevel: this.setZoomLevel,
            updateOrbitTarget: this.updateOrbitTarget,
            updateInitialPosition: this.updateInitialPosition,
            resetCameraAllValues: this.resetCameraAllValues,
            getCameraPosition: this.getCameraPosition,
            getCameraRotation: this.getCameraRotation,
            getOrbitControlsConfig: this.getOrbitControlsConfig,
            setUnlimitedAzimuthalRotation: this.setUnlimitedAzimuthalRotation
        };

        // Set up unlimited azimuthal rotation by default
        this.setUnlimitedAzimuthalRotation();
    },

    pointCameraAt: function(lookAtVector, duration = 1000) {
        const camera = document.querySelector('[camera]');
        if (!camera) return;
        // Sync A-Frame attribute with real camera position
        const threeCamera = camera.getObject3D('camera');
        if (threeCamera) {
            const pos = threeCamera.position;
            camera.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
        }
        // Update orbit controls target using current attribute
        camera.setAttribute('orbit-controls', {
            target: `${lookAtVector.x} ${lookAtVector.y} ${lookAtVector.z}`
        });
    },

    // Utility: Calculate camera position from orbit parameters
    calculateCameraPositionFromOrbit: function(azimuthRad, elevationRad, distance, target) {
        return {
            x: target.x + distance * Math.sin(elevationRad) * Math.sin(azimuthRad),
            y: target.y + distance * Math.cos(elevationRad),
            z: target.z + distance * Math.sin(elevationRad) * Math.cos(azimuthRad)
        };
    },

    animateCameraToTarget: function(targetPosition, cameraOffset = { x: 2, y: 1, z: 2 }, lookAtVector = null, duration = 1000, orbitParams = null) {
        const goTo = {
            x: targetPosition.x + cameraOffset.x,
            y: targetPosition.y + cameraOffset.y,
            z: targetPosition.z + cameraOffset.z
        };

        const camera = document.querySelector('[camera]');
        if (!camera) return;
        // Sync A-Frame attribute with real camera position
        const threeCamera = camera.getObject3D('camera');
        if (threeCamera) {
            const pos = threeCamera.position;
            camera.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
        }

        // Animate camera position
        camera.setAttribute('animation__position', {
            property: 'position',
            to: `${goTo.x} ${goTo.y} ${goTo.z}`,
            dur: duration,
            easing: 'easeInOutCubic'
        });

        // Update look-at target if provided
        const lookAt = lookAtVector || targetPosition;
        camera.setAttribute('orbit-controls', {
            target: `${lookAt.x} ${lookAt.y} ${lookAt.z}`
        });
        // Force update after animation completes
        setTimeout(() => {
            const orbitControls = camera.components['orbit-controls'];
            if (orbitControls) {
                orbitControls.target.set(lookAt.x, lookAt.y, lookAt.z);
                orbitControls.update();
            }
            if (orbitControls && orbitControls.controls && camera.getAttribute('orbit-controls').zoomSpeed !== undefined) {
                orbitControls.controls.zoomSpeed = camera.getAttribute('orbit-controls').zoomSpeed;
            }
        }, duration);
    },

    resetCamera: function() {
        const camera = document.querySelector('[camera]');
        if (camera) {
            // Sync A-Frame attribute with real camera position
            const threeCamera = camera.getObject3D('camera');
            if (threeCamera) {
                const pos = threeCamera.position;
                camera.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
            }
            // Remove any ongoing animations
            camera.removeAttribute('animation');
            camera.removeAttribute('animation__position');
            // Reset camera position and rotation immediately
            camera.setAttribute('position', '0 0 0');
            camera.setAttribute('rotation', '0 0 0');
            // Reset orbit controls
            const orbitControls = camera.components['orbit-controls'];
            if (orbitControls) {
                orbitControls.target.set(0, 0, 0);
                orbitControls.update();
            }
            // Reset orbit controls by updating its attributes using the current camera attributes
            camera.setAttribute('orbit-controls', {
                target: '0 0 0',
                initialPosition: '0 0 0'
            });
            if (orbitControls && orbitControls.controls && camera.getAttribute('orbit-controls').zoomSpeed !== undefined) {
                orbitControls.controls.zoomSpeed = camera.getAttribute('orbit-controls').zoomSpeed;
            }
        }
    },

    // Consolidated method that combines multiple camera operations
    resetCameraAllValues: function(polar, azimuthal, zoomlevel, maxZoomDistance) {
        this.setPolarAndAzimuthalAngle(polar, azimuthal);
        this.setMaxZoomDistance(maxZoomDistance);
        this.setZoomLevel(zoomlevel);
        this.updateOrbitTarget("0 0 0");
    },

    setMaxZoomDistance: function(maxDistance) {
        const cameraEl = document.querySelector('#camera');
        if (!cameraEl) {
            console.error('Camera entity not found.');
            return;
        }

        const orbitControlsComponent = cameraEl.components['orbit-controls'];
        if (!orbitControlsComponent) {
            console.error('Orbit controls not initialized.');
            return;
        }

        const controls = orbitControlsComponent.controls;
        if (!controls) {
            console.error("Orbit controls not ready.");
            return;
        }
        cameraEl.setAttribute('orbit-controls', 'maxDistance', maxDistance);
        controls.maxDistance = maxDistance;
        controls.update();
    },

    setPolarAndAzimuthalAngle: function(polar, azimuthal) {
        const cameraEl = document.querySelector('#camera');
        if (!cameraEl) {
            console.error('Camera entity not found.');
            return;
        }

        const orbitControlsComponent = cameraEl.components['orbit-controls'];
        if (!orbitControlsComponent) {
            console.error('Orbit controls not initialized.');
            return;
        }

        const controls = orbitControlsComponent.controls;
        if (!controls || !controls.target) {
            console.error("Orbit controls not ready.");
            return;
        }

        // Create spherical if missing
        if (!controls.spherical) {
            controls.spherical = new THREE.Spherical().setFromVector3(
                controls.object.position.clone().sub(controls.target)
            );
        }

        // Set the azimuthal angle (theta) in radians — 0 means "facing down -Z"
        controls.spherical.theta = azimuthal;
        
        // Set the polar angle (in radians)
        controls.spherical.phi = THREE.MathUtils.degToRad(polar);

        // Refresh camera position from spherical coordinates
        const offset = new THREE.Vector3().setFromSpherical(controls.spherical);
        controls.object.position.copy(controls.target).add(offset);
        controls.object.lookAt(controls.target);

        // Reset internal deltas and update
        if (controls.sphericalDelta) controls.sphericalDelta.set(0, 0, 0);
        controls.enableRotate = true;
        controls.update();
    },

    setZoomLevel: function(zoomDistance = 0.1) {
        const cameraEl = document.querySelector('#camera');
        const orbitControlsComponent = cameraEl.components['orbit-controls'];

        if (!cameraEl || !orbitControlsComponent) {
            console.error('Camera or orbit controls not found.');
            return;
        }

        const controls = orbitControlsComponent.controls;
        if (!controls || !controls.target) {
            console.error('Orbit controls not ready.');
            return;
        }

        // Create spherical if missing
        if (!controls.spherical) {
            controls.spherical = new THREE.Spherical().setFromVector3(
                controls.object.position.clone().sub(controls.target)
            );
        }

        // Set zoom (distance from target)
        controls.spherical.radius = zoomDistance;

        // Update camera position
        const offset = new THREE.Vector3().setFromSpherical(controls.spherical);
        controls.object.position.copy(controls.target).add(offset);
        controls.object.lookAt(controls.target);

        // Clear deltas and update
        if (controls.sphericalDelta) controls.sphericalDelta.set(0, 0, 0);
        controls.update();
    },

    updateOrbitTarget: function(vectorStr) {
        const cameraEl = document.getElementById('camera');
        if (!cameraEl) {
            console.error('Camera entity not found.');
            return;
        }

        const orbitComponent = cameraEl.components['orbit-controls'];
        if (!orbitComponent) {
            console.error('Orbit controls not initialized.');
            return;
        }

        const coords = vectorStr.trim().split(' ').map(Number);
        if (coords.length !== 3 || coords.some(isNaN)) {
            console.error('Invalid vector string format. Expected "x y z" numbers.');
            return;
        }

        // Update component data (A-Frame attribute binding)
        cameraEl.setAttribute('orbit-controls', `target: ${vectorStr}`);

        // Update Three.js object directly to reflect the change immediately
        orbitComponent.controls.target.set(coords[0], coords[1], coords[2]);
        orbitComponent.controls.update();
    },

    updateInitialPosition: function(vectorStr) {
        const cameraEl = document.getElementById('camera');
        if (!cameraEl) {
            console.error('Camera entity not found.');
            return;
        }

        const orbitComponent = cameraEl.components['orbit-controls'];
        if (!orbitComponent) {
            console.error('Orbit controls not initialized.');
            return;
        }

        const coords = vectorStr.trim().split(' ').map(Number);
        if (coords.length !== 3 || coords.some(isNaN)) {
            console.error('Invalid vector string format. Expected "x y z" numbers.');
            return;
        }

        // Update component data (A-Frame attribute binding)
        cameraEl.setAttribute('orbit-controls', `initialPosition: ${vectorStr}`);

        // Update Three.js object directly to reflect the change immediately
        orbitComponent.controls.initialPosition.set(coords[0], coords[1], coords[2]);
        orbitComponent.controls.update();
    },

    // Utility methods for getting camera information
    getCameraPosition: function() {
        const camera = document.querySelector('[camera]');
        if (camera) {
            const position = camera.getAttribute('position');
            return {
                x: position.x.toFixed(2),
                y: position.y.toFixed(2),
                z: position.z.toFixed(2)
            };
        }
        return null;
    },

    getCameraRotation: function() {
        const camera = document.querySelector('[camera]');
        if (camera) {
            const rotation = camera.getAttribute('rotation');
            return {
                x: rotation.x.toFixed(2),
                y: rotation.y.toFixed(2),
                z: rotation.z.toFixed(2)
            };
        }
        return null;
    },

    getOrbitControlsConfig: function() {
        const camera = document.querySelector('[camera]');
        if (camera) {
            const orbit = camera.components['orbit-controls'];
            if (orbit) {
                const config = {
                    target: {
                        x: orbit.target.x,
                        y: orbit.target.y,
                        z: orbit.target.z
                    },
                    minPolarAngle: orbit.data.minPolarAngle,
                    maxPolarAngle: orbit.data.maxPolarAngle,
                    minAzimuthAngle: orbit.data.minAzimuthAngle,
                    maxAzimuthAngle: orbit.data.maxAzimuthAngle,
                    minDistance: orbit.data.minDistance,
                    maxDistance: orbit.data.maxDistance,
                    initialPosition: orbit.data.initialPosition
                        ? {
                            x: orbit.data.initialPosition.x,
                            y: orbit.data.initialPosition.y,
                            z: orbit.data.initialPosition.z
                        }
                        : undefined,
                    rotateSpeed: orbit.data.rotateSpeed,
                    enablePan: orbit.data.enablePan,
                    enableDamping: orbit.data.enableDamping,
                    dampingFactor: orbit.data.dampingFactor,
                    enableRotate: orbit.data.enableRotate,
                    enableZoom: orbit.data.enableZoom,
                    zoomSpeed: orbit.controls ? orbit.controls.zoomSpeed : undefined
                };

                // Add current zoom factor and angles
                if (orbit.controls) {
                    const camPos = orbit.controls.object.position;
                    const tgt = orbit.controls.target;
                    config.currentZoomFactor = camPos.distanceTo(tgt).toFixed(3);
                    
                    const azimuthRad = orbit.controls.getAzimuthalAngle();
                    const polarRad = orbit.controls.getPolarAngle();
                    config.currentAzimuthalAngle = THREE.MathUtils.radToDeg(azimuthRad).toFixed(2);
                    config.currentPolarAngle = THREE.MathUtils.radToDeg(polarRad).toFixed(2);
                }

                return config;
            }
        }
        return null;
    },

    setUnlimitedAzimuthalRotation: function() {
        const camera = document.querySelector('[camera]');
        if (camera) {
            camera.addEventListener('componentinitialized', (e) => {
                if (e.detail.name === 'orbit-controls') {
                    const controls = camera.components['orbit-controls'].controls;
                    if (controls) {
                        controls.minAzimuthAngle = -Infinity;
                        controls.maxAzimuthAngle = Infinity;
                    }
                }
            });
        }
    }
}); 