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
        const settingsContainer = document.getElementById('settings-container');

        if (dashboardSection) dashboardSection.style.display = 'flex';

        // Update UI elements
        const displayEmail = document.getElementById('user-display-email');
        if (displayEmail) displayEmail.innerText = user.email;

        const roleHeader = document.getElementById('user-role-header');
        if (roleHeader) roleHeader.innerText = `Role: ${role.toUpperCase()}`;

        // Initialize modules and navigation
        initNavigation(roleFeature, masterDataContainer, settingsContainer);
        initModule('employees-content');

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

    function initNavigation(roleFeature, masterDataContainer, settingsContainer) {
        const navButtons = document.querySelectorAll('.nav-item-custom');
        const masterPanes = document.querySelectorAll('#masterDataTabsContent .tab-pane');

        // Expose global navigation helper
        window.switchAdminModule = (target) => {
            if (!target) return;

            // 1. Sidebar focus highlight (only if it matches a sidebar button)
            navButtons.forEach(btn => {
                if (btn.getAttribute('data-module') === target) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // 2. Hide all primary section containers
            [roleFeature, masterDataContainer, settingsContainer].forEach(el => {
                if (el) el.classList.add('d-none');
            });

            // 3. Show target section and pane
            if (target === 'dashboard') {
                roleFeature.classList.remove('d-none');
                updateBreadcrumb('Dashboard');
            } else if (target === 'settings-module') {
                settingsContainer.classList.remove('d-none');
                initModule('roles-content');
                updateBreadcrumb('Sistem / Roles');
            } else {
                // Check if it's a master data pane
                masterDataContainer.classList.remove('d-none');
                let foundMatch = false;

                masterPanes.forEach(pane => {
                    if (pane.id === target) {
                        pane.classList.add('show', 'active');
                        initModule(target);
                        const title = pane.querySelector('h4')?.innerText || 'Module';
                        updateBreadcrumb(`Master Data / ${title}`);
                        foundMatch = true;
                    } else {
                        pane.classList.remove('show', 'active');
                    }
                });

                // Special case for sub-views that don't have their own sidebar button
                if (!foundMatch && target === 'add-customer-view-content') {
                    // This is still within masterDataContainer
                    const pane = document.getElementById('add-customer-view-content');
                    if (pane) {
                        pane.classList.add('show', 'active');
                        initModule(target);
                        updateBreadcrumb('Master Data / Tambah Pelanggan');
                    }
                }
            }
        };

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                window.switchAdminModule(button.getAttribute('data-module'));
            });
        });

        // Set Dashboard as active by default on load
        document.querySelector('.nav-item-custom[data-module="dashboard"]')?.classList.add('active');
    }

    function updateBreadcrumb(text) {
        const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
        if (breadcrumbActive) breadcrumbActive.innerText = text;
    }

    async function initModule(targetId) {
        if (targetId === 'employees-content') {
            const { initEmployees } = await import('./modules/employees.js');
            initEmployees();
        } else if (targetId === 'customers-content') {
            const { initCustomers } = await import('./modules/customers.js');
            initCustomers();
        } else if (targetId === 'add-customer-view-content') {
            const { initAddCustomerView } = await import('./modules/add-customer-view.js');
            initAddCustomerView();
        } else if (targetId === 'roles-content') {
            const { initRoles } = await import('./modules/roles.js');
            initRoles();
        } else if (targetId === 'packages-content') {
            const { initPackages } = await import('./modules/packages.js');
            initPackages();
        } else if (targetId === 'inventory-content') {
            const { initInventory } = await import('./modules/inventory.js');
            initInventory();
        } else if (targetId === 'work-orders-content') {
            const { initWorkOrders } = await import('./modules/work-orders.js');
            initWorkOrders();
        } else if (targetId === 'customer-map-view-content') {
            const { initCustomerMapView } = await import('./modules/customer-map-view.js');
            initCustomerMapView();
        }
    }
});
