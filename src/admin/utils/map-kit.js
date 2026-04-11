/**
 * MapKit — Centralized Map Utility
 *
 * Exports:
 *   createLocationPicker(mapDivId, coordFieldId, opts) → { getCoords, setCoords, instance, destroy }
 *   createViewMap(mapDivId, markers, opts)             → { instance, addMarkers, fitAll }
 *   searchAddress(query)                               → [{ lat, lng, label }]
 *   parseCoordsField(str)                              → { lat, lng } | null
 */

const FALLBACK_CENTER = [-7.150970, 112.721245];
const OSM_URL    = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SAT_URL    = 'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}';
const OSM_ATTR   = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SAT_ATTR   = '&copy; Stadia Maps &amp; OpenStreetMap';

// ─────────────────────────────────────────────
// 1. Geocoder (Nominatim, Indonesia-scoped)
// ─────────────────────────────────────────────
export async function searchAddress(query) {
    if (!query || query.length < 3) return [];
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=id&limit=5&addressdetails=0`;
        const resp = await fetch(url, { headers: { 'Accept-Language': 'id' } });
        if (!resp.ok) return [];
        const data = await resp.json();
        return data.map(r => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name }));
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────
// 2. Coords Field Parser
// ─────────────────────────────────────────────
export function parseCoordsField(str) {
    if (!str || typeof str !== 'string') return null;
    const parts = str.split(',');
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
}

// ─────────────────────────────────────────────
// 3. SVG Marker Factory (Modern High-Tech Glow)
// ─────────────────────────────────────────────
export function createMapMarker(color = '#0047AB', label = '') {
    const txt = label
        ? `<text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="900" fill="${color}" font-family="monospace">${label}</text>`
        : '';
    return L.divIcon({
        className: 'mk-glow-marker',
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
            <defs>
                <filter id="mk-glow-${label.replace(/[^a-z0-9]/gi, '')}" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20S24 19.2 24 12C24 5.4 18.6 0 12 0z"
                fill="${color}" stroke="#fff" stroke-width="1.5" style="filter:drop-shadow(0 0 5px ${color}88)"/>
            <circle cx="12" cy="12" r="6" fill="white" opacity="0.95"/>
            ${txt}
        </svg>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
    });
}

// ─────────────────────────────────────────────
// 4. Location Picker
// ─────────────────────────────────────────────
/**
 * Creates a full-featured location picker inside `mapDivId`.
 * Injects a search bar above the map div and GPS + layer controls on the map.
 *
 * @param {string} mapDivId      - ID of the div to initialise as map
 * @param {string} coordFieldId  - ID of the <input> to write "lat, lng" into
 * @param {object} opts
 *   @param {string}   opts.theme    - 'dark' | 'light', default 'dark'
 *   @param {function} opts.onPin    - Callback (lat, lng) when pin is set
 *   @param {number[]} opts.initCoords - [lat, lng] to pre-pin on load
 * @returns {{ getCoords, setCoords, instance, destroy }}
 */
export function createLocationPicker(mapDivId, coordFieldId, opts = {}) {
    const { theme = 'dark', onPin = null, initCoords = null } = opts;

    const mapEl = document.getElementById(mapDivId);
    if (!mapEl) { console.warn(`MapKit: element #${mapDivId} not found`); return null; }

    const coordInput = document.getElementById(coordFieldId);

    const isDark = theme === 'dark';
    const clrBg       = isDark ? '#1e1e1e'  : '#ffffff';
    const clrBorder   = isDark ? '#444'     : '#dee2e6';
    const clrText     = isDark ? '#e0e0e0'  : '#222222';
    const clrSubtext  = isDark ? '#888'     : '#6c757d';
    const clrHover    = isDark ? '#2d2d2d'  : '#f0f4ff';
    const clrInput    = isDark ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border';

    // ── Search bar wrapper (injected above the map) ──
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'mk-search-wrapper';
    searchWrapper.style.cssText = 'position:relative;margin-bottom:6px;';
    searchWrapper.innerHTML = `
        <div style="position:relative;">
            <input type="text" id="${mapDivId}-search" class="form-control ${clrInput}"
                   placeholder="🔍 Cari alamat..." autocomplete="off"
                   style="padding-right:36px;font-size:13px;">
            <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:${clrSubtext};font-size:13px;pointer-events:none;">
                <i class="bi bi-search"></i>
            </span>
        </div>
        <div id="${mapDivId}-results"
             style="position:absolute;z-index:9999;width:100%;
                    background:${clrBg};border:1px solid ${clrBorder};
                    border-radius:6px;max-height:200px;overflow-y:auto;
                    display:none;box-shadow:0 6px 20px rgba(0,0,0,0.18);
                    top:100%;left:0;margin-top:3px;"></div>
    `;
    mapEl.parentNode.insertBefore(searchWrapper, mapEl);

    // ── Tile layers ──
    const osm = L.tileLayer(OSM_URL, { attribution: OSM_ATTR });
    const sat = L.tileLayer(SAT_URL, { minZoom: 0, maxZoom: 20, ext: 'jpg', attribution: SAT_ATTR });

    // ── Map instance ──
    const map = L.map(mapDivId, { zoomControl: false, layers: [osm] });
    L.control.layers({ 'OpenStreetMap': osm, 'Satelit (Stadia)': sat }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Set initial view — GPS first, then fallback
    let currentMarker = null;
    let viewReady = false;

    function applyView(lat, lng, zoom = 13) {
        map.setView([lat, lng], zoom);
        viewReady = true;
    }

    if (initCoords) {
        applyView(initCoords[0], initCoords[1], 16);
    } else if (navigator.geolocation) {
        map.setView(FALLBACK_CENTER, 13); // provisional
        navigator.geolocation.getCurrentPosition(
            pos => { if (!currentMarker) applyView(pos.coords.latitude, pos.coords.longitude, 14); },
            ()  => { if (!viewReady) applyView(...FALLBACK_CENTER); },
            { timeout: 5000 }
        );
    } else {
        applyView(...FALLBACK_CENTER);
    }

    // ── Pin logic ──
    function setPin(lat, lng) {
        if (currentMarker) currentMarker.remove();
        currentMarker = L.marker([lat, lng], { icon: createMapMarker('#0d6efd') }).addTo(map);
        map.setView([lat, lng], Math.max(map.getZoom(), 16));
        if (coordInput) coordInput.value = `${lat.toFixed(7)}, ${lng.toFixed(7)}`;
        if (typeof onPin === 'function') onPin(lat, lng);
    }

    // Pre-pin from initCoords
    if (initCoords) setPin(initCoords[0], initCoords[1]);

    // Click map to pin
    map.on('click', e => setPin(e.latlng.lat, e.latlng.lng));

    // Manual coord field → move pin
    if (coordInput) {
        coordInput.addEventListener('input', () => {
            const c = parseCoordsField(coordInput.value);
            if (c) {
                if (currentMarker) currentMarker.remove();
                currentMarker = L.marker([c.lat, c.lng], { icon: createMapMarker('#0d6efd') }).addTo(map);
                map.panTo([c.lat, c.lng]);
            }
        });
    }

    // ── GPS button (Leaflet control, bottom left) ──
    const gpsCtrl = L.control({ position: 'bottomleft' });
    gpsCtrl.onAdd = () => {
        const btn = L.DomUtil.create('button', '');
        btn.title = 'Deteksi lokasi saya';
        btn.style.cssText = `
            background:${clrBg};color:${clrText};
            border:1px solid ${clrBorder};padding:6px 12px;
            border-radius:6px;font-size:12px;font-weight:500;
            cursor:pointer;display:flex;align-items:center;gap:6px;
            box-shadow:0 2px 8px rgba(0,0,0,0.15);
            white-space:nowrap;
        `;
        btn.innerHTML = '<i class="bi bi-geo-alt-fill" style="color:#0d6efd;font-size:13px;"></i> Lokasi Saya';

        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', () => {
            if (!navigator.geolocation) return;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" style="width:13px;height:13px;margin-right:6px;border-width:2px;"></span> Mencari...';
            btn.disabled = true;
            navigator.geolocation.getCurrentPosition(
                pos => {
                    setPin(pos.coords.latitude, pos.coords.longitude);
                    btn.innerHTML = '<i class="bi bi-geo-alt-fill" style="color:#0d6efd;font-size:13px;"></i> Lokasi Saya';
                    btn.disabled = false;
                },
                () => {
                    btn.innerHTML = '<i class="bi bi-geo-alt-fill" style="color:#0d6efd;font-size:13px;"></i> Lokasi Saya';
                    btn.disabled = false;
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
        return btn;
    };
    gpsCtrl.addTo(map);

    // ── Address search autocomplete ──
    const searchInput   = document.getElementById(`${mapDivId}-search`);
    const searchResults = document.getElementById(`${mapDivId}-results`);
    let debounceTimer  = null;

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const q = searchInput.value.trim();
            if (q.length < 3) { searchResults.style.display = 'none'; return; }

            debounceTimer = setTimeout(async () => {
                searchResults.style.display = 'block';
                searchResults.innerHTML = `<div style="padding:8px 12px;color:${clrSubtext};font-size:12px;">
                    <span class="spinner-border spinner-border-sm me-2" style="width:11px;height:11px;border-width:2px;"></span>Mencari...
                </div>`;

                const results = await searchAddress(q);
                if (!results.length) {
                    searchResults.innerHTML = `<div style="padding:8px 12px;color:${clrSubtext};font-size:12px;">Tidak ditemukan.</div>`;
                    return;
                }

                searchResults.innerHTML = results.map((r, i) => `
                    <div class="mk-result-item" data-idx="${i}"
                         style="padding:9px 12px;cursor:pointer;font-size:12px;color:${clrText};
                                border-bottom:1px solid ${clrBorder};line-height:1.4;
                                transition:background 0.15s;">
                        <i class="bi bi-geo-alt me-2 text-primary" style="font-size:11px;"></i>${r.label}
                    </div>
                `).join('');

                searchResults.querySelectorAll('.mk-result-item').forEach(item => {
                    const idx = parseInt(item.dataset.idx, 10);
                    item.addEventListener('mouseenter', () => item.style.background = clrHover);
                    item.addEventListener('mouseleave', () => item.style.background = '');
                    item.addEventListener('click', () => {
                        setPin(results[idx].lat, results[idx].lng);
                        searchInput.value = results[idx].label;
                        searchResults.style.display = 'none';
                    });
                });
            }, 400);
        });

        // Close dropdown on outside click
        document.addEventListener('click', e => {
            if (!searchWrapper.contains(e.target)) searchResults.style.display = 'none';
        });
    }

    // ── Invalidate size after render (modal / hidden container fix) ──
    setTimeout(() => map.invalidateSize(), 300);

    // ── Public API ──
    return {
        getCoords() { return coordInput ? parseCoordsField(coordInput.value) : null; },
        setCoords(lat, lng) { setPin(lat, lng); },
        instance: map,
        destroy() { map.remove(); searchWrapper.remove(); },
    };
}

