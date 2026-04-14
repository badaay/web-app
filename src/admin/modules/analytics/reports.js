import { supabase } from '../../../api/supabase.js';

/**
 * Reports & Analytics Module - Real-time Implementation
 */
export async function initReports() {
    console.log('Reports Module Initialized (Real-time)');

    const gridContainer = document.getElementById('reports-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '<div class="col-12 text-center py-5 text-white-50"><div class="spinner-border spinner-border-sm me-2"></div>Memuat data laporan...</div>';

    const chartData = [
        { id: 'regChart', title: 'Tren Pendaftaran', icon: 'bi-person-plus', color: '#0d6efd', type: 'bar' },
        { id: 'execChart', title: 'Produktivitas Eksekusi', icon: 'bi-tools', color: '#ffc107', type: 'line' },
        { id: 'revenueChart', title: 'Estimasi Pendapatan (IDR)', icon: 'bi-cash-coin', color: '#198754', type: 'line' },
        { id: 'workloadChart', title: 'Beban Kerja Berdasarkan Tipe', icon: 'bi-pie-chart', color: '#6610f2', type: 'doughnut' },
        { id: 'installedChart', title: 'Status Pelanggan', icon: 'bi-check2-circle', color: '#0dcaf0', type: 'doughnut' },
        { id: 'paymentChart', title: 'Kesehatan Penagihan', icon: 'bi-wallet2', color: '#fd7e14', type: 'bar', stacked: true },
        { id: 'cancellationChart', title: 'Tingkat Pembatalan', icon: 'bi-x-circle', color: '#dc3545', type: 'line' },
        { id: 'responseTimeChart', title: 'Rata-rata Waktu Respon (Jam)', icon: 'bi-stopwatch', color: '#6c757d', type: 'bar' }
    ];

    const chartsRegistry = {};

    const getBaseConfig = (stacked = false) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#ffffff', font: { size: 10 } } },
            tooltip: { backgroundColor: '#1e1e1e', titleColor: '#fff', bodyColor: '#ccc' }
        },
        scales: {
            y: { stacked, ticks: { color: '#ffffff80', font: { size: 9 } }, grid: { color: '#ffffff08' } },
            x: { stacked, ticks: { color: '#ffffff80', font: { size: 9 } }, grid: { display: false } }
        }
    });

    async function loadReportsUI() {
        gridContainer.innerHTML = '';
        chartData.forEach(chart => {
            const col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `
                <div class="card bg-vscode border-secondary shadow-sm h-100 overflow-hidden">
                    <div class="card-header border-secondary bg-transparent py-2 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 text-white small">
                            <i class="bi ${chart.icon} me-2" style="color: ${chart.color}"></i>${chart.title}
                        </h6>
                        <button class="btn btn-link text-white-50 p-0 expand-chart-btn" data-id="${chart.id}" title="Expand">
                            <i class="bi bi-arrows-angle-expand" style="font-size: 0.8rem;"></i>
                        </button>
                    </div>
                    <div class="card-body p-3" style="height: 250px;">
                        <canvas id="${chart.id}"></canvas>
                    </div>
                </div>
            `;
            gridContainer.appendChild(col);
        });

        // Initialize with real data where possible
        await Promise.all([
            initWorkloadChart(),
            initRegistrationChart(),
            initProductivityChart(),
            initStatusChart(),
            initRevenueChart()
        ]);

        // Remaining charts stay dummy for now or use placeholders
        initPlaceholderCharts();
        setupExpandLogic();
    }

    async function initWorkloadChart() {
        try {
            const { data } = await supabase.from('work_orders').select('master_queue_types(name)');
            const counts = {};
            data.forEach(wo => {
                const name = wo.master_queue_types?.name || 'Lainnya';
                counts[name] = (counts[name] || 0) + 1;
            });

            chartsRegistry['workloadChart'] = new Chart(document.getElementById('workloadChart'), {
                type: 'doughnut',
                data: { 
                    labels: Object.keys(counts), 
                    datasets: [{ 
                        data: Object.values(counts), 
                        backgroundColor: ['#6610f2', '#fd7e14', '#0dcaf0', '#22c55e', '#ef4444'], 
                        borderWidth: 0 
                    }] 
                },
                options: { ...getBaseConfig(), cutout: '60%' }
            });
        } catch (e) { console.error(e); }
    }

    async function initRegistrationChart() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const now = new Date();
        const labels = [];
        const dataPoints = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(months[d.getMonth()]);
            dataPoints.push(0);
        }
        
        try {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
            const { data } = await supabase.from('customers').select('created_at').gte('created_at', sixMonthsAgo);
            
            if (data) {
                data.forEach(c => {
                    const d = new Date(c.created_at);
                    const monthName = months[d.getMonth()];
                    const idx = labels.indexOf(monthName);
                    if (idx !== -1) dataPoints[idx]++;
                });
            }
        } catch (e) {
            console.error('Error initRegistrationChart:', e);
        }

        chartsRegistry['regChart'] = new Chart(document.getElementById('regChart'), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Pelanggan Baru', data: dataPoints, backgroundColor: '#0d6efd', borderRadius: 4 }] },
            options: getBaseConfig()
        });
    }

    async function initProductivityChart() {
        const labels = ['W1', 'W2', 'W3', 'W4'];
        const dataPoints = [0, 0, 0, 0];
        
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { data } = await supabase.from('work_order_assignments').select('points_earned, assigned_at').gte('assigned_at', startOfMonth);
            
            if (data) {
                data.forEach(a => {
                    const d = new Date(a.assigned_at);
                    const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
                    dataPoints[week] += (a.points_earned || 0);
                });
            }
        } catch (e) {
            console.error('Error initProductivityChart:', e);
        }

        chartsRegistry['execChart'] = new Chart(document.getElementById('execChart'), {
            type: 'line',
            data: { labels, datasets: [{ label: 'Poin Diraih', data: dataPoints, borderColor: '#ffc107', tension: 0.4, fill: true, backgroundColor: 'rgba(255,193,7,0.1)' }] },
            options: getBaseConfig()
        });
    }

    async function initStatusChart() {
        try {
            const { data } = await supabase.from('customers').select('customer_code');
            let active = 0, waiting = 0, off = 0;
            
            if (data) {
                data.forEach(c => {
                    // Logic based on customer_code or status if it exists
                    // Assuming for now if they have a code they are active, otherwise waiting
                    if (c.customer_code) active++;
                    else waiting++;
                });
            }

            chartsRegistry['installedChart'] = new Chart(document.getElementById('installedChart'), {
                type: 'doughnut',
                data: { labels: ['Aktif', 'Off', 'Wait'], datasets: [{ data: [active, off, waiting], backgroundColor: ['#0dcaf0', '#dc3545', '#ffc107'], borderWidth: 0 }] },
                options: { ...getBaseConfig(), cutout: '60%' }
            });
        } catch (e) {
            console.error('Error initStatusChart:', e);
        }
    }

    async function initRevenueChart() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const now = new Date();
        const labels = [];
        const dataPoints = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(months[d.getMonth()]);
            dataPoints.push(0);
        }

        try {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
            const { data } = await supabase
                .from('financial_transactions')
                .select('amount, transaction_date')
                .eq('type', 'income')
                .gte('transaction_date', sixMonthsAgo);

            if (data) {
                data.forEach(t => {
                    const d = new Date(t.transaction_date);
                    const monthName = months[d.getMonth()];
                    const idx = labels.indexOf(monthName);
                    if (idx !== -1) dataPoints[idx] += Number(t.amount);
                });
            }
        } catch (e) {
            console.error('Error initRevenueChart:', e);
        }

        chartsRegistry['revenueChart'] = new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: { labels, datasets: [{ label: 'Revenue (k)', data: dataPoints.map(v => v/1000), borderColor: '#198754', tension: 0.4 }] },
            options: getBaseConfig()
        });
    }

    function initPlaceholderCharts() {
        // 6. Kesehatan Penagihan
        chartsRegistry['paymentChart'] = new Chart(document.getElementById('paymentChart'), {
            type: 'bar',
            data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Lancar', data: [80, 85, 82, 90, 88, 92], backgroundColor: '#198754' }, { label: 'Telat', data: [20, 15, 18, 10, 12, 8], backgroundColor: '#dc3545' }] },
            options: getBaseConfig(true)
        });

        // 7. Tingkat Pembatalan
        chartsRegistry['cancellationChart'] = new Chart(document.getElementById('cancellationChart'), {
            type: 'line',
            data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Batal %', data: [5, 4, 7, 3, 5, 2], borderColor: '#dc3545', tension: 0.4 }] },
            options: getBaseConfig()
        });

        // 8. Rata-rata Waktu Respon
        chartsRegistry['responseTimeChart'] = new Chart(document.getElementById('responseTimeChart'), {
            type: 'bar',
            data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'], datasets: [{ label: 'Jam', data: [4.2, 3.8, 4.5, 3.2, 3.0, 2.8], backgroundColor: '#6c757d', borderRadius: 4 }] },
            options: getBaseConfig()
        });
    }

    function setupExpandLogic() {
        let expandedChart = null;
        const expandModalEl = document.getElementById('chartExpandModal');
        if (!expandModalEl) return;
        
        const expandModal = new bootstrap.Modal(expandModalEl);
        const expandedCtx = document.getElementById('expandedChartCanvas').getContext('2d');

        document.querySelectorAll('.expand-chart-btn').forEach(btn => {
            btn.onclick = () => {
                const chartId = btn.dataset.id;
                const originalChart = chartsRegistry[chartId];
                const chartMeta = chartData.find(c => c.id === chartId);

                document.getElementById('chartExpandTitle').innerText = `Detail Laporan: ${chartMeta.title}`;

                if (expandedChart) expandedChart.destroy();

                expandedChart = new Chart(expandedCtx, {
                    type: originalChart.config.type,
                    data: JSON.parse(JSON.stringify(originalChart.data)), 
                    options: {
                        ...originalChart.options,
                        maintainAspectRatio: false,
                        plugins: {
                            ...originalChart.options.plugins,
                            legend: { labels: { color: '#fff', font: { size: 14 } } }
                        },
                        scales: {
                            ...originalChart.options.scales,
                            y: { ...originalChart.options.scales.y, ticks: { ...originalChart.options.scales.y.ticks, font: { size: 12 } } },
                            x: { ...originalChart.options.scales.x, ticks: { ...originalChart.options.scales.x.ticks, font: { size: 12 } } }
                        }
                    }
                });

                expandModal.show();
            };
        });
    }

    await loadReportsUI();
}
