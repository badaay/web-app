/**
 * Performance & Point Calculation Module - Simplified Implementation
 */
export async function initPerformance() {
    console.log('Performance Module Initialized (Simplified)');

    const currentListContainer = document.getElementById('performance-list-current');
    const previousListContainer = document.getElementById('performance-list-previous');

    const dummyTechniciansCurrent = [
        { name: 'Ali Wafa', points: 1250, level: 8, xp: 85, rank: 1, mvp: true },
        { name: 'Budi Santoso', points: 1100, level: 7, xp: 40, rank: 2 },
        { name: 'Charles Pratama', points: 950, level: 6, xp: 90, rank: 3 },
        { name: 'Dedi Kurniawan', points: 800, level: 5, xp: 20, rank: 4 }
    ];

    const dummyTechniciansPrevious = [
        { name: 'Budi Santoso', points: 1400, level: 7, xp: 95, rank: 1, mvp: true },
        { name: 'Ali Wafa', points: 1300, level: 8, xp: 20, rank: 2 }
    ];

    function renderLeaderboard(container, data, isCurrent = true) {
        if (!container) return;
        
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
                                <div class="text-accent fw-bold lh-1" style="font-size: 1.1rem;">${tech.points}</div>
                                <div class="text-white-50" style="font-size: 0.6rem; letter-spacing: 0.5px;">POINTS</div>
                            </div>
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
