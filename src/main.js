import { AuthService } from './api/auth-service.js';
import { APP_BASE_URL } from './config.js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await AuthService.login(email, password);
        if (error) {
            alert('Login failed: ' + error.message);
            console.error('Error logging in:', error.message);
        } else {
            console.log('Login successful:', data);

            const user = data.user;
            const role = user.app_metadata.role || 'customer';

            if (role === 'admin' || role === 'owner') {
                window.location.href = APP_BASE_URL + '/admin/';
            } else if (role === 'teknisi') {
                // Fetch employee code to redirect to activity.js
                const { data: emp, error: empErr } = await supabase
                    .from('employees')
                    .select('employee_id')
                    .eq('employee_id', user.email.split('@')[0]) // Assuming email prefix is employee_id for now, or match by email if added later
                    .single();

                // Fallback attempt: match by name or context if employee_id isn't directly the email prefix
                // For now, let's try to match by email if we can't find by prefix
                let finalCode = emp?.employee_id;
                if (!finalCode) {
                    const { data: empByEmail } = await supabase
                        .from('employees')
                        .select('employee_id')
                        .ilike('name', user.user_metadata.full_name || '') // Loose match
                        .single();
                    finalCode = empByEmail?.employee_id;
                }

                if (finalCode) {
                    window.location.href = APP_BASE_URL + `/activity.html?eid=${finalCode}`;
                } else {
                    alert('Data teknisi tidak ditemukan dalam database karyawan.');
                }
            } else {
                // Default to customer dashboard
                window.location.href = APP_BASE_URL + '/enduser/dashboard.html';
            }
        }
    });
});
