AFRAME.registerComponent('dynamic-text', {
  schema: {
    // The event to listen for that will contain the new text value.
    dynamicEvent: { type: 'string' },
    // The default text to display before any event is heard.
    defaultText: { type: 'string', default: '00:00 / 00:00' }
  },

  init: function () {
    // Set the initial text value.
    this.el.setAttribute('text', {
      align: 'left',
      width: 1.5,
      value: this.data.defaultText
    });

    // Listen for the dynamic event.
    if (this.data.dynamicEvent) {
      window.addEventListener(this.data.dynamicEvent, (e) => {
        // When the event is heard, update the text component's value.
        if (e.detail.value !== undefined) {
          this.el.setAttribute('text', 'value', e.detail.value);
        }
      });
    }
  }
}); 