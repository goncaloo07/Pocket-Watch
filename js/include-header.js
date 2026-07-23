fetch('../html/header.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('header-placeholder').innerHTML = html;
        document.dispatchEvent(new CustomEvent('header:loaded')); // avisa o resto do código que o header já existe no DOM
    })
    .catch(error => console.error('Erro ao carregar o header:', error));