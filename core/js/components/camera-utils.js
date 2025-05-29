/**
 * Camera Utilities Component
 * Provides helper functions for camera manipulation and control
 */

AFRAME.registerComponent('camera-utils', {
    schema: {}, // No schema needed since orbit-controls handles all camera parameters

    init: function() {
        // Bind methods to this component
        this.pointCameraAt = this.pointCameraAt.bind(this);
        this.animateCameraToTarget = this.animateCameraToTarget.bind(this);
        this.resetCamera = this.resetCamera.bind(this);

        // Expose methods globally
        window.cameraUtils = {
            pointCameraAt: this.pointCameraAt,
            animateCameraToTarget: this.animateCameraToTarget,
            resetCamera: this.resetCamera,
            setInitialPosition: (position) => {
                // No global config, so this is a no-op or could set directly on camera entity if needed
            }
        };
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
    sphericalToCartesian: function(azimuthDeg, elevationDeg, distance, target) {
        const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg);
        const elevationRad = THREE.MathUtils.degToRad(elevationDeg);
        return {
            x: target.x + distance * Math.sin(elevationRad) * Math.sin(azimuthRad),
            y: target.y + distance * Math.cos(elevationRad),
            z: target.z + distance * Math.sin(elevationRad) * Math.cos(azimuthRad)
        };
    },

    animateCameraToTarget: function(targetPosition, cameraOffset = { x: 2, y: 1, z: 2 }, lookAtVector = null, duration = 1000, orbitParams = null) {
        let newPos = targetPosition;
        if (orbitParams && orbitParams.azimuth !== undefined && orbitParams.elevation !== undefined && orbitParams.distance !== undefined && orbitParams.target) {
            newPos = this.sphericalToCartesian(orbitParams.azimuth, orbitParams.elevation, orbitParams.distance, orbitParams.target);
        } else {
            newPos = {
                x: targetPosition.x + cameraOffset.x,
                y: targetPosition.y + cameraOffset.y,
                z: targetPosition.z + cameraOffset.z
            };
        }
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
            to: `${newPos.x} ${newPos.y} ${newPos.z}`,
            dur: duration,
            easing: 'easeInOutQuad'
        });
        // Set orbit-controls target using current attribute
        const lookAt = lookAtVector || (orbitParams ? orbitParams.target : targetPosition);
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
            // Clear any existing animations
            camera.removeAttribute('animation');
            camera.removeAttribute('animation__position');
            // Reset camera position and rotation immediately
            camera.setAttribute('position', '0 0 0');
            camera.setAttribute('rotation', '0 0 0');
            // Get orbit controls component
            const orbitControls = camera.components['orbit-controls'];
            if (orbitControls) {
                // Reset orbit controls state
                orbitControls.target.set(0, 0, 0);
                orbitControls.update();
            }
            // Reset orbit controls by updating its attributes using the current camera attributes
            // (No global config)
            // Force an update of the orbit controls
            if (orbitControls) {
                orbitControls.update();
            }
            if (orbitControls && orbitControls.controls && camera.getAttribute('orbit-controls').zoomSpeed !== undefined) {
                orbitControls.controls.zoomSpeed = camera.getAttribute('orbit-controls').zoomSpeed;
            }
        }
    }
}); 