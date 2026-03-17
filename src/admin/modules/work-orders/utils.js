// Utility functions for work-orders module

/**
 * Map status to color for badges
 */
export function getStatusColor(status) {
    const colors = {
        'waiting': '#FFA500',      // Orange
        'confirmed': '#3B82F6',    // Blue
        'open': '#10B981',         // Green
        'closed': '#6B7280'        // Gray
    };
    return colors[status] || '#6B7280';
}

/**
 * Format display text for status
 */
export function getStatusDisplayText(status) {
    const labels = {
        'waiting': '⏳ Menunggu',
        'confirmed': '✓ Divalidasi',
        'open': '▶ Pengerjaan',
        'closed': '✓✓ Selesai'
    };
    return labels[status] || status;
}

