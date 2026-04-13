import { AuthService } from '../api/auth-service.js';
import { supabase } from '../api/supabase.js';
import { APP_BASE_URL } from '../config.js';
import { showToast } from './utils/toast.js';

console.log('Admin App Initialized');

const ROLE_PERMISSIONS = {
    'S_ADM': '*',
    'OWNER': '*',
    'ADM': [
        'dashboard', 
        'work-orders-content', 
        'customer-map-view-content', 
        'employees-content', 
        'customers-content', 
        'add-customer-view-content',
        'inventory-content', 
        'packages-content', 
        'queue-types-content', 
        'reports-content', 
        'performance-content',
        'attendance-content',
        'overtime-content',
        'billing-content',
        'theme-pane',
        'whatsapp-pane',
        'notifications-pane'
    ],
    'TREASURER': [
        'dashboard',
        'employees-content',
        'customers-content',
        'reports-content',
        'performance-content',
        'attendance-content',
        'overtime-content',
        'payroll-content',
        'billing-content',
        'financial-reports-content',
        'financial-ledger-content',
        'payments-pane'
    ],
    'SPV_TECH': [
        'dashboard', 
        'work-orders-content', 
        'customer-map-view-content', 
        'inventory-content', 
        'queue-types-content', 
        'reports-content', 
        'performance-content',
        'theme-pane'
    ]
};

