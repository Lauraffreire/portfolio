const esq = document.getElementById("cortina-fechada-esq");
const dir = document.getElementById("cortina-fechada-dir");

const somCortinas = new Audio("som/aplausos.mp3");
somCortinas.loop = true;
somCortinas.volume = 0.4;

let ratoNasLaterais = false;
let fadeInterval = null;
let timeoutStop = null;
somCortinas.play();


document.addEventListener("mousemove", (e) => {
    const x = e.clientX;
    const w = window.innerWidth;

    const agoraNasLaterais = (x < 120 || x > w - 120);

    if (agoraNasLaterais === ratoNasLaterais) return;

    ratoNasLaterais = agoraNasLaterais;

    if (ratoNasLaterais) {
        esq.classList.add("fechar");
        dir.classList.add("fechar");

        startFadeOut(800);
    } else {
        esq.classList.remove("fechar");
        dir.classList.remove("fechar");

        cancelFadeOut();
        somCortinas.volume = 0.4;
        somCortinas.play();
    }
});

function startFadeOut(duration) {
    cancelFadeOut();

    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = somCortinas.volume / steps;

    fadeInterval = setInterval(() => {
        if (somCortinas.volume > volumeStep) {
            somCortinas.volume -= volumeStep;
        } else {
            somCortinas.volume = 0;
        }
    }, stepTime);

    timeoutStop = setTimeout(() => {
        somCortinas.pause();
        somCortinas.currentTime = 0;
        somCortinas.volume = 0.4;
        cancelFadeOut();
    }, duration);
}

function cancelFadeOut() {
    if (fadeInterval) {
        clearInterval(fadeInterval);
        fadeInterval = null;
    }
    if (timeoutStop) {
        clearTimeout(timeoutStop);
        timeoutStop = null;
    }
}
