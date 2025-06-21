AFRAME.registerComponent('button-dropmenu', {
  schema: {
    config: { type: 'string', 
      default: `{
      "buttonClass": "dropmenu-selector",
      "buttonIcon": "fa-solid fa-cog fa-xl",
      "defaultLabel": "Select...",
      "title": "Select Option:",
      "titleIcon": "fa-solid fa-cog fa-xl",
      "wrapperClass": "DROPMENU_class-thing-wrapper",
      "eventName": "DROPMENU_UpdateThingStatus",
      "options": [
        {
          "value": "DROPMENU-ITEM_value",
          "text": "DROPMENU-ITEM_text",
          "icon": "DROPMENU-ITEM_icon",
          "style": "DROPMENU-ITEM_style"
        }
      ],
      "maxScrollable": 4,
      "startingOption": 0
    }`
    }, 
    dynamicEvent: { type: 'string', default: '' }, // Event name to listen for dynamic updates
    dynamicKey: { type: 'string', default: 'value' }, // Key in event detail to use for updates
    direction: { type: 'string', default: 'up', oneOf: ['up', 'down'] }, // Dropmenu direction
    maxScrollable: { type: 'number', default: 0 }, // If > 0 and options.length > maxScrollable, wrap in scrollable
    startingOption: { type: 'number', default: 0 } // Index of the option to use as the initial label
  },

  init: function () {
    console.log('[button-dropmenu] init');
    this.createDropmenu();
    this.setupDynamicUpdates();
  },

  update: function (oldData) {
    // If config or direction changed, recreate the dropmenu
    if (oldData.config !== this.data.config || oldData.direction !== this.data.direction) {
      this.createDropmenu();
    }
  },

  setupDynamicUpdates: function () {
    if (this.data.dynamicEvent) {
      window.addEventListener(this.data.dynamicEvent, (e) => {
        const detail = e.detail;

        // If the incoming detail is a list (array), it's a request to repopulate the options.
        if (Array.isArray(detail)) {
          let keys = this.data.dynamicKey.split(',').map(k => k.trim());
          this.updateDropmenuOptions(detail, keys);
        } 
        // If the incoming detail is an object with a 'value' property, it's a request to update the selection.
        else if (typeof detail === 'object' && detail.value !== undefined) {
          this.updateSelectedOption(detail.value);
        }
      });
    }
  },

  updateSelectedOption: function(value) {
    console.log('[button-dropmenu] updateSelectedOption called with value:', value);
    
    try {
      const config = JSON.parse(this.data.config);
      const button = this.el.querySelector('button');
      const label = button?.querySelector('.selection-label');
      const items = button?.querySelectorAll('.dropmenu-item');
      
      if (!button || !label || !items) {
        console.log('[button-dropmenu] updateSelectedOption: Missing elements, returning');
        return;
      }
      
      // Find the option that matches the value
      let targetOption = null;
      let targetIndex = -1;
      
      config.options.forEach((option, index) => {
        if (option.value === value || option.value === value.toString()) {
          targetOption = option;
          targetIndex = index;
        }
      });
      
      console.log('[button-dropmenu] updateSelectedOption: Found targetOption:', targetOption, 'targetIndex:', targetIndex);
      
      if (targetOption && targetIndex >= 0) {
        // Update active state
        items.forEach(item => item.classList.remove('selected'));
        if (items[targetIndex]) {
          items[targetIndex].classList.add('selected');
          console.log('[button-dropmenu] updateSelectedOption: Updated visual selection for item', targetIndex);
        }
        
        // Update label
        const optionHTML = `
          <span class="icon">
            <i class="${targetOption.icon}"${targetOption.style ? ` style="${targetOption.style}"` : ''}></i>
            <span>${targetOption.text}</span>
          </span>
        `;
        label.innerHTML = optionHTML;
        console.log('[button-dropmenu] updateSelectedOption: Updated button label to:', targetOption.text);
      } else {
        console.log('[button-dropmenu] updateSelectedOption: No matching option found for value:', value);
      }
    } catch (error) {
      console.error('Error updating selected option:', error);
    }
  },

  updateDropmenuOptions: function (newOptions, keys = ['value']) {
    try {
      const config = JSON.parse(this.data.config);
      // If newOptions is an array of strings (like animation names), convert to option format
      if (Array.isArray(newOptions) && typeof newOptions[0] === 'string') {
        // Keep the base options (like "None") and add the new options
        const baseOptions = config.options.filter(option => 
          option.value === 'reset-no-anim-static' || option.value === 'none'
        );
        const convertedOptions = newOptions.map(optionName => ({
          value: optionName,
          text: optionName,
          icon: 'fa-solid fa-film fa-xl'
        }));
        config.options = [...baseOptions, ...convertedOptions];
      } else if (Array.isArray(newOptions)) {
        // If newOptions is already in the correct format, update keys as needed
        config.options = newOptions.map((opt, i) => {
          let option = { ...opt };
          if (keys && Array.isArray(keys)) {
            keys.forEach(key => {
              if (opt[key] !== undefined) option[key] = opt[key];
            });
          }
          return option;
        });
      } else {
        // Fallback: use as-is
        config.options = newOptions;
      }
      // Update the component's config
      this.el.setAttribute('button-dropmenu', 'config', JSON.stringify(config));
    } catch (error) {
      console.error('Error updating dropmenu options:', error);
    }
  },

  createDropmenu: function () {
    try {
      const config = JSON.parse(this.data.config);
      
      // Clear existing content
      this.el.innerHTML = '';
      
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = config.wrapperClass || 'dropmenu-wrapper';
      
      // Build dropmenu HTML
      const dropmenuHTML = this.buildDropmenuHTML(config);
      wrapper.innerHTML = dropmenuHTML;
      
      // Add direction class
      const button = wrapper.querySelector('button');
      if (button) {
        button.classList.add('dropmenu');
        if (config.buttonClass) {
          button.classList.add(config.buttonClass);
        }
      }
      
      // Append to entity
      this.el.appendChild(wrapper);
      
      // Add event listeners
      this.addEventListeners(wrapper, config);
      
    } catch (error) {
      console.error('Error parsing dropmenu config:', error);
    }
  },

  buildDropmenuHTML: function (config) {
    const {
      buttonClass = 'dropmenu-selector',
      buttonIcon = 'fa-solid fa-cog fa-xl',
      defaultLabel = 'Select...',
      title = 'Select Option:',
      titleIcon = 'fa-solid fa-cog fa-xl',
      options = [],
      maxScrollable = 0,
      startingOption = 0
    } = config;

    let optionsHTML = '';
    options.forEach((option, index) => {
      const style = option.style ? ` style="${option.style}"` : '';
      const isSelected = index === startingOption;
      const activeClass = isSelected ? ' selected' : '';
      optionsHTML += `
        <a class="button dropmenu-item${activeClass}" data-selection="${option.value}">
          <span class="icon">
            <i class="${option.icon}"${style}></i>
            <span>${option.text}</span>
          </span>
        </a>
      `;
    });

    // Wrap in scrollable if needed
    if (maxScrollable > 0 && options.length > maxScrollable) {
      optionsHTML = `<div class="scrollable">${optionsHTML}</div>`;
    }

    // Determine initial label HTML
    let initialLabelHTML = '';
    if (
      typeof startingOption === 'number' &&
      !isNaN(startingOption) &&
      startingOption >= 0 &&
      startingOption < options.length &&
      config.hasOwnProperty('startingOption')
    ) {
      // Use the specified starting option as label
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = optionsHTML;
      const items = tempDiv.querySelectorAll('.dropmenu-item');
      if (items[startingOption]) {
        initialLabelHTML = items[startingOption].innerHTML;
      }
    } else {
      // Fallback to defaultLabel with icon
      initialLabelHTML = `<span class="icon"><i class="${buttonIcon}"></i><span>${defaultLabel}</span></span>`;
    }

    return `
      <button class="button dropmenu" data-dropmenu="${buttonClass}">
        <span class="label"><span class="selection-label">${initialLabelHTML}</span></span>
        <div class="dropmenu-menu ui-panel">
          <span class="dropmenu-title">
            <i class="${titleIcon}"></i><br><span>${title}</span>
          </span>
          ${optionsHTML}
        </div>
      </button>
    `;
  },

  addEventListeners: function (wrapper, config) {
    const button = wrapper.querySelector('button');
    const label = button.querySelector('.selection-label');
    const items = button.querySelectorAll('.dropmenu-item');

    // Open/close dropmenu
    ['click', 'touchstart'].forEach(evtName => {
      button.addEventListener(evtName, (e) => {
        e.stopPropagation();

        // Close all other open dropmenus first
        document.querySelectorAll('.dropmenu.active').forEach(otherBtn => {
          if (otherBtn !== button) {
            otherBtn.classList.remove('open-up', 'open-down', 'active');
          }
        });
        // Toggle this one
        if (this.data.direction === 'up') {
          button.classList.toggle('open-up');
        } else {
          button.classList.toggle('open-down');
        }
        button.classList.toggle('active');
      });
    });
    
    // Handle item selection
    items.forEach(item => {
      ['click', 'touchstart'].forEach(evtName => {
        item.addEventListener(evtName, (e) => {
          e.stopPropagation();
          const selection = item.getAttribute('data-selection');
          const text = item.querySelector('span').textContent;
          
          // Update active state
          items.forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          
          // Update label
          label.innerHTML = item.innerHTML;
          button.classList.remove('open-up', 'open-down');
          
          // Emit custom event
          const event = new CustomEvent(config.eventName || 'UpdateDropmenuStatus', {
            detail: { 
              value: selection,
              text: text,
              config: config
            }
          });
          console.log('dropmenu clicked', config.eventName, event.detail);
          window.dispatchEvent(event);
        });
      });
    });
  }
});

// Add a single global event listener to close all open dropmenus when clicking outside
if (!window._dropmenuGlobalClickListenerAdded) {
  document.addEventListener('click', (e) => {
    //console.log('click', e.target);
    
    // Find all active dropmenus (the button with .dropmenu.active)
    document.querySelectorAll('.dropmenu.active').forEach(button => {
      if (!button.contains(e.target)) {
        button.classList.remove('open-up', 'open-down', 'active');
      }
    });
  });
  window._dropmenuGlobalClickListenerAdded = true;
}