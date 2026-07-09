fetch('data/categories.json')
    .then(res => res.json())
    .then(categories => {
        const grid = document.getElementById('category-grid');
        grid.innerHTML = categories.map(cat => `
        <a class="category-tile" href="category.html?id=${cat.id}">
            <div class="tile-icon">${cat.icon}</div>
            <div class="tile-title">${cat.label}</div>
            <div class="tile-desc">${cat.description}</div>
        </a>
        `).join('');
    })
    .catch(() => {
        document.getElementById('category-grid').innerHTML =
            '<p style="color:var(--red)">Failed to load categories.</p>';
    });

function updateOrientationLock() {
    const overlay = document.getElementById('orientation-lock-overlay');
    if (!overlay) return;

    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;

    if (isLandscape && isMobile) {
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    } else {
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }
}

window.addEventListener('resize', updateOrientationLock);
window.addEventListener('orientationchange', updateOrientationLock);
window.addEventListener('DOMContentLoaded', updateOrientationLock);
updateOrientationLock();



