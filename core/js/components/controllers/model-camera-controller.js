AFRAME.registerComponent('model-camera-controller', {
    schema: {
      method: { type: 'string', default: 'html', oneOf: ['html', 'spatial'] },
      uiClass: { type: 'string', default: 'camera-controls' },
      targetEntity: { type: 'string', default: 'camera' } // Configurable entity ID
    },
    
    init: function () {
      console.log(`[XRS] <model-camera-controller> init(): initialise component - attached to: ${this.el} / method: ${this.data.method} / uiClass: ${this.data.uiClass}`);
      
      // Component state
      this.targetEntityElement = null;
      
      
      this.createUI();
      this.setupEventListeners();
    },
    createUI: function() {
        if (this.data.method === 'html') {
            this.createResetCameraButton();
        }
    },
    createResetCameraButton: function() {
        const config = {
            buttonClass: `${this.data.uiClass}-resetcamera-selector`,
            icon: 'fa-solid fa-xl fa-arrows-rotate',
            label: '',
            showLabel: false,
            tooltip: 'Reset Camera',
            tooltipPosition: 'right',
            eventName: 'RequestCameraMove',
            eventValue: 'reset',
            wrapperClass: `${this.data.uiClass}-resetcamera-wrapper`
        };
        
        console.log('[model-camera-controller] Creating reset button with config:', config);
        const button = document.createElement('a-entity');
        button.setAttribute('button-simple', config);
        this.el.appendChild(button);
    },  
     
    setupEventListeners: function() {
        // Listen for COMMAND events from the UI
        window.addEventListener('RequestCameraMove', (e) => this.handleCameraMove(e));

    },
    
    getTargetEntity: function() {
    if (!this.targetEntityElement) {
        this.targetEntityElement = document.getElementById(this.data.targetEntity);
    }
    return this.targetEntityElement;
    },
    
    broadcastState: function(eventName, detail) {
        console.log(`[model-camera-controller] Broadcasting event '${eventName}' with detail:`, detail);
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    },

    handleCameraMove: function(e) {
    const entity = this.getTargetEntity();
    if (!entity) return;

        const requestCameraMove = e.detail.value;

        if (requestCameraMove === 'reset') {
            entity.setAttribute('camera', 'position', { x: 0, y: 0, z: 0 });
        }
    }
});     