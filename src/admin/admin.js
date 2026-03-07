import { supabase } from '../api/supabase.js';

console.log('Admin App Initialized');

document.addEventListener('DOMContentLoaded', async () => {
    const isLoginPage = window.location.pathname.includes('/admin/login');
    const isDashboardPage = window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin/index.html') || window.location.pathname.endsWith('/admin');

    const { data: { session } } = await supabase.auth.getSession();

    if (isLoginPage) {
        if (session) {
            window.location.href = '/web-app/admin/';
            return;
        }
        initLoginLogic();
    } else if (isDashboardPage) {
        if (!session) {
            window.location.href = '/web-app/admin/login';
            return;
        }
        initDashboardLogic(session.user);
    }

    function initLoginLogic() {
        const loginBtn = document.getElementById('admin-login-btn');
        if (!loginBtn) return;

        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                alert('Login admin gagal: ' + error.message);
            } else {
                console.log('Admin login successful:', data);
                window.location.href = '/web-app/admin/';
            }
        });
    }

    function initDashboardLogic(user) {
        const role = user.app_metadata.role || 'customer';
        const dashboardSection = document.getElementById('dashboard-section');
        const roleFeature = document.getElementById('role-feature');
        const masterDataContainer = document.getElementById('master-data-container');

        if (dashboardSection) dashboardSection.style.display = 'flex';

        // Update UI elements
        const displayEmail = document.getElementById('user-display-email');
        if (displayEmail) displayEmail.innerText = user.email;

        const roleHeader = document.getElementById('user-role-header');
        if (roleHeader) roleHeader.innerText = `Role: ${role.toUpperCase()}`;

        // Initialize modules and navigation
        initNavigation(roleFeature, masterDataContainer);
        initModule('technicians-content');

        // Logout buttons
        const logoutHandler = async () => {
            await supabase.auth.signOut();
            window.location.href = '/web-app/admin/login';
        };
        const btnHeader = document.getElementById('nav-logout-btn');
        const btnSidebar = document.getElementById('nav-logout-btn-sidebar');
        if (btnHeader) btnHeader.addEventListener('click', logoutHandler);
        if (btnSidebar) btnSidebar.addEventListener('click', logoutHandler);

        // Role-based dummy features
        if (role === 'admin') {
            roleFeature.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-4 border-0 shadow-sm">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="bg-primary bg-opacity-10 p-2 rounded me-3">
                                        <i class="bi bi-shield-check text-accent fs-4"></i>
                                    </div>
                                    <h5 class="card-title mb-0">Keamanan Sistem</h5>
                                </div>
                                <p class="card-text text-white-50 small">Kelola audit log, sesi pengguna, dan kebijakan keamanan platform secara terpusat.</p>
                                <button class="btn btn-primary btn-sm px-3" onclick="alert('Membuka Log Keamanan...')">Lihat Log</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    function initNavigation(roleFeature, masterDataContainer) {
        document.querySelectorAll('.nav-item-custom').forEach(button => {
            button.addEventListener('click', (e) => {
                const moduleTarget = button.getAttribute('data-module');
                if (!moduleTarget) return;

                document.querySelectorAll('.nav-item-custom').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                if (moduleTarget === 'dashboard') {
                    roleFeature.classList.remove('d-none');
                    masterDataContainer.classList.add('d-none');
                    updateBreadcrumb('Dashboard');
                } else {
                    roleFeature.classList.add('d-none');
                    masterDataContainer.classList.remove('d-none');
                    const tab = document.getElementById(moduleTarget);
                    if (tab) {
                        const bsTab = new bootstrap.Tab(tab);
                        bsTab.show();
                        updateBreadcrumb(`Master Data / ${tab.innerText}`);
                    }
                }
            });
        });

        const tabEl = document.getElementById('masterDataTabs');
        if (tabEl) {
            tabEl.addEventListener('shown.bs.tab', event => {
                const targetId = event.target.getAttribute('data-bs-target').replace('#', '');
                initModule(targetId);
                updateBreadcrumb(`Master Data / ${event.target.innerText}`);
                document.querySelectorAll('.nav-module-link').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-module') === event.target.id);
                });
            });
        }
    }

    function updateBreadcrumb(text) {
        const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
        if (breadcrumbActive) breadcrumbActive.innerText = text;
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
});
