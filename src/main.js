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
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
        if (error) console.error('Error logging in:', error.message);
    });
});
