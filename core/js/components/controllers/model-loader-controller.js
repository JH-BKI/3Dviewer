//let currentModelConfig = null; // <-- Store the current model config globally
let currentModelEntity = null;
function setCurrentModelEntity(entity){
  currentModelEntity = entity;
}

function getCurrentModelEntity(){
  return window.currentModelEntity || currentModelEntity;
} 


/**
 * Stores the current animation status for the model entity.
 * @typedef {Object} AnimationStatus
 * @property {string} clip - The name of the current animation state.
 * @property {string} timeScale - The speed factor of the animation.
 * @property {string} loop - The loop mode (e.g., 'repeat', 'once').
 */

/** @type {AnimationStatus} */
let currentModelEntityAnimationStatus = {
  clip: "reset-no-anim-static",
  timeScale: "1.0",
  loop: "repeat"
};

/**
 * Updates a specific property of the current animation status.
 * @param {keyof AnimationStatus} key - The property to update.
 * @param {string} value - The new value to set.
 */
function setCurrentModelEntityAnimationStatus(key, value) {
  currentModelEntityAnimationStatus[key] = value;
}

/**
 * Retrieves a specific property from the current animation status.
 * @param {keyof AnimationStatus} key - The property to retrieve.
 * @returns {string} The value of the requested property.
 */
function getCurrentModelEntityAnimationStatus(key) {
  return currentModelEntityAnimationStatus[key];
}

