// runs once the menu HTML is inside the page
const initMenu = () => {
    menu = document.getElementById('menu'); // "menu" is declared in header.js

    document.querySelectorAll('#menu a[href="/"]').forEach((link) => { //if there's an link for the main page it will do the sendToHomePage function
        link.addEventListener('click', sendToHomePage);
    });

    // clicking outside the menu closes it. Example: menu is open on mobile and you tap the page behind it
    document.addEventListener('click', (e) => {
        if (!menu.classList.contains('open')) return; // menu already closed, nothing to do
        if (menu.contains(e.target) || menuBtn.contains(e.target)) return; // click was on the menu or its button, so leave it alone
        toggleMenu();
    });
};

// "menu:loaded" is fired by include-partials.js after all partials are in the DOM
document.addEventListener('menu:loaded', initMenu);