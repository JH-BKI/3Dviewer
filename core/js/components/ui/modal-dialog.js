AFRAME.registerComponent('modal-dialog', {
  schema: {
    isOpen: {type: 'boolean', default: false},
    title: {type: 'string', default: 'Dialog'},
    titleIcon: {type: 'string', default: ''},
    bodyText: {type: 'string', default: ''},
    showOverlay: {type: 'boolean', default: false},
    closeOnEsc: {type: 'boolean', default: true},
    showCloseX: {type: 'boolean', default: true},
    footerButtons: {type: 'array', default: []},
    openEvent: {type: 'string', default: ''},
    closeEvent: {type: 'string', default: ''}
  },

  init: function () {
    this.render();
    this.setupEventListeners();
  },

  update: function (oldData) {
    if (this.data.isOpen !== oldData.isOpen) {
      this.data.isOpen ? this.open() : this.close();
    }
  },

  remove: function () {
    this.removeEventListeners();
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  },

  render: function() {
    // Store declarative content before clearing
    const declarativeContent = Array.from(this.el.childNodes);
    this.el.innerHTML = ''; // Clear the entity

    // Create main elements programmatically
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.container = document.createElement('div');
    this.container.className = 'modal-dialog-container';
    this.container.style.display = 'none';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleContainer = document.createElement('h3');
    titleContainer.className = 'modal-title';
    if(this.data.titleIcon) {
        const icon = document.createElement('i');
        icon.className = this.data.titleIcon;
        titleContainer.appendChild(icon);
    }
    const titleSpan = document.createElement('span');
    titleSpan.textContent = this.data.title;
    titleContainer.appendChild(titleSpan);

    this.closeXButton = document.createElement('button');
    this.closeXButton.className = 'modal-close-x';
    this.closeXButton.innerHTML = '<i class="fa-solid fa-xl fa-square-xmark"></i>';

    const content = document.createElement('div');
    content.className = 'modal-content';
    if (this.data.bodyText) {
      content.textContent = this.data.bodyText;
    }
    declarativeContent.forEach(child => {
      content.appendChild(child);
    });

    this.footer = document.createElement('div');
    this.footer.className = 'modal-footer';

    // Assemble the modal
    header.appendChild(titleContainer);
    header.appendChild(this.closeXButton);
    this.container.appendChild(header);
    this.container.appendChild(content);
    this.container.appendChild(this.footer);

    // Append to the entity
    this.el.appendChild(this.overlay);
    this.el.appendChild(this.container);

    // Set initial state
    this.data.isOpen ? this.open() : this.close();

    this.updateFooter();
  },

  updateFooter: function() {
    if (!this.footer) return; // Guard against calls before render
    this.footer.innerHTML = '';
    this.data.footerButtons.forEach(buttonInfo => {
      const button = document.createElement('button');
      button.textContent = buttonInfo.label;
      button.onclick = () => {
        if (buttonInfo.event) {
          this.el.sceneEl.emit(buttonInfo.event, null, false);
        }
        if (buttonInfo.isClose) {
          this.close();
        }
      };
      this.footer.appendChild(button);
    });
  },

  open: function() {
    this.el.setAttribute('visible', true);
    if (this.overlay) this.overlay.style.display = this.data.showOverlay ? 'block' : 'none';
    if (this.container) this.container.style.display = 'flex';
    if (this.data.isOpen !== true) {
      this.el.setAttribute('modal-dialog', 'isOpen', true);
    }
  },

  close: function() {
    this.el.setAttribute('visible', false);
    if (this.overlay) this.overlay.style.display = 'none';
    if (this.container) this.container.style.display = 'none';
    if (this.data.isOpen !== false) {
      this.el.setAttribute('modal-dialog', 'isOpen', false);
    }
    window.dispatchEvent(new CustomEvent('modal-closed'));
  },

  setupEventListeners: function() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.handleOpenEvent = () => this.open();
    this.handleCloseEvent = () => this.close();

    window.addEventListener('keydown', this.onKeyDown);

    if (this.data.openEvent) {
      console.log(`[modal-dialog] Setting up listener for '${this.data.openEvent}' on window.`);
      window.addEventListener(this.data.openEvent, this.handleOpenEvent);
    }
    if (this.data.closeEvent) {
      console.log(`[modal-dialog] Setting up listener for '${this.data.closeEvent}' on window.`);
      window.addEventListener(this.data.closeEvent, this.handleCloseEvent);
    }

    if (this.closeXButton && this.data.showCloseX) {
      this.closeXButton.addEventListener('click', () => this.close());
    } else if(this.closeXButton) {
      this.closeXButton.style.display = 'none';
    }
  },

  removeEventListeners: function() {
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.data.openEvent) {
      window.removeEventListener(this.data.openEvent, this.handleOpenEvent);
    }
    if (this.data.closeEvent) {
      window.removeEventListener(this.data.closeEvent, this.handleCloseEvent);
    }
  },

  onKeyDown: function(event) {
    if (this.data.isOpen && this.data.closeOnEsc && event.key === 'Escape') {
      this.close();
    }
  }
}); 