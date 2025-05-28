// Debug module for handling development tools
function initDebug() {
    // Get the scene element
    const scene = document.querySelector('a-scene');
    
    // Add keyboard listener for ';' key
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === ';') {
            // Toggle stats
            const stats = scene.getAttribute('stats');
            scene.setAttribute('stats', !stats);
            console.log('Stats:', !stats ? 'enabled' : 'disabled');
        }
        
        // Add keyboard listener for 'p' key
        if (event.key.toLowerCase() === 'p') {
            const camera = document.querySelector('[camera]');
            if (camera) {
                const position = camera.getAttribute('position');
                const rotation = camera.getAttribute('rotation');
                
                // Format values to 2 decimal places
                const formattedPosition = `${position.x.toFixed(2)} ${position.y.toFixed(2)} ${position.z.toFixed(2)}`;
                const formattedRotation = `${rotation.x.toFixed(2)} ${rotation.y.toFixed(2)} ${rotation.z.toFixed(2)}`;
                console.log(`Position: "${formattedPosition}" Rotation: "${formattedRotation}"`);
                // Log orbit-controls config for copy-paste
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
                    console.log('Current orbit-controls config:', JSON.stringify(config, null, 2));
                    // Log current zoom factor (distance from camera to target)
                    if (orbit.controls) {
                        const camPos = orbit.controls.object.position;
                        const tgt = orbit.controls.target;
                        const zoomFactor = camPos.distanceTo(tgt);
                        console.log('Current zoom factor (distance to target):', zoomFactor.toFixed(3));
                        console.log('Current zoomSpeed:', orbit.controls.zoomSpeed);
                        // Log azimuthal and polar angles
                        const azimuthRad = orbit.controls.getAzimuthalAngle();
                        const polarRad = orbit.controls.getPolarAngle();
                        const azimuthDeg = THREE.MathUtils.radToDeg(azimuthRad);
                        const polarDeg = THREE.MathUtils.radToDeg(polarRad);
                        console.log('Current azimuthal angle (deg):', azimuthDeg.toFixed(2));
                        console.log('Current polar angle (deg):', polarDeg.toFixed(2));
                    }
                }
            }
        }
    });
} 