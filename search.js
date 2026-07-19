// ============================================================
//  SEARCH.JS — MedInterp global search
//  - Category page: in-place filter (unfold + hide non-matches)
//  - Home page: full index + dropdown → navigate to term
// ============================================================

const IS_CATEGORY_PAGE = !!new URLSearchParams(window.location.search).get('id');

// --- Language detection ---
function detectLanguage(query) {
    return /[\u0400-\u04FF]/.test(query) ? 'ru' : 'en';
}

// --- Levenshtein distance (per word) ---
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}

function fuzzyWordMatch(text, query) {
    return text.split(/\s+/).some(w => levenshtein(w, query) <= 3);
}

// ============================================================
//  CATEGORY PAGE — in-place filter
// ============================================================
function applyInPlaceFilter(query) {
    const lang = detectLanguage(query);
    const q = query.toLowerCase().trim();

    // Unfold all sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('open'));

    // Show/hide individual term cards
    document.querySelectorAll('.term-card').forEach(card => {
        const el = card.querySelector(lang === 'ru' ? '.term-ru' : '.term-en');
        const field = (el?.textContent || '').toLowerCase();
        const matches = field.includes(q) || (q.length >= 3 && fuzzyWordMatch(field, q));
        card.style.display = matches ? '' : 'none';
    });

    // Hide sections where every card is hidden
    document.querySelectorAll('.section').forEach(section => {
        const hasVisible = [...section.querySelectorAll('.term-card')]
            .some(c => c.style.display !== 'none');
        section.style.display = hasVisible ? '' : 'none';
    });
}

function clearInPlaceFilter() {
    document.querySelectorAll('.term-card').forEach(c => { c.style.display = ''; });
    document.querySelectorAll('.section').forEach(s => { s.style.display = ''; });
}

// ============================================================
//  HOME PAGE — index + dropdown
// ============================================================
let searchIndex = null;

async function buildSearchIndex() {
    if (searchIndex) return;
    const categories = await fetch('data/categories.json').then(r => r.json());
    const entries = [];
    await Promise.all(categories.map(async cat => {
        await Promise.all((cat.types || []).map(async type => {
            try {
                const data = await fetch(`data/${cat.id}/${type}.json`).then(r => r.json());
                (data?.terms || []).forEach(term => entries.push({
                    en: term.en,
                    ru: term.ru,
                    category_id: cat.id,
                    category_label: cat.label,
                    category_icon: cat.icon,
                    section: type
                }));
            } catch { /* skip missing files */ }
        }));
    }));
    searchIndex = entries;
}

function searchTerms(query) {
    if (!searchIndex) return [];
    const lang = detectLanguage(query);
    const q = query.toLowerCase().trim();
    const stage1 = [], stage2 = [];
    for (const e of searchIndex) {
        const field = e[lang].toLowerCase();
        if (field.includes(q)) stage1.push(e);
        else if (fuzzyWordMatch(field, q)) stage2.push(e);
    }
    return (stage1.length ? stage1 : stage2).slice(0, 20);
}

// Store last results for safe index-based onclick
let lastResults = [];

function renderDropdown(results, dropdown, query) {
    activeResultIndex = -1;
    lastResults = results;

    if (!results.length) {
        dropdown.innerHTML = '<div class="search-no-results">No results found</div>';
        dropdown.classList.remove('hidden');
        return;
    }

    const lang = detectLanguage(query);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    dropdown.innerHTML = results.map((r, i) => {
        const primary = lang === 'ru' ? r.ru : r.en;
        const secondary = lang === 'ru' ? r.en : r.ru;
        const highlighted = primary.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
        return `
            <div class="search-result-item" onclick="navigateToResult(${i})">
                <span class="search-result-primary">${highlighted}</span>
                <span class="search-result-secondary">${secondary}</span>
                <span class="search-result-meta">${r.category_icon} ${r.category_label} · ${r.section}</span>
            </div>`;
    }).join('');

    dropdown.classList.remove('hidden');
}

function navigateToResult(i) {
    const r = lastResults[i];
    if (!r) return;
    const p = new URLSearchParams({ id: r.category_id, section: r.section, term: r.en });
    window.location.href = `category.html?${p.toString()}`;
}

// --- Keyboard nav (home page dropdown) ---
let activeResultIndex = -1;

function handleKeyNav(e, dropdown) {
    const items = [...dropdown.querySelectorAll('.search-result-item')];
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeResultIndex = Math.min(activeResultIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeResultIndex = Math.max(activeResultIndex - 1, 0);
    } else if (e.key === 'Enter' && activeResultIndex >= 0) {
        items[activeResultIndex].click();
        return;
    }
    items.forEach((el, i) => el.classList.toggle('selected', i === activeResultIndex));
}

// ============================================================
//  INIT
// ============================================================
let searchDebounceTimer = null;

function initSearch() {
    const input = document.getElementById('search-input');
    const bar = document.getElementById('search-bar');
    const dropdown = document.getElementById('search-dropdown');
    if (!input || !bar || !dropdown) return;

    input.addEventListener('focus', async () => {
        bar.classList.add('focused');
        if (!IS_CATEGORY_PAGE && !searchIndex) {
            await buildSearchIndex();
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            bar.classList.remove('focused');
            dropdown.classList.add('hidden');
            if (IS_CATEGORY_PAGE && !input.value.trim()) {
                clearInPlaceFilter();
            }
        }, 150);
    });

    input.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            const q = input.value.trim();
            if (q.length < 2) {
                dropdown.classList.add('hidden');
                if (IS_CATEGORY_PAGE) clearInPlaceFilter();
                return;
            }
            if (IS_CATEGORY_PAGE) {
                applyInPlaceFilter(q);
            } else {
                renderDropdown(searchTerms(q), dropdown, q);
            }
        }, 250);
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            input.value = '';
            input.blur();
            if (IS_CATEGORY_PAGE) clearInPlaceFilter();
            dropdown.classList.add('hidden');
            return;
        }
        if (!IS_CATEGORY_PAGE) handleKeyNav(e, dropdown);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
        if (!bar.contains(e.target)) dropdown.classList.add('hidden');
    });
}

document.addEventListener('DOMContentLoaded', initSearch);