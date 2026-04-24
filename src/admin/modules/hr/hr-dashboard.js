import { supabase } from '../../../api/supabase.js';
import { ActivityLog } from '../../utils/activity-log.js';

/**
 * HR Dashboard Module - Premium Dummy View
 */
export async function initHRDashboard() {
    console.log('HR Dashboard Initialized');

    const container = document.getElementById('hr-dashboard-content');
    if (!container) return;

    container.innerHTML = `
        <div class="row g-4 mb-4 mt-1">
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary shadow-sm overflow-hidden">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center mb-2">
                            <div class="avatar-sm bg-primary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center text-primary me-3" style="width: 40px; height: 40px;">
                                <i class="bi bi-people fs-5"></i>
                            </div>
                            <span class="text-white-50 small fw-bold">TOTAL STAFF</span>
                        </div>
                        <h3 class="m-0 text-white fw-bold" id="hr-total-staff">24</h3>
                        <div class="text-success small mt-1"><i class="bi bi-arrow-up me-1"></i>+2 bulan ini</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary shadow-sm overflow-hidden">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center mb-2">
                            <div class="avatar-sm bg-info bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center text-info me-3" style="width: 40px; height: 40px;">
                                <i class="bi bi-person-check fs-5"></i>
                            </div>
                            <span class="text-white-50 small fw-bold">HADIR HARI INI</span>
                        </div>
                        <h3 class="m-0 text-white fw-bold">21</h3>
                        <div class="text-white-50 small mt-1">87.5% Presence Rate</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary shadow-sm overflow-hidden">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center mb-2">
                            <div class="avatar-sm bg-warning bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center text-warning me-3" style="width: 40px; height: 40px;">
                                <i class="bi bi-clock-history fs-5"></i>
                            </div>
                            <span class="text-white-50 small fw-bold">LEMBUR (JAM)</span>
                        </div>
                        <h3 class="m-0 text-white fw-bold">14.5</h3>
                        <div class="text-white-50 small mt-1">Minggu ini</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-vscode border-secondary shadow-sm overflow-hidden">
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center mb-2">
                            <div class="avatar-sm bg-danger bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center text-danger me-3" style="width: 40px; height: 40px;">
                                <i class="bi bi-person-x fs-5"></i>
                            </div>
                            <span class="text-white-50 small fw-bold">IZIN / SAKIT</span>
                        </div>
                        <h3 class="m-0 text-white fw-bold">3</h3>
                        <div class="text-danger small mt-1">Hari ini</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-8">
                <div class="card bg-vscode border-secondary shadow-sm h-100">
                    <div class="card-header bg-transparent border-secondary py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 text-white">Distribusi Jabatan</h6>
                        <button class="btn btn-xs btn-outline-secondary">Lihat Semua</button>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-dark table-hover align-middle mb-0" style="--bs-table-bg: transparent;">
                                <thead class="text-white-50 small">
                                    <tr>
                                        <th class="ps-4">Jabatan</th>
                                        <th>Jumlah Staff</th>
                                        <th class="text-end pe-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="ps-4">
                                            <div class="d-flex align-items-center">
                                                <div class="bg-primary rounded-circle me-2" style="width: 8px; height: 8px;"></div>
                                                <span>Teknisi Lapangan</span>
                                            </div>
                                        </td>
                                        <td>12 Orang</td>
                                        <td class="text-end pe-4"><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Aktif</span></td>
                                    </tr>
                                    <tr>
                                        <td class="ps-4">
                                            <div class="d-flex align-items-center">
                                                <div class="bg-info rounded-circle me-2" style="width: 8px; height: 8px;"></div>
                                                <span>Customer Service</span>
                                            </div>
                                        </td>
                                        <td>4 Orang</td>
                                        <td class="text-end pe-4"><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Aktif</span></td>
                                    </tr>
                                    <tr>
                                        <td class="ps-4">
                                            <div class="d-flex align-items-center">
                                                <div class="bg-warning rounded-circle me-2" style="width: 8px; height: 8px;"></div>
                                                <span>Admin & Finance</span>
                                            </div>
                                        </td>
                                        <td>3 Orang</td>
                                        <td class="text-end pe-4"><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Aktif</span></td>
                                    </tr>
                                    <tr>
                                        <td class="ps-4">
                                            <div class="d-flex align-items-center">
                                                <div class="bg-purple rounded-circle me-2" style="width: 8px; height: 8px; background-color: #6f42c1;"></div>
                                                <span>IT Support</span>
                                            </div>
                                        </td>
                                        <td>2 Orang</td>
                                        <td class="text-end pe-4"><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Aktif</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card bg-vscode border-secondary shadow-sm h-100">
                    <div class="card-header bg-transparent border-secondary py-3">
                        <h6 class="m-0 text-white">Aktivitas HR Terbaru</h6>
                    </div>
                    <div class="card-body" id="hr-activity-log-container">
                        <div class="text-center text-muted py-3 small">Memuat aktivitas...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Fetch Real Data
    try {
        const [staffRes, jobRes, topRes] = await Promise.all([
            supabase.from('employees').select('*', { count: 'exact', head: true }),
            supabase.from('employees').select('position'),
            supabase.from('technician_performance_stats').select('*').order('total_points', { ascending: false }).limit(5)
        ]);

        if (staffRes.count !== null) document.getElementById('hr-total-staff').innerText = staffRes.count;

        // Render Distribution Table
        if (jobRes.data) {
            const counts = {};
            jobRes.data.forEach(e => {
                counts[e.position] = (counts[e.position] || 0) + 1;
            });
            const tbody = container.querySelector('table tbody');
            if (tbody) {
                tbody.innerHTML = Object.entries(counts).map(([pos, count]) => {
                    let color = '#0d6efd'; // Default
                    if (pos.toLowerCase().includes('teknisi')) color = '#0d6efd';
                    if (pos.toLowerCase().includes('service')) color = '#0dcaf0';
                    if (pos.toLowerCase().includes('admin')) color = '#ffc107';
                    if (pos.toLowerCase().includes('it')) color = '#6f42c1';

                    return `
                        <tr>
                            <td class="ps-4">
                                <div class="d-flex align-items-center">     
                                    <div class="rounded-circle me-2" style="width: 8px; height: 8px; background-color: ${color}"></div>
                                    <span>${pos}</span>
                                </div>
                            </td>
                            <td>${count} Orang</td>
                            <td class="text-end pe-4"><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Aktif</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Render Activity Log (Mock Data for Timeline)
        const logContainer = document.getElementById('hr-activity-log-container');
        if (logContainer) {
            const hrLogs = [
                { created_at: new Date(Date.now() - 7200000).toISOString(), status: 'New Staff', title: 'Karyawan Baru Bergabung', notes: 'Ahmad Junaidi - Teknisi', color: '#007bff' },
                { created_at: new Date(Date.now() - 18000000).toISOString(), status: 'Approval', title: 'Pengajuan Izin Disetujui', notes: 'Siti Aminah - Admin', color: '#ffc107' },
                { created_at: new Date(Date.now() - 86400000).toISOString(), status: 'Payroll', title: 'Update Gaji Periode April', notes: 'Proses perhitungan selesai', color: '#28a745' },
                { created_at: '2026-04-12T07:00:00Z', status: 'Training', title: 'Training Rutin Selesai', notes: 'Modul Troubleshooting FO', color: '#17a2b8' }
            ];
            
            let finalHtml = '';
            
            // Re-render Top Performers first if data exists
            if (topRes.data && topRes.data.length > 0) {
                finalHtml += `
                    <div class="mb-4">
                        <h6 class="text-white-50 small fw-bold mb-3">TOP PERFORMERS</h6>
                        ${topRes.data.map((tech, index) => `
                            <div class="d-flex align-items-center mb-3">
                                <div class="me-3 position-relative">
                                    <div class="avatar-xs bg-vscode-header border border-secondary rounded-circle d-flex align-items-center justify-content-center text-white small" style="width: 32px; height: 32px;">
                                        ${tech.name.charAt(0)}
                                    </div>
                                    ${index === 0 ? '<div class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning px-1" style="font-size: 0.5rem;"><i class="bi bi-star-fill"></i></div>' : ''}
                                </div>
                                <div class="flex-grow-1 min-width-0">
                                    <div class="text-white small text-truncate fw-bold">${tech.name}</div>
                                    <div class="text-white-50 x-small">LVL ${tech.level} • ${tech.total_points} Pts</div>
                                </div>
                                <div class="ms-2">
                                    <div class="progress" style="height: 3px; width: 40px; background: rgba(255,255,255,0.05);">
                                        <div class="progress-bar bg-primary" style="width: ${tech.xp_percentage}%"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <hr class="border-secondary opacity-20 my-4">
                    <h6 class="text-white-50 small fw-bold mb-3">AKTIVITAS TERBARU</h6>
                `;
            }
            
            finalHtml += ActivityLog.renderTimeline(hrLogs);
            logContainer.innerHTML = finalHtml;
        }

    } catch (e) {
        console.error('HR Dashboard Data Fetch Error:', e);
    }
}
