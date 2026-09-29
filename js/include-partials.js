// fetches one partial and puts it inside its placeholder
const loadPartial = (url, placeholderId) => {
    return fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById(placeholderId).innerHTML = html;
        })
        .catch(error => console.error(`Erro ao carregar ${url}:`, error)); // one failing partial does not block the others
};

// all three requests start at the same time, and we wait until all of them are in the DOM
Promise.all([
    loadPartial('../html/header.html', 'header-placeholder'),
    loadPartial('../html/menu.html', 'menu-placeholder'),
    loadPartial('../html/footer.html', 'footer-placeholder')
]).then(() => {
    // same order as before: the footer needs the header, because initFooter calls applyTheme
    document.dispatchEvent(new CustomEvent('header:loaded'));
    document.dispatchEvent(new CustomEvent('menu:loaded'));
    document.dispatchEvent(new CustomEvent('footer:loaded'));
});