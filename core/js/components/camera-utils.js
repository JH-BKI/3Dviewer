/**
 * Camera Utilities Component
 * Provides helper functions for camera manipulation and control
 */

// Global camera configuration
window.CAMERA_CONFIG = {
    initialPosition: { x: 0, y: 0, z: 1 }, // fallback: camera 1 unit away from origin
    orbitControls: {
        target: { x: 0, y: 0, z: 0 },
        minPolarAngle: 0,
        maxPolarAngle: 180,
        minAzimuthAngle: -180,
        maxAzimuthAngle: 180,
        minDistance: 0.01,
        maxDistance: 100,
        rotateSpeed: 0.5,
        enablePan: true,
        enableDamping: true,
        dampingFactor: 0.1,
        enableRotate: true,
        enableZoom: true,
        zoomSpeed: 1
    }
};

AFRAME.registerComponent('camera-utils', {
    schema: {
        minPolarAngle: { type: 'number', default: 10 },
        maxPolarAngle: { type: 'number', default: 170 },
        minAzimuthAngle: { type: 'number', default: -180 },
        maxAzimuthAngle: { type: 'number', default: 180 },
        minDistance: { type: 'number', default: 0.1 },
        maxDistance: { type: 'number', default: 1 },
        rotateSpeed: { type: 'number', default: 0.5 },
        dampingFactor: { type: 'number', default: 0.1 },
        zoomSpeed: { type: 'number', default: 1 }
    },

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
                window.CAMERA_CONFIG.initialPosition = position;
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
        // Update orbit controls target using global config
        const orbitConfig = Object.assign({}, window.CAMERA_CONFIG.orbitControls, {
            target: new THREE.Vector3(lookAtVector.x, lookAtVector.y, lookAtVector.z)
        });
        camera.setAttribute('orbit-controls', orbitConfig);
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
        // orbitParams: {azimuth, elevation, distance, target}
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
        // Set orbit-controls target using global config
        const lookAt = lookAtVector || (orbitParams ? orbitParams.target : targetPosition);
        const orbitConfig = Object.assign({}, window.CAMERA_CONFIG.orbitControls, {
            target: new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z)
        });
        camera.setAttribute('orbit-controls', orbitConfig);
        // Force update after animation completes
        setTimeout(() => {
            const orbitControls = camera.components['orbit-controls'];
            if (orbitControls) {
                orbitControls.target.set(lookAt.x, lookAt.y, lookAt.z);
                orbitControls.update();
            }
            if (orbitControls && orbitControls.controls && window.CAMERA_CONFIG.orbitControls.zoomSpeed !== undefined) {
                orbitControls.controls.zoomSpeed = window.CAMERA_CONFIG.orbitControls.zoomSpeed;
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
            // Reset orbit controls by updating its attributes using global config
            const orbitConfig = Object.assign({}, window.CAMERA_CONFIG.orbitControls, {
                target: new THREE.Vector3(0, 0, 0),
                initialPosition: new THREE.Vector3(
                    window.CAMERA_CONFIG.initialPosition.x,
                    window.CAMERA_CONFIG.initialPosition.y,
                    window.CAMERA_CONFIG.initialPosition.z
                )
            });
            camera.setAttribute('orbit-controls', orbitConfig);
            // Force an update of the orbit controls
            if (orbitControls) {
                orbitControls.update();
            }
            if (orbitControls && orbitControls.controls && window.CAMERA_CONFIG.orbitControls.zoomSpeed !== undefined) {
                orbitControls.controls.zoomSpeed = window.CAMERA_CONFIG.orbitControls.zoomSpeed;
            }
        }
    }
}); 