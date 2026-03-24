import { AuthService } from '../api/auth-service.js';
import { supabase } from '../api/supabase.js';
import { APP_BASE_URL } from '../config.js';
import { showToast } from './utils/toast.js';

console.log('Admin App Initialized');

document.addEventListener('DOMContentLoaded', async () => {
    // Check for bypass links
    const bypassResult = await AuthService.handleBypassParams();
    if (bypassResult) {
        location.reload();
        return;
    }

    const isLoginPage = window.location.pathname.includes('/admin/login');
    const isDashboardPage = window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin/index.html') || window.location.pathname.endsWith('/admin');

    const { data: { session, user } } = await AuthService.getSession();

    if (isLoginPage) {
        if (session) {
            // Redirect based on role if already logged in
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('roles(code)')
                .eq('id', session.user.id)
                .single();
            const existingRole = existingProfile?.roles?.code;
            if (existingRole === 'TECH' || existingRole === 'SPV_TECH') {
                window.location.href = APP_BASE_URL + '/activity.html';
            } else if (existingRole === 'CUST') {
                window.location.href = APP_BASE_URL + '/enduser/dashboard.html';
            } else {
                window.location.href = APP_BASE_URL + '/admin/';
            }
            return;
        }
        initLoginLogic();
    } else if (isDashboardPage) {
        initDashboardLogic(user || session.user);
    }

    function initLoginLogic() {
        const loginBtn = document.getElementById('admin-login-btn');
        if (!loginBtn) return;

        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const { data, error } = await AuthService.login(email, password);
            if (error) {
                showToast('error', 'Login gagal: ' + error.message);
            } else {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('roles(code)')
                    .eq('id', data.user.id)
                    .single();

                const roleCode = profile?.roles?.code;
                if (roleCode === 'TECH' || roleCode === 'SPV_TECH') {
                    window.location.href = APP_BASE_URL + '/activity.html';
                } else if (roleCode === 'CUST') {
                    window.location.href = APP_BASE_URL + '/enduser/dashboard.html';
                } else {
                    window.location.href = APP_BASE_URL + '/admin/';
                }
            }
        });
    }

    async function initDashboardLogic(user) {
        if (!user) return;

        // Guard: redirect TECH/SPV_TECH and CUST away from admin dashboard
        const { data: guardProfile } = await supabase
            .from('profiles')
            .select('roles(code)')
            .eq('id', user.id)
            .single();
        const guardRole = guardProfile?.roles?.code;
        if (guardRole === 'TECH' || guardRole === 'SPV_TECH') {
            window.location.href = APP_BASE_URL + '/activity.html';
            return;
        } else if (guardRole === 'CUST') {
            window.location.href = APP_BASE_URL + '/enduser/dashboard.html';
            return;
        }

        const dashboardSection = document.getElementById('dashboard-section');
        const roleFeature = document.getElementById('role-feature');
        const masterDataContainer = document.getElementById('master-data-container');
        const settingsContainer = document.getElementById('settings-container');

        if (dashboardSection) dashboardSection.style.display = 'flex';

        // Update UI elements
        const displayEmail = document.getElementById('user-display-email');
        if (displayEmail) displayEmail.innerText = user.email || 'Admin';

        // Fetch precise role from employees table
        let role = 'TECHNICIAN';
        try {
            const { data: roleData, error: roleError } = await supabase
                .from('employees')
                .select('roles(name)')
                .eq('email', user.email)
                .maybeSingle();

            if (roleError) console.warn('Role lookup error (likely missing email column):', roleError);
            if (roleData?.roles?.name) {
                role = roleData.roles.name;
            }
        } catch (err) {
            console.error('Failed to fetch role:', err);
        }

        const roleHeader = document.getElementById('user-role-header');
        if (roleHeader) roleHeader.innerText = `Role: ${role.toUpperCase()}`;

        // Sidebar Toggle for Mobile
        const sidebar = document.getElementById('admin-sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (sidebarToggle && sidebar && sidebarOverlay) {
            const toggleSidebar = () => {
                sidebar.classList.toggle('show');
                sidebarOverlay.classList.toggle('show');
            };
            sidebarToggle.addEventListener('click', toggleSidebar);
            sidebarOverlay.addEventListener('click', toggleSidebar);
        }

        // Initialize modules and navigation
        initNavigation(roleFeature, masterDataContainer, settingsContainer);

        // Logout handlers
        const logoutHandler = async () => {
            await AuthService.logout();
            window.location.href = APP_BASE_URL + '/admin/login';
        };
        const btnHeader = document.getElementById('nav-logout-btn');
        const btnSidebar = document.getElementById('nav-logout-btn-sidebar');
        if (btnHeader) btnHeader.onclick = logoutHandler;
        if (btnSidebar) btnSidebar.onclick = logoutHandler;
    }

    function initNavigation(roleFeature, masterDataContainer, settingsContainer) {
        const navButtons = document.querySelectorAll('.nav-item-custom, .admin-mobile-nav .menu-item');
        const masterPanes = document.querySelectorAll('#masterDataTabsContent .tab-pane');
        const sidebar = document.getElementById('admin-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        // Local navigation helper
        const navigate = (target) => {
            if (!target) return;

            // Close sidebar on mobile after selection
            if (sidebar?.classList.contains('show')) {
                sidebar.classList.remove('show');
                sidebarOverlay?.classList.remove('show');
            }

            // 1. Navigation focus highlight (Sidebar & Mobile Nav)
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
            let pageTitle = 'Dashboard';
            if (target === 'dashboard') {
                roleFeature.classList.remove('d-none');
                initModule('dashboard');
                pageTitle = 'Beranda';
            } else if (target === 'settings-module') {
                settingsContainer.classList.remove('d-none');
                initModule('settings-content');
                initModule('roles-content');
                pageTitle = 'Settings';
            } else {
                // Check if it's a master data pane
                masterDataContainer.classList.remove('d-none');
                let foundMatch = false;

                masterPanes.forEach(pane => {
                    if (pane.id === target) {
                        pane.classList.add('show', 'active');
                        initModule(target);
                        const title = pane.querySelector('h4')?.innerText || 'Module';
                        pageTitle = title;
                        foundMatch = true;
                    } else {
                        pane.classList.remove('show', 'active');
                    }
                });

                // Special case for sub-views that don't have their own sidebar button
                if (!foundMatch && target === 'add-customer-view-content') {
                    const pane = document.getElementById('add-customer-view-content');
                    if (pane) {
                        pane.classList.add('show', 'active');
                        initModule(target);
                        pageTitle = 'Pelanggan Baru';
                    }
                }
            }
            updateUIText(pageTitle);
        };

        // Listen for navigation events
        document.addEventListener('navigate', (e) => {
            if (e.detail) {
                navigate(e.detail);
            }
        });

        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = button.getAttribute('data-module');
                document.dispatchEvent(new CustomEvent('navigate', { detail: target }));
            });
        });

        // Set Dashboard as active by default on load
        navigate('dashboard');
    }

    function updateUIText(title) {
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerText = title;

        // Also update breadcrumb if still exists in DOM
        const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
        if (breadcrumbActive) breadcrumbActive.innerText = title;
    }

    async function initModule(targetId) {
        if (targetId === 'dashboard') {
            const { initDashboard } = await import('./modules/dashboard.js');
            initDashboard();
        } else if (targetId === 'employees-content') {
            const { initEmployees } = await import('./modules/employees.js');
            initEmployees();
        } else if (targetId === 'customers-content') {
            const { initCustomers } = await import('./modules/customers.js');
            initCustomers();
        } else if (targetId === 'add-customer-view-content') {
            const { initAddCustomerView } = await import('./modules/add-customer-view.js');
            initAddCustomerView();
        } else if (targetId === 'settings-content') {
            const { initSettings } = await import('./modules/settings.js');
            initSettings();
        } else if (targetId === 'roles-content') {
            const { initRoles } = await import('./modules/roles.js');
            initRoles();
        } else if (targetId === 'packages-content') {
            const { initPackages } = await import('./modules/packages.js');
            initPackages();
        } else if (targetId === 'inventory-content') {
            const { initInventory } = await import('./modules/inventory.js');
            initInventory();
        } else if (targetId === 'queue-types-content') {
            const { initQueueTypes } = await import('./modules/queue-types.js');
            initQueueTypes();
        } else if (targetId === 'work-orders-content') {
            const { initWorkOrders } = await import('./modules/work-orders/index.js');
            initWorkOrders();
        } else if (targetId === 'customer-map-view-content') {
            const { initCustomerMapView } = await import('./modules/customer-map-view.js');
            initCustomerMapView();
        }
    }
});
