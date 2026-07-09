const params = new URLSearchParams(window.location.search);
const id = params.get('id');

if (!id) {
    document.getElementById('content').innerHTML =
        '<p style="color:var(--red)">No category specified.</p>';
} else {
    fetch('data/categories.json')
        .then(res => res.json())
        .then(categories => {
            const cat = categories.find(c => c.id === id);
            if (!cat) {
                document.getElementById('content').innerHTML =
                    `<p style="color:var(--red)">Category "${id}" not found.</p>`;
                return;
            }

            document.title = `MIP | ${cat.label}`;
            document.getElementById('content').innerHTML = `
                <div class="category-header">
                    <h1>${cat.icon} ${cat.label}</h1>
                    <p>${cat.description}</p>
                </div>
                <div id="sections"></div>
            `;

            // Fetch all section files; skip missing or empty ones silently
            Promise.all(
                cat.types.map(type =>
                    fetch(`data/${id}/${type}.json`)
                        .then(res => res.json())
                        .then(data => ({ type, data }))
                        .catch(() => ({ type, data: null }))
                )
            ).then(results => {
                const container = document.getElementById('sections');
                const validSections = results.filter(({ data }) => data && Object.keys(data).length > 0);

                validSections.forEach(({ type, data }) => {
                    container.insertAdjacentHTML('beforeend', renderSection(type, data));
                    const firstSection = document.querySelector('.section');
                    if (firstSection) firstSection.classList.add('open');
                });

                const nav = document.getElementById('section-nav');
                nav.innerHTML = `
                    <div class="section-nav-title">${cat.label}</div>
                    ${validSections.map(({ type }) =>
                        `<div class="section-nav-item" data-target="section-${type}" onclick="scrollToSection('section-${type}')">
                            ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>`
                    ).join('')}
                `;

                // Highlight active section on scroll
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            document.querySelectorAll('.section-nav-item').forEach(i => i.classList.remove('active'));
                            const navItem = document.querySelector(`.section-nav-item[data-target="${entry.target.id}"]`);
                            if (navItem) navItem.classList.add('active');
                        }
                    });
                }, { rootMargin: '-10% 0px -60% 0px' });

                document.querySelectorAll('.section').forEach(s => observer.observe(s));
            });
        })
        .catch(() => {
            document.getElementById('content').innerHTML =
                '<p style="color:var(--red)">Failed to load categories.</p>';
        });
}

function renderSection(type, data) {
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    const accent = data.color ? `style="border-left: 3px solid ${data.color}; padding-left: 1rem;"` : '';
    let html = `<div class="section" id="section-${type}" ${accent}>`;

    html += `
        <div class="section-toggle" onclick="toggleSection('section-${type}')">
            <h2 class="section-title" style="color:${data.color ? data.color : ''}">${title}</h2>
            <span class="section-arrow">›</span>
        </div>
        <div class="section-body">`;

    if (data.intro)
        html += `<div class="section-intro">${data.intro}</div>`;

    if (data.reading)
        html += `
            <div class="section-reading">
                <p class="reading-label">Background reading</p>
                <p>${data.reading}</p>
            </div>`;

    if (data.terms?.length)
        html += `<div class="terms-list">${data.terms.map(renderTerm).join('')}</div>`;

    html += `</div></div>`;
    return html;
}

function toggleSection(id) {
    document.getElementById(id).classList.toggle('open');
}

const termMap = {};

function renderTerm(term) {
    const id = 't-' + Math.random().toString(36).slice(2, 8);
    termMap[id] = term;
    return `
        <div class="term-card" onclick="openModal('${id}')">
            ${term.image ? '<div class="term-image-indicator" title="Has image">🖼</div>' : ''}
            <div class="term-header">
                <span class="term-en">${term.en}</span>
                <span class="term-ru">${term.ru}</span>
            </div>
        </div>`;
}

function openModal(id) {
    const term = termMap[id];
    if (!term) return;

    let html = `
        <div class="modal-en">${term.en}</div>
        <div class="modal-ru">${term.ru}</div>`;

    if (term.example_en || term.example_ru) {
        html += `<div class="modal-section-label">Examples</div>
        <div class="modal-examples">`;
        if (term.example_en)
            html += `<div class="modal-example-line"><span class="lang-tag">EN</span>${term.example_en}</div>`;
        if (term.example_ru)
            html += `<div class="modal-example-line"><span class="lang-tag">RU</span>${term.example_ru}</div>`;
        html += `</div>`;
    }

    if (term.note)
        html += `<div class="modal-section-label">Interpreter note</div>
        <div class="modal-note">⚠ ${term.note}</div>`;

    if (term.image)
        html += `<img class="modal-image" src="${term.image}" alt="${term.en}" />`;
    // html += `<a class="modal-image-link" href="${term.image}" target="_blank" rel="noopener">View image ↗</a>`;

    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarWidth + 'px';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        const offset = 90; // pixels from top
        const elementTop = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: elementTop, behavior: 'smooth' });
    }
}

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