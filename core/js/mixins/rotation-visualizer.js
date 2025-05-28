/**
 * Rotation Visualizer Mixin
 * Creates a cube with a directional indicator showing the forward vector
 */
AFRAME.registerComponent('rotation-visualizer', {
    schema: {
        size: { type: 'number', default: 0.1 },
        indicatorLength: { type: 'number', default: 0.15 },
        indicatorWidth: { type: 'number', default: 0.02 },
        cubeColor: { type: 'color', default: '#FF0000' },
        indicatorColor: { type: 'color', default: '#FFFFFF' }
    },

    init: function() {
        console.log('Initializing rotation visualizer'); // Debug log

        // Create the main cube
        this.cube = document.createElement('a-box');
        this.cube.setAttribute('width', this.data.size);
        this.cube.setAttribute('height', this.data.size);
        this.cube.setAttribute('depth', this.data.size);
        this.cube.setAttribute('color', this.data.cubeColor);
        this.cube.setAttribute('cursor-listener', '');
        this.cube.setAttribute('class', 'clickable');
        this.el.appendChild(this.cube);

        // Create the directional indicator
        this.indicator = document.createElement('a-box');
        this.indicator.setAttribute('width', this.data.indicatorLength);
        this.indicator.setAttribute('height', this.data.indicatorWidth);
        this.indicator.setAttribute('depth', this.data.indicatorWidth);
        this.indicator.setAttribute('color', this.data.indicatorColor);
        this.indicator.setAttribute('cursor-listener', '');
        this.indicator.setAttribute('class', 'clickable');
        // Position the indicator to protrude from the front of the cube
        this.indicator.setAttribute('position', `${this.data.size/2 + this.data.indicatorLength/2} 0 0`);
        this.el.appendChild(this.indicator);

        // Add click handlers to both elements
        this.cube.addEventListener('click', this.onClick.bind(this));
        this.indicator.addEventListener('click', this.onClick.bind(this));
        this.el.addEventListener('click', this.onClick.bind(this));

        console.log('Rotation visualizer initialized with elements:', this.cube, this.indicator); // Debug log
    },

    onClick: function(event) {
        console.log('Click detected on rotation visualizer'); // Debug log
        const position = this.el.getAttribute('position');
        const rotation = this.el.getAttribute('rotation');
        
        // Format values to 2 decimal places and combine into one line
        const formattedPosition = `${position.x.toFixed(2)} ${position.y.toFixed(2)} ${position.z.toFixed(2)}`;
        const formattedRotation = `${rotation.x.toFixed(2)} ${rotation.y.toFixed(2)} ${rotation.z.toFixed(2)}`;
        console.log(`Position: "${formattedPosition}" Rotation: "${formattedRotation}"`);
    },

    update: function() {
        // Update colors if they change
        if (this.cube) {
            this.cube.setAttribute('color', this.data.cubeColor);
        }
        if (this.indicator) {
            this.indicator.setAttribute('color', this.data.indicatorColor);
        }
    }
}); 