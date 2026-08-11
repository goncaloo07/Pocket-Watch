const ROUTES = {
    '/': 'html/pages/home.html',
    '/balance': 'html/pages/balance.html',
};

const pageContent = document.getElementById('page-content');

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

const navigateTo = (path) => {
    if (path === window.location.pathname) return; 
    history.pushState({}, '', path);
    loadPage(path);
};

document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/') || !ROUTES.hasOwnProperty(href)) return;

    e.preventDefault();
    navigateTo(href);
});

window.addEventListener('popstate', () => {
    loadPage(window.location.pathname);
});

loadPage(window.location.pathname);