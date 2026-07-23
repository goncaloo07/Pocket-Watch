fetch('../html/menu.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('menu-placeholder').innerHTML = html;
        document.dispatchEvent(new CustomEvent('menu:loaded')); // avisa o resto do código que o menu já existe no DOM
    })
    .catch(error => console.error('Erro ao carregar o menu:', error));