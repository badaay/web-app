// Utility functions for work-orders module

/**
 * Map status to color for badges
 */
export function getStatusColor(status) {
    const colors = {
        'waiting': '#FFA500',      // Orange
        'confirmed': '#3B82F6',    // Blue
        'open': '#10B981',         // Green
        'completed': '#F59E0B',    // Amber

        'closed': '#6B7280'        // Gray
    };
    return colors[status] || '#6B7280';
}

/**
 * Format display text for status
 */
export function getStatusDisplayText(status) {
    const labels = {
        'waiting': 'Menunggu',
        'confirmed': 'Divalidasi',
        'open': 'Pengerjaan',
        'completed': 'Selesai (Review)',
        'closed': 'Final'

    };
    return labels[status] || status;
}

/**
 * Copy item code to clipboard with visual feedback on the triggering element.
 * Supports modern Clipboard API with a textarea fallback for older browsers.
 * @param {string} text - The text to copy
 * @param {HTMLElement} el - Element that triggered the copy (for feedback)
 * @param {number} duration - ms to show feedback (default 2000)
 */
// export function copyItemCode moved to ui-common.js
