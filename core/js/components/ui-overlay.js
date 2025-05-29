// //console.log('ui-overlay.js loaded');
// Global flag to track if user has selected a model
window.hasSelectedModel = false;

AFRAME.registerComponent('ui-overlay', {
  init: function () {
    // --- Loading screen logic ---
    function showLoadingScreen(callback) {
      const loadingContainer = document.querySelector('.loading-container');
      if (loadingContainer) {
        //console.log('showLoadingScreen');
        loadingContainer.style.display = 'block';
        setTimeout(() => {
          loadingContainer.classList.remove('fade-in');
          loadingContainer.classList.add('fade-out');
          setTimeout(() => {
            loadingContainer.style.display = 'none';
            if (typeof callback === 'function') callback();
          }, 400);
        }, 2000);
      } else {
        if (typeof callback === 'function') callback();
      }
    }
    // --- End loading screen logic ---

    
    function toggleSelector(element, showHide=true, callback=null) {
      const selectorContainer = document.querySelector(element);
      if (selectorContainer) {
        //console.log('toggleSelector is called for: ', element);
        if (showHide) {
            //console.log('toggleSelector is showing: ', element);
            selectorContainer.style.display = 'block';
            selectorContainer.classList.remove('fade-out');
            selectorContainer.classList.add('fade-in');
            //console.log('toggleSelector is done showing: ', element);
            if (typeof callback === 'function') callback();     
        } else {
          //console.log('toggleSelector is hiding: ', element);
          selectorContainer.classList.remove('fade-in');
          selectorContainer.classList.add('fade-out');
            setTimeout(() => {
              selectorContainer.style.display = 'none';
              //console.log('toggleSelector is done hiding: ', element);
              if (typeof callback === 'function') callback();
            }, 400);
        } 
        
      }
    }

    // Attach closeInstructions to the Continue button
    const continueBtn = document.querySelector('.instructions-container .button');
    if (continueBtn) {
      continueBtn.addEventListener('click', ()=> { 
          toggleSelector('.instructions-container',false); 
          toggleSelector('.buttons-container',true); 
          toggleSelector('.model-selector-container',true); 

          // Check if this is first run using global flag
          const isFirstRun = !window.hasSelectedModel;
          const cancelBtn = document.querySelector('.model-selector-container #cancel-model-selector-button');
          if (cancelBtn) {
            cancelBtn.style.display = isFirstRun ? 'none' : 'inline-block';
          }
      });
    }


    const cancelBtn = document.querySelector('.model-selector-container #cancel-model-selector-button');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', ()=> { 
          toggleSelector('.model-selector-container',false); 
      });
    }


    //console.log('ui-overlay.js in comp');
    // Fade in the overlay container (this.el)
    const uiContainer = this.el;
    //console.log('ui-overlay init');
    if (uiContainer) {
      showLoadingScreen(() => {
        toggleSelector('.instructions-container',true);
      });
      // Force reflow to ensure animation triggers
      //void uiContainer.offsetWidth;
    }

    // Fullscreen toggle logic
    const fullscreenBtn = document.getElementById('fullscreen-toggle');
    let isFullscreen = false;
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        const minimiseIcon = fullscreenBtn.querySelector('.minimise-view');
        const maximiseIcon = fullscreenBtn.querySelector('.maximise-view');
        if (isFullscreen) {
          document.documentElement.requestFullscreen();
          if (minimiseIcon) minimiseIcon.style.display = 'block';
          if (maximiseIcon) maximiseIcon.style.display = 'none';
          fullscreenBtn.setAttribute('data-tooltip', 'Fullscreen view enabled');
        } else {
          document.exitFullscreen();
          if (minimiseIcon) minimiseIcon.style.display = 'none';
          if (maximiseIcon) maximiseIcon.style.display = 'block';
          fullscreenBtn.setAttribute('data-tooltip', 'Window view enabled');
        }
      });
    }

    // Info box logic
    const infoBtn = document.getElementById('general-info-toggle');

    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
          toggleSelector('.model-selector-container',true); 
      });
    }

    // Set up model selector button click handlers
    const modelButtons = document.querySelectorAll('.model-selector-button');
    modelButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const modelId = button.getAttribute('data-model');
        if (!modelConfig) {
          const response = await fetch('./core/data/data.json');
          modelConfig = await response.json();
        }
        const modelIndex = modelConfig.models.findIndex(m => m.id === modelId);
        if (modelIndex !== -1) {
          loadModelByIndex(modelIndex);
          // Hide the model selector modal
          const selectorContainer = document.querySelector('.model-selector-container');
          if (selectorContainer) {
            selectorContainer.style.display = 'none';
          }
          // Set global flag to indicate model has been selected
          window.hasSelectedModel = true;
          // Show cancel button for future use
          const cancelBtn = document.querySelector('.model-selector-container #cancel-model-selector-button');
          if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
          }
          // Ensure orbit controls are properly initialized after model load
          const camera = document.querySelector('[camera]');
          if (camera) {
            const orbitControls = camera.components['orbit-controls'];
            if (orbitControls) {
              // Force orbit controls to update
              orbitControls.update();
              // Ensure rotation is enabled
              camera.setAttribute('orbit-controls', 'enableRotate', true);
            }
          }
        }
      });
    });
  }
}); 