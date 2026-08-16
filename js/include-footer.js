const loadFooter = () => {
    fetch('../html/footer.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('footer-placeholder').innerHTML = html;
            document.dispatchEvent(new CustomEvent('footer:loaded'));
        })
        .catch(error => console.error('Erro ao carregar o footer:', error));
};

document.addEventListener('header:loaded', loadFooter);