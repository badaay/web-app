// Simple Offline Indicator Component
// Shows red/green status light for online/offline status

class OfflineIndicator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showText: true,
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left
      size: 'medium', // small, medium, large
      ...options
    };
    
    this.isOnline = navigator.onLine;
    this.init();
  }

  init() {
    this.setupStyles();
    this.createIndicator();
    this.setupEventListeners();
    this.updateStatus();
  }

  setupStyles() {
    const styleId = 'offline-indicator-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .offline-indicator {
          position: fixed;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .offline-indicator.top-right {
          top: 20px;
          right: 20px;
        }

        .offline-indicator.top-left {
          top: 20px;
          left: 20px;
        }

        .offline-indicator.bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .offline-indicator.bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .offline-indicator.small {
          padding: 4px 8px;
          font-size: 10px;
        }

        .offline-indicator.large {
          padding: 12px 16px;
          font-size: 14px;
        }

        .status-light {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .status-light.small {
          width: 6px;
          height: 6px;
        }

        .status-light.large {
          width: 10px;
          height: 10px;
        }

        .status-light.online {
          background-color: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .status-light.offline {
          background-color: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }

        .status-light.connecting {
          background-color: #f59e0b;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .status-text {
          color: #374151;
          font-weight: 500;
        }

        .status-text.online {
          color: #10b981;
        }

        .status-text.offline {
          color: #ef4444;
        }

        .status-text.connecting {
          color: #f59e0b;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .offline-indicator {
            top: 10px;
            right: 10px;
            bottom: 10px;
            left: 10px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  createIndicator() {
    const indicator = document.createElement('div');
    indicator.className = `offline-indicator ${this.options.position} ${this.options.size}`;
    
    const statusLight = document.createElement('div');
    statusLight.className = `status-light ${this.options.size}`;
    
    const statusText = document.createElement('span');
    statusText.className = 'status-text';
    
    indicator.appendChild(statusLight);
    if (this.options.showText) {
      indicator.appendChild(statusText);
    }
    
    this.container.appendChild(indicator);
    
    this.indicator = indicator;
    this.statusLight = statusLight;
    this.statusText = statusText;
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatus();
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'connection-status') {
          this.isOnline = event.data.isOnline;
          this.updateStatus();
        }
      });
    }
  }

  updateStatus() {
    const status = this.getConnectionStatus();
    const statusClass = status.class;
    const statusText = status.text;

    // Update status light
    this.statusLight.className = `status-light ${this.options.size} ${statusClass}`;

    // Update status text
    if (this.options.showText) {
      this.statusText.className = `status-text ${statusClass}`;
      this.statusText.textContent = statusText;
    }

    // Emit event
    this.emit('statusChanged', {
      isOnline: this.isOnline,
      status: statusClass,
      text: statusText
    });
  }

  getConnectionStatus() {
    if (this.isOnline) {
      return {
        class: 'online',
        text: 'Online'
      };
    } else {
      return {
        class: 'offline',
        text: 'Offline'
      };
    }
  }

  // Check connection status more thoroughly
  async checkConnection() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000
      });
      
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
    }
    
    this.updateStatus();
    return this.isOnline;
  }

  // Show connecting status
  setConnecting() {
    this.statusLight.className = `status-light ${this.options.size} connecting`;
    if (this.options.showText) {
      this.statusText.className = 'status-text connecting';
      this.statusText.textContent = 'Connecting...';
    }
  }

  // Hide indicator
  hide() {
    if (this.indicator) {
      this.indicator.style.display = 'none';
    }
  }

  // Show indicator
  show() {
    if (this.indicator) {
      this.indicator.style.display = 'flex';
    }
  }

  // Update position
  updatePosition(position) {
    if (this.indicator && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(position)) {
      this.indicator.className = `offline-indicator ${position} ${this.options.size}`;
      this.options.position = position;
    }
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners?.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners?.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Destroy component
  destroy() {
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }
    this.eventListeners?.clear();
  }
}

// Export factory function
window.createOfflineIndicator = (container, options) => new OfflineIndicator(container, options);

export default OfflineIndicator;
