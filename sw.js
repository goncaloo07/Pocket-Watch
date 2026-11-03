// Change this name when you rename or delete files, so old copies are removed
const CACHE = 'pw-v1';

// files the app needs to start. If one of these is missing, the install fails
const CORE_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/translate.js',
    '/js/router.js',
    '/js/theme.js',
    '/js/header.js',
    '/js/menu.js',
    '/js/footer.js',
    '/js/transactions.js',
    '/js/balance.js',
    '/js/render.js',
    '/js/chart.js',
    '/js/budget.js',
    '/js/confirm.js',
    '/js/settings.js',
    '/js/currency.js',
    '/js/main.js',
    '/js/include-partials.js',
    '/html/header.html',
    '/html/menu.html',
    '/html/footer.html',
    '/html/pages/home.html',
    '/html/pages/balance.html',
    '/html/pages/budgets.html',
    '/html/pages/transactions.html',
    '/html/pages/settings.html',
    '/html/pages/404.html',
    '/html/pages/comingSoon.html',
    '/data/rates.json'
];

// nice to have: fonts and icons. If one fails (no internet, blocked), the install still works
const EXTRA_FILES = [
    '/assets/icons/light/logo.webp',
    '/assets/icons/dark/logo.webp',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css',
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Archivo:ital,wght@0,100..900;1,100..900&family=Manrope:wght@400;500;600;700;800&display=swap',
    'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap'
];

// "reload" skips the browser's own cache, so we save the newest version of each file
const freshRequest = (url) => new Request(url, { cache: 'reload' });

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await cache.addAll(CORE_FILES.map(freshRequest));
        await Promise.allSettled(EXTRA_FILES.map((url) => cache.add(freshRequest(url))));
        self.skipWaiting(); // the new worker starts right away
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // deletes caches from older versions
        const names = await caches.keys();
        await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
        await self.clients.claim(); // controls the open tabs without a reload
    })());
});

// saves a copy of the answer, but only if it is a good one
const saveCopy = async (request, response) => {
    if (response.ok || response.type === 'opaque') { // "opaque" is what other domains (fonts) return
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
    }
    return response;
};

// tries the internet first, uses the saved copy if there is no connection
const networkFirst = async (request) => {
    try {
        return await saveCopy(request, await fetch(request));
    } catch {
        return (await caches.match(request)) || Response.error();
    }
};

// answers with the saved copy right away, and updates it in the background for next time
const staleWhileRevalidate = async (request) => {
    const cached = await caches.match(request);
    const update = fetch(request).then((response) => saveCopy(request, response)).catch(() => null);
    return cached || (await update) || Response.error();
};

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;
    if (url.hostname === 'api.frankfurter.dev') return; // the app already handles this one failing

    // opening a page, like /balance. These are not real files, so offline we answer with index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(async () => (await caches.match('/index.html')) || Response.error())
        );
        return;
    }

    // exchange rates: fresh when online, last saved ones when offline
    if (url.pathname === '/data/rates.json') {
        event.respondWith(networkFirst(request));
        return;
    }

    // everything else (js, css, html partials, fonts, icons)
    event.respondWith(staleWhileRevalidate(request));
});