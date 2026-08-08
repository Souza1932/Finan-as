const radiosTema = document.querySelectorAll('input[name="estilo"]');
const containerPrincipal = document.querySelector('.container');
radiosTema.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'verde') {
            containerPrincipal.style.backgroundColor = '#1a5c42';
            containerPrincipal.style.color = '#FFFFFF';
        } else {
            containerPrincipal.style.backgroundColor = '#f0fdf4';
            containerPrincipal.style.color = '#141414';
        }
    });
});




