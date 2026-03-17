/**
 * SiFatih Toast Notification Utility (Enhanced)
 * Provides non-blocking notifications using Bootstrap 5 Toasts with:
 * - Multiple placement options
 * - Custom styling support
 * - Notification queue management
 */

// Toast queue to prevent overlapping
const toastQueue = [];
let isProcessing = false;

/**
 * Toast type configurations with colors and icons
 */
const TOAST_TYPES = {
    success: {
        bgClass: 'bg-success',
        icon: 'bi-check-circle-fill',
        title: 'Sukses'
    },
    error: {
        bgClass: 'bg-danger',
        icon: 'bi-x-circle-fill',
        title: 'Error'
    },
    warning: {
        bgClass: 'bg-warning text-dark',
        icon: 'bi-exclamation-triangle-fill',
        title: 'Peringatan'
    },
    info: {
        bgClass: 'bg-info text-dark',
        icon: 'bi-info-circle-fill',
        title: 'Informasi'
    }
};

/**
 * Placement position mappings
 */
const PLACEMENTS = {
    'top-right': { top: '0', right: '0', bottom: 'auto', left: 'auto' },
    'top-left': { top: '0', right: 'auto', bottom: 'auto', left: '0' },
    'bottom-right': { top: 'auto', right: '0', bottom: '0', left: 'auto' },
    'bottom-left': { top: 'auto', right: 'auto', bottom: '0', left: '0' },
    'center': { top: '50%', right: '50%', bottom: 'auto', left: '50%', transform: 'translate(-50%, -50%)' }
};

/**
 * Ensure toast container exists for given placement
 * @param {string} placement - Toast placement position
 * @returns {HTMLElement} The container element
 */
function getOrCreateContainer(placement = 'top-right') {
    let container = document.getElementById(`toast-container-${placement}`);
    
    if (!container) {
        container = document.createElement('div');
        container.id = `toast-container-${placement}`;
        container.className = 'toast-container position-fixed p-3';
        container.style.zIndex = '9999';
        
        const pos = PLACEMENTS[placement] || PLACEMENTS['top-right'];
        Object.assign(container.style, pos);
        
        document.body.appendChild(container);
    }
    
    return container;
}

/**
 * Process queue and show next toast
 */
function processQueue() {
    if (isProcessing || toastQueue.length === 0) return;
    
    isProcessing = true;
    const toastItem = toastQueue.shift();
    
    const { type, message, options, callback } = toastItem;
    const container = getOrCreateContainer(options.placement);
    
    const style = TOAST_TYPES[type] || TOAST_TYPES.info;
    
    // Create toast element
    const toastEl = document.createElement('div');
    const customClass = options.customClass ? ` ${options.customClass}` : '';
    toastEl.className = `toast align-items-center text-white ${style.bgClass} border-0 shadow-lg${customClass}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', options.ariaLive || 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.dataset.bsDelay = options.duration;
    
    const icon = options.customIcon || style.icon;
    const title = options.customTitle || style.title;
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${icon} fs-5 me-2"></i>
                <div>
                    <strong class="d-block">${title}</strong>
                    ${message}
                </div>
            </div>
            ${options.dismissible ? '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' : ''}
        </div>
    `;
    
    // Append to container
    container.appendChild(toastEl);
    
    // Initialize and show
    const toast = new bootstrap.Toast(toastEl, { delay: options.duration });
    toast.show();
    
    // Remove from DOM and process queue
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
        if (callback) callback();
        isProcessing = false;
        processQueue();
    });
}

/**
 * Show a toast notification (enhanced version)
 * 
 * @param {string} type - Notification type: 'success', 'error', 'warning', 'info'
 * @param {string} message - Message to display
 * @param {Object|number} [options] - Configuration object or duration (for backward compatibility)
 * @param {number} [options.duration=5000] - Duration in ms before auto-dismissal
 * @param {string} [options.placement='top-right'] - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'
 * @param {boolean} [options.dismissible=true] - Show close button
 * @param {string} [options.customClass=''] - Additional CSS classes
 * @param {string} [options.customIcon=null] - Override default icon (Bootstrap Icon class)
 * @param {string} [options.customTitle=null] - Override default title
 * @param {string} [options.ariaLive='assertive'] - Aria-live value: 'assertive', 'polite', 'off'
 * @param {Function} [options.callback=null] - Callback when toast dismissed
 * @param {boolean} [options.queue=true] - Use queue system for sequential display
 * 
 * @example
 * // Basic usage (backward compatible)
 * showToast('success', 'Data saved!');
 * showToast('error', 'Failed to save', 7000);
 * 
 * // With options object
 * showToast('warning', 'Please wait...', {
 *   duration: 10000,
 *   placement: 'bottom-left',
 *   customIcon: 'bi-hourglass-split',
 *   dismissible: false
 * });
 */
export function showToast(type, message, options) {
    // Handle backward compatibility: if options is a number, treat it as duration
    if (typeof options === 'number') {
        options = { duration: options };
    }
    
    // Merge with defaults
    const config = {
        duration: 5000,
        placement: 'top-right',
        dismissible: true,
        customClass: '',
        customIcon: null,
        customTitle: null,
        ariaLive: 'assertive',
        callback: null,
        queue: true,
        ...options
    };
    
    if (config.queue) {
        // Add to queue
        toastQueue.push({ type, message, options: config, callback: config.callback });
        processQueue();
    } else {
        // Show immediately without queue
        const container = getOrCreateContainer(config.placement);
        const style = TOAST_TYPES[type] || TOAST_TYPES.info;
        
        const toastEl = document.createElement('div');
        const customClass = config.customClass ? ` ${config.customClass}` : '';
        toastEl.className = `toast align-items-center text-white ${style.bgClass} border-0 shadow-lg${customClass}`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', config.ariaLive);
        toastEl.setAttribute('aria-atomic', 'true');
        toastEl.dataset.bsDelay = config.duration;
        
        const icon = config.customIcon || style.icon;
        const title = config.customTitle || style.title;
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="bi ${icon} fs-5 me-2"></i>
                    <div>
                        <strong class="d-block">${title}</strong>
                        ${message}
                    </div>
                </div>
                ${config.dismissible ? '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' : ''}
            </div>
        `;
        
        container.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { delay: config.duration });
        toast.show();
        
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
            if (config.callback) config.callback();
        });
    }
}

/**
 * Clear all toasts from the screen
 */
export function clearAllToasts() {
    document.querySelectorAll('.toast-container').forEach(container => {
        container.querySelectorAll('.toast').forEach(toast => {
            const bsToast = bootstrap.Toast.getInstance(toast);
            if (bsToast) bsToast.hide();
        });
    });
    toastQueue.length = 0;
    isProcessing = false;
}

/**
 * Get current queue size
 */
export function getQueueSize() {
    return toastQueue.length;
}
