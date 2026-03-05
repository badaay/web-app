import { supabase } from './api/supabase.js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

console.log('Customer App Initialized');

async function initMap() {
    // Basic setup for offline/online leaflet
    const map = L.map('map-container').setView([-6.2088, 106.8456], 13); // Jakarta Coordinates
    // Using OpenStreetMap titles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Default marker
    L.marker([-6.2088, 106.8456]).addTo(map)
        .bindPopup('We are here.')
        .openPopup();
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();

    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert('Login failed: ' + error.message);
            console.error('Error logging in:', error.message);
        } else {
            console.log('Login successful:', data);

            // UI Transition
            document.getElementById('app').classList.remove('login-active');
            document.querySelector('.login-container').style.display = 'none';
            document.getElementById('dashboard-content').style.display = 'block';

            const role = data.user.app_metadata.role || 'customer';
            // if (role === 'admin' || role === 'owner') {
            window.location.href = '/admin.html';
            // } else {
            //     alert('Welcome, Customer!');
            // }
        }
    });
});
