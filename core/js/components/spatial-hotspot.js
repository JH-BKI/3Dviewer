/**
 * SpatialHotspot Component
 * A versatile hotspot component for 3D scenes that handles camera positioning and UI interactions
 */
AFRAME.registerComponent('spatial-hotspot', {
    schema: {
        hotspotID: {type: 'string'},
        label: {type: 'string'},
        type: {type: 'string', default: 'media'},
        visited: {type: 'boolean', default: false},
        required: {type: 'boolean', default: false}
    },

    init: function() {
        console.log('[HOTSPOT_DEBUG] [spatial-hotspot] init(): Creating hotspot with data:', this.data);
        // Main hotspot body (the sphere)
        this.hotspotEl = document.createElement('a-sphere');
        this.hotspotEl.setAttribute('radius', 0.1);
        this.hotspotEl.setAttribute('color', '#FF0000'); // Placeholder color
        this.hotspotEl.setAttribute('shader', 'flat');
        this.hotspotEl.setAttribute('billboard', ''); // Add billboard component
        this.hotspotEl.setAttribute('cursor-listener', ''); // Make this element interactable by the raycaster
        this.el.appendChild(this.hotspotEl);

        // Text label
        this.labelEl = document.createElement('a-entity');
        this.labelEl.setAttribute('text', {
            value: this.data.label,
            align: 'center',
            width: 2,
            color: '#FFFFFF'
        });
        this.labelEl.setAttribute('position', '0 0.2 0');
        this.labelEl.setAttribute('billboard', ''); // Add billboard component
        this.el.appendChild(this.labelEl);

        // Event Listeners for interaction
        this.hotspotEl.addEventListener('mouseenter', this.onMouseEnter.bind(this));
        this.hotspotEl.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.hotspotEl.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.hotspotEl.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.hotspotEl.addEventListener('click', this.onClick.bind(this));
    },

    onMouseEnter: function() {
        this.hotspotEl.setAttribute('scale', '1.2 1.2 1.2'); // Grow on hover
    },

    onMouseLeave: function() {
        this.hotspotEl.setAttribute('scale', '1 1 1'); // Return to normal size
        this.hotspotEl.setAttribute('color', '#FF0000'); // Return to normal color
    },

    onMouseDown: function() {
        this.hotspotEl.setAttribute('color', '#00FF00'); // Active color
    },

    onMouseUp: function() {
        this.hotspotEl.setAttribute('color', '#FF0000'); // Normal color
    },

    onClick: function() {
        console.log(`[HOTSPOT_DEBUG] [spatial-hotspot] onClick(): Clicked. Emitting event for hotspot ID: ${this.data.hotspotID}`);
        window.dispatchEvent(new CustomEvent('hotspot-clicked', {
            detail: { hotspotID: this.data.hotspotID }
        }));
    }
}); 