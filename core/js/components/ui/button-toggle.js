AFRAME.registerComponent('button-toggle', {
  schema: {
    config: { type: 'string', default: `{
        "buttonClass": "toggle-button",
        "iconOff": "fa-solid fa-play fa-xl",
        "iconOn": "fa-solid fa-pause fa-xl",
        "labelOff": "Play",
        "labelOn": "Pause",
        "valueOff": "play",
        "valueOn": "pause",
        "showLabel": true,
        "tooltip": "",
        "tooltipPosition": "right",
        "wrapperClass": "toggle-wrapper",
        "eventName": "UpdateToggleStatus"
      }` }, // JSON string configuration
    dynamicEvent: { type: 'string', default: '' }, // Event name to listen for dynamic updates
    dynamicKey: { type: 'string', default: 'value' }, // Key in event detail to use for updates
    isToggled: { type: 'boolean', default: false } // Initial toggle state
  },

  init: function () {
    console.log('[button-toggle] init');
    this.createButton();
    this.setupDynamicUpdates();
  },

  update: function (oldData) {
    // If config changed, recreate the button
    if (oldData.config !== this.data.config) {
      this.createButton();
    }
  },

  setupDynamicUpdates: function () {
    if (this.data.dynamicEvent) {
      window.addEventListener(this.data.dynamicEvent, (e) => {
        let keys = this.data.dynamicKey;
        if (!Array.isArray(keys)) keys = [keys];
        let newState = e.detail;
        // If the event detail is an object with keys, extract the relevant data
        if (typeof newState === 'object' && !Array.isArray(newState)) {
          newState = [newState];
        }
        this.updateToggleState(newState, keys);
      });
    }
  },

  updateToggleState: function (newState, keys = ['value']) {
    try {
      const button = this.el.querySelector('button');
      if (button) {
        // If newState is an array, update all keys
        if (Array.isArray(keys) && Array.isArray(newState)) {
          keys.forEach((key, i) => {
            if (newState[0] && newState[0][key] !== undefined) {
              this.setToggleState(button, newState[0][key]);
            }
          });
        } else {
          this.setToggleState(button, newState);
        }
      }
    } catch (error) {
      console.error('Error updating toggle state:', error);
    }
  },

  createButton: function () {
    try {
      const config = JSON.parse(this.data.config);
      
      // Clear existing content
      this.el.innerHTML = '';
      
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = config.wrapperClass || 'toggle-wrapper';
      
      // Build button HTML
      const buttonHTML = this.buildButtonHTML(config);
      wrapper.innerHTML = buttonHTML;
      
      // Add classes
      const button = wrapper.querySelector('button');
      if (button) {
        // Add classes individually
        button.classList.add('toggle');
        if (config.buttonClass) {
          // Split the buttonClass string and add each class separately
          config.buttonClass.split(' ').forEach(className => {
            if (className) button.classList.add(className.trim());
          });
        }
        if (this.data.isToggled) {
          button.classList.add('toggled');
        }
      }
      
      // Append to entity
      this.el.appendChild(wrapper);
      
      // Add event listeners
      this.addEventListeners(wrapper, config);
      
    } catch (error) {
      console.error('Error parsing toggle button config:', error);
    }
  },

  buildButtonHTML: function (config) {
    const {
      iconOff = 'fa-solid fa-play fa-xl',
      iconOn = 'fa-solid fa-pause fa-xl',
      labelOff = 'Start',
      labelOn = 'Stop',
      valueOff = 'off',
      valueOn = 'on',
      showLabel = true,
      tooltip = '',
      tooltipPosition = 'right'
    } = config;

    const tooltipAttr = tooltip ? `data-balloon="${tooltip}" data-balloon-pos="${tooltipPosition}"` : '';
    const labelHTML = showLabel ? `<span class="content-label">${this.data.isToggled ? labelOn : labelOff}</span>` : '';
    
    const iconOnlyClass = !showLabel ? 'icon-only' : '';

    return `
      <button class="button ${iconOnlyClass}" ${tooltipAttr} data-selection="${this.data.isToggled ? valueOn : valueOff}">
        <span class="label">
          <span class="icon">
            <i class="${this.data.isToggled ? iconOn : iconOff}"></i>
            ${labelHTML}
          </span>
        </span>
      </button>
    `;
  },

  setToggleState: function (button, isToggled) {
    const config = JSON.parse(this.data.config);
    const icon = button.querySelector('i');
    const label = button.querySelector('.content-label');
    
    // Update the persistent state
    this.data.isToggled = isToggled;
    
    if (isToggled) {
      button.classList.add('toggled');
      icon.className = config.iconOn;
      if (label) label.textContent = config.labelOn;
    } else {
      button.classList.remove('toggled');
      icon.className = config.iconOff;
      if (label) label.textContent = config.labelOff;
    }
  },

  addEventListeners: function (wrapper, config) {
    const button = wrapper.querySelector('button');

    // Toggle button click handler
    ['click', 'touchstart'].forEach(evtName => {
      button.addEventListener(evtName, (e) => {
        e.stopPropagation();
        
        // Toggle the current state
        this.data.isToggled = !this.data.isToggled;
        this.setToggleState(button, this.data.isToggled);
        
        // Emit custom event using the eventName from config
        const eventName = config.eventName || 'UpdateToggleStatus';
        const event = new CustomEvent(eventName, {
          detail: { 
            value: this.data.isToggled,
            config: config
          }
        });
        console.log('[button-toggle] clicked, emitting event:', eventName, 'value:', this.data.isToggled);
        window.dispatchEvent(event);
      });
    });
  }
}); 