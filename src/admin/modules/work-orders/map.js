// Map features for work orders
import { getStatusColor, getStatusDisplayText } from './utils.js';
import { createViewMap } from '../../utils/map-kit.js';

/**
 * Show all work orders on map (respects current filter)
 */
export function showAllPSBMap(filteredOrders, currentFilter) {
    const modal = new bootstrap.Modal(document.getElementById('mapModal'));
    modal.show();

    setTimeout(() => {
        const valid = filteredOrders.filter(w => w.customers?.lat && w.customers?.lng);

        if (valid.length === 0) {
            alert('Tidak ada data PSB dengan koordinat yang valid untuk filter ini.');
            return;
        }

        // Update modal title
        const mTitle = document.querySelector('#mapModal .modal-title');
        if (mTitle) {
            const filterLabel = currentFilter === 'All' ? 'Semua Status' : currentFilter;
            mTitle.innerHTML = `<i class="bi bi-map me-2"></i>Peta PSB — <span class="badge" style="background:${getStatusColor(currentFilter) || 'var(--vscode-accent)'}">${filterLabel}</span> (${valid.length} titik)`;
        }

        const markers = valid.map(wo => ({
            lat: wo.customers.lat,
            lng: wo.customers.lng,
            color: getStatusColor(wo.status),
            popupHtml: buildPopup(wo),
        }));

        createViewMap('admin-map', markers, {
            center: [valid[0].customers.lat, valid[0].customers.lng],
            zoom: 12,
        });
    }, 300);
}

/**
 * Expose map function to window for onclick
 */
export function exposeMapGlobal(filteredOrders, currentFilter) {
    window.showAllPSBMap = () => showAllPSBMap(filteredOrders, currentFilter);
}

/**
 * Build popup HTML for a work order marker
 */
function buildPopup(wo) {
    const color   = getStatusColor(wo.status);
    const mapsUrl = `https://www.google.com/maps?q=${wo.customers?.lat},${wo.customers?.lng}`;
    return `
        <div style="min-width:200px;font-family:sans-serif;">
            <div style="background:${color};color:#fff;padding:6px 10px;margin:-7px -7px 8px;border-radius:4px 4px 0 0;font-weight:600;">
                <i class="bi bi-person"></i> ${wo.customers?.name || '-'}
            </div>
            <table style="width:100%;font-size:12px;border-collapse:collapse;">
                <tr><td style="color:#666;padding:2px 4px;">Status</td><td><span style="background:${color};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">${getStatusDisplayText(wo.status)}</span></td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Daftar</td><td>${wo.registration_date || '-'}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">No HP</td><td>${wo.customers?.phone || '-'}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Alamat</td><td>${wo.customers?.address || '-'}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Petugas</td><td>${wo.employees?.name || '-'}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Ket</td><td>${wo.ket || '-'}</td></tr>
                <tr><td style="color:#666;padding:2px 4px;">Bayar</td><td>${wo.payment_status || '-'}</td></tr>
            </table>
            <div style="margin-top:8px;">
                <a href="${mapsUrl}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                    <i class="bi bi-map"></i> Buka Google Maps
                </a>
            </div>
        </div>
    `;
}
