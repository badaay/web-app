import { supabase } from '../api/supabase.js';
import { APP_BASE_URL } from '../config.js';
import { initPWAInstall } from '../utils/pwa-install.js';

document.addEventListener('DOMContentLoaded', async () => {
    const mainContent = document.getElementById('main-content');
    const userNameEl = document.getElementById('user-name');
    const customerIdEl = document.getElementById('customer-id');
    const logoutBtn = document.getElementById('logout-btn');

    // PWA Install Banner
    initPWAInstall();

    // 1. Session Check & Mock Login Support
    const urlParams = new URLSearchParams(window.location.search);
    const mockCode = urlParams.get('cid');
    const isMockCustomer = urlParams.get('customer') === 'true';

    const { data: { session } } = await supabase.auth.getSession();

    // if (!session && !isMockCustomer) {
    //     window.location.href = APP_BASE_URL + '/enduser/login.html';
    //     return;
    // }

    const user = session?.user;
    console.log('User session:', user);

    // 2. Load Profile & Customer Data
    let customerData = null;
    try {
        if (isMockCustomer && mockCode) {
            // Mock Login: Fetch by code or ID
            console.log('Mock Login Mode active for code:', mockCode);
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .or(`customer_code.eq."${mockCode}",id.eq."${mockCode}"`)
                .maybeSingle();

            if (data) {
                customerData = data;
            } else {
                console.error('Customer not found for mock code');
            }
        } else if (user) {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('username', user.email)
                .maybeSingle();

            if (data) {
                customerData = data;
            } else {
                // Try matching by name as fallback
                const { data: fallback } = await supabase
                    .from('customers')
                    .select('*')
                    .ilike('name', user.user_metadata.full_name || '')
                    .limit(1)
                    .maybeSingle();
                customerData = fallback;
            }
        }

        if (customerData) {
            userNameEl.innerText = customerData.name;
            customerIdEl.innerText = customerData.customer_code || 'N/A';
        } else {
            userNameEl.innerText = user?.user_metadata.full_name || 'Guest User';
        }
    } catch (err) {
        console.error('Error fetching customer profile:', err);
    }

    // 3. Navigation handling
    const navItems = document.querySelectorAll('.menu-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const view = item.getAttribute('data-view');
            renderView(view);
        });
    });

    // 4. Logout
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = APP_BASE_URL + '/enduser/login.html';
    });

    // 5. Views Rendering
    async function renderView(view) {
        mainContent.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

        if (view === 'home') {
            await renderHome();
        } else if (view === 'status') {
            await renderStatus();
        } else if (view === 'paket') {
            await renderPaket();
        } else if (view === 'billing') {
            await renderBilling();
        }
    }

    async function renderHome() {
        mainContent.innerHTML = `
            <div class="chat-bubble">
                <h6 class="fw-bold mb-2">Informasi Akun</h6>
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-person-circle fs-3 text-accent me-3"></i>
                    <div>
                        <div class="small text-muted">Nama Lengkap</div>
                        <div class="fw-medium">${customerData?.name || 'User'}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-phone fs-3 text-accent me-3"></i>
                    <div>
                        <div class="small text-muted">Nomor Telepon</div>
                        <div class="fw-medium">${customerData?.phone || '-'}</div>
                    </div>
                </div>
            </div>

            <div class="chat-bubble" style="border-left-color: var(--vscode-warning)">
                <h6 class="fw-bold mb-2">Pemberitahuan</h6>
                <div id="notifications-list">
                    <p class="small text-muted mb-0"><i class="bi bi-info-circle me-1"></i> Tidak ada notifikasi baru hari ini.</p>
                </div>
            </div>

            <div class="chat-bubble" style="border-left-color: var(--vscode-success)">
                <h6 class="fw-bold mb-3">Countdown Pembayaran</h6>
                <div class="text-center">
                    <div class="countdown-timer mb-1" id="billing-countdown">-- : -- : --</div>
                    <div class="small text-muted">Hari sebelum jatuh tempo berikutnya</div>
                </div>
            </div>
        `;
        updateCountdown();
    }

    async function renderStatus() {
        if (!customerData) {
            mainContent.innerHTML = '<div class="chat-bubble">Data pelanggan tidak ditemukan.</div>';
            return;
        }

        const { data: wos, error } = await supabase
            .from('work_orders')
            .select('*')
            .eq('customer_id', customerData.id)
            .order('created_at', { ascending: false });

        if (error || !wos || wos.length === 0) {
            mainContent.innerHTML = `
                <div class="chat-bubble">
                    <h6 class="fw-bold mb-2">Status Pemasangan</h6>
                    <p class="small text-muted mb-0">Anda belum memiliki antrian pemasangan aktif.</p>
                </div>
            `;
            return;
        }

        let html = '<h6 class="fw-bold px-3 mb-3">Lacak Status</h6>';
        wos.forEach(wo => {
            html += `
                <div class="chat-bubble">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="fw-bold">${wo.title}</div>
                        <span class="badge-status bg-opacity-10 bg-primary text-primary">${wo.status}</span>
                    </div>
                    <p class="small text-muted mb-3">${wo.description || 'Pemasangan internet baru.'}</p>
                    <div class="steps-container small">
                        <div class="step mb-2 ${wo.status === 'Antrian' ? 'fw-bold text-accent' : ''}">
                            <i class="bi bi-circle-fill me-2" style="font-size: 0.5rem"></i> Pendaftaran Diterima
                        </div>
                        <div class="step mb-2 ${wo.status === 'Pending' ? 'fw-bold text-accent' : ''}">
                            <i class="bi bi-circle-fill me-2" style="font-size: 0.5rem"></i> Menunggu Teknisi
                        </div>
                        <div class="step mb-2 ${wo.status === 'Konfirmasi' ? 'fw-bold text-accent' : ''}">
                            <i class="bi bi-circle-fill me-2" style="font-size: 0.5rem"></i> Dalam Pengerjaan
                        </div>
                        <div class="step ${wo.status === 'Selesai' ? 'fw-bold text-success' : ''}">
                            <i class="bi bi-check-circle-fill me-2"></i> Selesai & Aktif
                        </div>
                    </div>
                </div>
            `;
        });
        mainContent.innerHTML = html;
    }

    async function renderPaket() {
        if (!customerData) {
            mainContent.innerHTML = '<div class="chat-bubble">Data pelanggan tidak ditemukan.</div>';
            return;
        }

        mainContent.innerHTML = `
            <div class="chat-bubble">
                <div class="text-center mb-4">
                    <i class="bi bi-box-seam display-4 text-accent"></i>
                    <h5 class="fw-bold mt-2">Paket Langganan</h5>
                </div>
                <div class="p-3 bg-light rounded-4 mb-3">
                    <div class="small text-muted">Paket Aktif</div>
                    <div class="h4 fw-bold mb-0">${customerData.packet || 'Belum Langganan'}</div>
                </div>
                <div class="card border-0 bg-primary bg-opacity-10 rounded-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="small">Kapasitas:</span>
                            <span class="fw-bold">Unlimited</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="small">Layanan:</span>
                            <span class="fw-bold">Fiber Optic</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function renderBilling() {
        if (!customerData) {
            mainContent.innerHTML = '<div class="chat-bubble">Data pelanggan tidak ditemukan.</div>';
            return;
        }

        mainContent.innerHTML = `
            <div class="chat-bubble">
                <h6 class="fw-bold mb-3">Informasi Pembayaran</h6>
                <div class="d-flex justify-content-between mb-2 border-bottom pb-2">
                    <span class="text-muted">Siklus Penagihan</span>
                    <span class="fw-bold">Setiap Tanggal ${new Date(customerData.install_date || Date.now()).getDate()}</span>
                </div>
                <div class="d-flex justify-content-between mb-2 border-bottom pb-2">
                    <span class="text-muted">Status Pembayaran</span>
                    <span class="badge bg-success">Lunas</span>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="text-muted">Tagihan Terakhir</span>
                    <span class="fw-bold">Rp 250.000</span>
                </div>
            </div>
            
            <div class="chat-bubble">
                <h6 class="fw-bold mb-2">Metode Pembayaran</h6>
                <p class="small text-muted">Hubungi admin untuk pembayaran via transfer Bank atau E-Wallet.</p>
                <button class="btn btn-outline-primary w-100 rounded-pill">Lihat Cara Bayar</button>
            </div>
        `;
    }

    function updateCountdown() {
        const timerEl = document.getElementById('billing-countdown');
        if (!timerEl) return;

        // Logic dummy: next billing is 25 days from now
        let days = 25;
        let hours = 14;
        let mins = 32;

        timerEl.innerText = `${days} Hari : ${hours} Jam : ${mins} Menit`;
    }

    // Initial Load
    renderHome();
});
