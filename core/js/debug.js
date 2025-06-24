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
            // console.log('Stats:', !stats ? 'enabled' : 'disabled');
        }
        
        // Add keyboard listener for 'p' key
        if (event.key.toLowerCase() === 'p') {
            if (window.cameraUtils) {
                const position = window.cameraUtils.getCameraPosition();
                const rotation = window.cameraUtils.getCameraRotation();
                const orbitConfig = window.cameraUtils.getOrbitControlsConfig();
                
                if (position && rotation) {
                    // Format values to 2 decimal places
                    const formattedPosition = `${position.x} ${position.y} ${position.z}`;
                    const formattedRotation = `${rotation.x} ${rotation.y} ${rotation.z}`;
                    // console.log(`Position: "${formattedPosition}" Rotation: "${formattedRotation}"`);
                    
                    if (orbitConfig) {
                        // console.log('Current orbit-controls config:', JSON.stringify(orbitConfig, null, 2));
                        // console.log('Current zoom factor (distance to target):', orbitConfig.currentZoomFactor);
                        // console.log('Current azimuthal angle (deg):', orbitConfig.currentAzimuthalAngle);
                        // console.log('Current polar angle (deg):', orbitConfig.currentPolarAngle);
                    }
                }
            }
        }
    });
}

window.addEventListener('modal-closed', function(e) {
    console.log('[HOTSPOT_DEBUG] [GLOBAL] modal-closed event received:', e);
}); 