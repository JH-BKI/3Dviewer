/**
 * Onboarding Guide Component
 * Provides an interactive guide with camera movement and visual cues
 */

// Utility to strip leading/trailing single or double quotes
function stripQuotes(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/^['"]+|['"]+$/g, '');
}

AFRAME.registerComponent('onboarding-guide', {
    schema: {
        // Camera movement settings
        amplitude: { type: 'number', default: 5 },    // degrees
        speed: { type: 'number', default: 0.5 },      // cycles per second
        loops: { type: 'number', default: 1 },        // number of cycles
        
        // UI settings
        message: { type: 'string', default: '' },
        imageUrl: { type: 'string', default: '' },
        
        // Idle orbit settings
        idleOrbit: { type: 'boolean', default: false }, // Enable idle orbit
        idleOrbitSpeed: { type: 'number', default: 5 }, // deg/sec
        
        // Timing settings
        initialDelay: { type: 'number', default: 1000 },  // ms before first show
        cooldown: { type: 'number', default: 10000 }  // ms of inactivity before showing again
    },

    init: function() {
        console.log('[OnboardingGuide] Component initialized');
        
        // State management
        this.isActive = false;
        this.isAnimating = false;
        this.lastInteraction = Date.now();
        this.cooldownEnd = 0;
        this.cooldownTimer = null; // New: store cooldown timer
        this.isIdleOrbiting = false;
        this.idleOrbitTimeout = null;
        this.lastIdleOrbitTime = Date.now();
        this.idleOrbitBaseRotation = null;
        this.idleOrbitAngle = 0;
        this.swayOriginalAzimuthal = null;
        
        // Create UI elements
        this.createUI();
        
        // Bind methods
        this.startGuide = this.startGuide.bind(this);
        this.stopGuide = this.stopGuide.bind(this);
        this.handleInteraction = this.handleInteraction.bind(this);
        this.startCooldown = this.startCooldown.bind(this);
        this.clearCooldown = this.clearCooldown.bind(this);
        
        // Add event listeners
        this.el.sceneEl.addEventListener('model-loaded', () => {
            console.log('[OnboardingGuide] Model loaded event received');
            // Reset state for new model
            this.isActive = false;
            this.isAnimating = false;
            this.cooldownEnd = 0;
            this.clearCooldown();
            this.lastInteraction = Date.now();
            // Start initial guide after delay
            setTimeout(() => {
                console.log('[OnboardingGuide] Starting guide after initial delay');
                this.startGuide();
            }, this.data.initialDelay);
        });
        
        // Track user interaction - Mouse
        this.el.sceneEl.addEventListener('mousedown', (e) => {
            console.log('[OnboardingGuide] Mouse down event');
            this.handleInteraction(e);
        });
        this.el.sceneEl.addEventListener('wheel', (e) => {
            console.log('[OnboardingGuide] Wheel event');
            this.handleInteraction(e);
        });
        
        // Track user interaction - Touch
        this.el.sceneEl.addEventListener('touchstart', (e) => {
            console.log('[OnboardingGuide] Touch start event');
            this.handleInteraction(e);
        });
        this.el.sceneEl.addEventListener('gesturestart', (e) => {
            console.log('[OnboardingGuide] Gesture start event (pinch zoom)');
            this.handleInteraction(e);
        });
        
        // Track user interaction - VR Controllers
        this.el.sceneEl.addEventListener('triggerdown', (e) => {
            console.log('[OnboardingGuide] VR trigger down event');
            this.handleInteraction(e);
        });
        this.el.sceneEl.addEventListener('gripdown', (e) => {
            console.log('[OnboardingGuide] VR grip down event');
            this.handleInteraction(e);
        });
        
        // Track orbit-controls specific events
        this.el.sceneEl.addEventListener('orbit-controls-start', (e) => {
            console.log('[OnboardingGuide] Orbit controls start event');
            this.handleInteraction(e);
        });
    },

    createUI: function() {
        // Create container
        this.uiContainer = document.createElement('div');
        this.uiContainer.className = 'onboarding-guide';
        this.uiContainer.style.cssText = `
            position: fixed;
            top: 65%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
            z-index: 9999;
            display: none;
            pointer-events: none;
        `;
              
        // Create message
        this.messageEl = document.createElement('p');
        
        // Create image container
        this.imageContainer = document.createElement('div');
        
        // Add elements to container
        this.uiContainer.appendChild(this.imageContainer);
        this.uiContainer.appendChild(this.messageEl);
        
        // Add to document
        document.body.appendChild(this.uiContainer);
    },

    clearCooldown: function() {
        if (this.cooldownTimer) {
            clearTimeout(this.cooldownTimer);
            this.cooldownTimer = null;
        }
    },

    startGuide: function() {
        this.clearCooldown();
        this.stopIdleOrbit();
        this.resetIdleOrbitTimer();
        if (this.isActive) {
            console.log('[OnboardingGuide] Guide already active, skipping start');
            return;
        }
        
        console.log('[OnboardingGuide] Starting guide');
        this.isActive = true;
        this.isAnimating = true;
        
        // Update UI
        this.messageEl.textContent = stripQuotes(this.data.message);
        
        // Update image if provided
        const cleanImageUrl = stripQuotes(this.data.imageUrl);
        if (cleanImageUrl) {
            console.log('[OnboardingGuide] Loading image:', cleanImageUrl);
            this.imageContainer.innerHTML = `<img src="${cleanImageUrl}" style="max-width: 48px; height: auto;">`;
        }
        
        // Show UI with fade-in
        this.showUI();
        
        // Start camera movement
        this.startCameraMovement();
        
        // Calculate when to hide UI (after loops complete)
        const loopDuration = (this.data.loops / this.data.speed) * 1000; // Convert to milliseconds
        console.log('[OnboardingGuide] UI will hide after', loopDuration, 'ms');
        setTimeout(() => {
            console.log('[OnboardingGuide] Loops completed, hiding UI');
            this.hideUI();
            this.isAnimating = false;
            this.isActive = false;
            this.startCooldown(); // Start cooldown after animation
        }, loopDuration);
    },

    startCooldown: function() {
        this.clearCooldown();
        console.log('[OnboardingGuide] Starting cooldown for', this.data.cooldown, 'ms');
        this.cooldownTimer = setTimeout(() => {
            console.log('[OnboardingGuide] Cooldown finished, restarting onboarding');
            this.startGuide();
        }, this.data.cooldown);
    },

    showUI: function() {
        if (!this.uiContainer) return;
        this.uiContainer.classList.remove('fade-out');
        this.uiContainer.style.display = 'block';
        // Force reflow to ensure the animation triggers
        void this.uiContainer.offsetWidth;
        this.uiContainer.classList.add('fade-in');
    },

    hideUI: function() {
        if (!this.uiContainer) return;
        console.log('[OnboardingGuide] Hiding UI');
        this.uiContainer.classList.remove('fade-in');
        this.uiContainer.classList.add('fade-out');
        // Wait for fade-out animation to finish before hiding
        setTimeout(() => {
            if (this.uiContainer.classList.contains('fade-out')) {
                this.uiContainer.style.display = 'none';
                // Clean up classes
                this.uiContainer.classList.remove('fade-in');
                this.uiContainer.classList.remove('fade-out');
            }
            // SAFETY: Always re-enable orbit-controls
            const orbit = this.el.components['orbit-controls'];
            if (orbit) {
                this.el.setAttribute('orbit-controls', 'enableRotate', true);
            }
            // When onboarding UI is hidden, start idle orbit timer
            this.resetIdleOrbitTimer();
        }, 400); // Match CSS animation duration
    },

    stopGuide: function() {
        if (!this.isActive) {
            console.log('[OnboardingGuide] Guide not active, skipping stop');
            return;
        }
        
        console.log('[OnboardingGuide] Stopping guide');
        this.isActive = false;
        this.isAnimating = false;
        
        // Hide UI
        this.hideUI();
        
        // Stop camera movement
        this.stopCameraMovement();
        
        // Start cooldown
        this.startCooldown();
    },

    startCameraMovement: function() {
        console.log('[OnboardingGuide] Starting camera movement');
        // Store the current orbit-controls azimuthal angle as the base for sway
        const orbit = this.el.components['orbit-controls'];
        if (orbit && orbit.controls && orbit.controls.getAzimuthalAngle) {
            this.swayOriginalAzimuthal = orbit.controls.getAzimuthalAngle();
        } else {
            this.swayOriginalAzimuthal = null;
        }
        this.baseRotation = this.el.getAttribute('rotation'); // still used for x/z
        this.startTime = Date.now();
        
        // Lock orbit controls
        if (orbit) {
            console.log('[OnboardingGuide] Locking orbit controls');
            this.el.setAttribute('orbit-controls', 'enableRotate', false);
        }
        
        // Start animation loop
        this.animationLoop();
    },

    stopCameraMovement: function() {
        console.log('[OnboardingGuide] Stopping camera movement');
        // Restore original azimuthal angle if possible
        const orbit = this.el.components['orbit-controls'];
        if (orbit && orbit.controls && this.swayOriginalAzimuthal !== null && orbit.controls.setAzimuthalAngle) {
            orbit.controls.setAzimuthalAngle(this.swayOriginalAzimuthal);
            orbit.controls.update();
        }
        // Re-enable orbit controls
        if (orbit) {
            console.log('[OnboardingGuide] Re-enabling orbit controls');
            this.el.setAttribute('orbit-controls', 'enableRotate', true);
        }
    },

    animationLoop: function() {
        if (!this.isAnimating) return;
        
        const t = (Date.now() - this.startTime) / 1000;
        let amplitude = this.data.amplitude;
        
        // Ease out in the last loop
        if (this.data.loops !== -1) {
            const totalTime = this.data.loops / this.data.speed;
            const lastLoopStart = totalTime - (1 / this.data.speed);
            if (t >= lastLoopStart) {
                const progress = (t - lastLoopStart) * this.data.speed;
                const ease = 1 - Math.pow(progress, 2);
                amplitude *= Math.max(0, ease);
            }
        }
        
        // Calculate sway
        const sway = amplitude * Math.sin(2 * Math.PI * this.data.speed * t);
        
        // Animate orbit-controls azimuthal angle (theta)
        const orbit = this.el.components['orbit-controls'];
        if (orbit && orbit.controls && this.swayOriginalAzimuthal !== null && orbit.controls.setAzimuthalAngle) {
            orbit.controls.setAzimuthalAngle(this.swayOriginalAzimuthal + THREE.MathUtils.degToRad(sway));
            orbit.controls.update();
        } else {
            // Fallback: apply rotation for x/z only, leave y as is
            this.el.setAttribute('rotation', {
                x: this.baseRotation.x,
                y: this.baseRotation.y + sway,
                z: this.baseRotation.z
            });
        }
        
        // Move the image horizontally in sync with sway
        if (this.imageContainer) {
            const maxPx = 20; // Maximum pixel offset for the sway
            const px = amplitude !== 0 ? (sway / amplitude) * maxPx : 0;
            this.imageContainer.style.transform = `translateX(${px}px)`;
        }
        
        // Continue animation
        requestAnimationFrame(() => this.animationLoop());
    },

    handleInteraction: function(event) {
        console.log('[OnboardingGuide] User interaction detected:', event.type);
        this.lastInteraction = Date.now();
        // If guide is active or cooldown is running, stop and restart cooldown
        if (this.isActive || this.cooldownTimer) {
            this.stopGuide();
        }
        // Stop idle orbit and reset timer
        this.stopIdleOrbit();
        this.resetIdleOrbitTimer();
    },

    remove: function() {
        console.log('[OnboardingGuide] Component being removed, cleaning up');
        // Clean up
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
        }
        this.clearCooldown();
        this.stopGuide();
    },

    // Idle Orbit Methods
    startIdleOrbit: function() {
        if (!this.data.idleOrbit || this.isIdleOrbiting || this.isActive || this.isAnimating) return;
        this.isIdleOrbiting = true;
        // Store the base rotation (so we can orbit relative to it)
        this.idleOrbitBaseRotation = this.el.getAttribute('rotation');
        this.idleOrbitAngle = 0;
        //console.log('[OnboardingGuide] Idle orbit started');
    },

    stopIdleOrbit: function() {
        if (!this.isIdleOrbiting) return;
        this.isIdleOrbiting = false;
        // Reset rotation to base
        if (this.idleOrbitBaseRotation) {
            this.el.setAttribute('rotation', this.idleOrbitBaseRotation);
        }
        //console.log('[OnboardingGuide] Idle orbit stopped');
    },

    resetIdleOrbitTimer: function() {
        if (this.idleOrbitTimeout) {
            clearTimeout(this.idleOrbitTimeout);
            this.idleOrbitTimeout = null;
        }
        if (!this.data.idleOrbit) return;
        // Start idle orbit after 5s of inactivity
        this.idleOrbitTimeout = setTimeout(() => {
            this.startIdleOrbit();
        }, 5000);
    },

    // Add tick for idle orbit
    tick: function(time, timeDelta) {
        if (this.isIdleOrbiting && !this.isActive && !this.isAnimating) {
            // Orbit around Y axis
            const speed = this.data.idleOrbitSpeed; // deg/sec
            this.idleOrbitAngle += (speed * (timeDelta / 1000));
            if (this.idleOrbitBaseRotation) {
                this.el.setAttribute('rotation', {
                    x: this.idleOrbitBaseRotation.x,
                    y: this.idleOrbitBaseRotation.y + this.idleOrbitAngle,
                    z: this.idleOrbitBaseRotation.z
                });
            }
        }
    }
}); 