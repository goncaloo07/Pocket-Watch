// maps a path to the HTML file to load
const ROUTES = {
    '/': 'html/pages/home.html',
    '/balance': 'html/pages/balance.html',
    '/comingSoon': 'html/pages/comingSoon.html',
    default: 'html/pages/404.html'
};

// title shown in the browser tab for each route
const PAGE_TITLES = {
    '/': 'Pocket Watch',
    '/balance': 'Balance History',
    '/comingSoon': 'Coming Soon',
    default: 'Page Not Found'
};

const pageContent = document.getElementById('page-content'); // where the page HTML goes

const ERROR_PAGE_HTML = `<div id="crash-page" class="error-page">
                    <div class="error-content">
                        <i class="bi bi-exclamation-triangle error-icon" aria-hidden="true"></i>
                        <p class="error-title">Something went wrong</p>
                        <p class="error-subtitle">An unexpected error happened. Try reloading the page.</p>
                        <button id="reload-btn" class="btn btn-primary error-home-btn">
                            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Reload Page
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
            document.title = PAGE_TITLES[path] || PAGE_TITLES.default; // updates the browser tab title for this page
            document.dispatchEvent(new CustomEvent('page:loaded', { detail: { path } }));
        })
        .catch(error => console.error('Erro ao carregar a página:', error));
};

// updates the URL and loads the new page, no full reload
const navigateTo = (path) => {
    if (path === window.location.pathname) return; // already here
    history.pushState({}, '', path);
    loadPage(path);
};

const showErrorPage = () => {
    pageContent.innerHTML = ERROR_PAGE_HTML;
    document.getElementById('reload-btn').addEventListener('click', () => window.location.reload());
}

// catches clicks on internal links and routes them
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/') || !ROUTES.hasOwnProperty(href)) return; // not one of our routes

    e.preventDefault();
    navigateTo(href);

    if (menu.classList.contains('open')) {
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
loadPage(window.location.pathname);