// Model loader controller component
AFRAME.registerComponent('model-loader-controller', {
  schema: {},

  init: function() {
    this.loadModelConfig();
  },

  async loadModelConfig() {
    try {
      const response = await fetch('./core/data/data.json');
      window.modelConfig = await response.json();
      console.log('Model config loaded:', window.modelConfig);
      
      // Load a default model (first model in the list)
      if (window.modelConfig && window.modelConfig.models && window.modelConfig.models.length > 0) {
        console.log('Loading default model (index 0)');
        //this.loadModelByIndex(0);
        this.loadModelByIndex(4);
      }
    } catch (error) {
      console.error('Failed to load model config:', error);
    }
  },

  async loadModelByIndex(idx) {
    const model = window.modelConfig.models[idx];
    if (!model) return;
    console.log('Loading model:', model);
    
    

    // Remove previous model entity
    if (window.currentModelEntity) {
      window.currentModelEntity.parentNode.removeChild(window.currentModelEntity);
      window.currentModelEntity = null;
    }

    window.currentModelEntityAnimationStatus = null;


    // Add new model entity
    const scene = this.el.sceneEl;
    const entity = document.createElement('a-entity');
    entity.setAttribute('gltf-model', `assets/3d/${model.filename}`);
    entity.setAttribute('id', '3D-object');
    
    const pos = model.modelPosition || { x: 0, y: 0, z: 0 };
    const rot = model.modelRotation || { x: 0, y: 0, z: 0 };
    entity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    entity.setAttribute('rotation', `${rot.x} ${rot.y} ${rot.z}`);
    entity.setAttribute('scale', '1 1 1');

    scene.appendChild(entity);
    window.currentModelEntity = entity;

    // Wait for model to load before updating camera/controls
    entity.addEventListener('model-loaded', (e) => {
      e.stopPropagation();
      console.log('Model loaded successfully');
      
      // Dispatch global model-loaded event
      const modelLoadedEvent = new CustomEvent('model-loaded', { detail: { entity: entity, modelId: model.id } });
      console.log('[HOTSPOT_DEBUG] [model-loader-controller] loadModelByIndex(): Dispatching model-loaded event.', modelLoadedEvent.detail);
      window.dispatchEvent(modelLoadedEvent);
      
      // Reset camera using camera-utils
      if (model.orbitControls && window.cameraUtils) {
        window.cameraUtils.resetCameraAllValues(
          model.orbitControls.InitialPolarAngle,
          model.orbitControls.InitialAzimuthAngle,
          model.orbitControls.InitialZoomAmmount,
          model.orbitControls.ZoomMaxDistance
        );
      }

      // Handle animations if present
      const animations = e.detail.model.animations.map(anim => anim.name);
      
      console.log("Available animations:", animations, animations.length);
      if (animations.length > 0) {
        const animationOptions = animations.map(name => ({
          value: name,
          text: name,
          icon: 'fa-solid fa-film fa-xl'
        }));
        animationOptions.unshift( { value: 'reset-no-anim-static', text: 'None', icon: 'fa-solid fa-ban fa-xl', style: 'color: #ec5f5f;' });
        
        // Set default animation status
        setCurrentModelEntityAnimationStatus("clip", "reset-no-anim-static");
        setCurrentModelEntityAnimationStatus("timeScale", "0");
        setCurrentModelEntityAnimationStatus("loop", "repeat");

   
        console.log("[XRS] [isolate] _loadModelByIndex(): Available animations:", animationOptions, animationOptions.length);
        window.latestAnimationOptions = animationOptions;

        // Set up animation-mixer component with proper initial values
        const initialAnimation = getCurrentModelEntityAnimationStatus("clip");
        const initialSpeed = getCurrentModelEntityAnimationStatus("timeScale");
        const initialLoop = getCurrentModelEntityAnimationStatus("loop");
        entity.setAttribute('animation-mixer', `clip: ${initialAnimation}; timeScale: ${initialSpeed}; loop: ${initialLoop};`);
        
        // Remove previous animation controls to prevent duplicates
        const startNav = document.querySelector('.xrs_uicontainer .xrs_navbar .start');
        if (startNav) {
          const oldControls = startNav.querySelectorAll('#model-animation-controls-html');
          oldControls.forEach(el => el.remove());
        }

        // Create new a-entity for animation controls
        console.log('[model-loader-controller] Creating model-animation-controller entity...');
        const modelAnimationController = document.createElement('a-entity');
        modelAnimationController.setAttribute('model-animation-controller', `method: html; targetEntity: ${entity.id}; uiClass: browser-model-animation;`);
        modelAnimationController.setAttribute('id', 'model-animation-controls-html');
        modelAnimationController.setAttribute('class', 'nav-item');
        
        // Wrap in a div and add to navigation (now works with custom timer)
        const navItemDiv = document.createElement('div');
        navItemDiv.className = 'nav-item';
        navItemDiv.appendChild(modelAnimationController);
        
        // Add to nav
        startNav.appendChild(navItemDiv);
        console.log('[model-loader-controller] Appended modelAnimationController to navigation with custom timer system');
        
        // Dispatch event to populate animations AFTER the controller exists.
        // We use a setTimeout with a delay of 0. This pushes the event dispatch to
        // the next tick of the event loop, ensuring that the newly created
        // button-dropmenu component has fully initialized and attached its event listeners.
        // This is a robust way to solve this race condition.
        setTimeout(() => {
          console.log('[model-loader-controller] Dispatching UpdateAnimationNameList event with animations:', animationOptions);
          const event = new CustomEvent('UpdateAnimationNameList', { 
            detail: animationOptions 
          });
          window.dispatchEvent(event);
        }, 0);
      }
    });
  },

  // Delegate camera operations to camera-utils
  resetCamera(polar, azimuthal, zoomlevel, maxZoomDistance) {
    if (window.cameraUtils) {
      window.cameraUtils.resetCameraAllValues(polar, azimuthal, zoomlevel, maxZoomDistance);
    }
  },

  setMaxZoomDistance(maxDistance) {
    if (window.cameraUtils) {
      window.cameraUtils.setMaxZoomDistance(maxDistance);
    }
  },

  setPolarAndAzimuthalAngle(polar, azimuthal) {
    if (window.cameraUtils) {
      window.cameraUtils.setPolarAndAzimuthalAngle(polar, azimuthal);
    }
  },

  setZoomLevel(zoomDistance = 0.1) {
    if (window.cameraUtils) {
      window.cameraUtils.setZoomLevel(zoomDistance);
    }
  },

  updateOrbitTarget(vectorStr) {
    if (window.cameraUtils) {
      window.cameraUtils.updateOrbitTarget(vectorStr);
    }
  },

  setAnimProp: function(entity, prop, newValue) {
    if (!entity) return;
    
    let currentProps = entity.getAttribute("animation-mixer") || "";

    // Ensure currentProps is a string
    if (typeof currentProps !== "string") {
        currentProps = String(currentProps);
    }

    console.log("animation-mixer=" + currentProps);

    // Convert current properties into an object
    let propObj = Object.fromEntries(
        currentProps.split(";").map(p => p.trim().split(":").map(s => s.trim()))
    );

    // Update the specified property
    propObj[prop] = newValue;

    // Convert back to attribute string
    const updatedProps = Object.entries(propObj)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");

    // Apply updated properties
    entity.setAttribute("animation-mixer", updatedProps);
  }
}); 