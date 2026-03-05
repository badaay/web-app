import { supabase } from '../api/supabase.js';

console.log('Admin App Initialized');

document.addEventListener('DOMContentLoaded', async () => {
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const userInfo = document.getElementById('user-info');
    const roleFeature = document.getElementById('role-feature');
    const logoutBtn = document.getElementById('logout-btn');

    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showDashboard(session.user);
    }

    // Tab switching logic for Master Data
    const tabEl = document.getElementById('masterDataTabs');
    if (tabEl) {
        tabEl.addEventListener('shown.bs.tab', event => {
            const targetId = event.target.getAttribute('data-bs-target').replace('#', '');
            initModule(targetId);
        });
    }

    async function initModule(targetId) {
        if (targetId === 'technicians-content') {
            const { initTechnicians } = await import('./modules/technicians.js');
            initTechnicians();
        } else if (targetId === 'customers-content') {
            const { initCustomers } = await import('./modules/customers.js');
            initCustomers();
        } else if (targetId === 'inventory-content') {
            const { initInventory } = await import('./modules/inventory.js');
            initInventory();
        }
    }

    // Initial load
    initModule('technicians-content');

    document.getElementById('admin-login-btn').addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert('Login admin gagal: ' + error.message);
            console.error('Error logging in:', error.message);
        } else {
            console.log('Admin login successful:', data);
            showDashboard(data.user);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });

    function showDashboard(user) {
        const role = user.app_metadata.role || 'customer';
        authSection.classList.add('d-none');
        dashboardSection.style.display = 'block';
        userInfo.innerHTML = `Terhubung sebagai <strong>${user.email}</strong> <span class="badge bg-primary ms-2">${role.toUpperCase()}</span>`;

        // Role-based dummy features using Bootstrap Cards
        if (role === 'admin') {
            roleFeature.innerHTML = `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Manajemen Pengguna</h5>
                        <p class="card-text text-muted">Anda memiliki akses penuh untuk mengelola pengguna dan izin platform.</p>
                        <button class="btn btn-primary" onclick="alert('Mengelola Pengguna...')">Kelola Pengguna</button>
                    </div>
                </div>
            `;
        } else if (role === 'owner') {
            roleFeature.innerHTML = `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Kinerja Keuangan</h5>
                        <p class="card-text text-muted">Melihat ringkasan dan proyeksi keuangan tingkat perusahaan.</p>
                        <button class="btn btn-success" onclick="alert('Melihat Laporan...')">Lihat Laporan Pendapatan</button>
                    </div>
                </div>
            `;
        } else {
            roleFeature.innerHTML = `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Profil Pribadi</h5>
                        <p class="card-text text-muted">Kelola pengaturan pribadi dan tiket dukungan Anda.</p>
                        <button class="btn btn-info text-white" onclick="alert('Melihat Profil...')">Edit Profil</button>
                    </div>
                </div>
            `;
        }
    }
});
