AFRAME.registerComponent('billboard', {
  init: function () {
    this.camera = this.el.sceneEl.camera;
  },

  tick: function () {
    if (this.camera) {
      // Get the camera's world position.
      const cameraPosition = new THREE.Vector3();
      // The camera object is a THREE.PerspectiveCamera instance.
      this.camera.getWorldPosition(cameraPosition);
      
      // Make the entity look at the camera's position.
      this.el.object3D.lookAt(cameraPosition);
    }
  }
}); 