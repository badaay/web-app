import { supabase } from '../../api/supabase.js';

/**
 * Customer Map View — Full-screen interactive map with:
 * - Customizable displayed data columns
 * - Filter by packet / damping / antrian status
 * - Marker color by: Paket | Redaman | Status Antrian PSB | Single
 */

export async function initCustomerMapView() {
    const container = document.getElementById('customer-map-view-container');
    if (!container) return;

    if (container.dataset.initialized === 'true') {
        if (window._cmapReloadData) window._cmapReloadData();
        return;
    }
    container.dataset.initialized = 'true';

    let customersData = [];   // raw customers + joined wo_status
    let filteredData = [];
    let mapInstance = null;
    let markersLayer = null;
    let legendCtrl = null;

    // ---- Status Antrian PSB config (same as work-orders.js) ----
    const STATUS_COLORS = {
        'Antrian': '#22c55e',
        'Pending': '#f97316',
        'Konfirmasi': '#3b82f6',
        'ODP Penuh': '#a16207',
        'Cancel': '#374151',
        'Completed': '#6b7280',
        'Selesai': '#6b7280',
        'Tidak Ada Antrian': '#6b7280',
    };

    // ---- Display field config ----
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
        wo_status: 'Status Antrian PSB',
    };
    let displayFields = {
        customer_code: true,
        packet: true,
        phone: true,
        address: true,
        install_date: false,
        username: false,
        mac_address: false,
        damping: true,
        ktp: false,
        wo_status: true,
    };

    // ---- Packet → color palette ----
    const packetColorMap = {};
    const palette = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e'];
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

            <!-- ===== Sidebar ===== -->
            <div id="cmap-sidebar" style="width:290px;min-width:290px;background:var(--vscode-sidebar-bg);border-right:1px solid var(--vscode-border);display:flex;flex-direction:column;overflow:hidden;">

                <!-- Header -->
                <div style="padding:14px 16px;background:var(--vscode-header-bg);border-bottom:1px solid var(--vscode-border);">
                    <div style="font-weight:700;color:#fff;font-size:14px;"><i class="bi bi-sliders me-2 text-accent"></i>Kustomisasi MAP</div>
                    <div id="cmap-count" style="font-size:11px;color:var(--vscode-text);margin-top:2px;">Memuat data...</div>
                </div>

                <div style="flex:1;overflow-y:auto;padding:12px 14px;">

                    <!-- ── Warna Marker (TOP PRIORITY) ── -->
                    <div style="margin-bottom:14px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">🎨 Warna Marker</div>
                        <select id="cmap-color-mode" class="form-select form-select-sm">
                            <option value="antrian" selected>Status Antrian PSB</option>
                            <option value="packet">Paket Internet</option>
                            <option value="damping">Redaman Signal</option>
                            <option value="single">Satu Warna (Biru)</option>
                        </select>
                        <!-- Live legend mini -->
                        <div id="cmap-mini-legend" style="margin-top:10px;font-size:11px;"></div>
                    </div>

                    <hr style="border-color:var(--vscode-border);margin:10px 0;">

                    <!-- ── Filter ── -->
                    <div style="margin-bottom:14px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">🔍 Filter</div>

                        <div class="mb-2">
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Status Antrian PSB</label>
                            <select id="cmap-filter-antrian" class="form-select form-select-sm">
                                <option value="">Semua Status</option>
                                <option value="Antrian">Antrian</option>
                                <option value="Pending">Pending</option>
                                <option value="Konfirmasi">Konfirmasi</option>
                                <option value="ODP Penuh">ODP Penuh</option>
                                <option value="Cancel">Cancel</option>
                                <option value="Completed">Completed</option>
                                <option value="Tidak Ada Antrian">Tidak Ada Antrian</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Paket Internet</label>
                            <select id="cmap-filter-packet" class="form-select form-select-sm">
                                <option value="">Semua Paket</option>
                            </select>
                        </div>

                        <div class="mb-2">
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Redaman Signal</label>
                            <select id="cmap-filter-damping" class="form-select form-select-sm">
                                <option value="all">Semua</option>
                                <option value="good">Normal (≥ -28 dBm)</option>
                                <option value="bad">Buruk (< -28 dBm)</option>
                            </select>
                        </div>

                        <div>
                            <label style="font-size:12px;color:var(--vscode-text);display:block;margin-bottom:3px;">Lokasi</label>
                            <select id="cmap-filter-coords" class="form-select form-select-sm">
                                <option value="1">Ada koordinat saja</option>
                                <option value="0">Semua pelanggan</option>
                            </select>
                        </div>
                    </div>

                    <hr style="border-color:var(--vscode-border);margin:10px 0;">

                    <!-- ── Tampilkan di Popup ── -->
                    <div style="margin-bottom:14px;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">📋 Kolom Popup</div>
                        ${Object.entries(fieldLabels).map(([key, label]) => `
                            <label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer;font-size:12px;color:var(--vscode-text);">
                                <input type="checkbox" class="cmap-field-toggle" data-field="${key}" ${displayFields[key] ? 'checked' : ''} style="cursor:pointer;">
                                ${key === 'wo_status' ? `<span style="color:#f97316;">${label}</span>` : label}
                            </label>
                        `).join('')}
                    </div>

                </div>

                <!-- Footer Buttons -->
                <div style="padding:12px 14px;border-top:1px solid var(--vscode-border);display:flex;flex-direction:column;gap:8px;">
                    <button id="cmap-fit-bounds-btn" class="btn btn-outline-info btn-sm w-100">
                        <i class="bi bi-bounding-box me-1"></i>Fit ke Semua Marker
                    </button>
                    <button id="cmap-apply-btn" class="btn btn-primary btn-sm w-100 d-none">
                        Terapkan
                    </button>
                </div>
            </div>

            <!-- ===== Map ===== -->
            <div style="flex:1;position:relative;">
                <div id="customer-map-full" style="height:100%;width:100%;"></div>
                <div id="cmap-stats-panel" style="position:absolute;top:10px;left:10px;z-index:999;background:rgba(15,15,15,0.88);backdrop-filter:blur(4px);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;border:1px solid #333;pointer-events:none;"></div>
            </div>
        </div>
    `;

    // =====================  EVENTS  =====================
    document.getElementById('cmap-apply-btn').onclick = () => applyFiltersAndRender();
    document.getElementById('cmap-fit-bounds-btn').onclick = () => {
        if (markersLayer && mapInstance) {
            const b = markersLayer.getBounds();
            if (b.isValid()) mapInstance.fitBounds(b.pad(0.12));
        }
    };

    // Auto-apply filters on any change
    ['cmap-color-mode', 'cmap-filter-antrian', 'cmap-filter-packet', 'cmap-filter-damping', 'cmap-filter-coords'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', applyFiltersAndRender);
    });

    document.getElementById('cmap-wrapper').addEventListener('change', (e) => {
        if (e.target.classList.contains('cmap-field-toggle')) {
            applyFiltersAndRender();
        }
    });

    // Live legend update when color mode changes
    document.getElementById('cmap-color-mode').addEventListener('change', () => {
        renderMiniLegend();
    });

    // =====================  DATA  =====================
    await loadData();

    async function loadData() {
        const countEl = document.getElementById('cmap-count');
        if (countEl) countEl.textContent = 'Memuat data...';

        // Load customers
        const { data: custs, error: custErr } = await supabase
            .from('customers')
            .select('id, name, customer_code, packet, phone, address, install_date, username, mac_address, damping, ktp, lat, lng')
            .order('name');

        if (custErr) {
            container.innerHTML = `<div class="alert alert-danger">Gagal memuat pelanggan: ${custErr.message}</div>`;
            return;
        }

        // Load latest work_order status per customer (most recent by created_at)
        const { data: wos, error: woErr } = await supabase
            .from('work_orders')
            .select('customer_id, status, registration_date, created_at')
            .order('created_at', { ascending: false });

        if (woErr) console.warn('Gagal memuat antrian:', woErr.message);

        // Build a map: customer_id → latest work_order
        const latestWO = {};
        (wos || []).forEach(wo => {
            if (!latestWO[wo.customer_id]) {
                latestWO[wo.customer_id] = wo;
            }
        });

        // Merge into customers
        customersData = custs.map(c => ({
            ...c,
            wo_status: latestWO[c.id]?.status || 'Tidak Ada Antrian',
            wo_reg_date: latestWO[c.id]?.registration_date || null,
        }));

        // Populate packet dropdown
        const packets = [...new Set(custs.map(c => c.packet).filter(Boolean))].sort();
        const packetSel = document.getElementById('cmap-filter-packet');
        if (packetSel) {
            // clear existing specific options except first
            while (packetSel.options.length > 1) {
                packetSel.remove(1);
            }
            packets.forEach(p => {
                const o = document.createElement('option');
                o.value = p; o.textContent = p;
                packetSel.appendChild(o);
            });
        }

        // Save latest variables to window so we can trigger this on re-visit
        window._cmapReloadData = loadData;

        renderMiniLegend();
        applyFiltersAndRender();
    }

    // =====================  FILTER + RENDER  =====================
    function applyFiltersAndRender() {
        const filterAntrian = document.getElementById('cmap-filter-antrian')?.value || '';
        const filterPacket = document.getElementById('cmap-filter-packet')?.value || '';
        const filterDamping = document.getElementById('cmap-filter-damping')?.value || 'all';
        const coordsOnly = document.getElementById('cmap-filter-coords')?.value === '1';

        // Sync display fields
        document.querySelectorAll('.cmap-field-toggle').forEach(cb => {
            displayFields[cb.dataset.field] = cb.checked;
        });

        filteredData = customersData.filter(c => {
            if (coordsOnly && (!c.lat || !c.lng)) return false;
            if (filterAntrian) {
                const wos = c.wo_status;
                if (filterAntrian === 'Completed' && (wos === 'Completed' || wos === 'Selesai')) { /* match */ }
                else if (wos !== filterAntrian) return false;
            }
            if (filterPacket && c.packet !== filterPacket) return false;
            if (filterDamping === 'good' && c.damping && parseFloat(c.damping) < -28) return false;
            if (filterDamping === 'bad' && (!c.damping || parseFloat(c.damping) >= -28)) return false;
            return true;
        });

        const countEl = document.getElementById('cmap-count');
        if (countEl) countEl.textContent = `${filteredData.length} pelanggan ditampilkan`;

        initOrUpdateMap();
    }

    // =====================  COLOR LOGIC  =====================
    function getMarkerColor(cust, colorMode) {
        switch (colorMode) {
            case 'antrian': return STATUS_COLORS[cust.wo_status] || '#6b7280';
            case 'packet': return getPacketColor(cust.packet);
            case 'damping':
                if (!cust.damping) return '#6b7280';
                return parseFloat(cust.damping) >= -28 ? '#22c55e' : '#ef4444';
            default: return '#3b82f6';
        }
    }

    // =====================  SVG MARKER  =====================
    function createSvgMarker(color, label = '') {
        const strokeColor = '#fff';
        // Add status letter label inside pin
        const letter = label ? `<text x="12" y="15.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">${label}</text>` : '';
        return L.divIcon({
            className: '',
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z"
                    fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="5.5" fill="white" opacity="0.9"/>
                ${letter}
            </svg>`,
            iconSize: [28, 36],
            iconAnchor: [14, 36],
            popupAnchor: [0, -36],
        });
    }

    // First letter of status, abbreviated
    const STATUS_LETTER = {
        'Antrian': 'A',
        'Pending': 'P',
        'Konfirmasi': 'K',
        'ODP Penuh': 'O',
        'Cancel': 'X',
        'Completed': '✓',
        'Selesai': '✓',
        'Tidak Ada Antrian': '-',
    };

    // =====================  POPUP  =====================
    function buildPopup(cust, colorMode) {
        const headerColor = getMarkerColor(cust, colorMode);
        const mapsUrl = cust.lat ? `https://www.google.com/maps?q=${cust.lat},${cust.lng}` : null;
        const dampColor = cust.damping && parseFloat(cust.damping) < -28 ? '#ef4444' : '#22c55e';
        const statusColor = STATUS_COLORS[cust.wo_status] || '#6b7280';

        const rows = [];

        if (displayFields.wo_status) {
            rows.push(['🚦', 'Status PSB',
                `<span style="background:${statusColor};color:#fff;padding:1px 7px;border-radius:3px;font-size:11px;font-weight:600;">${cust.wo_status}</span>` +
                (cust.wo_reg_date ? `<span style="color:#888;font-size:10px;margin-left:4px;">${cust.wo_reg_date}</span>` : '')
            ]);
        }
        if (displayFields.customer_code && cust.customer_code) rows.push(['🏷️', 'Kode', cust.customer_code]);
        if (displayFields.packet) rows.push(['📦', 'Paket', cust.packet || '-']);
        if (displayFields.phone) rows.push(['📱', 'HP', cust.phone || '-']);
        if (displayFields.address) rows.push(['🏠', 'Alamat', cust.address || '-']);
        if (displayFields.install_date) rows.push(['📅', 'Pasang', cust.install_date ? new Date(cust.install_date).toLocaleDateString('id-ID') : '-']);
        if (displayFields.username) rows.push(['💻', 'User', cust.username || '-']);
        if (displayFields.mac_address) rows.push(['🔌', 'MAC', `<span style="font-family:monospace;font-size:11px;">${cust.mac_address || '-'}</span>`]);
        if (displayFields.damping) rows.push(['📶', 'Redaman', cust.damping ? `<span style="color:${dampColor};font-weight:600;">${cust.damping} dBm</span>` : '-']);
        if (displayFields.ktp) rows.push(['🪪', 'KTP', cust.ktp || '-']);

        return `
            <div style="min-width:210px;font-family:sans-serif;">
                <div style="background:${headerColor};color:#fff;padding:8px 12px;margin:-7px -7px 8px;border-radius:4px 4px 0 0;">
                    <div style="font-weight:700;font-size:13px;">${cust.name}</div>
                    ${displayFields.customer_code ? `<div style="font-size:10px;opacity:0.85;">${cust.customer_code || ''}</div>` : ''}
                </div>
                <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    ${rows.map(([icon, label, val]) => `
                        <tr>
                            <td style="color:#666;padding:2px 2px;white-space:nowrap;">${icon} ${label}</td>
                            <td style="padding:2px 4px;">${val}</td>
                        </tr>`).join('')}
                </table>
                ${mapsUrl ? `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;">
                    <a href="${mapsUrl}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">
                        <i class="bi bi-map"></i> Buka Google Maps
                    </a>
                </div>` : ''}
            </div>
        `;
    }

    // =====================  MAP  =====================
    function initOrUpdateMap() {
        if (!document.getElementById('customer-map-full')) return;
        const colorMode = document.getElementById('cmap-color-mode')?.value || 'antrian';

        if (!mapInstance) {
            mapInstance = L.map('customer-map-full').setView([-6.2, 106.8], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(mapInstance);
        } else {
            setTimeout(() => mapInstance.invalidateSize(), 150);
        }

        if (markersLayer) mapInstance.removeLayer(markersLayer);
        markersLayer = L.featureGroup();

        const withCoords = filteredData.filter(c => c.lat && c.lng);
        withCoords.forEach(cust => {
            const color = getMarkerColor(cust, colorMode);
            const letter = colorMode === 'antrian' ? (STATUS_LETTER[cust.wo_status] || '?') : '';
            const marker = L.marker([cust.lat, cust.lng], {
                icon: createSvgMarker(color, letter)
            }).bindPopup(buildPopup(cust, colorMode), { maxWidth: 300 });
            markersLayer.addLayer(marker);
        });

        markersLayer.addTo(mapInstance);

        if (withCoords.length > 0) {
            const b = markersLayer.getBounds();
            if (b.isValid()) mapInstance.fitBounds(b.pad(0.12));
        }

        updateLegend(colorMode, withCoords);
        updateStats(withCoords, colorMode);
    }

    // =====================  LEGEND  =====================
    function renderMiniLegend() {
        const el = document.getElementById('cmap-mini-legend');
        if (!el) return;
        const mode = document.getElementById('cmap-color-mode')?.value || 'antrian';

        if (mode === 'antrian') {
            el.innerHTML = Object.entries(STATUS_COLORS)
                .filter(([k]) => k !== 'Selesai')  // dedupe
                .map(([status, color]) => `
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="width:11px;height:11px;border-radius:50%;background:${color};display:inline-block;border:1px solid rgba(255,255,255,0.3);flex-shrink:0;"></span>
                        <span style="color:var(--vscode-text);">${status}</span>
                    </div>`).join('');
        } else if (mode === 'damping') {
            el.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="width:11px;height:11px;border-radius:50%;background:#22c55e;display:inline-block;border:1px solid rgba(255,255,255,0.3);"></span><span style="color:var(--vscode-text);">Normal (≥ -28 dBm)</span></div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="width:11px;height:11px;border-radius:50%;background:#ef4444;display:inline-block;border:1px solid rgba(255,255,255,0.3);"></span><span style="color:var(--vscode-text);">Buruk (< -28 dBm)</span></div>
                <div style="display:flex;align-items:center;gap:6px;"><span style="width:11px;height:11px;border-radius:50%;background:#6b7280;display:inline-block;border:1px solid rgba(255,255,255,0.3);"></span><span style="color:var(--vscode-text);">Tidak Diketahui</span></div>`;
        } else {
            el.innerHTML = '';
        }
    }

    function updateLegend(colorMode, data) {
        if (legendCtrl) { legendCtrl.remove(); legendCtrl = null; }
        if (!mapInstance) return;

        legendCtrl = L.control({ position: 'bottomright' });
        legendCtrl.onAdd = () => {
            const div = L.DomUtil.create('div');
            div.style.cssText = 'background:rgba(15,15,15,0.9);backdrop-filter:blur(4px);padding:10px 14px;border-radius:8px;color:#fff;font-size:12px;border:1px solid #333;max-width:190px;';

            if (colorMode === 'antrian') {
                const statuses = Object.entries(STATUS_COLORS).filter(([k]) => k !== 'Selesai');
                // Count per status in visible data
                const counts = {};
                data.forEach(c => { counts[c.wo_status] = (counts[c.wo_status] || 0) + 1; });

                div.innerHTML = `<div style="font-weight:700;margin-bottom:7px;border-bottom:1px solid #444;padding-bottom:5px;font-size:12px;">📊 Status Antrian PSB</div>` +
                    statuses.map(([status, color]) => `
                        <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
                            <span style="width:12px;height:12px;border-radius:50%;background:${color};display:inline-block;border:1px solid rgba(255,255,255,0.4);flex-shrink:0;"></span>
                            <span style="flex:1;">${status}</span>
                            <span style="opacity:0.7;font-size:11px;">${counts[status] || 0}</span>
                        </div>`).join('');

            } else if (colorMode === 'damping') {
                div.innerHTML = `<div style="font-weight:700;margin-bottom:7px;border-bottom:1px solid #444;padding-bottom:5px;">📶 Redaman Signal</div>
                    <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;"><span style="width:12px;height:12px;border-radius:50%;background:#22c55e;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Normal (≥ -28 dBm)</div>
                    <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;"><span style="width:12px;height:12px;border-radius:50%;background:#ef4444;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Buruk (< -28 dBm)</div>
                    <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:50%;background:#6b7280;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Tidak Diketahui</div>`;

            } else if (colorMode === 'packet') {
                const packets = [...new Set(data.map(c => c.packet).filter(Boolean))];
                div.innerHTML = `<div style="font-weight:700;margin-bottom:7px;border-bottom:1px solid #444;padding-bottom:5px;">📦 Paket Internet</div>` +
                    packets.map(p => `
                        <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
                            <span style="width:12px;height:12px;border-radius:50%;background:${getPacketColor(p)};display:inline-block;border:1px solid rgba(255,255,255,0.4);flex-shrink:0;"></span>
                            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p}</span>
                        </div>`).join('') +
                    `<div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:50%;background:#6b7280;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Tidak ada paket</div>`;

            } else {
                div.innerHTML = `<div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:12px;border-radius:50%;background:#3b82f6;display:inline-block;border:1px solid rgba(255,255,255,0.4);"></span>Pelanggan</div>`;
            }

            return div;
        };
        legendCtrl.addTo(mapInstance);
    }

    // =====================  STATS PANEL  =====================
    function updateStats(data, colorMode) {
        const panel = document.getElementById('cmap-stats-panel');
        if (!panel) return;

        if (colorMode === 'antrian') {
            const counts = {};
            data.forEach(c => { counts[c.wo_status] = (counts[c.wo_status] || 0) + 1; });
            const topStats = Object.entries(STATUS_COLORS)
                .filter(([k]) => k !== 'Selesai' && counts[k])
                .map(([s, color]) => `<span style="color:${color};">● ${s}: ${counts[s] || 0}</span>`)
                .join('<span style="color:#555;margin:0 4px;">|</span>');
            panel.innerHTML = `
                <div style="font-weight:600;margin-bottom:5px;color:#fff;font-size:13px;">${data.length} Titik di Peta</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;">${topStats}</div>`;
        } else if (colorMode === 'damping') {
            const bad = data.filter(c => c.damping && parseFloat(c.damping) < -28).length;
            const good = data.filter(c => c.damping && parseFloat(c.damping) >= -28).length;
            const unknown = data.filter(c => !c.damping).length;
            panel.innerHTML = `
                <div style="font-weight:600;margin-bottom:5px;color:#fff;font-size:13px;">${data.length} Titik di Peta</div>
                <div style="display:flex;gap:10px;font-size:11px;">
                    <span style="color:#22c55e;">● ${good} Normal</span>
                    <span style="color:#ef4444;">● ${bad} Buruk</span>
                    <span style="color:#6b7280;">● ${unknown} N/A</span>
                </div>`;
        } else {
            panel.innerHTML = `<div style="font-weight:600;color:#fff;">${data.length} Titik di Peta</div>`;
        }
    }
}
