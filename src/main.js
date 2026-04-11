import { AuthService } from './api/auth-service.js';
import { supabase } from './api/supabase.js';
import { APP_BASE_URL } from './config.js';

console.log('Customer App Initialized');

async function initMap() {
    // ... same ...
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check for bypass links
    const bypassResult = await AuthService.handleBypassParams();
    if (bypassResult) {
        // Force reload or trigger the login redirection logic
        // For main.js, we can just trigger a click on login-btn if we want, 
        // but better to just reload or simulate successful login.
        location.reload(); 
        return;
    }
    // initMap();

    document.getElementById('login-btn').addEventListener('click', async () => {
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const { data, error } = await AuthService.loginCustomerPhone(phone, password);
        if (error) {
            alert('Login gagal: ' + error.message);
            console.error('Error logging in:', error.message);
        } else {
            console.log('Login successful:', data);

            const user = data.user;
            // Role is stored in user_metadata (set at signUp) or app_metadata (set server-side)
            const role = user.user_metadata?.role || user.app_metadata?.role || 'customer';

            if (role === 'admin' || role === 'owner' || role === 'ADMIN' || role === 'SUPERADMIN') {
                window.location.href = APP_BASE_URL + '/admin/';
            } else if (role === 'teknisi' || role === 'TEKNISI') {
                // Lookup employee_id from employees table
                const { data: emp } = await supabase
                    .from('employees')
                    .select('employee_id')
                    .eq('id', user.id)
                    .maybeSingle();

                const finalCode = emp?.employee_id;
                if (finalCode) {
                    window.location.href = APP_BASE_URL + `/activity.html?eid=${finalCode}`;
                } else {
                    alert('Data teknisi tidak ditemukan dalam database karyawan.');
                }
            } else {
                // Default: customer dashboard
                window.location.href = APP_BASE_URL + '/enduser/dashboard.html';
            }
        }
    });
});
