const initMenu = () => {
    menu = document.getElementById('menu');

    document.querySelectorAll('#menu a[href="/"]').forEach((link) => { //if there's an link for the main page it will do the sendToHomePage function
        link.addEventListener('click', sendToHomePage);
    });

    document.addEventListener('click', (e) => {
        if (!menu.classList.contains('open')) return;
        if (menu.contains(e.target) || menuBtn.contains(e.target)) return;
        toggleMenu();
    });
};

document.addEventListener('menu:loaded', initMenu);