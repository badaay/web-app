/**
 * Utility: Activity Log Renderer
 * Provides consistent, premium-themed timeline and list rendering for history logs.
 */

export const ActivityLog = {
    /**
     * Renders a vertical timeline of activities
     * @param {Array} logs - Array of log objects { created_at, status, notes, title, icon, color }
     * @returns {string} HTML string
     */
    renderTimeline(logs) {
        if (!logs || logs.length === 0) {
            return '<div class="text-center text-white-50 py-4 small">Belum ada riwayat aktivitas.</div>';
        }

        const timelineHtml = `
            <div class="timeline position-relative ps-3 my-2" style="border-left: 2px solid rgba(255,255,255,0.1);">
                ${logs.map(log => {
                    const date = new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit'
                    });
                    const color = log.color || 'var(--bs-primary)';
                    const icon = log.icon || 'bi-circle-fill';
                    
                    return `
                        <div class="timeline-item position-relative mb-3">
                            <span class="position-absolute rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                                  style="width: 12px; height: 12px; left: -20px; top: 4px; background: ${color}; border: 2px solid rgba(0,0,0,0.3);">
                            </span>
                            <div class="small fw-bold text-white-50 mb-1" style="font-size: 0.75rem;">
                                <i class="bi bi-clock me-1"></i> ${date}
                            </div>
                            <div class="glass-card-sm p-2 rounded-3 border border-white border-opacity-10" style="background: rgba(255,255,255,0.03);">
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <span class="badge bg-opacity-25 text-white x-small" style="background-color: ${color}; padding: 2px 6px;">${log.status || 'Aktivitas'}</span>
                                    ${log.title ? `<span class="small fw-bold text-info">${log.title}</span>` : ''}
                                </div>
                                <div class="small text-white opacity-75 lh-sm">${log.notes || 'Status diperbarui'}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <style>
                .glass-card-sm { backdrop-filter: blur(4px); }
                .x-small { font-size: 0.65rem; }
            </style>
        `;

        return timelineHtml;
    },

    /**
     * Renders a horizontal card-based activity feed
     * @param {Array} logs - Array of log objects
     * @returns {string} HTML string
     */
    renderFeed(logs) {
        if (!logs || logs.length === 0) {
            return '<div class="text-center text-white-50 py-3">Tidak ada aktivitas baru hari ini.</div>';
        }

        return `
            <div class="d-flex flex-nowrap overflow-x-auto pb-2 gap-3 kanban-scroll">
                ${logs.map(m => {
                    const time = new Date(m.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                    const color = m.color || '#10b981';
                    
                    return `
                        <div class="activity-feed-card p-3 shadow-sm d-flex flex-column justify-content-between rounded-3 border-secondary border-opacity-25" 
                             style="min-width: 260px; max-width: 300px; border-left: 3px solid ${color} !important; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.05);">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-opacity-25 border border-opacity-25 text-white" 
                                      style="background-color: ${color}; border-color: ${color} !important;">
                                    ${m.status || 'Berjalan'}
                                </span>
                                <span class="small fw-bold text-white-50"><i class="bi bi-clock me-1"></i>${time}</span>
                            </div>
                            <div class="fw-bold text-white mb-1" style="letter-spacing: -0.2px;">${m.customer_name || m.name || 'Pekerjaan'}</div>
                            <div class="small text-info mb-2"><i class="bi bi-tag-fill me-1"></i>${m.title || 'Work Order'}</div>
                            <div class="small text-white-50 border-top border-secondary border-opacity-10 pt-2 mt-auto lh-sm">
                                ${m.notes || 'Status diperbarui'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
};
