AFRAME.registerComponent('orbit-path-visualizer', {
  schema: {
    color: { type: 'color', default: '#00ff00' },
    opacity: { type: 'number', default: 0.5 },
    segmentsWidth: { type: 'int', default: 48 },
    segmentsHeight: { type: 'int', default: 24 },
    showBand: { type: 'boolean', default: true }
  },

  init: function () {
    this.sphere = null;
    this.band = null;
    this.updatePath = this.updatePath.bind(this);
    this.camera = document.querySelector('[camera]');
    if (this.camera) {
      this.camera.addEventListener('componentchanged', this.updatePath);
    }
    this.updatePath();
  },

  remove: function () {
    if (this.sphere && this.sphere.parentNode) this.sphere.parentNode.removeChild(this.sphere);
    if (this.band && this.band.parentNode) this.band.parentNode.removeChild(this.band);
    if (this.camera) {
      this.camera.removeEventListener('componentchanged', this.updatePath);
    }
  },

  update: function () {
    this.updatePath();
  },

  updatePath: function () {
    // Remove previous
    if (this.sphere && this.sphere.parentNode) this.sphere.parentNode.removeChild(this.sphere);
    if (this.band && this.band.parentNode) this.band.parentNode.removeChild(this.band);

    if (!this.camera) return;
    const orbitConfig = this.camera.getAttribute('orbit-controls');
    if (!orbitConfig) return;

    // Parse target
    let target = { x: 0, y: 0, z: 0 };
    if (typeof orbitConfig.target === 'string') {
      const parts = orbitConfig.target.split(/\s+/).map(Number);
      if (parts.length === 3) target = { x: parts[0], y: parts[1], z: parts[2] };
    } else if (typeof orbitConfig.target === 'object') {
      target = orbitConfig.target;
    }

    // Use average of min/max distance for radius
    const minDist = parseFloat(orbitConfig.minDistance) || 1;
    const maxDist = parseFloat(orbitConfig.maxDistance) || 1;
    const radius = (minDist + maxDist) / 4;

    // Draw main wireframe sphere
    this.sphere = document.createElement('a-entity');
    this.sphere.setAttribute('geometry', {
      primitive: 'sphere',
      radius: radius,
      segmentsWidth: this.data.segmentsWidth,
      segmentsHeight: this.data.segmentsHeight
    });
    this.sphere.setAttribute('material', {
      color: this.data.color,
      wireframe: true,
      opacity: this.data.opacity,
      transparent: true,
      depthTest: false
    });
    this.sphere.setAttribute('position', `${target.x} ${target.y} ${target.z}`);
    this.el.appendChild(this.sphere);

    // Optionally draw a band for min/max polar angle
    if (this.data.showBand && orbitConfig.minPolarAngle !== undefined && orbitConfig.maxPolarAngle !== undefined) {
      const minPolar = THREE.MathUtils.degToRad(parseFloat(orbitConfig.minPolarAngle) || 0);
      const maxPolar = THREE.MathUtils.degToRad(parseFloat(orbitConfig.maxPolarAngle) || 180);
      // Draw a band as a torus for the min/max polar angles
      // We'll draw two tori: one at minPolar, one at maxPolar
      this.band = document.createElement('a-entity');
      // Min polar
      const minY = radius * Math.cos(minPolar);
      const minR = radius * Math.sin(minPolar);
      const minTorus = document.createElement('a-entity');
      minTorus.setAttribute('geometry', {
        primitive: 'torus',
        radius: minR,
        tube: 0.001 * radius,
        segmentsRadial: this.data.segmentsWidth,
        segmentsTubular: 8
      });
      minTorus.setAttribute('material', {
        color: '#ff0000',
        wireframe: true,
        opacity: 0.7,
        transparent: true,
        depthTest: false
      });
      minTorus.setAttribute('position', `0 ${minY} 0`);
      this.band.appendChild(minTorus);
      // Max polar
      const maxY = radius * Math.cos(maxPolar);
      const maxR = radius * Math.sin(maxPolar);
      const maxTorus = document.createElement('a-entity');
      maxTorus.setAttribute('geometry', {
        primitive: 'torus',
        radius: maxR,
        tube: 0.001 * radius,
        segmentsRadial: this.data.segmentsWidth,
        segmentsTubular: 8
      });
      maxTorus.setAttribute('material', {
        color: '#0000ff',
        wireframe: true,
        opacity: 0.7,
        transparent: true,
        depthTest: false
      });
      maxTorus.setAttribute('position', `0 ${maxY} 0`);
      this.band.appendChild(maxTorus);
      this.band.setAttribute('position', `${target.x} ${target.y} ${target.z}`);
      this.el.appendChild(this.band);
    }
  }
}); 