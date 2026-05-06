import { supabase } from '../../api/supabase.js';
import { showToast } from './toast.js';
import { createViewMap } from './map-kit.js';

/**
 * UI Common Utility Module
 * Consolidated functions for Maps, Packages, and other shared UI components.
 */

// --- 1. Internet Packages ---

/**
 * Populates a select element with internet packages from the database.
 * @param {string} selectId - The ID of the select element.
 * @param {string} currentValue - The current value to select.
 */
export async function populatePackagesDropdown(selectId, currentValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const { data, error } = await supabase
            .from('internet_packages')
            .select('name')
            .order('name');

        if (error) throw error;

        let options = '<option value="">Pilih Paket...</option>';
        data.forEach(pkg => {
            const selected = (pkg.name === currentValue) ? 'selected' : '';
            options += `<option value="${pkg.name}" ${selected}>${pkg.name}</option>`;
        });

        select.innerHTML = options;
    } catch (err) {
        console.error('Error fetching packages:', err);
    }
}

// --- 2. Maps & Coordinates ---

/**
 * Returns a Google Maps search link for a set of coordinates.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string}
 */
export function getGoogleMapsLink(lat, lng) {
    if (!lat || !lng) return '';
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Creates a standard SVG marker for Leaflet.
 * @param {string} color - Hex color code.
 * @param {string} label - Optional single character label.
 * @returns {L.DivIcon}
 */
export function createStandardMarker(color = '#3b82f6', label = '') {
    const letter = label ? `<text x="12" y="15.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">${label}</text>` : '';
    return L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z"
                fill="${color}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5.5" fill="white" opacity="0.9"/>
            ${letter}
        </svg>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
    });
}

/**
 * Shows a location on the shared map modal.
 * @param {number} lat 
 * @param {number} lng 
 * @param {string} title 
 * @param {string} popupHtml 
 */
export function showSharedMap(lat, lng, title = 'Lokasi', popupHtml = '') {
    if (!lat || !lng) return showToast('warning', 'Koordinat tidak valid.');

    const mapModalEl = document.getElementById('mapModal');
    if (!mapModalEl) return;

    const modal = new bootstrap.Modal(mapModalEl);
    modal.show();

    // Update title
    const mTitle = mapModalEl.querySelector('.modal-title');
    if (mTitle) mTitle.innerHTML = `<i class="bi bi-geo-alt me-2 text-info"></i>${title}`;

    setTimeout(() => {
        // createViewMap handles cleanup of previous instance via _mkViewMaps registry
        createViewMap('admin-map', [{ lat, lng, popupHtml, color: '#3b82f6' }], { zoom: 16 });
    }, 300);
}

// --- 3. Common UI Elements ---

/**
 * Returns a standardized Bootstrap spinner element.
 * @param {string} text - Text to display next to the spinner.
 * @returns {string} HTML string for the spinner.
 */
export function getSpinner(text = 'Memproses...') {
    return `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            ${text}
        </div>
    `;
}

/**
 * Copy item code to clipboard with visual feedback on the triggering element.
 * Supports modern Clipboard API with a textarea fallback for older browsers.
 * @param {string} text - The text to copy
 * @param {HTMLElement} el - Element that triggered the copy (for feedback)
 * @param {number} duration - ms to show feedback (default 2000)
 */
export function copyItemCode(text, el, duration = 2000) {
    const showFeedback = (success) => {
        const originalHtml = el.innerHTML;
        const originalClass = el.className;
        el.innerHTML = success
            ? '<i class="bi bi-check"></i> Disalin!'
            : '<i class="bi bi-x"></i> Gagal';
        if (success) {
            el.classList.add('btn-success');
            el.classList.remove('btn-outline-secondary');
        } else {
            el.classList.add('btn-danger');
            el.classList.remove('btn-outline-secondary');
        }
        setTimeout(() => {
            el.innerHTML = originalHtml;
            el.className = originalClass;
        }, duration);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showFeedback(true)).catch(() => showFeedback(false));
    } else {
        // Fallback for non-secure contexts / older browsers
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showFeedback(true);
        } catch (_) {
            showFeedback(false);
        }
    }
}
