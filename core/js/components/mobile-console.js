/**
 * Mobile Console Component
 * A self-contained component for debugging on mobile devices
 * Activates when tapping the top right corner 5 times
 */
AFRAME.registerComponent('mobile-console', {
  schema: {
    enabled: { type: 'boolean', default: true },
    tapAreaSize: { type: 'number', default: 100 }, // Size of tap area in pixels
    tapTimeout: { type: 'number', default: 2000 }, // Time window for 5 taps in ms
    maxLogs: { type: 'number', default: 1000 } // Maximum number of logs to keep
  },

  init: function() {
    this.isMobile = this.detectMobile();
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.logs = [];
    this.isConsoleOpen = false;
    this.consoleModal = null;
    this.logContainer = null;
    
    if (this.isMobile && this.data.enabled) {
      this.setupTapDetection();
      this.interceptConsoleLogs();
      console.log('[Mobile Console] Component initialized - tap top right 5 times to activate');
    }
  },

  detectMobile: function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
  },

  setupTapDetection: function() {
    const tapArea = document.createElement('div');
    tapArea.id = 'mobile-console-tap-area';
    tapArea.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: ${this.data.tapAreaSize}px;
      height: ${this.data.tapAreaSize}px;
      z-index: 999999;
      background: transparent;
      cursor: pointer;
    `;

    tapArea.addEventListener('click', this.handleTap.bind(this));
    document.body.appendChild(tapArea);
  },

  handleTap: function(event) {
    const now = Date.now();
    
    // Reset tap count if too much time has passed
    if (now - this.lastTapTime > this.data.tapTimeout) {
      this.tapCount = 0;
    }
    
    this.tapCount++;
    this.lastTapTime = now;
    
    console.log(`[Mobile Console] Tap ${this.tapCount}/5`);
    
    if (this.tapCount >= 5) {
      this.tapCount = 0;
      this.toggleConsole();
    }
  },

  interceptConsoleLogs: function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Safe JSON serialization that handles circular references
    const safeStringify = (obj, maxDepth = 3) => {
      const seen = new WeakSet();
      
      const replacer = (key, value, depth = 0) => {
        if (depth > maxDepth) {
          return '[Max Depth Reached]';
        }
        
        if (value === null || value === undefined) {
          return value;
        }
        
        if (typeof value === 'function') {
          return '[Function]';
        }
        
        if (typeof value === 'object') {
          // Handle circular references
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          
          // Handle A-Frame entities and components
          if (value.el && value.components) {
            return `[A-Frame Entity: ${value.el.tagName || 'unknown'}]`;
          }
          
          if (value.tagName && value.tagName.toLowerCase().includes('a-')) {
            return `[A-Frame Element: ${value.tagName}]`;
          }
          
          if (value.constructor && value.constructor.name) {
            const constructorName = value.constructor.name;
            if (constructorName.includes('Component') || constructorName.includes('Entity')) {
              return `[A-Frame ${constructorName}]`;
            }
          }
          
          seen.add(value);
          
          if (Array.isArray(value)) {
            return value.map(item => replacer(null, item, depth + 1));
          } else {
            const result = {};
            for (const [k, v] of Object.entries(value)) {
              result[k] = replacer(k, v, depth + 1);
            }
            return result;
          }
        }
        
        return value;
      };
      
      try {
        return JSON.stringify(obj, replacer, 2);
      } catch (error) {
        return `[Serialization Error: ${error.message}]`;
      }
    };

    const addLog = (level, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = Array.from(args).map(arg => {
        if (typeof arg === 'object') {
          return safeStringify(arg);
        }
        return String(arg);
      }).join(' ');
      
      this.logs.push({
        timestamp,
        level,
        message,
        time: Date.now()
      });

      // Keep only the most recent logs
      if (this.logs.length > this.data.maxLogs) {
        this.logs = this.logs.slice(-this.data.maxLogs);
      }

      // Update console if open
      if (this.isConsoleOpen && this.logContainer) {
        this.updateLogDisplay();
      }
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('warn', args);
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      addLog('info', args);
    };

    console.debug = (...args) => {
      originalDebug.apply(console, args);
      addLog('debug', args);
    };
  },

  toggleConsole: function() {
    if (this.isConsoleOpen) {
      this.closeConsole();
    } else {
      this.openConsole();
    }
  },

  openConsole: function() {
    if (this.consoleModal) {
      this.closeConsole();
    }

    // Create modal container
    this.consoleModal = document.createElement('div');
    this.consoleModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #2c3e50;
      color: white;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #34495e;
    `;
    
    const title = document.createElement('div');
    title.textContent = 'Mobile Console';
    title.style.fontWeight = 'bold';
    
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.cssText = `
      background: #e74c3c;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    clearBtn.onclick = () => this.clearLogs();
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: #95a5a6;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    `;
    closeBtn.onclick = () => this.closeConsole();
    
    controls.appendChild(clearBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);

    // Create log container
    this.logContainer = document.createElement('div');
    this.logContainer.style.cssText = `
      flex: 1;
      background: #1a1a1a;
      color: #00ff00;
      padding: 10px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
    `;

    this.consoleModal.appendChild(header);
    this.consoleModal.appendChild(this.logContainer);
    document.body.appendChild(this.consoleModal);

    this.isConsoleOpen = true;
    this.updateLogDisplay();
    
    console.log('[Mobile Console] Console opened');
  },

  closeConsole: function() {
    if (this.consoleModal) {
      document.body.removeChild(this.consoleModal);
      this.consoleModal = null;
      this.logContainer = null;
      this.isConsoleOpen = false;
      console.log('[Mobile Console] Console closed');
    }
  },

  updateLogDisplay: function() {
    if (!this.logContainer) return;

    const logText = this.logs.map(log => {
      const levelColor = {
        'log': '#00ff00',
        'error': '#ff0000',
        'warn': '#ffff00',
        'info': '#00ffff',
        'debug': '#888888'
      }[log.level] || '#00ff00';

      return `<span style="color: ${levelColor}">[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}</span>`;
    }).join('\n');

    this.logContainer.innerHTML = logText;
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  },

  clearLogs: function() {
    this.logs = [];
    if (this.logContainer) {
      this.logContainer.innerHTML = '';
    }
    console.log('[Mobile Console] Logs cleared');
  },

  remove: function() {
    this.closeConsole();
    
    // Remove tap area
    const tapArea = document.getElementById('mobile-console-tap-area');
    if (tapArea) {
      document.body.removeChild(tapArea);
    }
  }
}); 