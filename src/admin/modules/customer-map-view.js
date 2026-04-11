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
        <div id="cmap-wrapper" class="glass-container" style="display:flex;height:calc(100vh - 150px);gap:0;border-radius:16px;overflow:hidden;border:1px solid var(--vscode-border);position:relative;background:var(--vscode-bg);">
            
            <!-- Sidebar Drawer Overlay (Mobile) -->
            <div id="cmap-sidebar-overlay" class="d-md-none" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1045;display:none;backdrop-filter:blur(4px);"></div>

            <!-- Mobile Toggle -->
            <button id="cmap-mobile-toggle" class="btn btn-primary d-md-none position-absolute" 
                    style="bottom:80px; right:20px; z-index:1100; border-radius:50%; width:56px; height:56px; box-shadow:var(--glow-accent); border:none; background:var(--vscode-accent-gradient);">
                <i class="bi bi-filter fs-4"></i>
            </button>

            <!-- Sidebar -->
            <div id="cmap-sidebar" class="glass-sidebar" style="width:310px;min-width:310px;background:var(--glass-bg);backdrop-filter:blur(20px);border-right:1px solid var(--vscode-border);display:flex;flex-direction:column;overflow:hidden;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);z-index:1050;">
                <div style="padding:20px;background:rgba(0,0,0,0.2);border-bottom:1px solid var(--vscode-border);">
                    <div class="d-flex align-items-center justify-content-between">
                        <div style="font-weight:700;color:var(--vscode-text-bright);font-size:16px;letter-spacing:-0.5px;">
                            <i class="bi bi-layers-half me-2 text-accent-gradient"></i>Map Explorer
                        </div>
                        <button class="btn btn-link text-white d-md-none p-0" id="cmap-close-sidebar"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div id="cmap-count" style="font-size:11px;color:var(--vscode-accent-teal);margin-top:4px;font-weight:600;">Memuat data...</div>
                </div>

                <div style="flex:1;overflow-y:auto;padding:16px;" class="sidebar-scroll">
                    <!-- SECTION: COSMETIC -->
                    <div class="filter-section mb-4">
                        <label class="filter-header">🎨 Visualisasi</label>
                        <div class="mb-3">
                            <label class="tiny-label">Warna Berdasarkan</label>
                            <select id="cmap-color-mode" class="form-select form-select-sm bg-dark-soft border-0 shadow-sm">
                                <option value="type" selected>Tipe Pekerjaan</option>
                                <option value="status">Status Tiket</option>
                                <option value="packet">Paket Internet</option>
                                <option value="damping">Redaman Signal</option>
                            </select>
                        </div>
                    </div>

                    <!-- SECTION: CORE FILTERS -->
                    <div class="filter-section mb-4">
                        <label class="filter-header">🔍 Filter Utama</label>
                        
                        <div class="mb-3">
                            <label class="tiny-label">Tipe Pekerjaan</label>
                            <select id="cmap-filter-type" class="form-select form-select-sm bg-dark-soft border-0">
                                <option value="">Semua Tipe</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="tiny-label">Status Tiket</label>
                            <select id="cmap-filter-status" class="form-select form-select-sm bg-dark-soft border-0">
                                <option value="">Semua Status</option>
                                <option value="waiting">Menunggu</option>
                                <option value="confirmed">Divalidasi</option>
                                <option value="open">Pengerjaan</option>
                                <option value="closed">Selesai</option>
                                <option value="none">Tanpa Tiket</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="tiny-label">Paket Internet</label>
                            <select id="cmap-filter-packet" class="form-select form-select-sm bg-dark-soft border-0">
                                <option value="">Semua Paket</option>
                            </select>
                        </div>
                        
                        <div class="d-flex gap-2 mb-2">
                             <div class="flex-grow-1">
                                <label class="tiny-label">Lokasi</label>
                                <select id="cmap-filter-coords" class="form-select form-select-sm bg-dark-soft border-0">
                                    <option value="1">Ada Titik</option>
                                    <option value="0">Semua</option>
                                </select>
                             </div>
                             <div class="pt-4">
                                <div class="form-check form-switch p-0 m-0 d-flex align-items-center gap-2">
                                    <input class="form-check-input ms-0 mt-0" type="checkbox" id="cmap-filter-process">
                                    <label class="form-check-label tiny-label mb-0" for="cmap-filter-process">OPEN ONLY</label>
                                </div>
                             </div>
                        </div>
                    </div>

                    <!-- SECTION: TOGGLES -->
                    <div class="filter-section mb-4">
                        <label class="filter-header">📋 Kelola Detail Pop-up</label>
                        <div class="grid-columns-2">
                            ${Object.entries(fieldLabels).map(([key, label]) => `
                                <label class="field-pill cursor-pointer">
                                    <input type="checkbox" class="cmap-field-toggle d-none" data-field="${key}" ${displayFields[key] ? 'checked' : ''}>
                                    <span>${label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="p-3 border-top border-secondary border-opacity-10 bg-black-20">
                    <button id="cmap-fit-bounds-btn" class="btn btn-accent-gradient btn-sm w-100 mb-2 py-2 fw-bold">
                        <i class="bi bi-bounding-box me-2"></i>FOKUS AREA
                    </button>
                    <div class="text-white-50 text-center" style="font-size: 9px; opacity: 0.7;">Mode: Desktop Optimized v2.0</div>
                </div>
            </div>

            <!-- Map Area -->
            <div style="flex:1;position:relative;">
                <div id="customer-map-full" style="height:100%;width:100%;z-index: 1;"></div>
                <div id="cmap-stats-panel" class="glass-stats-panel"></div>
            </div>
        </div>

        <style>
            .glass-sidebar::-webkit-scrollbar { width: 4px; }
            .glass-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            
            .filter-header { font-size: 11px; font-weight: 800; color: var(--vscode-accent-teal); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: block; opacity: 0.8; }
            .tiny-label { font-size: 10px; color: var(--vscode-text); display: block; margin-bottom: 4px; text-transform: uppercase; font-weight: 600; }
            
            .bg-dark-soft { background: rgba(15, 23, 42, 0.4) !important; color: #fff !important; }
            .bg-black-20 { background: rgba(0,0,0,0.2); }
            
            .grid-columns-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
            
            .field-pill { display: flex; align-items: center; justify-content: center; padding: 6px 4px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); font-size: 9px; color: var(--vscode-text); transition: all 0.2s; text-align: center; line-height: 1.1; }
            .field-pill:has(input:checked) { background: rgba(0, 128, 128, 0.2); border-color: var(--vscode-accent-teal); color: #fff; }
            .field-pill:hover { background: rgba(255,255,255,0.08); }

            .btn-accent-gradient { background: var(--vscode-accent-gradient); border: none; color: #fff; box-shadow: var(--glow-accent); }
            .btn-accent-gradient:hover { filter: brightness(1.1); box-shadow: 0 0 20px rgba(0, 71, 171, 0.6); color: #fff; }

            .glass-stats-panel { position:absolute;top:60px;left:10px;z-index:1000;background:rgba(15, 23, 42, 0.85);backdrop-filter:blur(12px);padding:8px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);pointer-events:none;box-shadow:var(--glass-shadow); min-width:140px; }

            @media (max-width: 768px) {
                #cmap-wrapper { height: calc(100vh - 160px) !important; margin: -10px !important; border-radius: 0 !important; border: none !important; }
                #cmap-sidebar { position: fixed; left: 0; top: 0; bottom: 0; height: 100vh; transform: translateX(-100%); width: 300px !important; min-width: 300px !important; z-index: 1050; box-shadow: 20px 0 50px rgba(0,0,0,0.5); }
                #cmap-sidebar.show { transform: translateX(0); }
                .glass-stats-panel { top: 70px; left: 10px; padding: 6px 10px; }
            }
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

    // Mobile Toggle Events
    const sidebar = document.getElementById('cmap-sidebar');
    const overlay = document.getElementById('cmap-sidebar-overlay');
    const toggleSidebar = (show) => {
        sidebar.classList.toggle('show', show);
        overlay.style.display = show ? 'block' : 'none';
        if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 300);
    };

    document.getElementById('cmap-mobile-toggle').onclick = () => toggleSidebar(true);
    document.getElementById('cmap-close-sidebar').onclick = () => toggleSidebar(false);
    overlay.onclick = () => toggleSidebar(false);


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

            // CRITICAL: Robust resize handling for Leaflet (fixes small square bug)
            const resizeObserver = new ResizeObserver(() => {
                mapInstance.invalidateSize();
            });
            resizeObserver.observe(document.getElementById('cmap-wrapper'));
            
            // Initial poke
            setTimeout(() => mapInstance.invalidateSize(), 500);
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
            setTimeout(() => {
                if (mapInstance && markersLayer.getBounds().isValid()) {
                    mapInstance.fitBounds(markersLayer.getBounds().pad(0.1));
                }
            }, 600);
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
                    <defs>
                        <filter id="glow-${label}" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5" style="filter:drop-shadow(0 0 4px ${color}88)"/>
                    <circle cx="12" cy="12" r="6" fill="#fff" opacity="0.9"/>
                    <text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="900" fill="${color}" font-family="monospace">${label}</text>
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
            div.style.cssText = 'background:rgba(15, 23, 42, 0.9);backdrop-filter:blur(8px);box-shadow:var(--glass-shadow);padding:12px;border-radius:12px;font-size:11px;border:1px solid rgba(255,255,255,0.1);color:#fff;margin-bottom:20px;min-width:140px;';
            
            let html = `<div style="font-weight:700;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;color:var(--vscode-accent-teal);text-transform:uppercase;letter-spacing:0.5px;">Legenda</div>`;

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
            <div style="font-weight:700; color:#fff; display:flex; align-items:center; gap:8px;">
                <span class="pulse-dot"></span>
                <span>${data.length} Nodes Aktif</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:4px;">
                <div style="font-size:10px; color:var(--vscode-accent-teal);">LAT: ${data[0]?.lat?.toFixed(4) || '-'}</div>
                <div style="font-size:10px; color:var(--vscode-accent-teal);">LNG: ${data[0]?.lng?.toFixed(4) || '-'}</div>
            </div>
            <style>
                .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
            </style>
        `;
    }
}
