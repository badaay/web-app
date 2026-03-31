/**
 * Module: Overtime Management
 * Task 4.3: Overtime UI - table, multi-technician modal, auto-calc
 * Ref: pre-planning/05-normalized-overtime.md
 */

import { supabase, apiCall } from '../../api/supabase.js';

export async function initOvertime() {
    const container = document.getElementById('overtime-content');
    if (!container) return;

    // Set page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Lembur Karyawan';

    // TODO: Task 4.3 - Implement overtime module
    //
    // Features:
    // 1. Date range filter
    // 2. Table showing: Date, Description, Type, Start, End, Hours, Amount, Technicians
    // 3. Create modal with multi-select technicians
    // 4. Auto-calculate hours and per-person amount
    // 5. Link to work order (optional)
    //
    // API calls:
    // - GET /api/overtime?date_from=&date_to=
    // - POST /api/overtime (create with technician_ids[])
    // - PATCH /api/overtime/:id (update)
    // - DELETE /api/overtime/:id (delete)

    container.innerHTML = `
        <div class="card bg-dark border-secondary">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Lembur Karyawan</h5>
                <button class="btn btn-primary btn-sm" id="btn-add-overtime">
                    <i class="bi bi-plus-lg"></i> Tambah Lembur
                </button>
            </div>
            <div class="card-body">
                <!-- Filters -->
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label class="form-label">Dari Tanggal</label>
                        <input type="date" class="form-control" id="filter-date-from">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Sampai Tanggal</label>
                        <input type="date" class="form-control" id="filter-date-to">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Tipe</label>
                        <select class="form-select" id="filter-type">
                            <option value="">Semua Tipe</option>
                            <option value="psb">PSB</option>
                            <option value="backbone">Backbone</option>
                            <option value="repair">Perbaikan</option>
                            <option value="cable_pull">Tarik Kabel</option>
                            <option value="other">Lainnya</option>
                        </select>
                    </div>
                    <div class="col-md-3 d-flex align-items-end">
                        <button class="btn btn-outline-light w-100" id="btn-filter">
                            <i class="bi bi-funnel"></i> Filter
                        </button>
                    </div>
                </div>

                <!-- Summary -->
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="card bg-info bg-opacity-25 border-info">
                            <div class="card-body text-center py-2">
                                <div class="h4 mb-0" id="stat-total-hours">0</div>
                                <small>Total Jam Lembur</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card bg-success bg-opacity-25 border-success">
                            <div class="card-body text-center py-2">
                                <div class="h4 mb-0" id="stat-total-amount">Rp 0</div>
                                <small>Total Honor Lembur</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div class="table-responsive">
                    <table class="table table-dark table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Keterangan</th>
                                <th>Tipe</th>
                                <th>Waktu</th>
                                <th>Jam</th>
                                <th>Honor</th>
                                <th>Teknisi</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="overtime-table-body">
                            <tr>
                                <td colspan="8" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                    Belum ada data lembur
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // TODO: Implement
    // - loadTechnicians() - populate multi-select
    // - loadOvertime() - fetch and render table
    // - setupEventHandlers() - filter, add, edit, delete
    // - renderTable(data) - render overtime rows with technician badges
    // - calculateHoursAndAmount(start, end, techCount) - auto-calc
}
