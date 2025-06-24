AFRAME.registerComponent('spatial-hotspot-controller', {
  init: function () {
    console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] init(): Initialized.');
    this.hotspotData = null;
    this.currentModelId = null;
    this.activeHotspotsContainer = null;
    this.activeModal = null;

    this.fetchHotspotData();

    this.onModelLoaded = this.onModelLoaded.bind(this);
    this.onHotspotClicked = this.onHotspotClicked.bind(this);

    window.addEventListener('model-loaded', this.onModelLoaded);
    window.addEventListener('hotspot-clicked', this.onHotspotClicked);
  },

  remove: function () {
    window.removeEventListener('model-loaded', this.onModelLoaded);
    window.removeEventListener('hotspot-clicked', this.onHotspotClicked);
    this.clearHotspots();
    this.clearModal();
  },

  fetchHotspotData: async function () {
    try {
      const response = await fetch('./core/data/data.json');
      const data = await response.json();
      this.hotspotData = data.models;
      console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] fetchHotspotData(): Success.', this.hotspotData);
    } catch (error) {
      console.error('[SpatialHotspotController] Failed to load hotspot data:', error);
    }
  },

  onModelLoaded: function (e) {
    if (!e.detail || !e.detail.modelId) {
      console.warn('[HOTSPOT_DEBUG] Ignoring model-loaded event with missing modelId:', e.detail);
      return;
    }
    console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] onModelLoaded(): Received model-loaded for ID:', e.detail.modelId);
    if (!this.hotspotData) return;

    this.clearHotspots();
    this.clearModal();

    this.currentModelId = e.detail.modelId;
    const modelData = this.hotspotData.find(m => m.id === this.currentModelId);
    const modelEl = e.detail.entity;

    if (modelData && modelData.hotspots && modelData.hotspots.length > 0) {
      console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] onModelLoaded(): Found matching data, creating hotspots.', modelData.hotspots);
      this.createHotspots(modelData.hotspots, modelEl);
    } else {
      console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] onModelLoaded(): No hotspots in data for model ID:', this.currentModelId);
    }
  },

  onHotspotClicked: function (e) {
    console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] onHotspotClicked(): Received for ID:', e.detail.hotspotID);
    if (!this.hotspotData || !this.currentModelId) return;

    this.clearModal();

    const modelData = this.hotspotData.find(m => m.id === this.currentModelId);
    if (!modelData) return;

    const hotspotId = e.detail.hotspotID;
    const hotspot = modelData.hotspots.find(h => h.id.toString() === hotspotId.toString());

    if (hotspot && hotspot.details) {
      console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] onHotspotClicked(): Found hotspot data, creating modal.', hotspot);
      this.createModal(hotspot);
    }
  },

  createHotspots: function (hotspots, modelEl) {
    this.activeHotspotsContainer = document.createElement('a-entity');
    this.activeHotspotsContainer.setAttribute('id', 'hotspots-container');
    this.el.sceneEl.appendChild(this.activeHotspotsContainer);

    console.log('Appended hotspots container:', this.activeHotspotsContainer, 'to', this.el.sceneEl);

    if (!modelEl || !modelEl.object3D) {
      console.error("[SpatialHotspotController] CRITICAL: modelEl not found. Cannot create hotspots.");
      return;
    }

    hotspots.forEach(hotspot => {
      if (hotspot.parentName && hotspot.position) {
        const parentObject = modelEl.object3D.getObjectByName(hotspot.parentName);

        if (parentObject) {
          const hotspotEl = document.createElement('a-entity');
          // Get the world position of the parent mesh
          const worldPos = new THREE.Vector3();
          parentObject.getWorldPosition(worldPos);

          // Add the hotspot's local offset
          const offset = new THREE.Vector3(
            hotspot.position.x,
            hotspot.position.y,
            hotspot.position.z
          );
          worldPos.add(offset);

          // Set the marker's position in world coordinates
          hotspotEl.setAttribute('position', `${worldPos.x} ${worldPos.y} ${worldPos.z}`);
          hotspotEl.setAttribute('spatial-hotspot', {
            hotspotID: hotspot.id || hotspot.name,
            label: hotspot.label || hotspot.name,
            modelUrl: hotspot.modelUrl || '',
            modelScale: hotspot.modelScale || {x: 5, y: 5, z: 5},
          });
          // Append the marker entity to the hotspots container
          this.activeHotspotsContainer.appendChild(hotspotEl);
        } else {
          console.warn(`[SpatialHotspotController] SKIPPED: Parent mesh '${hotspot.parentName}' not found in model.`);
        }
      } else {
        console.warn('[SpatialHotspotController] Hotspot skipped. Data is malformed (missing `parentName` or `position`):', hotspot);
      }
    });
  },
  
  clearHotspots: function () {
    if (this.activeHotspotsContainer) {
      console.log('[HOTSPOT_DEBUG] Removing hotspots container:', this.activeHotspotsContainer);
      this.activeHotspotsContainer.parentNode.removeChild(this.activeHotspotsContainer);
      this.activeHotspotsContainer = null;
    }
  },

  createModal: function (hotspot) {
    const sceneEl = this.el.sceneEl;

    const modalEl = document.createElement('a-entity');
    
    // Set content BEFORE setting component to avoid race condition
    if (hotspot.details.targetDesc) {
      modalEl.innerHTML = hotspot.details.targetDesc;
    }
    
    modalEl.setAttribute('modal-dialog', {
      isOpen: true,
      title: hotspot.details.targetTitle || 'Information',
      titleIcon: 'fa-solid fa-xl fa-location-dot',
      showOverlay: false,
      footerButtons: JSON.stringify([{
        label: 'Close',
        isClose: true
      }])
    });

    sceneEl.appendChild(modalEl);
    this.activeModal = modalEl;
  },

  clearModal: function() {
    if (this.activeModal) {
      this.activeModal.parentNode.removeChild(this.activeModal);
      this.activeModal = null;
    }
  }
}); 