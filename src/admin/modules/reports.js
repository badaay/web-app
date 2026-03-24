/**
 * Reports & Analytics Module - Advanced 2-Column Expandable Implementation
 */
export async function initReports() {
    console.log('Reports Module Initialized (2-Column Expandable)');

    const gridContainer = document.getElementById('reports-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

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

    // 1. Tren Pendaftaran
    chartsRegistry['regChart'] = new Chart(document.getElementById('regChart'), {
        type: 'bar',
        data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Sales', data: [45, 52, 38, 65, 48, 70], backgroundColor: '#0d6efd', borderRadius: 4 }] },
        options: getBaseConfig()
    });

    // 2. Produktivitas Eksekusi
    chartsRegistry['execChart'] = new Chart(document.getElementById('execChart'), {
        type: 'line',
        data: { labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ label: 'Selesai', data: [22, 28, 25, 35], borderColor: '#ffc107', tension: 0.4, fill: true, backgroundColor: 'rgba(255,193,7,0.1)' }] },
        options: getBaseConfig()
    });

    // 3. Estimasi Pendapatan
    chartsRegistry['revenueChart'] = new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Revenue', data: [120, 150, 140, 180, 170, 210], borderColor: '#198754', tension: 0.4 }] },
        options: getBaseConfig()
    });

    // 4. Beban Kerja Berdasarkan Tipe
    chartsRegistry['workloadChart'] = new Chart(document.getElementById('workloadChart'), {
        type: 'doughnut',
        data: { labels: ['Install', 'Repair', 'Survey'], datasets: [{ data: [60, 30, 10], backgroundColor: ['#6610f2', '#fd7e14', '#0dcaf0'], borderWidth: 0 }] },
        options: { ...getBaseConfig(), cutout: '60%' }
    });

    // 5. Status Pelanggan
    chartsRegistry['installedChart'] = new Chart(document.getElementById('installedChart'), {
        type: 'doughnut',
        data: { labels: ['Aktif', 'Off', 'Wait'], datasets: [{ data: [85, 10, 5], backgroundColor: ['#0dcaf0', '#dc3545', '#ffc107'], borderWidth: 0 }] },
        options: { ...getBaseConfig(), cutout: '60%' }
    });

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
        data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Jam', data: [4.2, 3.8, 4.5, 3.2, 3.0, 2.8], backgroundColor: '#6c757d', borderRadius: 4 }] },
        options: getBaseConfig()
    });

    // Expand Feature Logic
    let expandedChart = null;
    const expandModal = new bootstrap.Modal(document.getElementById('chartExpandModal'));
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
                data: JSON.parse(JSON.stringify(originalChart.data)), // Deep clone data
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
