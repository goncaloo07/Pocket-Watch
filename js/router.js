// maps a path to the HTML file to load
const ROUTES = {
    '/': 'html/pages/home.html',
    '/balance': 'html/pages/balance.html',
    '/budgets': 'html/pages/budgets.html',
    '/transactions': 'html/pages/transactions.html',
    '/settings': 'html/pages/settings.html',
    '/comingSoon': 'html/pages/comingSoon.html',
    default: 'html/pages/404.html'
};

// title shown in the browser tab for each route
const PAGE_TITLES = {
    '/': 'title.home',
    '/balance': 'title.balance',
    '/budgets': 'title.budgets',
    '/transactions': 'title.transactions',
    '/settings': 'title.settings',
    '/comingSoon': 'title.comingSoon',
    default: 'title.default'
};

// meta description shown in Google search results for each route
const PAGE_DESCRIPTIONS = {
    '/': 'desc.home',
    '/balance': 'desc.balance',
    '/budgets': 'desc.budgets',
    '/transactions': 'desc.transactions',
    '/settings': 'desc.settings',
    '/comingSoon': 'desc.comingSoon',
    default: 'desc.default'
};

const pageContent = document.getElementById('page-content'); // where the page HTML goes

const ERROR_PAGE_HTML = `<div id="crash-page" class="error-page">
                    <div class="error-content">
                        <i class="bi bi-exclamation-triangle error-icon" aria-hidden="true"></i>
                        <p class="error-title" data-i18n="error.crashTitle"></p>
                        <p class="error-subtitle" data-i18n="error.crashSubtitle"></p>
                        <button id="reload-btn" class="btn btn-primary error-home-btn">
                            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> <span data-i18n="error.reload"></span>
                        </button>
                    </div>
                </div>`; // error content to show when a page crashes

// fetches and injects the page's HTML, then fires "page:loaded"
const loadPage = (path) => {
    const page = ROUTES[path] || ROUTES.default;
    fetch(page)
        .then(response => response.text())
        .then(html => {
            pageContent.innerHTML = html;
            applyTranslations(pageContent);
            updatePageMeta(path);
            document.getElementById('canonical-link').setAttribute('href', `https://pocket-watch-murex.vercel.app${path}`); // updates the canonical URL for this page
            document.dispatchEvent(new CustomEvent('page:loaded', { detail: { path } }));
        })
        .catch(error => console.error('Erro ao carregar a página:', error));
};

// updates the URL and loads the new page, no full reload
const navigateTo = (path) => {
    if (path === window.location.pathname + window.location.search) return; // already here
    history.pushState({}, '', path);
    loadPage(path.split('?')[0]);
};

const showErrorPage = () => {
    pageContent.innerHTML = ERROR_PAGE_HTML;
    applyTranslations(pageContent);
    document.getElementById('reload-btn').addEventListener('click', () => window.location.reload());
}

// catches clicks on internal links and routes them
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/')) return; // not one of our routes
    const path = href.split('?')[0];
    if (!ROUTES.hasOwnProperty(path)) return;

    e.preventDefault();
    navigateTo(href);

    if (menu && menu.classList.contains('open')) {
        toggleMenu(); // close mobile menu after navigating
    }
});

// handles browser back/forward buttons
window.addEventListener('popstate', () => {
    loadPage(window.location.pathname);
});

window.addEventListener('error', () => { // if there is a error in the page, show the error page
    showErrorPage();
});

window.addEventListener('unhandledrejection', () => { // same here
    showErrorPage();
});

// load the right page on first load
document.addEventListener('DOMContentLoaded', () => {
    loadPage(window.location.pathname);
});