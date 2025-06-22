AFRAME.registerComponent('button-simple', {
  schema: {
    buttonClass: { type: 'string', default: 'simple-button' },
    icon: { type: 'string', default: 'fa-solid fa-star fa-xl' },
    label: { type: 'string', default: 'Click Me' },
    showLabel: { type: 'boolean', default: true },
    tooltip: { type: 'string', default: '' },
    tooltipPosition: { type: 'string', default: 'right' },
    wrapperClass: { type: 'string', default: 'simple-button-wrapper' },
    eventName: { type: 'string', default: 'SimpleButtonClick' },
    eventValue: { type: 'string', default: 'default-value' }
  },

  init: function () {
    console.log('[button-simple] init. Data:', this.data);
    // createButton is now called by update, which is called after init.
  },

  update: function (oldData) {
    //console.log('[button-simple] update. New data:', this.data);
    // Data changed. Recreate button.
    this.createButton();
  },

  createButton: function () {
    try {
      const config = this.data;
      
      // Clear existing content
      this.el.innerHTML = '';
      
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = config.wrapperClass || 'simple-button-wrapper';
      
      // Build button HTML
      const buttonHTML = this.buildButtonHTML(config);
      wrapper.innerHTML = buttonHTML;
      
      // Add classes
      const button = wrapper.querySelector('button');
      if (button && config.buttonClass) {
        config.buttonClass.split(' ').forEach(className => {
          if (className) button.classList.add(className.trim());
        });
      }
      
      // Append to entity
      this.el.appendChild(wrapper);
      
      // Add event listeners
      this.addEventListeners(wrapper, config);
      
    } catch (error) {
      console.error('Error creating simple button:', error);
    }
  },

  buildButtonHTML: function (config) {
    const {
      icon = '',
      label = '',
      showLabel = true,
      tooltip = '',
      tooltipPosition = 'right'
    } = config;

    const tooltipAttr = tooltip ? `data-balloon="${tooltip}" data-balloon-pos="${tooltipPosition}"` : '';
    const labelHTML = showLabel && label ? `<span class="content-label">${label}</span>` : '';
    const iconHTML = icon ? `<span class="icon"><i class="${icon}"></i>${labelHTML}</span>` : '';
    
    // Only show the label's span if there's text, otherwise the icon might not center correctly.
    const contentHTML = `${iconHTML}`;

    const iconOnlyClass = !showLabel ? 'icon-only' : '';

    return `
      <button class="button simple ${iconOnlyClass}" ${tooltipAttr}>
        <span class="label">${contentHTML}</span>
      </button>
    `;
  },

  addEventListeners: function (wrapper, config) {
    const button = wrapper.querySelector('button');

    // Simple button click handler
    ['click', 'touchstart'].forEach(evtName => {
      button.addEventListener(evtName, (e) => {
        e.stopPropagation();
        
        // Emit custom event using the eventName from config
        const eventName = config.eventName || 'SimpleButtonClick';
        const event = new CustomEvent(eventName, {
          detail: { 
            value: config.eventValue || 'clicked',
            config: config
          }
        });
        console.log(`[button-simple] Emitting event: '${eventName}' on window with detail:`, event.detail);
        window.dispatchEvent(event);
      });
    });
  }
}); 