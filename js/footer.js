// runs once the footer HTML is inside the page
const initFooter = () => {
    // shows the current year in the copyright line, so it never needs a manual update
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    // the footer logo only exists now, so the theme is applied again to give it the right image
    applyTheme(document.documentElement.dataset.theme);
}

// "footer:loaded" is fired by include-partials.js after all partials are in the DOM
document.addEventListener('footer:loaded', initFooter);