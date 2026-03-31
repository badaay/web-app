/**
 * Module: Attendance Management
 * Task 3.3: Attendance UI - table, filters, quick-add, edit modal
 * Ref: pre-planning/04-normalized-attendance.md
 */

import { supabase, apiCall } from '../../api/supabase.js';

export async function initAttendance() {
    const container = document.getElementById('attendance-content');
    if (!container) return;

    // Set page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Kehadiran Karyawan';

    // TODO: Task 3.3 - Implement attendance module
    // 
    // Features:
    // 1. Date range filter (default: current month)
    // 2. Employee dropdown filter
    // 3. Table showing: Date, Employee, Check-in, Late (min), Deduction, Status
    // 4. Quick-add form for single record
    // 5. Edit modal for updating records
    // 6. Monthly summary stats at top (present, late, absent counts)
    //
    // API calls:
    // - GET /api/attendance?date_from=&date_to=&employee_id=
    // - POST /api/attendance (create)
    // - PATCH /api/attendance/:id (update)
    // - DELETE /api/attendance/:id (delete)

    container.innerHTML = `
        <div class="card bg-dark border-secondary">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>Kehadiran Karyawan</h5>
                <button class="btn btn-primary btn-sm" id="btn-add-attendance">
                    <i class="bi bi-plus-lg"></i> Tambah
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
                    <div class="col-md-4">
                        <label class="form-label">Karyawan</label>
                        <select class="form-select" id="filter-employee">
                            <option value="">Semua Karyawan</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-outline-light w-100" id="btn-filter">
                            <i class="bi bi-funnel"></i> Filter
                        </button>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div class="row mb-3" id="attendance-summary">
                    <div class="col-md-4">
                        <div class="card bg-success bg-opacity-25 border-success">
                            <div class="card-body text-center py-2">
                                <div class="h4 mb-0" id="stat-present">-</div>
                                <small>Hadir</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-warning bg-opacity-25 border-warning">
                            <div class="card-body text-center py-2">
                                <div class="h4 mb-0" id="stat-late">-</div>
                                <small>Terlambat</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-danger bg-opacity-25 border-danger">
                            <div class="card-body text-center py-2">
                                <div class="h4 mb-0" id="stat-absent">-</div>
                                <small>Tidak Hadir</small>
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
                                <th>Karyawan</th>
                                <th>Jam Masuk</th>
                                <th>Terlambat</th>
                                <th>Potongan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="attendance-table-body">
                            <tr>
                                <td colspan="7" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                    Belum ada data kehadiran
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // TODO: Implement
    // - loadEmployees() - populate filter dropdown
    // - loadAttendance() - fetch and render table
    // - setupEventHandlers() - filter, add, edit, delete
    // - renderTable(data) - render attendance rows
    // - updateSummary(data) - calculate and show stats
}
