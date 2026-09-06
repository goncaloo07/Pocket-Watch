const initFooter = () => {
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    applyTheme(document.documentElement.dataset.theme);
}

document.addEventListener('footer:loaded', initFooter);