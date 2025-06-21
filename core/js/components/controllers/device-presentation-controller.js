AFRAME.registerComponent('device-presentation-controller', {
  schema: {
    method: { type: 'string', default: 'html', oneOf: ['html', 'spatial'] },
    uiClass: { type: 'string', default: 'animation-controls' }, // CSS class for styling/selection
  },
  
  init: function () {
    console.log('=== MODEL ANIMATION CONTROLLER INIT ===');
    console.log('Component attached to:', this.el);
    console.log('Method:', this.data.method);
    console.log('UI Class:', this.data.uiClass);
    
    
    this.setupUI_playpause(this.data.method);
    this.setupUI_loop(this.data.method);
    this.setupUI_speed(this.data.method);
    this.setupUI_animationName(this.data.method);


    console.log('Configs created');
  },
  setupUI_playpause: function(render_method){
    // Create dropmenu configurations with class-based approach
    const uiClass = this.data.uiClass;
    
    const playPauseSelectorConfig = {
      buttonClass: `${uiClass}-playpause-selector`,
      iconOff: 'fa-solid fa-play fa-xl',
      iconOn: 'fa-solid fa-pause fa-xl',
      showLabel: false,
      tooltip: 'Play/Pause Animation',
      tooltipPosition: 'right',
      wrapperClass: `${uiClass}-playpause-wrapper`,
      eventName: 'UpdateAnimationPlayStatus'
    };

    if (render_method === 'html') {
      console.log('[XRS] _setupUI_playpause(): Rendering HTML UI...');
      
      const playpauseTogglebutton = document.createElement('a-entity');
      playpauseTogglebutton.setAttribute('button-toggle', 'config', JSON.stringify(playPauseSelectorConfig));
      this.el.appendChild(playpauseTogglebutton);         
      

    } else if (render_method === 'spatial') {
      console.log('[XRS] _setupUI_playpause(): Rendering Spatial UI...');
      
      
    }


    window.addEventListener('UpdateAnimationPlayStatus', (e) => {
      console.log('[XRS] _setupUI_playpause(): Animation Play status updated:', e.detail.value);
      // Use e.detail.value as needed
    });


  },
  setupUI_loop: function(render_method){
    const uiClass = this.data.uiClass;

    const loopSelectorConfig = {
      buttonClass: `${uiClass}-loop-selector`,
      buttonIcon: 'fa-solid fa-repeat fa-xl',
      defaultLabel: 'OFF',
      title: 'Loop Playback?',
      titleIcon: 'fa-solid fa-repeat fa-xl',
      wrapperClass: `${uiClass}-loop-wrapper`,
      eventName: 'UpdateAnimationLoopStatus',
      startingOption: 1,
      options: [
        {
          value: 'on',
          text: 'ON',
          icon: 'fa-solid fa-repeat fa-xl'
        },
        {
          value: 'off',
          text: 'OFF',
          icon: 'fa-solid fa-right-from-bracket fa-xl'
        }
      ]
    };      

    if (render_method === 'html') {
      console.log('[XRS] _setupUI_loop(): Rendering HTML UI...');
      
      const loopDropmenu = document.createElement('a-entity');
      loopDropmenu.setAttribute('button-dropmenu', 'config', JSON.stringify(loopSelectorConfig));
      this.el.appendChild(loopDropmenu);
  
      window.addEventListener('UpdateAnimationLoopStatus', (e) => {
        console.log('[XRS] _setupUI_loop(): Animation Loop status updated:', e.detail.value);
        // Use e.detail.value as needed
      });
  
      
    } else if (render_method === 'spatial') {
      console.log('[XRS] _setupUI_loop(): Rendering Spatial UI...');
      
      
    }


  },
  setupUI_speed: function(render_method){
    const uiClass = this.data.uiClass;  
    
    const speedSelectorConfig = {
      buttonClass: `${uiClass}-speed-selector`,
      buttonIcon: 'fa-solid fa-gauge-high fa-xl',
      defaultLabel: 'x1.0',
      title: 'Playback Speed:',
      titleIcon: 'fa-solid fa-gauge-high fa-xl',
      wrapperClass: `${uiClass}-speed-wrapper`,
      eventName: 'UpdateAnimationSpeedStatus',
      startingOption: 2,
      options: [
        {
          value: '0.1',
          text: 'x0.1',
          icon: 'fa-solid fa-gauge-simple-high fa-flip-horizontal fa-xl',
          style: 'color: #ec5f5f;'
        },
        {
          value: '0.5',
          text: 'x0.5',
          icon: 'fa-solid fa-gauge-simple-high fa-flip-horizontal fa-xl',
          style: 'color: #ec5f5f;'
        },
        {
          value: '1.0',
          text: 'x1.0',
          icon: 'fa-solid fa-gauge-simple fa-xl',
          style: 'color: #5fec95;'
        },
        {
          value: '2.0',
          text: 'x2.0',
          icon: 'fa-solid fa-gauge-simple-high fa-xl',
          style: 'color: #5fb6ec;'
        },
        {
          value: '3.0',
          text: 'x3.0',
          icon: 'fa-solid fa-gauge-simple-high fa-xl',
          style: 'color: #5fb6ec;'
        }
      ]
    };

    if (render_method === 'html') {
      console.log('[XRS] _setupUI_speed(): Rendering HTML UI...');

      const speedDropmenu = document.createElement('a-entity');
      speedDropmenu.setAttribute('button-dropmenu', 'config', JSON.stringify(speedSelectorConfig));
      this.el.appendChild(speedDropmenu);
  
      window.addEventListener('UpdateAnimationSpeedStatus', (e) => {
        console.log('[XRS] _setupUI_speed(): Animation Speed updated:', e.detail.value);
        // Use e.detail.value as needed
      });
  
      
    } else if (render_method === 'spatial') {
      console.log('[XRS] _setupUI_speed(): Rendering Spatial UI...');
      
      
    }



  },
  setupUI_animationName: function(render_method ){
    const uiClass = this.data.uiClass;
    
    const animationNameSelectorConfig = {
      buttonClass: `${uiClass}-name-selector`,
      buttonIcon: 'fa-solid fa-film fa-xl',
      defaultLabel: 'Select ...',
      title: 'Select Animation:',
      titleIcon: 'fa-solid fa-film fa-xl',
      wrapperClass: `${uiClass}-name-wrapper`,
      eventName: 'UpdateAnimationNameStatus',
      options: [
        {
          value: 'reset-no-anim-static',
          text: 'None',
          icon: 'fa-solid fa-ban fa-xl',
          style: 'color: #ec5f5f;'
        }
      ],
      maxScrollable: 3,
      dynamicEvent: 'UpdateAnimationNameList',
      dynamicKey: ['value', 'text', 'icon']
    };

    if (render_method === 'html') {
      console.log('[XRS] _setupUI_animationName(): Rendering HTML UI...');

      const animationNameDropmenu = document.createElement('a-entity');
      animationNameDropmenu.setAttribute('button-dropmenu', 'config', JSON.stringify(animationNameSelectorConfig));
      this.el.appendChild(animationNameDropmenu);
  
      window.addEventListener('UpdateAnimationNameStatus', (e) => {
        console.log('[XRS] _setupUI_animationName(): Animation Name status updated:',e.detail.entity, e.detail.value);
        // Use e.detail.value as needed
      });
      
    } else if (render_method === 'spatial') {
      console.log('[XRS] _setupUI_animationName(): Rendering Spatial UI...');
      
      
    }

  },

   
  renderSpatial: function () {
    // Create spatial A-Frame entities for VR/AR controls
    const uiClass = this.data.uiClass;
    
    // Play/Pause button as A-Frame entity
    const playPauseButton = document.createElement('a-entity');
    playPauseButton.setAttribute('geometry', 'primitive: box; width: 0.1; height: 0.1; depth: 0.02');
    playPauseButton.setAttribute('material', 'color: #4CC3D9; transparent: true; opacity: 0.8');
    playPauseButton.setAttribute('position', '0 0 -0.5');
    playPauseButton.setAttribute('class', `clickable ${uiClass}-play-pause animation-controls-play-pause`);
    
    // Add click handler for spatial button
    playPauseButton.addEventListener('click', () => {
      // Spatial play/pause logic
      const event = new CustomEvent('UpdateAnimationPlayStatus', {
        detail: { value: true }
      });
      window.dispatchEvent(event);
    });
    
    this.el.appendChild(playPauseButton);
    
    // Create spatial dropmenu entities (if you have a spatial dropmenu component)
    // const loopDropmenu = document.createElement('a-entity');
    // loopDropmenu.setAttribute('spatial-dropmenu', 'config', JSON.stringify(this.configs.loop));
    // this.el.appendChild(loopDropmenu);
    
    // Add more spatial UI elements as needed...
    console.log('Spatial UI rendered with class:', uiClass);
  }
  
}); 