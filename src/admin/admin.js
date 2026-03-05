import { supabase } from '../api/supabase.js';

console.log('Admin App Initialized');

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('admin-login-btn').addEventListener('click', async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
        if (error) console.error('Error logging in:', error.message);
    });
});
