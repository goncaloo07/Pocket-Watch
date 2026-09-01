// maps a path to the HTML file to load
const ROUTES = {
    '/': 'html/pages/home.html',
    '/balance': 'html/pages/balance.html',
};

const pageContent = document.getElementById('page-content'); // where the page HTML goes

// fetches and injects the page's HTML, then fires "page:loaded"
const loadPage = (path) => {
    const page = ROUTES[path] || ROUTES['/'];
    fetch(page)
        .then(response => response.text())
        .then(html => {
            pageContent.innerHTML = html;
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

// load the right page on first load
loadPage(window.location.pathname);