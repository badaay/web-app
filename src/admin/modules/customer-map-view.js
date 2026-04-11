import { supabase } from '../../api/supabase.js';
import { attachSearchBar } from '../utils/map-kit.js';

/**
 * Customer Map View — Refined with OSM/Satellite Layers & Dynamic Legends
 */

export async function initCustomerMapView() {
    const container = document.getElementById('customer-map-view-container');
    if (!container) return;

    if (container.dataset.initialized === 'true') {
        if (window._cmapReloadData) window._cmapReloadData();
        return;
    }
    container.dataset.initialized = 'true';

    // ---- CONSTANTS & CONFIG (Moved to top to prevent ReferenceError) ----
    const STATUS_COLORS = {
        'waiting': '#FFA500',      // Menunggu
        'confirmed': '#3B82F6',    // Divalidasi
        'open': '#10B981',         // Pengerjaan
        'closed': '#6B7280',       // Selesai
        'Tidak Ada Antrian': '#475569'
    };

    const STATUS_LETTER = {
        'waiting': 'W',
        'confirmed': 'C',
        'open': 'O',
        'closed': '✓',
        'Tidak Ada Antrian': '-'
    };

    const fieldLabels = {
        customer_code: 'Kode Pelanggan',
        packet: 'Paket Internet',
        phone: 'No. HP',
        address: 'Alamat',
        install_date: 'Tanggal Pasang',
        username: 'Username PPPoE',
        mac_address: 'MAC Address',
        damping: 'Redaman (dBm)',
        ktp: 'NIK / KTP',
        wo_status: 'Status Tiket',
    };

    // ---- STATE ----
    let customersData = [];
    let queueTypesData = [];
    let filteredData = [];
    let mapInstance = null;
    let markersLayer = null;
    let legendCtrl = null;
    let displayFields = {
        customer_code: true,
        packet: true,
        phone: true,
        address: true,
        damping: true,
        wo_status: true,
    };

    const packetColorMap = {};
    const palette = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#ef4444', '#eab308'];
    let paletteIdx = 0;

    function getPacketColor(packet) {
        if (!packet) return '#6b7280';
        if (!packetColorMap[packet]) {
            packetColorMap[packet] = palette[paletteIdx % palette.length];
            paletteIdx++;
        }
        return packetColorMap[packet];
    }

    // =====================  UI RENDER  =====================
    container.innerHTML = `
        <div id="cmap-wrapper" style="display:flex;height:calc(100vh - 130px);gap:0;border-radius:12px;overflow:hidden;border:1px solid var(--vscode-border);">
            <!-- Sidebar -->
            <div id="cmap-sidebar" style="width:290px;min-width:290px;background:var(--vscode-sidebar-bg);border-right:1px solid var(--vscode-border);display:flex;flex-direction:column;overflow:hidden;">
                <div style="padding:14px 16px;background:var(--vscode-header-bg);border-bottom:1px solid var(--vscode-border);">
                    <div style="font-weight:700;color:#fff;font-size:14px;"><i class="bi bi-geo-alt-fill me-2 text-accent"></i>Visualisasi Lokasi</div>
                    <div id="cmap-count" style="font-size:11px;color:var(--vscode-text);margin-top:2px;">Memuat data...</div>
                </div>

                <div style="flex:1;overflow-y:auto;padding:12px 14px;">
                    <!-- Color Mode -->
                    <div class="mb-3">
                        <label class="small text-white-50 text-uppercase mb-2 d-block">🎨 Warna Marker</label>
                        <select id="cmap-color-mode" class="form-select form-select-sm bg-dark text-white border-secondary shadow-sm">
                            <option value="type" selected>Tipe Pekerjaan (PSB, Repair, etc)</option>
                            <option value="status">Status Pengerjaan (Waiting, Open, etc)</option>
                            <option value="packet">Paket Internet</option>
                            <option value="damping">Redaman Signal</option>
                        </select>
                    </div>

                    <hr class="border-secondary opacity-25">

                    <!-- Filters -->
                    <div class="mb-3">
                        <label class="small text-white-50 text-uppercase mb-2 d-block">🔍 Filter Data</label>
                        
                        <div class="mb-2">
                            <label class="tiny-label">Status Cepat</label>
                            <div class="form-check form-switch small">
                                <input class="form-check-input" type="checkbox" id="cmap-filter-process">
                                <label class="form-check-label text-white-50" for="cmap-filter-process">Sedang Diproses (Open)</label>
                            </div>
                        </div>

                        <div class="mb-2">
                            <label class="tiny-label">Tipe Pekerjaan</label>
                            <select id="cmap-filter-type" class="form-select form-select-sm bg-dark text-white border-secondary">
                                <option value="">Semua Tipe</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label class="tiny-label">Status Tiket</label>
                            <select id="cmap-filter-status" class="form-select form-select-sm bg-dark text-white border-secondary">
                                <option value="">Semua Status</option>
                                <option value="waiting">Menunggu</option>
                                <option value="confirmed">Divalidasi</option>
                                <option value="open">Pengerjaan</option>
                                <option value="closed">Selesai</option>
                                <option value="none">Tanpa Tiket</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label class="tiny-label">Paket Internet</label>
                            <select id="cmap-filter-packet" class="form-select form-select-sm bg-dark text-white border-secondary">
                                <option value="">Semua Paket</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label class="tiny-label">Koordinat</label>
                            <select id="cmap-filter-coords" class="form-select form-select-sm bg-dark text-white border-secondary">
                                <option value="1">Hanya dengan Lokasi</option>
                                <option value="0">Tampilkan Semua</option>
                            </select>
                        </div>
                    </div>

                    <hr class="border-secondary opacity-25">

                    <!-- Column Toggles -->
                    <div class="mb-3">
                        <label class="small text-white-50 text-uppercase mb-2 d-block">📋 Detail Popup</label>
                        ${Object.entries(fieldLabels).map(([key, label]) => `
                            <label class="d-flex align-items-center gap-2 mb-1 cursor-pointer small">
                                <input type="checkbox" class="cmap-field-toggle" data-field="${key}" ${displayFields[key] ? 'checked' : ''}>
                                <span class="text-white-50">${label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="p-3 border-top border-secondary border-opacity-25">
                    <button id="cmap-fit-bounds-btn" class="btn btn-outline-info btn-sm w-100 mb-2">
                        <i class="bi bi-bounding-box me-1"></i>Fit ke Area
                    </button>
                    <div class="text-white-50 text-center" style="font-size: 9px; opacity: 0.5;">Gunakan layer control di kanan atas peta.</div>
                </div>
            </div>

            <!-- Map Area -->
            <div style="flex:1;position:relative;">
                <div id="customer-map-full" style="height:100%;width:100%;z-index: 1;"></div>
                <div id="cmap-stats-panel" style="position:absolute;top:10px;left:10px;z-index:1000;background:rgba(15,15,15,0.8);backdrop-filter:blur(4px);padding:8px 12px;border-radius:8px;border:1px solid #333;pointer-events:none;"></div>
            </div>
        </div>

        <style>
            .tiny-label { font-size: 10px; color: #888; display: block; margin-bottom: 2px; text-transform: uppercase; }
            .leaflet-control-layers { background: #1e1e1e !important; color: #fff !important; border: 1px solid #444 !important; }
            .leaflet-control-layers-overlays label { color: #fff !important; }
        </style>
    `;

    // =====================  EVENTS  =====================
    const filterSelectors = ['cmap-color-mode', 'cmap-filter-type', 'cmap-filter-status', 'cmap-filter-packet', 'cmap-filter-coords', 'cmap-filter-process'];
    filterSelectors.forEach(id => {
        document.getElementById(id)?.addEventListener('change', applyFiltersAndRender);
    });

    document.getElementById('cmap-fit-bounds-btn').onclick = () => {
        if (markersLayer && mapInstance) {
            const b = markersLayer.getBounds();
            if (b.isValid()) mapInstance.fitBounds(b.pad(0.1));
        }
    };

    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('cmap-field-toggle')) applyFiltersAndRender();
    });

    // =====================  DATA LOADING  =====================
    await loadData();

    async function loadData() {
        const countEl = document.getElementById('cmap-count');
        if (countEl) countEl.textContent = 'Sinkronisasi data...';

        try {
            const { data: qTypes } = await supabase.from('master_queue_types').select('*');
            queueTypesData = qTypes || [];

            const { data: custs } = await supabase.from('customers').select('*').order('name');
            
            const { data: wos } = await supabase
                .from('work_orders')
                .select('id, customer_id, status, type_id, created_at')
                .order('created_at', { ascending: false });

            const latestWO = {};
            (wos || []).forEach(wo => {
                if (!latestWO[wo.customer_id]) {
                    const typeInfo = queueTypesData.find(t => t.id === wo.type_id);
                    latestWO[wo.customer_id] = { ...wo, typeInfo };
                }
            });

            customersData = custs.map(c => ({
                ...c,
                wo: latestWO[c.id] || null,
                wo_status: latestWO[c.id]?.status || 'Tidak Ada Antrian',
                type_name: latestWO[c.id]?.typeInfo?.name || 'N/A',
                type_color: latestWO[c.id]?.typeInfo?.color || '#6b7280',
                type_icon: latestWO[c.id]?.typeInfo?.icon || 'bi-geo-alt'
            }));

            const typeSel = document.getElementById('cmap-filter-type');
            if (typeSel) {
                typeSel.innerHTML = '<option value="">Semua Tipe</option>' + 
                    queueTypesData.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
            }

            const packets = [...new Set(custs.map(c => c.packet).filter(Boolean))].sort();
            const packetSel = document.getElementById('cmap-filter-packet');
            if (packetSel) {
                packetSel.innerHTML = '<option value="">Semua Paket</option>' + 
                    packets.map(p => `<option value="${p}">${p}</option>`).join('');
            }

            window._cmapReloadData = loadData;
            applyFiltersAndRender();
        } catch (err) {
            console.error('Map Load Error:', err);
        }
    }

    // =====================  FILTER & RENDER  =====================
    function applyFiltersAndRender() {
        const mode = document.getElementById('cmap-color-mode')?.value || 'type';
        const fType = document.getElementById('cmap-filter-type')?.value || '';
        const fStatus = document.getElementById('cmap-filter-status')?.value || '';
        const fPacket = document.getElementById('cmap-filter-packet')?.value || '';
        const fProcess = document.getElementById('cmap-filter-process')?.checked || false;
        const coordsOnly = document.getElementById('cmap-filter-coords')?.value === '1';

        document.querySelectorAll('.cmap-field-toggle').forEach(cb => {
            displayFields[cb.dataset.field] = cb.checked;
        });

        filteredData = customersData.filter(c => {
            if (coordsOnly && (!c.lat || !c.lng)) return false;
            if (fProcess && c.wo_status !== 'open') return false;
            if (fType && c.type_name !== fType) return false;
            if (fStatus) {
                if (fStatus === 'none' && c.wo) return false;
                if (fStatus !== 'none' && c.wo_status !== fStatus) return false;
            }
            if (fPacket && c.packet !== fPacket) return false;
            return true;
        });

        const countEl = document.getElementById('cmap-count');
        if (countEl) countEl.textContent = `${filteredData.length} pelanggan ditemukan`;

        initOrUpdateMap(mode);
    }

    // =====================  MAP LOGIC  =====================
    function initOrUpdateMap(mode) {
        if (!mapInstance) {
            // Define Tile Layers
            const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            });
            const Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
                minZoom: 0, maxZoom: 20, ext: 'jpg',
                attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; Stadia Maps & OpenMapTiles & OpenStreetMap'
            });

            mapInstance = L.map('customer-map-full', { 
                zoomControl: false,
                layers: [osm] // Default
            }).setView([-6.2, 106.8], 11);

            const baseMaps = {
                "OpenStreetMap": osm,
                "Satellite (Stadia)": Stadia_AlidadeSatellite
            };
            L.control.layers(baseMaps).addTo(mapInstance);
            L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

            // Attach address search bar (top-left, dark theme, flies map on result)
            attachSearchBar('customer-map-full', mapInstance, { theme: 'dark' });
        }

        if (markersLayer) mapInstance.removeLayer(markersLayer);
        markersLayer = L.featureGroup();

        const withCoords = filteredData.filter(c => c.lat && c.lng);
        withCoords.forEach(cust => {
            const color = getMarkerColor(cust, mode);
            const label = getMarkerLabel(cust, mode);
            markersLayer.addLayer(L.marker([cust.lat, cust.lng], {
                icon: createSvgMarker(color, label)
            }).bindPopup(buildPopup(cust, mode), { maxWidth: 320 }));
        });

        markersLayer.addTo(mapInstance);
        if (withCoords.length > 0 && mapInstance.getZoom() < 5) {
            mapInstance.fitBounds(markersLayer.getBounds().pad(0.1));
        }

        updateStatsPanel(withCoords);
        updateLegend(mode, withCoords);
    }

    function getMarkerColor(cust, mode) {
        switch (mode) {
            case 'type': return cust.type_color || '#6b7280';
            case 'status': return STATUS_COLORS[cust.wo_status] || '#6b7280';
            case 'packet': return getPacketColor(cust.packet);
            case 'damping': return parseFloat(cust.damping || 0) >= -28 ? '#22c55e' : '#ef4444';
            default: return '#3b82f6';
        }
    }

    function getMarkerLabel(cust, mode) {
        if (mode === 'status') return STATUS_LETTER[cust.wo_status] || '';
        if (mode === 'type') return cust.type_name.charAt(0);
        return '';
    }

    function createSvgMarker(color, label) {
        return L.divIcon({
            className: '',
            html: `
                <svg width="28" height="36" viewBox="0 0 24 32">
                    <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
                    <circle cx="12" cy="12" r="6" fill="#fff" opacity="0.9"/>
                    <text x="12" y="15" text-anchor="middle" font-size="9" font-weight="900" fill="${color}" font-family="monospace">${label}</text>
                </svg>`,
            iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -36]
        });
    }

    // =====================  UI HELPERS  =====================
    function updateLegend(mode, data) {
        if (legendCtrl) legendCtrl.remove();
        legendCtrl = L.control({ position: 'bottomleft' });

        legendCtrl.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend-container');
            div.style.cssText = 'background:rgba(255,255,255,0.95);box-shadow:0 0 15px rgba(0,0,0,0.1);padding:10px 14px;border-radius:8px;font-size:11px;border:1px solid #ccc;color:#333;margin-bottom:15px;';
            
            let html = `<div style="font-weight:700;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px;">Keterangan Warna</div>`;

            if (mode === 'type') {
                html += queueTypesData.map(t => `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                        <span style="width:10px;height:10px;border-radius:50%;background:${t.color};display:inline-block;border:1px solid #555;"></span>
                        <span>${t.name}</span>
                    </div>`).join('');
            } else if (mode === 'status') {
                html += Object.entries(STATUS_COLORS).map(([k, v]) => `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                        <span style="width:10px;height:10px;border-radius:50%;background:${v};display:inline-block;border:1px solid #555;"></span>
                        <span>${k === 'Tidak Ada Antrian' ? 'Tanpa Tiket' : k}</span>
                    </div>`).join('');
            } else if (mode === 'damping') {
                html += `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;border:1px solid #555;"></span><span>Normal (≥-28dBm)</span></div>
                    <div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:1px solid #555;"></span><span>Buruk (<-28dBm)</span></div>
                `;
            } else if (mode === 'packet') {
               const packets = [...new Set(data.map(c => c.packet).filter(Boolean))];
               html += packets.map(p => `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                        <span style="width:10px;height:10px;border-radius:50%;background:${getPacketColor(p)};border:1px solid #555;"></span>
                        <span>${p}</span>
                    </div>`).join('');
            }
            
            div.innerHTML = html;
            return div;
        };

        legendCtrl.addTo(mapInstance);
    }

    function buildPopup(cust, mode) {
        const headerColor = getMarkerColor(cust, mode);
        const rows = [];
        Object.entries(fieldLabels).forEach(([key, label]) => {
            if (!displayFields[key]) return;
            let val = cust[key] || '-';
            if (key === 'wo_status') {
                const color = STATUS_COLORS[cust.wo_status] || '#6b7280';
                val = `<span class="badge" style="background:${color}">${cust.wo_status}</span>`;
            }
            rows.push(`<tr><td style="color:#666;font-size:11px;padding:2px 0;">${label}</td><td style="color:#000;font-size:11px;padding:2px 0;text-align:right;">${val}</td></tr>`);
        });

        return `
            <div style="min-width:220px;font-family:sans-serif;">
                <div style="background:${headerColor};color:#fff;padding:8px 12px;margin:-8px -8px 8px;border-radius:4px 4px 0 0;">
                    <strong style="display:block;">${cust.name}</strong>
                    <span style="font-size:10px;opacity:0.8;">${cust.customer_code || ''}</span>
                </div>
                <table style="width:100%;border-collapse:collapse;">${rows.join('')}</table>
                <hr style="border:none;border-top:1px solid #eee;margin:8px 0;">
                <a href="https://www.google.com/maps?q=${cust.lat},${cust.lng}" target="_blank" style="color:#0d6efd;font-size:11px;text-decoration:none;font-weight:600;">
                    <i class="bi bi-box-arrow-up-right me-1"></i> Buka di Google Maps
                </a>
            </div>
        `;
    }

    function updateStatsPanel(data) {
        const panel = document.getElementById('cmap-stats-panel');
        if (!panel) return;
        panel.innerHTML = `
            <div class="small fw-bold text-white mb-1"><i class="bi bi-broadcast me-2 text-accent"></i>${data.length} Data Terkunci</div>
            <div class="d-flex gap-3 small text-white-50" style="font-size: 10px;">
                <span>LAT: ${data[0]?.lat?.toFixed(4) || '-'}</span>
                <span>LNG: ${data[0]?.lng?.toFixed(4) || '-'}</span>
            </div>
        `;
    }
}
