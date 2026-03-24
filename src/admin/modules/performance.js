/**
 * Performance & Point Calculation Module - Advanced Metrics Implementation
 */
export async function initPerformance() {
    console.log('Performance Module Initialized (Advanced Metrics)');

    const currentListContainer = document.getElementById('performance-list-current');
    const previousListContainer = document.getElementById('performance-list-previous');

    // Enhanced dummy data with TAT (Turnaround Time), SLA %, and Task Breakdown
    const dummyTechniciansCurrent = [
        { 
            name: 'Ali Wafa', points: 1250, tasks: 12, level: 8, xp: 85, rank: 1, mvp: true,
            tat: '3.2h', sla: 98, success: 100,
            breakdown: { install: 8, repair: 3, survey: 1 }
        },
        { 
            name: 'Budi Santoso', points: 1100, tasks: 10, level: 7, xp: 40, rank: 2,
            tat: '4.5h', sla: 92, success: 90,
            breakdown: { install: 6, repair: 4, survey: 0 }
        },
        { 
            name: 'Charles Pratama', points: 950, tasks: 9, level: 6, xp: 90, rank: 3,
            tat: '5.1h', sla: 85, success: 100,
            breakdown: { install: 5, repair: 2, survey: 2 }
        },
        { 
            name: 'Dedi Kurniawan', points: 800, tasks: 8, level: 5, xp: 20, rank: 4,
            tat: '6.2h', sla: 80, success: 85,
            breakdown: { install: 4, repair: 4, survey: 0 }
        }
    ];

    const dummyTechniciansPrevious = [
        { 
            name: 'Budi Santoso', points: 1400, tasks: 14, level: 7, xp: 95, rank: 1, mvp: true,
            tat: '3.8h', sla: 96, success: 100,
            breakdown: { install: 10, repair: 4, survey: 0 }
        },
        { 
            name: 'Ali Wafa', points: 1300, tasks: 13, level: 8, xp: 20, rank: 2,
            tat: '4.0h', sla: 94, success: 100,
            breakdown: { install: 9, repair: 3, survey: 1 }
        }
    ];

    function renderLeaderboard(container, data, isCurrent = true) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="list-group list-group-flush bg-transparent">
                ${data.map(tech => {
                    const rankColor = tech.rank === 1 ? '#f59e0b' : tech.rank === 2 ? '#94a3b8' : tech.rank === 3 ? '#b45309' : '#475569';
                    const glowClass = (isCurrent && tech.rank === 1) ? 'shadow-lg border-primary border-opacity-50' : 'border-secondary border-opacity-25';
                    
                    return `
                    <div class="list-group-item bg-transparent border-0 px-3 py-3 mb-3 rounded-3 ${glowClass}" 
                        style="background: ${isCurrent ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)'}">
                        
                        <!-- Header: Avatar, Name, Points -->
                        <div class="d-flex align-items-center mb-3">
                            <div class="position-relative me-3">
                                <div class="avatar-md bg-vscode-header border rounded-circle d-flex align-items-center justify-content-center text-white" 
                                    style="width: 52px; height: 52px; font-size: 1.3rem; border: 2px solid ${rankColor} !important;">
                                    ${tech.name.charAt(0)}
                                </div>
                                <span class="position-absolute bottom-0 end-0 translate-middle-y badge rounded-pill bg-dark border border-secondary" style="font-size: 0.65rem; margin-right: -4px;">
                                    ${tech.rank}
                                </span>
                            </div>

                            <div class="flex-grow-1 min-width-0">
                                <div class="d-flex align-items-center mb-1">
                                    <h6 class="m-0 text-white text-underline-hover cursor-pointer me-2">${tech.name}</h6>
                                    ${tech.mvp ? '<span class="badge bg-warning text-dark px-1 py-0" style="font-size: 0.55rem;"><i class="bi bi-award-fill"></i> MVP</span>' : ''}
                                </div>
                                <div class="d-flex align-items-center mb-1">
                                    <span class="text-white-50 small me-2" style="font-size: 0.7rem;">LVL ${tech.level}</span>
                                    <div class="progress flex-grow-1" style="height: 4px; background: rgba(255,255,255,0.05)">
                                        <div class="progress-bar" role="progressbar" style="width: ${tech.xp}%; background: linear-gradient(90deg, #0d6efd, #0dcaf0)"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="text-end ms-3">
                                <div class="text-accent fw-bold lh-1" style="font-size: 1.2rem;">${tech.points}</div>
                                <div class="text-white-50 small" style="font-size: 0.65rem;">POINT TOTAL</div>
                            </div>
                        </div>

                        <!-- Metrics Grid -->
                        <div class="row g-2 mb-3">
                            <div class="col-4">
                                <div class="bg-dark bg-opacity-50 rounded p-2 text-center border border-secondary border-opacity-25">
                                    <div class="text-white-50" style="font-size: 0.6rem;">AVG TAT</div>
                                    <div class="text-info fw-bold small">${tech.tat}</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="bg-dark bg-opacity-50 rounded p-2 text-center border border-secondary border-opacity-25">
                                    <div class="text-white-50" style="font-size: 0.6rem;">SLA %</div>
                                    <div class="text-success fw-bold small">${tech.sla}%</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="bg-dark bg-opacity-50 rounded p-2 text-center border border-secondary border-opacity-25">
                                    <div class="text-white-50" style="font-size: 0.6rem;">SUCCESS</div>
                                    <div class="text-warning fw-bold small">${tech.success}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- Task Breakdown Pills -->
                        <div class="d-flex gap-2 justify-content-center">
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1" style="font-size: 0.6rem;">
                                ${tech.breakdown.install} Install
                            </span>
                            <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-1" style="font-size: 0.6rem;">
                                ${tech.breakdown.repair} Perbaikan
                            </span>
                            <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-2 py-1" style="font-size: 0.6rem;">
                                ${tech.breakdown.survey} Survey
                            </span>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderLeaderboard(currentListContainer, dummyTechniciansCurrent, true);
    renderLeaderboard(previousListContainer, dummyTechniciansPrevious, false);
}
