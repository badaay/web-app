import { supabase } from '../../api/supabase.js';

export async function initWorkOrders() {
    const listContainer = document.getElementById('work-orders-list');
    const addBtn = document.getElementById('add-work-order-btn');

    // State for filtering
    let allWorkOrders = [];
    let currentFilter = 'All';

    if (addBtn) addBtn.onclick = () => showWorkOrderModal();

    async function loadWorkOrders() {
        if (!listContainer) return;
        listContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-white-50">Memuat Antrian...</div></div>';

        const { data, error } = await supabase
            .from('work_orders')
            .select('*, customers(*), employees(name)')
            .order('created_at', { ascending: false });

        if (error) {
            listContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            return;
        }

        allWorkOrders = data;
        renderWorkOrders();
        renderStatusSummary();
    }

    function renderStatusSummary() {
        const summaryContainer = document.getElementById('wo-status-summary');
        if (!summaryContainer) return;

        const counts = allWorkOrders.reduce((acc, wo) => {
            acc[wo.status] = (acc[wo.status] || 0) + 1;
            return acc;
        }, {});

        const statuses = ['Antrian', 'Pending', 'Konfirmasi', 'ODP Penuh', 'Cancel', 'Completed'];
        summaryContainer.innerHTML = statuses.map(s => `
            <div class="badge ${getStatusBadgeClass(s)} me-2 p-2" style="cursor: pointer;" onclick="window.filterWorkOrders('${s}')">
                ${s}: ${counts[s] || 0}
            </div>
        `).join('');

        // Make filter accessible globally for convenience
        window.filterWorkOrders = (status) => {
            currentFilter = status === currentFilter ? 'All' : status;
            renderWorkOrders();
        };
    }

    function renderWorkOrders() {
        const filtered = currentFilter === 'All' ? allWorkOrders : allWorkOrders.filter(w => w.status === currentFilter);

        listContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Registrasi</th>
                            <th>Status / Ket</th>
                            <th>Pelanggan</th>
                            <th>Petugas / Poin</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(wo => `
                            <tr>
                                <td>
                                    <div class="fw-bold text-accent">${wo.registration_date || '-'}</div>
                                    <div class="small text-white-50">Daftar: ${new Date(wo.created_at).toLocaleDateString()}</div>
                                </td>
                                <td>
                                    <div class="mb-1"><span class="badge ${getStatusBadgeClass(wo.status)}">${wo.status}</span></div>
                                    <div class="small text-white-50">${wo.ket || wo.title}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${wo.customers?.name || '-'}</div>
                                    <div class="small text-white-50">${wo.customers?.phone || '-'}</div>
                                    <div class="small fst-italic text-white-50">${wo.customers?.address || '-'}</div>
                                </td>
                                <td>
                                    <div class="fw-bold">${wo.employees?.name || '-'}</div>
                                    <div class="small"><i class="bi bi-star-fill text-warning me-1"></i>${wo.points || 0} Poin</div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary edit-wo" data-id="${wo.id}"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-outline-info view-wo-map" data-id="${wo.id}" title="Lihat Peta"><i class="bi bi-geo-alt"></i></button>
                                        <button class="btn btn-outline-light copy-wo-format" data-id="${wo.id}" title="Salin Format"><i class="bi bi-clipboard"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.querySelectorAll('.edit-wo').forEach(btn => {
            btn.onclick = () => showWorkOrderModal(allWorkOrders.find(w => w.id === btn.dataset.id));
        });

        document.querySelectorAll('.view-wo-map').forEach(btn => {
            btn.onclick = () => showSingleMap(allWorkOrders.find(w => w.id === btn.dataset.id));
        });

        document.querySelectorAll('.copy-wo-format').forEach(btn => {
            btn.onclick = () => {
                const wo = allWorkOrders.find(w => w.id === btn.dataset.id);
                const mapLink = wo.customers?.lat ? `https://www.google.com/maps?q=${wo.customers.lat},${wo.customers.lng}` : '(Peta belum set)';
                const format = `${wo.customers?.name || '-'}, ${wo.customers?.address || '-'}, ${wo.customers?.phone || '-'}, ${mapLink}, (${wo.points || 0} poin)`;
                navigator.clipboard.writeText(format);
                alert('Format PSB berhasil disalin!');
            };
        });
    }

    function getStatusBadgeClass(status) {
        switch (status) {
            case 'Antrian': return 'bg-success';
            case 'Pending': return 'bg-warning text-dark';
            case 'Completed':
            case 'Selesai': return 'bg-secondary';
            case 'Konfirmasi': return 'bg-primary';
            case 'ODP Penuh': return 'bg-brown'; // Custom CSS for brown
            case 'Cancel': return 'bg-dark border border-secondary';
            default: return 'bg-info text-dark';
        }
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Antrian': return '#28a745'; // Green
            case 'Pending': return '#fd7e14'; // Orange
            case 'Konfirmasi': return '#007bff'; // Blue
            case 'ODP Penuh': return '#795548'; // Brown
            case 'Cancel': return '#000000'; // Black
            case 'Selesai':
            case 'Completed': return null; // Hidden
            default: return '#6c757d';
        }
    }

    async function showWorkOrderModal(wo = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        const { data: customers } = await supabase.from('customers').select('*').order('name');
        const { data: employees } = await supabase.from('employees').select('id, name').order('name');

        modalTitle.innerText = wo ? 'Edit Antrian PSB' : 'Tambah Antrian PSB Baru';
        modalBody.innerHTML = `
            <form id="work-order-form" class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Tanggal Daftar (Wajib)</label>
                    <input type="date" class="form-control" id="wo-reg-date" value="${wo?.registration_date || new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Status Antrian</label>
                    <select class="form-select" id="wo-status">
                        <option value="Antrian" ${wo?.status === 'Antrian' ? 'selected' : ''}>Antrian</option>
                        <option value="Pending" ${wo?.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Konfirmasi" ${wo?.status === 'Konfirmasi' ? 'selected' : ''}>Konfirmasi</option>
                        <option value="ODP Penuh" ${wo?.status === 'ODP Penuh' ? 'selected' : ''}>ODP Penuh</option>
                        <option value="Cancel" ${wo?.status === 'Cancel' ? 'selected' : ''}>Cancel</option>
                        <option value="Completed" ${wo?.status === 'Completed' || wo?.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                    </select>
                </div>
                <div class="col-md-12 mb-3">
                    <label class="form-label small text-white-50">Pelanggan (Wajib)</label>
                    <select class="form-select" id="wo-customer-id" required>
                        <option value="">Pilih Pelanggan...</option>
                        ${customers?.map(c => `<option value="${c.id}" ${wo?.customer_id === c.id ? 'selected' : ''}>${c.name} - ${c.phone || ''}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Teknisi / Petugas</label>
                    <select class="form-select" id="wo-employee-id">
                        <option value="">Pilih Petugas...</option>
                        ${employees?.map(e => `<option value="${e.id}" ${wo?.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Pembayaran</label>
                    <input type="text" class="form-control" id="wo-payment" value="${wo?.payment_status || ''}" placeholder="Contoh: Tunai, Transfer">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Nama Referal</label>
                    <input type="text" class="form-control" id="wo-referral" value="${wo?.referral_name || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label small text-white-50">Ket Singkat</label>
                    <input type="text" class="form-control" id="wo-ket" value="${wo?.ket || ''}" placeholder="Data OK, Data Tidak Lengkap">
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">Keterangan / Detail (Notes)</label>
                    <textarea class="form-control" id="wo-description" rows="2">${wo?.description || ''}</textarea>
                </div>
                <div class="col-12 mb-3">
                    <label class="form-label small text-white-50">URL Foto Rumah</label>
                    <input type="text" class="form-control" id="wo-photo" value="${wo?.photo_url || ''}" placeholder="https://...">
                </div>
            </form>
        `;

        saveBtn.onclick = async () => {
            const formData = {
                registration_date: document.getElementById('wo-reg-date').value,
                customer_id: document.getElementById('wo-customer-id').value,
                employee_id: document.getElementById('wo-employee-id').value || null,
                status: document.getElementById('wo-status').value,
                title: 'Pemasangan Baru (PSB)',
                payment_status: document.getElementById('wo-payment').value,
                referral_name: document.getElementById('wo-referral').value,
                ket: document.getElementById('wo-ket').value,
                description: document.getElementById('wo-description').value,
                photo_url: document.getElementById('wo-photo').value,
                updated_at: new Date().toISOString()
            };

            if (!formData.registration_date || !formData.customer_id) {
                return alert('Tanggal Daftar dan Pelanggan wajib diisi.');
            }

            let result;
            if (wo) {
                result = await supabase.from('work_orders').update(formData).eq('id', wo.id);
            } else {
                result = await supabase.from('work_orders').insert([formData]);
            }

            if (result.error) {
                alert('Gagal menyimpan: ' + result.error.message);
            } else {
                modal.hide();
                loadWorkOrders();
            }
        };

        modal.show();
    }

    let map;
    function showSingleMap(wo) {
        if (!wo.customers?.lat || !wo.customers?.lng) return alert('Koordinat tidak disetel untuk pelanggan ini.');

        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        setTimeout(() => {
            if (map) map.remove();
            map = L.map('admin-map').setView([wo.customers.lat, wo.customers.lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            const color = getStatusColor(wo.status);
            if (color) {
                L.circleMarker([wo.customers.lat, wo.customers.lng], {
                    radius: 8,
                    fillColor: color,
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map).bindPopup(`<b>${wo.customers.name}</b><br>${wo.status}<br>${wo.customers.address}`).openPopup();
            }
        }, 300);
    }

    // Add CSS for brown badge
    if (!document.getElementById('psb-styles')) {
        const style = document.createElement('style');
        style.id = 'psb-styles';
        style.innerHTML = '.bg-brown { background-color: #795548; color: #fff; }';
        document.head.appendChild(style);
    }

    loadWorkOrders();

    // Global map view for PSB Queue
    window.showAllPSBMap = () => {
        const modal = new bootstrap.Modal(document.getElementById('mapModal'));
        modal.show();

        setTimeout(() => {
            if (map) map.remove();

            const valid = allWorkOrders.filter(w => w.customers?.lat && w.customers?.lng && getStatusColor(w.status));
            if (valid.length === 0) return alert('Tidak ada data PSB dengan koordinat yang valid untuk ditampilkan di peta.');

            map = L.map('admin-map').setView([valid[0].customers.lat, valid[0].customers.lng], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            const markers = [];
            valid.forEach(wo => {
                const color = getStatusColor(wo.status);
                const marker = L.circleMarker([wo.customers.lat, wo.customers.lng], {
                    radius: 7,
                    fillColor: color,
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1
                }).addTo(map).bindPopup(`<b>${wo.customers.name}</b><br>Status: ${wo.status}<br>Addr: ${wo.customers.address}`);
                markers.push(marker);
            });

            if (markers.length > 1) {
                const group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }, 300);
    };
}