// ─────────────────────────────────────────────
// 5. View Map (read-only)
// ─────────────────────────────────────────────
/**
 * Creates a read-only Leaflet view map with layer switcher.
 *
 * @param {string}   mapDivId  - ID of the div to init as map
 * @param {object[]} markers   - [{ lat, lng, color?, label?, popupHtml? }]
 * @param {object}   opts
 *   @param {number} opts.zoom       - Initial zoom level (default 13)
 *   @param {number[]} opts.center   - [lat, lng] initial center; defaults to first marker
 * @returns {{ instance, addMarkers, fitAll }}
 */
export function createViewMap(mapDivId, markers = [], opts = {}) {
    const { zoom = 13, center = null } = opts;

    // Destroy previous instance if reusing the same div
    if (window._mkViewMaps && window._mkViewMaps[mapDivId]) {
        try { window._mkViewMaps[mapDivId].remove(); } catch {}
    }

    const osm = L.tileLayer(OSM_URL, { attribution: OSM_ATTR });
    const sat = L.tileLayer(SAT_URL, { minZoom: 0, maxZoom: 20, ext: 'jpg', attribution: SAT_ATTR });

    const startCenter = center
        || (markers[0] ? [markers[0].lat, markers[0].lng] : FALLBACK_CENTER);

    const map = L.map(mapDivId, { zoomControl: false, layers: [osm] }).setView(startCenter, zoom);
    L.control.layers({ 'OpenStreetMap': osm, 'Satelit (Stadia)': sat }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    if (!window._mkViewMaps) window._mkViewMaps = {};
    window._mkViewMaps[mapDivId] = map;

    const group = L.featureGroup();

    function addMarkers(list) {
        list.forEach(m => {
            if (!m.lat || !m.lng) return;
            const icon = createMapMarker(m.color || '#3b82f6', m.label || '');
            const mk   = L.marker([m.lat, m.lng], { icon });
            if (m.popupHtml) mk.bindPopup(m.popupHtml, { maxWidth: 300 });
            group.addLayer(mk);
        });
        if (!map.hasLayer(group)) group.addTo(map);
    }

    function fitAll() {
        const b = group.getBounds();
        if (b.isValid()) map.fitBounds(b.pad(0.15));
    }

    if (markers.length) {
        addMarkers(markers);
        if (markers.length > 1) fitAll();
    }

    setTimeout(() => map.invalidateSize(), 300);

    return { instance: map, addMarkers, fitAll };
}

// ─────────────────────────────────────────────
// 6. Full-page Map Search Bar Helper
//    (Adds a search bar to an existing Leaflet instance)
// ─────────────────────────────────────────────
/**
 * Attaches a search bar above an existing map element that flies the
 * existing map instance to the result.
 *
 * @param {string} mapDivId   - ID of the existing map container element
 * @param {object} mapInstance - Leaflet map instance
 * @param {object} opts
 *   @param {string} opts.theme - 'dark' | 'light'
 *   @param {function} opts.onResult - Callback ({ lat, lng, label }) after selection
 */
export function attachSearchBar(mapDivId, mapInstance, opts = {}) {
    const { theme = 'dark', onResult = null } = opts;

    const mapEl = document.getElementById(mapDivId);
    if (!mapEl) return;

    // Don't attach twice
    if (document.getElementById(`${mapDivId}-globalsearch`)) return;

    const isDark     = theme === 'dark';
    const clrBg      = isDark ? '#1e1e1e' : '#ffffff';
    const clrBorder  = isDark ? '#444'    : '#dee2e6';
    const clrText    = isDark ? '#e0e0e0' : '#222222';
    const clrSubtext = isDark ? '#888'    : '#6c757d';
    const clrHover   = isDark ? '#2d2d2d' : '#f0f4ff';
    const clrInput   = isDark ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border';

    // Inject a Leaflet control with the search input
    const SearchCtrl = L.control({ position: 'topleft' });
    SearchCtrl.onAdd = () => {
        const wrapper = L.DomUtil.create('div', '');
        wrapper.id = `${mapDivId}-globalsearch`;
        wrapper.style.cssText = 'width:280px;position:relative;';
        wrapper.innerHTML = `
            <div style="position:relative;">
                <input type="text" id="${mapDivId}-gsearch-input" class="${clrInput}"
                       placeholder="🔍 Cari alamat..." autocomplete="off"
                       style="width:100%;padding:7px 36px 7px 10px;font-size:13px;
                              border-radius:6px;border:1px solid ${clrBorder};
                              background:${clrBg};color:${clrText};outline:none;
                              box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);
                             color:${clrSubtext};font-size:12px;pointer-events:none;">
                    <i class="bi bi-search"></i>
                </span>
            </div>
            <div id="${mapDivId}-gsearch-results"
                 style="position:absolute;z-index:9999;width:100%;
                        background:${clrBg};border:1px solid ${clrBorder};
                        border-radius:6px;max-height:220px;overflow-y:auto;
                        display:none;box-shadow:0 6px 20px rgba(0,0,0,0.25);
                        top:100%;left:0;margin-top:3px;"></div>
        `;
        L.DomEvent.disableClickPropagation(wrapper);
        L.DomEvent.disableScrollPropagation(wrapper);
        return wrapper;
    };
    SearchCtrl.addTo(mapInstance);

    // Wire up after DOM is ready
    setTimeout(() => {
        const input   = document.getElementById(`${mapDivId}-gsearch-input`);
        const results = document.getElementById(`${mapDivId}-gsearch-results`);
        if (!input || !results) return;

        let timer = null;
        input.addEventListener('input', () => {
            clearTimeout(timer);
            const q = input.value.trim();
            if (q.length < 3) { results.style.display = 'none'; return; }

            timer = setTimeout(async () => {
                results.style.display = 'block';
                results.innerHTML = `<div style="padding:8px 12px;color:${clrSubtext};font-size:12px;">
                    <span class="spinner-border spinner-border-sm me-2" style="width:11px;height:11px;border-width:2px;"></span>Mencari...
                </div>`;

                const hits = await searchAddress(q);
                if (!hits.length) {
                    results.innerHTML = `<div style="padding:8px 12px;color:${clrSubtext};font-size:12px;">Tidak ditemukan.</div>`;
                    return;
                }

                results.innerHTML = hits.map((r, i) => `
                    <div class="mk-gs-item" data-idx="${i}"
                         style="padding:9px 12px;cursor:pointer;font-size:12px;color:${clrText};
                                border-bottom:1px solid ${clrBorder};line-height:1.4;">
                        <i class="bi bi-geo-alt me-2 text-primary" style="font-size:11px;"></i>${r.label}
                    </div>
                `).join('');

                results.querySelectorAll('.mk-gs-item').forEach(item => {
                    const idx = parseInt(item.dataset.idx, 10);
                    item.addEventListener('mouseenter', () => item.style.background = clrHover);
                    item.addEventListener('mouseleave', () => item.style.background = '');
                    item.addEventListener('click', () => {
                        mapInstance.setView([hits[idx].lat, hits[idx].lng], 16);
                        input.value = hits[idx].label;
                        results.style.display = 'none';
                        if (typeof onResult === 'function') onResult(hits[idx]);
                    });
                });
            }, 400);
        });

        document.addEventListener('click', e => {
            if (!wrapper?.contains(e.target)) results.style.display = 'none';
        });
    }, 200);
}
