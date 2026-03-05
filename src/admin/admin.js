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

    document.getElementById('admin-login-btn').addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert('Admin login failed: ' + error.message);
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
        userInfo.innerHTML = `Connected as <strong>${user.email}</strong> <span class="badge bg-primary ms-2">${role.toUpperCase()}</span>`;

        // Role-based dummy features using Bootstrap Cards
        if (role === 'admin') {
            roleFeature.innerHTML = `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body">
                        <h5 class="card-title">User Management</h5>
                        <p class="card-text text-muted">You have full access to manage platform users and permissions.</p>
                        <button class="btn btn-primary" onclick="alert('Managing Users...')">Manage Users</button>
                    </div>
                </div>
            `;
        } else if (role === 'owner') {
            roleFeature.innerHTML = `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Financial Performance</h5>
                        <p class="card-text text-muted">Viewing enterprise-level financial summaries and projections.</p>
                        <button class="btn btn-success" onclick="alert('Viewing Reports...')">View Revenue Reports</button>
                    </div>
                </div>
            `;
        } else {
            roleFeature.innerHTML = `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body">
                        <h5 class="card-title">Personal Profile</h5>
                        <p class="card-text text-muted">Manage your personal settings and support tickets.</p>
                        <button class="btn btn-info text-white" onclick="alert('Viewing Profile...')">Edit Profile</button>
                    </div>
                </div>
            `;
        }
    }
});
