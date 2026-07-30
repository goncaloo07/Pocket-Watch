fetch('../html/footer.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('footer-placeholder').innerHTML = html;
        document.dispatchEvent(new CustomEvent('footer:loaded')); // avisa o resto do código que o header já existe no DOM
    })
    .catch(error => console.error('Erro ao carregar o footer:', error));