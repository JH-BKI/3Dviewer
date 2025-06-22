AFRAME.registerComponent('device-presentation-controller', {
  schema: {
    method: { type: 'string', default: 'html', oneOf: ['html', 'spatial'] },
    uiClass: { type: 'string', default: 'camera-controls' },
    targetEntity: { type: 'string', default: 'camera' } // Configurable entity ID
  },
  
  init: function () {
    console.log(`[XRS] <model-device-presentation-controller> init(): initialise component - attached to: ${this.el} / method: ${this.data.method} / uiClass: ${this.data.uiClass}`);
    
    // Component state
    this.targetEntityElement = null;
    
    
    this.createUI();
    this.setupEventListeners();
  },
  createUI: function() {
      if (this.data.method === 'html') {
        this.createVRButton();
        this.createARButton();
        this.createFullscreenButton();
      }
  },
  createFullscreenButton: function() {
    const config = {
      buttonClass: `${this.data.uiClass}-fullscreentoggle-selector`,
      iconOff: 'fa-solid fa-expand fa-xl',
      iconOn: 'fa-solid fa-compress fa-xl',
      valueOff: false,
      valueOn: true,
      showLabel: false,
      tooltip: 'Toggle Fullscreen',
      tooltipPosition: 'top',
      wrapperClass: `${this.data.uiClass}-fullscreentoggle-wrapper`,
      eventName: 'RequestFullscreenToggle',
      eventValue: 'toggle'
    };

    const button = document.createElement('a-entity');
    button.setAttribute('button-toggle', {
      config: JSON.stringify(config)
    });
    this.el.appendChild(button);
  },

  createVRButton: function() {
    const config = {
      buttonClass: `${this.data.uiClass}-entervr-selector`,
      icon: 'fa-solid fa-xl fa-vr-cardboard',
      label: '',
      showLabel: false,
      tooltip: 'Enter VR',
      tooltipPosition: 'right',
      eventName: 'RequestEnterVR',
      eventValue: 'enter',
      wrapperClass: `${this.data.uiClass}-entervr-wrapper`
    };
    
    console.log('[model-camera-controller] Creating reset button with config:', config);
    const button = document.createElement('a-entity');
    button.setAttribute('button-simple', config);
    this.el.appendChild(button);
    
  },
  createARButton: function() {
    const config = {
      buttonClass: `${this.data.uiClass}-enterar-selector`,
      icon: 'fa-solid fa-xl fa-tablet-screen-button',
      label: '',
      showLabel: false,
      tooltip: 'Enter AR',
      tooltipPosition: 'right',
      eventName: 'RequestEnterAR',
      eventValue: 'enter',
      wrapperClass: `${this.data.uiClass}-enterar-wrapper`
    };  

    console.log('[model-camera-controller] Creating reset button with config:', config);
    const button = document.createElement('a-entity');
    button.setAttribute('button-simple', config);
    this.el.appendChild(button);
    
  },
    
  setupEventListeners: function() {
      // Listen for COMMAND events from the UI
      window.addEventListener('RequestFullscreenToggle', (e) => this.handleFullscreenToggle(e));
      window.addEventListener('RequestEnterVR', (e) => this.handleEnterVR(e));
      window.addEventListener('RequestEnterAR', (e) => this.handleEnterAR(e));

  },
  
  getTargetEntity: function() {
  if (!this.targetEntityElement) {
      this.targetEntityElement = document.getElementById(this.data.targetEntity);
  }
  return this.targetEntityElement;
  },
  
  broadcastState: function(eventName, detail) {
      console.log(`[device-presentation-controller] Broadcasting event '${eventName}' with detail:`, detail);
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
  },

  handleFullscreenToggle: function(e) {
  const entity = this.getTargetEntity();
  //if (!entity) return;

    const requestToggle = e.detail.value;
    console.log('[device-presentation-controller] handleFullscreenToggle: toggle fullscreen', requestToggle);

    if (requestToggle) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  

  },
  handleEnterVR: function(e) {
    const entity = this.getTargetEntity();
    if (!entity) return;

    const requestEnterVR = e.detail.value;

    if (requestEnterVR === 'enter') {
        console.log('[device-presentation-controller] handleEnterVR: enter VR');
    }
  },  
  handleEnterAR: function(e) {
    const entity = this.getTargetEntity();
    if (!entity) return;

    const requestEnterAR = e.detail.value;

    if (requestEnterAR === 'enter') {
      console.log('[device-presentation-controller] handleEnterAR: enter AR');
    }
  }
});     