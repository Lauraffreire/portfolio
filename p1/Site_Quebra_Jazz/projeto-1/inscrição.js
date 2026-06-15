const images = ['images/fundos/imagem de fundo 2.jpg','images/fundos/quebra jazz.jpg',  'images/fundos/imagem fundo 2.jpg'];

let currentIndex = 0;
let imgEl = document.querySelector('#imagem');


function changeImage() {
    imgEl.setAttribute("src", images[currentIndex]);

    // Atualiza o índice para a próxima imagem
    currentIndex = (currentIndex + 1) % images.length; // Retorna ao início ao fim do array
}

// Inicializa com a primeira imagem
changeImage();

setInterval(changeImage,6000);