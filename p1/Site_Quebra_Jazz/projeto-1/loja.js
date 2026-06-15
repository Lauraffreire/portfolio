const slider = document.querySelectorAll('.slider');
const btnPrev = document.querySelector('.prev-btn');
const btnNext = document.querySelector('.next-btn');

let currentSlide = 0;

function hideSlider() {
    slider.forEach((item) => item.classList.remove('on'))
}

function showSlider() {const slider = document.querySelectorAll('.slider');
    const btnPrev = document.querySelector('.prev-btn');
    const btnNext = document.querySelector('.next-btn');

    let currentSlide = 0;

    function hideSlider() {
        slider.forEach((item) => item.classList.remove('on'))
    }

    function showSlider() {
        slider[currentSlide].classList.add('on');
    }

    function nextSlider() {
        hideSlider()
        if (currentSlide === slider.length - 1) {
            currentSlide = 0
        } else {
            currentSlide++
        }
        showSlider()
    }

    function prevSlider() {
        hideSlider()
        if (currentSlide === 0) {
            currentSlide = slider.length - 1
        } else {
            currentSlide--
        }
        showSlider()
    }

    btnNext.addEventListener('click', nextSlider);
    btnPrev.addEventListener('click', prevSlider);

    console.log(slider);




// Seleciona todas as cartas de produto
    const cards = document.querySelectorAll('.box');

    cards.forEach(card => {
        const image = card.querySelector('.image-container img'); // Seleciona a imagem do produto
        const colorOptions = card.querySelectorAll('.color'); // Seleciona as opções de cor

        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.getAttribute('data-color'); // Obtém a cor selecionada

                // Atualiza o src da imagem com base na cor
                //canetas
                if (color === 'caneta1') {
                    image.src = 'images/outros produtos/caneta.jpg';
                } else if (color === 'caneta2') {
                    image.src = 'images/outros produtos/caneta3.jpg';
                }

                //totes
                if (color === 'tote1') {
                    image.src = 'images/produtos/Tote_Bag_on_the_Ground.jpg';
                } else if (color === 'tote2') {
                    image.src = 'images/produtos/Tote_Bag_on_the_Ground 2.jpg';
                }

                //sweats
                if (color === 'sweat1') {
                    image.src = 'images/produtos/sweat preta 2  - mulher.jpg';
                } else if (color === 'sweat2') {
                    image.src = 'images/produtos/sweat branca 2  - mulher.jpg';
                }
            });
        });
    });

    slider[currentSlide].classList.add('on');
}

function nextSlider() {
    hideSlider()
    if (currentSlide === slider.length - 1) {
        currentSlide = 0
    } else {
        currentSlide++
    }
    showSlider()
}

function prevSlider() {
    hideSlider()
    if (currentSlide === 0) {
        currentSlide = slider.length - 1
    } else {
        currentSlide--
    }
    showSlider()
}

btnNext.addEventListener('click', nextSlider);
btnPrev.addEventListener('click', prevSlider);

console.log(slider);




// Seleciona todas as cartas de produto
const cards = document.querySelectorAll('.box');

cards.forEach(card => {
    const image = card.querySelector('.image-container img'); // Seleciona a imagem do produto
    const colorOptions = card.querySelectorAll('.color'); // Seleciona as opções de cor

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const color = option.getAttribute('data-color'); // Obtém a cor selecionada

            // Atualiza o src da imagem com base na cor
            //canetas
            if (color === 'caneta1') {
                image.src = 'images/outros produtos/caneta.jpg';
            } else if (color === 'caneta2') {
                image.src = 'images/outros produtos/caneta3.jpg';
            }

            //tote
            if (color === 'tote1') {
                image.src = 'images/outros produtos/caneta.jpg';
            } else if (color === 'tote2') {
                image.src = 'images/outros produtos/caneta3.jpg';
            }

            //sweat
            if (color === 'sweat1') {
                image.src = 'images/produtos/sweat preta 2  - mulher.jpg';
            } else if (color === 'sweat2') {
                image.src = 'images/produtos/sweat branca 2  - mulher.jpg';
            }
        });
    });
});