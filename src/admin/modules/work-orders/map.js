// Map features for work orders
import { getStatusColor, getStatusDisplayText } from './utils.js';

/**
 * Show all work orders on map (respects current filter)
 */
export function showAllPSBMap(filteredOrders, currentFilter) {
    const modal = new bootstrap.Modal(document.getElementById('mapModal'));
    modal.show();

    setTimeout(() => {
        if (window.adminModalMap) {
            window.adminModalMap.remove();
            window.adminModalMap = null;
        }

        const valid = filteredOrders.filter(w => w.customers?.lat && w.customers?.lng);

        if (valid.length === 0) {
            alert('Tidak ada data PSB dengan koordinat yang valid untuk filter ini.');
            return;
        }

        const map = L.map('admin-map').setView([valid[0].customers.lat, valid[0].customers.lng], 12);
        window.adminModalMap = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // Legend
        addMapLegend(map);

        // Update modal title
        const mTitle = document.querySelector('#mapModal .modal-title');
        if (mTitle) {
            const filterLabel = currentFilter === 'All' ? 'Semua Status' : currentFilter;
            mTitle.innerHTML = `<i class="bi bi-map me-2"></i>Peta PSB — <span class="badge" style="background:${getStatusColor(currentFilter) || 'var(--vscode-accent)'}">${filterLabel}</span> (${valid.length} titik)`;
        }

        const markers = [];
        valid.forEach(wo => {
            const color = getStatusColor(wo.status);
            const marker = L.marker([wo.customers.lat, wo.customers.lng], {
                icon: L.divIcon({
                    className: '',
                    html: createMarkerIcon(color),
                    iconSize: [28, 36],
                    iconAnchor: [14, 36],
                    popupAnchor: [0, -36]
                })
            }).addTo(map).bindPopup(buildPopup(wo));
            markers.push(marker);
        });

        if (markers.length > 1) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.15));
        }
    }, 300);
}

/**
 * Expose map function to window for onclick
 */
export function exposeMapGlobal(filteredOrders, currentFilter) {
    window.showAllPSBMap = () => showAllPSBMap(filteredOrders, currentFilter);
}

/**
 * Create SVG marker icon
 */
function createMarkerIcon(color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`;
}

/**
 * Build popup HTML for marker
 */
function buildPopup(wo) {
    const color = getStatusColor(wo.status);
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

/**
 * Add legend to map
 */
function addMapLegend(mapInstance) {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'map-legend');
        const statuses = ['waiting', 'confirmed', 'open', 'closed'];
        div.style.cssText = 'background:rgba(30,30,30,0.9);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;min-width:130px;border:1px solid #444;';
        div.innerHTML = `<div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid #444;padding-bottom:4px;">Legend Status</div>` +
            statuses.map(s => `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="width:12px;height:12px;border-radius:50%;background:${getStatusColor(s)};display:inline-block;flex-shrink:0;border:1px solid #fff;"></span>
                    <span>${getStatusDisplayText(s)}</span>
                </div>`).join('');
        return div;
    };
    legend.addTo(mapInstance);
}
