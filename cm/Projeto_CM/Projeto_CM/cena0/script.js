//controla a aproximacao inicial do titulo durante o scroll
const CONFIG = {
    scene1ScrollVH: 300,
    oOffsetX: 0.29,
    oOffsetY: 0.68,
    maxScale: 28
};

const els = {
    anchor: document.getElementById('title-anchor')
};

function ease(t) {
    return t < 0.5
        ? 4*t*t*t
        : 1 - Math.pow(-2*t+2,3)/2;
}

//aproxima o titulo em direcao ao centro do ecra
function updateScene(progress) {
    const eased = ease(progress);

    const rect = els.anchor.getBoundingClientRect();

    const oX = rect.left + rect.width * CONFIG.oOffsetX;
    const oY = rect.top + rect.height * CONFIG.oOffsetY;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const scale = 1 + eased * (CONFIG.maxScale - 1);

    const dx = (centerX - oX) * eased;
    const dy = (centerY - oY) * eased;

    els.anchor.style.transform =
        `translate(${dx}px, ${dy}px) scale(${scale})`;

    els.anchor.style.transformOrigin =
        `${CONFIG.oOffsetX*100}% ${CONFIG.oOffsetY*100}%`;
}

//converte scroll em progresso da cena inicial
function onScroll() {
    const scrollY = window.scrollY;
    const max = window.innerHeight * 3;

    const progress = Math.min(scrollY / max, 1);

    updateScene(progress);
}

window.addEventListener('scroll', onScroll);
onScroll();
