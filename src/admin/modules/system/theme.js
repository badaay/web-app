/**
 * Theme & UI Settings Module
 * Handles theme selection, persistence, and application.
 */

const THEMES = [
    { id: '', name: 'Default Dark', desc: 'VSCode classic aesthetics', primary: '#007acc' },
    { id: 'midnight-obsidian', name: 'Midnight Obsidian', desc: 'Icy slate & deep blue', primary: '#38bdf8' },
    { id: 'ocean-teal', name: 'Ocean Teal', desc: 'Deep navy & vibrant teal', primary: '#14b8a6' },
    { id: 'deep-forest', name: 'Deep Forest', desc: 'Organic earthy greens', primary: '#4caf50' },
    { id: 'cosmic-violet', name: 'Cosmic Violet', desc: 'Premium indigo & purple', primary: '#a78bfa' },
    { id: 'ember-dark', name: 'Ember Dark', desc: 'Warm charcoal & amber', primary: '#f59e0b' },
    { id: 'modern-slate', name: 'Modern Slate (Light)', desc: 'Professional light theme', primary: '#3b5bdb' },
    { id: 'soft-forest', name: 'Soft Forest (Light)', desc: 'Calm & natural light theme', primary: '#557c55' }
];

export async function initTheme() {
    const grid = document.getElementById('theme-selector-grid');
    if (!grid) return;

    const currentTheme = localStorage.getItem('sifatih-admin-theme') || '';
    
    // Apply current theme on init (in case it wasn't applied by admin.js)
    applyTheme(currentTheme);

    renderThemeGrid(grid, currentTheme);
}

function renderThemeGrid(container, activeId) {
    container.innerHTML = THEMES.map(theme => `
        <div class="col-md-6 col-lg-4">
            <div class="theme-card ${theme.id === activeId ? 'active' : ''}" 
                 onclick="window.switchSifatihTheme('${theme.id}')"
                 style="--theme-primary: ${theme.primary}">
                <div class="theme-preview">
                    <div class="preview-sidebar"></div>
                    <div class="preview-header"></div>
                    <div class="preview-content">
                        <div class="preview-line"></div>
                        <div class="preview-line w-75"></div>
                    </div>
                </div>
                <div class="theme-info p-3">
                    <h6 class="mb-1 text-white">${theme.name}</h6>
                    <p class="small text-white-50 mb-0">${theme.desc}</p>
                </div>
                ${theme.id === activeId ? '<div class="active-badge"><i class="bi bi-check-lg"></i></div>' : ''}
            </div>
        </div>
    `).join('');
}

function applyTheme(themeId) {
    if (themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// Global function for the onclick handler
window.switchSifatihTheme = (themeId) => {
    applyTheme(themeId);
    localStorage.setItem('sifatih-admin-theme', themeId);
    
    // Refresh the grid to show active state
    const grid = document.getElementById('theme-selector-grid');
    if (grid) {
        // Find existing list of themes
        const themeCards = grid.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.classList.remove('active');
            const badge = card.querySelector('.active-badge');
            if (badge) badge.remove();
        });

        // Add active state to selected
        const selected = Array.from(grid.querySelectorAll('.theme-card')).find(c => {
            const onclick = c.getAttribute('onclick');
            return onclick && onclick.includes(`'${themeId}'`);
        });
        
        if (selected) {
            selected.classList.add('active');
            const badge = document.createElement('div');
            badge.className = 'active-badge';
            badge.innerHTML = '<i class="bi bi-check-lg"></i>';
            selected.appendChild(badge);
        }
    }
};