function hasPermission(role, moduleId) {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    if (permissions === '*') return true;
    if (Array.isArray(permissions)) {
        return permissions.includes(moduleId);
    }
    return false;
}
const MENU_SCHEMA = [
    {
        group: 'Menu Utama',
        roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH', 'TREASURER'],
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH', 'TREASURER'] },
            { id: 'work-orders-content', label: 'Antrian PSB', icon: 'bi-file-earmark-text', roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH'] },
            { id: 'customer-map-view-content', label: 'MAP View', icon: 'bi-pin-map', roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH'] }
        ]
    },
    {
        group: 'Master Data',
        roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH'],
        items: [
            { id: 'employees-content', label: 'Karyawan', icon: 'bi-person-vcard', roles: ['S_ADM', 'OWNER', 'ADM'] },
            { id: 'customers-content', label: 'Pelanggan', icon: 'bi-people', roles: ['S_ADM', 'OWNER', 'ADM'] },
            { id: 'inventory-content', label: 'Inventaris', icon: 'bi-box-seam', roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH'] },
            { id: 'packages-content', label: 'Paket Layanan', icon: 'bi-tags', roles: ['S_ADM', 'OWNER', 'ADM'] },
            { id: 'queue-types-content', label: 'Tipe & Point', icon: 'bi-ticket-detailed', roles: ['S_ADM', 'OWNER', 'ADM'] }
        ]
    },
    {
        group: 'Analitik & Performa',
        roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH'],
        items: [
            { id: 'reports-content', label: 'Laporan', icon: 'bi-bar-chart-line', roles: ['S_ADM', 'OWNER', 'ADM'] },
            { id: 'performance-content', label: 'Performa', icon: 'bi-lightning-charge', roles: ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH'] }
        ]
    },
    {
        group: 'Payroll & HR',
        roles: ['S_ADM', 'OWNER', 'TREASURER'],
        items: [
            { id: 'attendance-content', label: 'Kehadiran', icon: 'bi-calendar-check', roles: ['S_ADM', 'OWNER', 'TREASURER'] },
            { id: 'overtime-content', label: 'Lembur', icon: 'bi-clock-history', roles: ['S_ADM', 'OWNER', 'TREASURER'] },
            { id: 'payroll-content', label: 'Payroll', icon: 'bi-cash-stack', roles: ['S_ADM', 'OWNER', 'TREASURER'] }
        ]
    },
    {
        group: 'Keuangan',
        roles: ['S_ADM', 'OWNER', 'TREASURER'],
        items: [
            { id: 'billing-content', label: 'Tagihan', icon: 'bi-receipt-cutoff', roles: ['S_ADM', 'OWNER', 'TREASURER'] },
            { id: 'financial-reports-content', label: 'Lap. Keuangan', icon: 'bi-graph-up', roles: ['S_ADM', 'OWNER', 'TREASURER'] },
            { id: 'financial-ledger-content', label: 'Buku Besar', icon: 'bi-book', roles: ['S_ADM', 'OWNER', 'TREASURER'] }
        ]
    },
    {
        group: 'Sistem',
        roles: ['S_ADM', 'OWNER'],
        items: [
            { id: 'settings-module', label: 'Settings', icon: 'bi-gear', roles: ['S_ADM', 'OWNER'] }
        ]
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    const currentTheme = localStorage.getItem('sifatih-admin-theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }


    const isLoginPage = window.location.pathname.includes('/admin/login');
    const isDashboardPage = window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin/index.html') || window.location.pathname.endsWith('/admin');

    const { data } = await AuthService.getSession();
    const session = data?.session;
    const user = session?.user;

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
                // Extract employee_id from session email (format: eid@sifatih.id)
                const eid = session.user.email ? session.user.email.split('@')[0] : 'tech';
                window.location.href = APP_BASE_URL + `/activity.html?eid=${encodeURIComponent(eid)}`;
            } else if (existingRole === 'CUST') {
                window.location.href = APP_BASE_URL + '/enduser/dashboard.html';
            } else {
                window.location.href = APP_BASE_URL + '/admin/';
            }
            return;
        }
        initLoginLogic();
    } else if (isDashboardPage) {
        if (!user) {
            console.warn('No user session found. Redirecting to login...');
            window.location.href = APP_BASE_URL + '/admin/login.html';
            return;
        }
        initDashboardLogic(user);
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
                    // Extract employee_id from session email (format: eid@sifatih.id)
                    const eid = data.user.email ? data.user.email.split('@')[0] : 'tech';
                    window.location.href = APP_BASE_URL + `/activity.html?eid=${encodeURIComponent(eid)}`;
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

        // Rebuild sidebar based on role
        rebuildSidebar(guardRole);

        // Initialize modules and navigation
        initNavigation(roleFeature, masterDataContainer, settingsContainer);
        
        // Sidebar Module Search
        initSidebarSearch();

        // 1. Render Dynamic Sidebar
        renderSidebar(guardRole);

        // 2. Initialize navigation (Now called AFTER sidebar is rendered)
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

        // Hash-based navigation support with guards
        window.addEventListener('hashchange', () => {
            const target = window.location.hash.replace('#', '');
            if (target) {
                document.dispatchEvent(new CustomEvent('navigate', { detail: target }));
            }
        });

        // Check initial hash
        const initialHash = window.location.hash.replace('#', '');
        if (initialHash && initialHash !== 'dashboard') {
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('navigate', { detail: initialHash }));
            }, 500);
        }
    }

    function rebuildSidebar(role) {
        const navItems = document.querySelectorAll('.nav-item-custom[data-module], .admin-mobile-nav .menu-item[data-module]');
        const navGroups = document.querySelectorAll('.nav-group');

        navItems.forEach(item => {
            const module = item.getAttribute('data-module');
            if (module && module !== 'dashboard' && !hasPermission(role, module)) {
                item.remove(); // Remove instead of hide to prevent DOM inspection recovery
            }
        });

        // Hide empty groups
        navGroups.forEach(group => {
            const itemsInGroup = group.querySelectorAll('.nav-item-custom');
            if (itemsInGroup.length === 0) {
                group.remove();
            }
        });

        // Also handle mobile nav if needed
        const mobileNavItems = document.querySelectorAll('.admin-mobile-nav .menu-item[data-module]');
        mobileNavItems.forEach(item => {
            const module = item.getAttribute('data-module');
            if (module && module !== 'dashboard' && !hasPermission(role, module)) {
                item.remove();
            }
        });
    }

    function renderSidebar(roleCode) {
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) return;

        // Clear existing nav except logout button
        const logoutBtn = document.getElementById('nav-logout-btn-sidebar');
        sidebarNav.innerHTML = '';

        MENU_SCHEMA.forEach(group => {
            // Check if user has access to this group
            if (!group.roles.includes(roleCode)) return;

            // Filter items in group by role
            const allowedItems = group.items.filter(item => item.roles.includes(roleCode));
            if (allowedItems.length === 0) return;

            // Create Group Header
            const groupEl = document.createElement('div');
            groupEl.className = 'nav-group';
            groupEl.innerHTML = `
                <div class="px-4 py-2 mt-3 small text-uppercase text-white-50 fw-bold"
                     style="font-size: 0.65rem; letter-spacing: 1.5px;">${group.group}</div>
            `;

            // Create Items
            allowedItems.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'nav-item-custom nav-module-link';
                btn.setAttribute('data-module', item.id);
                btn.innerHTML = `<i class="bi ${item.icon}"></i> ${item.label}`;
                groupEl.appendChild(btn);
            });

            sidebarNav.appendChild(groupEl);
        });

        // Add logout button back
        if (logoutBtn) {
            sidebarNav.appendChild(logoutBtn);
        }

        // --- Also Update Mobile Nav ---
        const mobileNav = document.querySelector('.admin-mobile-nav');
        if (mobileNav) {
            mobileNav.innerHTML = '';
            // Only take top 4 items for mobile nav
            const allItems = MENU_SCHEMA.flatMap(g => g.items).filter(i => i.roles.includes(roleCode)).slice(0, 4);
            allItems.forEach(item => {
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'menu-item';
                a.setAttribute('data-module', item.id);
                a.innerHTML = `<i class="bi ${item.icon}"></i> <span>${item.label}</span>`;
                mobileNav.appendChild(a);
            });
        }
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
            } else if (target === 'financial-reports-content' || target === 'financial-ledger-content') {
                masterDataContainer.classList.remove('d-none');
                masterPanes.forEach(pane => pane.classList.remove('show', 'active'));
                const financialPane = document.getElementById(target);
                if (financialPane) financialPane.classList.add('show', 'active');
                initModule(target);
                pageTitle = target === 'financial-reports-content' ? 'Laporan Keuangan' : 'Buku Besar';
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

        // Global listener for sub-tabs (e.g. Settings tabs)
        document.addEventListener('shown.bs.tab', (e) => {
            const targetId = e.target.getAttribute('data-bs-target')?.replace('#', '');
            if (targetId) {
                initModule(targetId);
            }
        });
    }

    function updateUIText(title) {
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerText = title;

        // Also update breadcrumb if still exists in DOM
        const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
        if (breadcrumbActive) breadcrumbActive.innerText = title;
    }

    async function initModule(targetId) {
        // Auth Guard check
        const { data: sessionData } = await AuthService.getSession();
        const role = sessionData?.session?.user?.id ? await (async () => {
            const { data: p } = await supabase.from('profiles').select('roles(code)').eq('id', sessionData.session.user.id).single();
            return p?.roles?.code;
        })() : null;

        if (targetId !== 'dashboard' && !hasPermission(role, targetId)) {
            console.warn(`Unauthorized access attempt to module: ${targetId}`);
            window.location.href = APP_BASE_URL + '/admin/403-forbidden.html';
            return;
        }
        // RBAC Access Guard
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('roles(code)')
                .eq('id', session.user.id)
                .single();
            
            const roleCode = profile?.roles?.code;
            
            // Check if targetId is allowed for this role
            const allAllowedItems = MENU_SCHEMA.flatMap(g => g.items).filter(i => i.roles.includes(roleCode));
            const isAllowed = allAllowedItems.some(i => i.id === targetId) || 
                             ['dashboard', 'theme-pane', 'whatsapp-pane', 'notifications-pane', 'scheduling-pane', 'payments-pane', 'settings-content', 'roles-content', 'packages-content', 'inventory-content', 'queue-types-content'].includes(targetId);

            // Special exception for superadmins and owners
            const isGodRole = roleCode === 'S_ADM' || roleCode === 'OWNER';

            if (!isAllowed && !isGodRole) {
                console.warn(`Access denied for module ${targetId} and role ${roleCode}`);
                showToast('error', 'Akses Ditolak: Anda tidak memiliki izin untuk modul ini.');
                // Trigger navigation back to dashboard
                document.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
                return;
            }
        } catch (err) {
            console.error('RBAC Guard Error:', err);
        }

        try {
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
            } else if (targetId === 'reports-content') {
                const { initReports } = await import('./modules/reports.js');
                initReports();
            } else if (targetId === 'performance-content') {
                const { initPerformance } = await import('./modules/performance.js');
                initPerformance();
            } else if (targetId === 'work-orders-content') {
                const { initWorkOrders } = await import('./modules/work-orders/index.js');
                initWorkOrders();
            } else if (targetId === 'customer-map-view-content') {
                const { initCustomerMapView } = await import('./modules/customer-map-view.js');
                initCustomerMapView();
            } else if (targetId === 'theme-pane') {
                const { initTheme } = await import('./modules/theme.js');
                initTheme();
            } else if (targetId === 'whatsapp-pane') {
                const { initWhatsApp } = await import('./modules/whatsapp.js');
                initWhatsApp();
            } else if (targetId === 'notifications-pane') {
                const { initNotifications } = await import('./modules/notifications.js');
                initNotifications();
            } else if (targetId === 'scheduling-pane') {
                const { initScheduling } = await import('./modules/scheduling.js');
                initScheduling();
            } else if (targetId === 'payments-pane') {
                const { initPayments } = await import('./modules/payments.js');
                initPayments();
            } else if (targetId === 'billing-content') {
                const { initBilling } = await import('./modules/billing.js');
                initBilling();
            } else if (targetId === 'attendance-content') {
                const { initAttendance } = await import('./modules/attendance.js');
                initAttendance();
            } else if (targetId === 'overtime-content') {
                const { initOvertime } = await import('./modules/overtime.js');
                initOvertime();
            } else if (targetId === 'payroll-content') {
                const { initPayroll } = await import('./modules/payroll.js');
                initPayroll();
            } else if (targetId === 'financial-ledger-content') {
                const { initFinancialLedger } = await import('./modules/financial-ledger.js');
                initFinancialLedger();
            } else if (targetId === 'financial-reports-content') {
                const { initFinancialReports } = await import('./modules/financial-reports.js');
                initFinancialReports();
            }
        } catch (error) {
            console.error(`Failed to load module '${targetId}':`, error);
            showToast('error', `Gagal memuat modul: ${error.message}`);
        }
    }

    function initSidebarSearch() {
        const searchInput = document.getElementById('sidebar-module-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const navItems = document.querySelectorAll('.sidebar-nav .nav-item-custom:not(#nav-logout-btn-sidebar)');
            const groups = document.querySelectorAll('.nav-group');

            navItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                const isMatch = text.includes(query);
                item.style.display = isMatch ? 'flex' : 'none';
            });

            groups.forEach(group => {
                const itemsInGroup = group.querySelectorAll('.nav-item-custom');
                const hasVisibleItem = Array.from(itemsInGroup).some(item => item.style.display === 'flex');
                group.style.display = hasVisibleItem ? 'block' : 'none';
            });
        });
    }

    // Official Toast Utility
    import('./utils/toast.js').then(({ showToast }) => {
        window.showToast = (type, message, options) => {
            // Handle cases where developer might pass (message, type) by mistake
            if (['success', 'error', 'warning', 'info'].includes(message)) {
                const temp = type;
                type = message;
                message = temp;
            }
            // Map 'danger' to 'error'
            if (type === 'danger') type = 'error';
            showToast(type, message, options);
        };
    });
});
