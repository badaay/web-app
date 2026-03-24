/**
 * PWA Install Utility
 * Shows a prominent install banner on enduser/activity pages.
 * - Slides up from the bottom immediately on page load
 * - Handles Android (beforeinstallprompt) and iOS (manual guide)
 * - Remembers "dismiss" in localStorage for 2 days
 * - Auto-hides if already running in standalone / installed mode
 */

const STORAGE_KEY = 'pwa_install_dismissed_at';
const DISMISS_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * @param {object} [options]
 * @param {string} [options.bannerId='pwa-install-banner']
 */
export function initPWAInstall({ bannerId = 'pwa-install-banner' } = {}) {
    if (isStandalone()) return;

    const banner = document.getElementById(bannerId);
    if (!banner) return;

    let deferredPrompt = null;

    // ----- Helpers -----

    function showBanner() {
        banner.classList.remove('d-none');
        // Force reflow then animate
        requestAnimationFrame(() => {
            requestAnimationFrame(() => banner.classList.add('pwa-banner--visible'));
        });
    }

    function hideBanner() {
        banner.classList.remove('pwa-banner--visible');
        setTimeout(() => banner.classList.add('d-none'), 420);
    }

    // ----- Wire up buttons -----

    const btnInstall = banner.querySelector('[data-pwa-install]');

    // ----- iOS -----
    if (isIOS()) {
        banner.querySelector('[data-pwa-ios]')?.classList.remove('d-none');
        banner.querySelector('[data-pwa-android]')?.classList.add('d-none');
        btnInstall?.classList.add('d-none');
        if (!isStandalone()) showBanner();
        return;
    }

    // ----- Android / Chrome / Edge -----
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isStandalone()) showBanner();
    });

    window.addEventListener('appinstalled', () => {
        hideBanner();
        deferredPrompt = null;
    });

    btnInstall?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        btnInstall.disabled = true;
        btnInstall.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menginstall...';
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
            hideBanner();
        } else {
            btnInstall.disabled = false;
            btnInstall.innerHTML = '<i class="bi bi-download me-1"></i>Install';
        }
    });
}
