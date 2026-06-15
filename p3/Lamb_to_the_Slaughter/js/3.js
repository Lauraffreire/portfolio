document.addEventListener("DOMContentLoaded", () => {

    const objetos   = document.querySelectorAll(".obj");
    const descricao = document.querySelector(".descricao-selecao");

    let somFundo = new Audio("som/cantar.mp3");
    somFundo.loop = true;
    somFundo.volume = 0.1;

    function iniciarSomFundo() {
        if (somFundo.paused) {
            somFundo.currentTime = 0;
            somFundo.play().catch(() => {});
        }
    }

    window.addEventListener("pageshow", () => {
        iniciarSomFundo();
    });

    document.addEventListener("click", () => {
        iniciarSomFundo();
    }, { once: true });

    const sonsObjetos = {
        "q3-rolo":   new Audio("som/rolo.mp3"),
        "q3-faca":   new Audio("som/faca.mp3"),
        "q3-colher": new Audio("som/colher.m4a"),
        "q3-gelo":   new Audio("som/cubos.mp3")
    };

    Object.values(sonsObjetos).forEach(som => {
        som.volume = 0.20;
        som.loop = false;
    });

    function pararTodosOsSonsObjetos() {
        Object.values(sonsObjetos).forEach(som => {
            som.pause();
            som.currentTime = 0;
        });
    }

    objetos.forEach(obj => {
        obj.addEventListener("click", () => {

            objetos.forEach(o => o.classList.remove("ativo"));

            obj.classList.add("ativo");

            descricao.textContent = obj.dataset.text || "";

            const radioId = obj.dataset.radio;
            const radio = document.getElementById(radioId);
            if (radio) radio.checked = true;

            pararTodosOsSonsObjetos();

            const somAtual = sonsObjetos[radioId];
            if (somAtual) {
                somAtual.play().catch(() => {});
            }
        });
    });

});
