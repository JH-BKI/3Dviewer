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
    console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] onModelLoaded(): Received model-loaded for ID:', e.detail.modelId);
    if (!this.hotspotData) return;

    this.clearHotspots();
    this.clearModal();

    this.currentModelId = e.detail.modelId;
    const modelData = this.hotspotData.find(m => m.id === this.currentModelId);

    if (modelData && modelData.hotspots && modelData.hotspots.length > 0) {
      console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] onModelLoaded(): Found matching data, creating hotspots.', modelData.hotspots);
      this.createHotspots(modelData.hotspots);
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

  createHotspots: function (hotspots) {
    this.activeHotspotsContainer = document.createElement('a-entity');
    this.activeHotspotsContainer.setAttribute('id', 'hotspots-container');
    this.el.sceneEl.appendChild(this.activeHotspotsContainer);

    hotspots.forEach(hotspot => {
      const hotspotEl = document.createElement('a-entity');
      hotspotEl.setAttribute('position', hotspot.position);
      console.log('[HOTSPOT_DEBUG] [spatial-hotspot-controller] createHotspots(): Creating hotspot with data:', hotspot);
      hotspotEl.setAttribute('spatial-hotspot', {
        hotspotID: hotspot.id,
        label: hotspot.label,
        type: hotspot.type,
        visited: hotspot.visited,
        required: hotspot.requireAnswer
      });
      this.activeHotspotsContainer.appendChild(hotspotEl);
    });
  },
  
  clearHotspots: function () {
    if (this.activeHotspotsContainer) {
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
      titleIcon: 'fa-solid fa-circle-info',
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