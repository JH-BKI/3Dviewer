(function () {
    
  
    function getDeviceInfo() {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--device')
        .trim();
    
      const [type, label, range, orientation] = raw.split('|');
      const [min, max] = range.split('-');
    
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
    
      return {
        raw,
        type,
        label,
        orientation,
        range: { min, max },
        viewport: {
          width: viewportWidth,
          height: viewportHeight,
        }
      };
    }
    
    
    function applyDeviceInfoToBody() {
      const info = getDeviceInfo();
    
      // Set data attribute
      document.body.setAttribute('data-media-query', info.raw);
    
      // Log full details
      console.log('Device Info:', {
        mediaQuery: info.raw,
        deviceType: info.type,
        resolutionLabel: info.label,
        resolutionRange: info.range,
        orientation: info.orientation,
        viewport: info.viewport
      });
    }

    // Expose functions globally
    window.getDeviceInfo = getDeviceInfo;
    window.applyDeviceInfoToBody = applyDeviceInfoToBody;
    window.throttle = throttle;
    window.debounce = debounce;
    window.resolvePath = resolvePath;
    window.resolveViewerPath = resolveViewerPath;

    //Only allow the function to run once every X milliseconds.
    //EG: window.addEventListener('resize', throttle(applyDeviceInfoToBody, 200));
    function throttle(fn, delay) {
      let lastCall = 0;
      return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall >= delay) {
          lastCall = now;
          fn(...args);
        }
      };
    }


    //Only run the function after the user has stopped resizing for X milliseconds.
    //window.addEventListener('resize', debounce(applyDeviceInfoToBody, 200));
    function debounce(fn, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    }

    /**
     * Resolves a relative path to an absolute path based on the current HTML file location
     * @param {string} relativePath - The relative path to resolve
     * @param {string} basePath - Optional base path (defaults to current HTML file location)
     * @returns {string} The absolute path
     * 
     * Examples:
     * resolvePath('./core/assets/model.glb') → 'http://localhost:3000/core/assets/model.glb'
     * resolvePath('../assets/model.glb', './core/data/') → 'http://localhost:3000/core/assets/model.glb'
     * resolvePath('assets/model.glb') → 'http://localhost:3000/assets/model.glb'
     */
    function resolvePath(relativePath, basePath = null) {
      // Get the current HTML file's URL as the base
      const currentScript = document.currentScript || document.querySelector('script[src*="globalUtils.js"]');
      const baseUrl = basePath || (currentScript ? new URL(currentScript.src).href : window.location.href);
      
      // Create a URL object to resolve the relative path
      const baseUrlObj = new URL(baseUrl);
      const resolvedUrl = new URL(relativePath, baseUrlObj);
      
      console.log('[globalUtils] resolvePath():', resolvedUrl.href);

      // Return the resolved path
      return resolvedUrl.href;
    }

    /**
     * Resolves a relative path relative to the viewer.html file location
     * @param {string} relativePath - The relative path to resolve
     * @returns {string} The absolute path
     * 
     * Examples:
     * resolveViewerPath('./core/assets/model.glb') → 'http://localhost:3000/core/assets/model.glb'
     * resolveViewerPath('assets/model.glb') → 'http://localhost:3000/assets/model.glb'
     */
    function resolveViewerPath(relativePath) {
      // Always resolve relative to the current page (viewer.html)
      console.log('[globalUtils] resolveViewerPath():', new URL(relativePath, window.location.href).href);
      return new URL(relativePath, window.location.href).href;
    }

  })();