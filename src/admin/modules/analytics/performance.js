import { supabase } from '../../../api/supabase.js';

/**
 * Performance & Point Calculation Module - Real-time Implementation
 */
export async function initPerformance() {
    console.log('Performance Module Initialized (Real-time)');

    const container = document.getElementById('performance-content');
    if (!container) return;

    // Redefine layout to include Overall Stats
    container.innerHTML = `
        <div class="row g-4 mb-4" id="overall-performance-row">
            <div class="col-12 text-center py-5 text-white-50"><div class="spinner-border spinner-border-sm me-2"></div>Memuat performa...</div>
        </div>
        <div class="row g-4">
            <div class="col-lg-6">
                <div class="card bg-vscode border-secondary shadow-sm h-100">
                    <div class="card-header border-secondary bg-transparent py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 text-white"><i class="bi bi-star-fill text-warning me-2"></i>Leaderboard: Bulan Ini</h6>
                        <span class="badge bg-primary px-2 py-1" style="font-size: 0.65rem">LIVE</span>
                    </div>
                    <div class="card-body p-0" id="performance-list-current">
                        <div class="text-center py-4 text-white-50">Memuat performa...</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card bg-vscode border-secondary shadow-sm h-100 opacity-75">
                    <div class="card-header border-secondary bg-transparent py-3">
                        <h6 class="m-0 text-white-50"><i class="bi bi-clock-history me-2"></i>Rekap: Bulan Lalu</h6>
                    </div>
                    <div class="card-body p-0" id="performance-list-previous">
                        <div class="text-center py-4 text-white-50">Memuat rekap...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const currentListContainer = document.getElementById('performance-list-current');
    const previousListContainer = document.getElementById('performance-list-previous');
    const overallRow = document.getElementById('overall-performance-row');

    async function loadRealPerformance() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

            // 1. Fetch Assignments and Overall Stats
            const [currentRes, prevRes, overallRes] = await Promise.all([
                supabase
                    .from('work_order_assignments')
                    .select('points_earned, employee_id, employees(name, position)')
                    .gte('assigned_at', startOfMonth),
                supabase
                    .from('work_order_assignments')
                    .select('points_earned, employee_id, employees(name, position)')
                    .lt('assigned_at', startOfMonth)
                    .gte('assigned_at', startOfLastMonth),
                supabase
                    .from('technician_performance_stats')
                    .select('*')
                    .order('total_points', { ascending: false })
                    .limit(3)
            ]);

            if (currentRes.error) throw currentRes.error;
            if (prevRes.error) throw prevRes.error;

            // 2. Aggregate Monthly Data
            const processData = (assignments) => {
                const map = {};
                assignments.forEach(a => {
                    if (!a.employees) return;
                    const id = a.employee_id;
                    if (!map[id]) {
                        map[id] = { 
                            name: a.employees.name, 
                            points: 0, 
                            level: 1, 
                            xp: 0 
                        };
                    }
                    map[id].points += a.points_earned || 0;
                });

                return Object.values(map)
                    .map(tech => {
                        // Level logic: Consistent with DB View (500 points per level)
                        tech.level = Math.floor(tech.points / 500) + 1;
                        tech.xp = Math.floor(((tech.points % 500) / 500) * 100);
                        return tech;
                    })
                    .sort((a, b) => b.points - a.points)
                    .map((tech, index) => ({ ...tech, rank: index + 1 }));
            };

            const currentData = processData(currentRes.data || []);
            const previousData = processData(prevRes.data || []);

            // 3. Render Overall Podium
            if (overallRes.data && overallRes.data.length > 0) {
                renderPodium(overallRow, overallRes.data);
            } else {
                overallRow.innerHTML = '';
            }

            // 4. Render Monthly Lists
            renderLeaderboard(currentListContainer, currentData, true);
            renderLeaderboard(previousListContainer, previousData, false);

        } catch (error) {
            console.error('Failed to load performance data:', error);
            if (currentListContainer) currentListContainer.innerHTML = `<div class="text-center py-5 text-danger small">Gagal: ${error.message}</div>`;
        }
    }

    function renderPodium(container, techs) {
        container.innerHTML = `
            <div class="col-12 mb-2 text-center">
                <h5 class="text-white-50 small fw-bold" style="letter-spacing: 2px;">GLOBAL PERFORMANCE HALL OF FAME</h5>
            </div>
            ${techs.map((tech, i) => {
                const colors = ['#f59e0b', '#94a3b8', '#b45309'];
                const rankLabels = ['1ST', '2ND', '3RD'];
                return `
                <div class="col-md-4">
                    <div class="card bg-vscode border-secondary shadow border-opacity-25 overflow-hidden">
                        <div class="card-body p-3 text-center position-relative">
                            <div class="position-absolute top-0 end-0 p-2 text-white-50 small fw-bold">${rankLabels[i]}</div>
                            <div class="avatar-md bg-vscode-header border-2 border rounded-circle d-flex align-items-center justify-content-center text-white mx-auto mb-3" 
                                 style="width: 64px; height: 64px; border-color: ${colors[i]} !important;">
                                <h3 class="m-0">${tech.name.charAt(0)}</h3>
                            </div>
                            <h6 class="text-white mb-1 text-truncate">${tech.name}</h6>
                            <div class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 mb-3">LVL ${tech.level} MASTER</div>
                            <div class="d-flex justify-content-center align-items-end gap-1">
                                <span class="h4 m-0 fw-bold" style="color: ${colors[i]}">${tech.total_points}</span>
                                <span class="text-white-50 x-small pb-1">TOTAL POINTS</span>
                            </div>
                            <div class="progress mt-3" style="height: 4px; background: rgba(255,255,255,0.05);">
                                <div class="progress-bar" style="width: ${tech.xp_percentage}%; background-color: ${colors[i]}"></div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
        `;
    }

    function renderLeaderboard(container, data, isCurrent = true) {
        if (!container) return;
        
        if (data.length === 0) {
            container.innerHTML = `<div class="text-center py-5 text-white-50 small">Tidak ada data pengerjaan ${isCurrent ? 'bulan ini' : 'bulan lalu'}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="list-group list-group-flush bg-transparent">
                ${data.map(tech => {
                    const rankColor = tech.rank === 1 ? '#f59e0b' : tech.rank === 2 ? '#94a3b8' : tech.rank === 3 ? '#b45309' : '#475569';
                    const glowClass = (isCurrent && tech.rank === 1) ? 'shadow-lg border-primary border-opacity-50' : 'border-secondary border-opacity-25';
                    
                    return `
                    <div class="list-group-item bg-transparent border-0 px-3 py-3 mb-2 rounded-3 ${glowClass}" 
                        style="background: ${isCurrent ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)'}">
                        
                        <div class="d-flex align-items-center">
                            <!-- Rank Icon -->
                            <div class="me-3 text-center" style="width: 24px;">
                                ${tech.rank <= 3 
                                    ? `<i class="bi bi-trophy-fill" style="color: ${rankColor}; font-size: 1.1rem;"></i>` 
                                    : `<span class="text-white-50 small">${tech.rank}</span>`}
                            </div>

                            <!-- Avatar & Name -->
                            <div class="avatar-sm bg-vscode-header border border-secondary rounded-circle d-flex align-items-center justify-content-center text-white me-3" 
                                style="width: 40px; height: 40px; flex-shrink: 0;">
                                ${tech.name.charAt(0)}
                            </div>

                            <div class="flex-grow-1 min-width-0">
                                <h6 class="m-0 text-white text-truncate">${tech.name}</h6>
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 py-0 px-2 me-2" style="font-size: 0.65rem;">LVL ${tech.level}</span>
                                    <div class="progress flex-grow-1" style="height: 3px; background: rgba(255,255,255,0.05); max-width: 60px;">
                                        <div class="progress-bar" role="progressbar" style="width: ${tech.xp}%; background: #0d6efd"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Points -->
                            <div class="text-end ms-3">
                                <div class="text-accent-gradient fw-bold lh-1" style="font-size: 1.1rem;">${tech.points}</div>
                                <div class="text-white-50" style="font-size: 0.6rem; letter-spacing: 0.5px;">POINTS</div>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    loadRealPerformance();
}
