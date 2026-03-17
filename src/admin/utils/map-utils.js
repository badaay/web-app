/**
 * Generates a Google Maps URL from latitude and longitude.
 * @param {number} lat - Latitude.
 * @param {number} lng - Longitude.
 * @param {string} text - The text to display for the link.
 * @returns {string} An HTML anchor tag for the Google Maps link.
 */
export function createGoogleMapsLink(lat, lng, text = 'View on Map') {
    if (!lat || !lng) {
        return '';
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    return `<a href="${url}" target="_blank" class="badge bg-success bg-opacity-10 text-success text-decoration-none ms-1"><i class="bi bi-geo-alt-fill"></i> ${text}</a>`;
}
