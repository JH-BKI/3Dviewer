AFRAME.registerComponent('model-animation-controller', {
  schema: {
    method: { type: 'string', default: 'html', oneOf: ['html', 'spatial'] },
    uiClass: { type: 'string', default: 'animation-controls' },
    targetEntity: { type: 'string', default: '3D-object' } // Configurable entity ID
  },
  
  init: function () {
    console.log(`[XRS] <model-animation-controller> init(): initialise component - attached to: ${this.el} / method: ${this.data.method} / uiClass: ${this.data.uiClass}`);
    console.log('[Timer] Component initialized - custom timer system starting');
    
    // Component state
    this.animationOptions = [];
    this.targetEntityElement = null;
    this.timeDisplayElement = null; // A reference to our HTML timer element
    
    this.activeTimeScale = "1.0"; // Our internal memory for the current speed
    this.activeClip = "reset-no-anim-static"; // Our internal memory for the current clip
    this.activeLoop = "repeat"; // Our internal memory for the current loop
    
    // Custom timer system
    this.timerInterval = null;
    this.lastUpdateTime = 0;
    
    this.createUI();
    this.setupEventListeners();
    this.startCustomTimer();
  },

  createUI: function() {
    if (this.data.method === 'html') {
      this.createPlayPauseButton();
      this.createPlayTimeDuration();
      this.createLoopDropdown();
      this.createSpeedDropdown();
      this.createAnimationDropdown();
    }
  },

  createPlayPauseButton: function() {
    const config = {
      buttonClass: `${this.data.uiClass}-playpause-selector`,
      iconOff: 'fa-solid fa-play fa-xl',
      iconOn: 'fa-solid fa-pause fa-xl',
      valueOff: false,
      valueOn: true,
      showLabel: false,
      tooltip: 'Play/Pause Animation',
      tooltipPosition: 'right',
      wrapperClass: `${this.data.uiClass}-playpause-wrapper`,
      eventName: 'RequestPlayPauseToggle'
    };

    const button = document.createElement('a-entity');
    button.setAttribute('button-toggle', {
      config: JSON.stringify(config),
      dynamicEvent: 'UpdateAnimationPlayStatus'
    });
    this.el.appendChild(button);
  },

  createPlayTimeDuration: function() {
    // Create a standard HTML div for our 2D UI, not an A-Frame entity.
    const timerWrapper = document.createElement('a-entity');
    timerWrapper.className = 'animation-timer-display text'; // For styling
    timerWrapper.textContent = '--:-- / --:--';

    // Store a reference to this element so we can update it directly.
    this.timeDisplayElement = timerWrapper;

    // The `el` of this component is an a-entity that lives inside a div.
    // We want to append our timer to that same parent div.
    this.el.appendChild(timerWrapper);
  },

  createLoopDropdown: function() {
    const config = {
      buttonClass: `${this.data.uiClass}-loop-selector`,
      buttonIcon: 'fa-solid fa-repeat fa-xl',
      defaultLabel: 'OFF',
      title: 'Loop Playback?',
      titleIcon: 'fa-solid fa-repeat fa-xl',
      wrapperClass: `${this.data.uiClass}-loop-wrapper`,
      eventName: 'RequestLoopToggle',
      startingOption: 0,
      options: [
        { value: 'repeat', text: 'ON', icon: 'fa-solid fa-repeat fa-xl' },
        { value: 'once', text: 'OFF', icon: 'fa-solid fa-right-from-bracket fa-xl' }
      ]
    };

    const dropdown = document.createElement('a-entity');
    dropdown.setAttribute('button-dropmenu', {
      config: JSON.stringify(config),
      dynamicEvent: 'UpdateAnimationLoopStatus'
    });
    this.el.appendChild(dropdown);
  },

  createSpeedDropdown: function() {
    const config = {
      buttonClass: `${this.data.uiClass}-speed-selector`,
      buttonIcon: 'fa-solid fa-gauge-high fa-xl',
      defaultLabel: 'x1.0',
      title: 'Playback Speed:',
      titleIcon: 'fa-solid fa-gauge-high fa-xl',
      wrapperClass: `${this.data.uiClass}-speed-wrapper`,
      eventName: 'RequestSpeedChange',
      startingOption: 2,
      options: [
        { value: '0.1', text: 'x0.1', icon: 'fa-solid fa-gauge-simple-high fa-flip-horizontal fa-xl', style: 'color: #ec5f5f;' },
        { value: '0.5', text: 'x0.5', icon: 'fa-solid fa-gauge-simple-high fa-flip-horizontal fa-xl', style: 'color: #ec5f5f;' },
        { value: '1.0', text: 'x1.0', icon: 'fa-solid fa-gauge-simple fa-xl', style: 'color: #5fec95;' },
        { value: '2.0', text: 'x2.0', icon: 'fa-solid fa-gauge-simple-high fa-xl', style: 'color: #5fb6ec;' },
        { value: '3.0', text: 'x3.0', icon: 'fa-solid fa-gauge-simple-high fa-xl', style: 'color: #5fb6ec;' }
      ]
    };

    const dropdown = document.createElement('a-entity');
    dropdown.setAttribute('button-dropmenu', {
      config: JSON.stringify(config),
      dynamicEvent: 'UpdateAnimationSpeedStatus'
    });
    this.el.appendChild(dropdown);
  },

  createAnimationDropdown: function() {
    const config = {
      buttonClass: `${this.data.uiClass}-name-selector`,
      buttonIcon: 'fa-solid fa-film fa-xl',
      defaultLabel: 'Select ...',
      title: 'Select Animation:',
      titleIcon: 'fa-solid fa-film fa-xl',
      wrapperClass: `${this.data.uiClass}-name-wrapper`,
      eventName: 'RequestAnimationChange',
      options: [
        { value: 'reset-no-anim-static', text: 'None', icon: 'fa-solid fa-ban fa-xl', style: 'color: #ec5f5f;' }
      ],
      maxScrollable: 3
    };

    const dropdown = document.createElement('a-entity');
    dropdown.setAttribute('button-dropmenu', {
      config: JSON.stringify(config),
      dynamicEvent: 'UpdateAnimationNameList',
      dynamicKey: 'value,text,icon'
    });
    this.el.appendChild(dropdown);
  },

  startCustomTimer: function() {
    // Clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Start our custom timer that runs every 250ms (4 times per second)
    this.timerInterval = setInterval(() => {
      this.updateTimerDisplay();
    }, 100);
    
    console.log('[Timer] Custom timer started - updating every 100ms');
  },

  updateTimerDisplay: function() {
    if (!this.timeDisplayElement) { 
      console.log('[Timer] No time display element found');
      return; 
    }

    const entity = this.getTargetEntity();
    const mixerComponent = entity ? entity.components['animation-mixer'] : null;
    const model = entity ? entity.getObject3D('mesh') : null;

    // If we don't have what we need, display default text.
    if (!mixerComponent || !mixerComponent.mixer || !model || !model.animations) {
      this.timeDisplayElement.textContent = '00:00 / 00:00';
      return;
    }

    const clipName = mixerComponent.data.clip;
    const clip = THREE.AnimationClip.findByName(model.animations, clipName);
    
    if (!clip) {
      this.timeDisplayElement.textContent = '00:00 / 00:00';
      return;
    }

    const totalDuration = clip.duration;
    const action = mixerComponent.mixer.clipAction(clip);
    
    if (action) {
      const currentTime = action.time;
      const timeDisplay = `${this.formatTime(currentTime)} / ${this.formatTime(totalDuration)}`;
      this.timeDisplayElement.textContent = timeDisplay;
      //console.log('[Timer] Updated:', timeDisplay, '| Clip:', clipName, '| Current:', currentTime.toFixed(2), 's / Total:', totalDuration.toFixed(2), 's');
    } else {
      this.timeDisplayElement.textContent = '00:00 / 00:00';
    }
  },

  remove: function() {
    // Clean up our custom timer when component is removed
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      console.log('[Timer] Custom timer stopped');
    }
  },

  formatTime: function(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return '00:00';
    }
    const secs = Math.floor(seconds);
    const ms = Math.floor((seconds - secs) * 100); // Calculate centiseconds (2 digits)
    return `${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  },

  setupEventListeners: function() {
    // Listen for COMMAND events from the UI
    window.addEventListener('RequestPlayPauseToggle', (e) => this.handlePlayPause(e));
    window.addEventListener('RequestLoopToggle', (e) => this.handleLoop(e));
    window.addEventListener('RequestSpeedChange', (e) => this.handleSpeed(e));
    window.addEventListener('RequestAnimationChange', (e) => this.handleAnimationName(e));

    // Listen for STATE events from the model itself
    const entity = this.getTargetEntity();
    if (entity) {
      entity.addEventListener('animation-finished', async () => {
        // When a non-looping animation finishes, the model is effectively paused at the end.
        // To allow it to be replayed, we do a "hard reset":
        // 1. Set the clip to empty.
        // 2. Wait for the next browser tick.
        // 3. Set the clip back to the active one, but with timeScale 0, which pauses it at the start.
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        
        entity.setAttribute("animation-mixer", 'clip', '');
        await sleep(0); // Wait for the next tick to ensure the change is processed.
        
        entity.setAttribute("animation-mixer", { clip: this.activeClip, timeScale: 0.0 });
        
        // Broadcast that the animation is now paused (at the beginning).
        this.broadcastState('UpdateAnimationPlayStatus', { value: false });
      });
    }
  },
  
  getTargetEntity: function() {
    if (!this.targetEntityElement) {
      this.targetEntityElement = document.getElementById(this.data.targetEntity);
    }
    return this.targetEntityElement;
  },
  
  broadcastState: function(eventName, detail) {
    console.log(`[model-animation-controller] Broadcasting event '${eventName}' with detail:`, detail);
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  },

  checkForValidAnimation: function() {
    let validAnimation = true;

    if (this.activeClip === "reset-no-anim-static"){
      validAnimation = false;
    }
    
    return validAnimation;
  },

  handlePlayPause: function(e) {
    const entity = this.getTargetEntity();
    if (!entity) return;

    const isPlaying = e.detail.value;

    if (this.activeClip === "reset-no-anim-static") {
      this.broadcastState('UpdateAnimationPlayStatus', { value: this.checkForValidAnimation() });
      return;
    }

    if (isPlaying) {
      // When playing, resume at the speed we remembered.
      entity.setAttribute('animation-mixer', 'timeScale', this.activeTimeScale);
    } else {
      // When pausing, just set the speed to 0. Our memory remains unchanged.
      entity.setAttribute('animation-mixer', 'timeScale', 0);
    }

    this.broadcastState('UpdateAnimationSpeedStatus', { value: this.activeTimeScale });
    this.broadcastState('UpdateAnimationPlayStatus', { value: isPlaying });
  },

  handleLoop: function(e) {
    const entity = this.getTargetEntity();
    if (!entity) return;
    
    this.activeLoop = e.detail.value;
    entity.setAttribute("animation-mixer", 'loop', this.activeLoop);
    this.broadcastState('UpdateAnimationLoopStatus', { value: this.activeLoop });
  },

  handleSpeed: function(e) {
    const entity = this.getTargetEntity();
    if (!entity) return;
    
    // When the user changes the speed, update both our memory and the model.
    this.activeTimeScale = e.detail.value;
    entity.setAttribute("animation-mixer", 'timeScale', this.activeTimeScale);
    this.broadcastState('UpdateAnimationSpeedStatus', { value: this.activeTimeScale });
    
    // If they change speed, assume they want it to play but only if its a valid anim, ie. not 'none'.   
    this.broadcastState('UpdateAnimationPlayStatus', { value: this.checkForValidAnimation() });
  },

  handleAnimationName: async function(e) {
    const entity = this.getTargetEntity();
    if (!entity) return;

    // A helper function to create a Promise-based delay.
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    // If user selects "None", just stop everything.
    if (e.detail.value === "reset-no-anim-static") {
      this.activeClip = "reset-no-anim-static";
      this.activeTimeScale = "1.0";
      entity.setAttribute('animation-mixer', { timeScale: 0, clip: this.activeClip });
      this.broadcastState('UpdateAnimationSpeedStatus', { value: this.activeTimeScale });
      this.broadcastState('UpdateAnimationPlayStatus', { value: this.checkForValidAnimation() });
      return;
    }
    
    // To ensure a clean restart, we perform the animation change in steps:
    // 1. Reset the clip to stop the current animation.
    entity.setAttribute('animation-mixer', 'clip', '');
    await sleep(0); // Wait for the next tick to ensure the change is processed.
        
    // 2. Set the new clip and reset the speed to normal.
    this.activeClip = e.detail.value;
    entity.setAttribute('animation-mixer', 'clip', this.activeClip  );
    await sleep(0); // Wait for the next tick.
    
    this.activeTimeScale = "1.0";
    entity.setAttribute('animation-mixer', 'timeScale', this.activeTimeScale);
    await sleep(0); // Wait for the next tick.
    
    // 3. Broadcast the new state to the UI.
    this.broadcastState('UpdateAnimationSpeedStatus', { value: this.activeTimeScale });
    this.broadcastState('UpdateAnimationPlayStatus', { value: this.checkForValidAnimation() });
  }
}); 

