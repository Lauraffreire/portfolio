document.addEventListener("DOMContentLoaded", () => {

    const video1 = document.getElementById("video-bg");
    const video2 = document.getElementById("video-bg-2");
    const btn    = document.querySelector(".btn");

    if (!video1 || !video2 || !btn) return;

    const somInicio = new Audio("som/porta.mp3");
    somInicio.volume = 0.6;

    const somFecho = new Audio("som/reverse.mp3");
    somFecho.volume = 0.6;

    let jaIniciou = false;
    let fallbackAtivo = false;

    function resetarTudo() {
        jaIniciou = false;

        video1.pause();
        video2.pause();
        video1.currentTime = 0;
        video2.currentTime = 0;

        somInicio.pause();
        somInicio.currentTime = 0;

        somFecho.pause();
        somFecho.currentTime = 0;

        video1.style.display = "block";
        video2.style.display = "none";
    }

    function iniciarPagina() {
        if (jaIniciou) return;
        jaIniciou = true;

        const pV = video1.play();
        const pS = somInicio.play();

        Promise.allSettled([pV, pS]).then(res => {
            const falhou = res.some(r => r.status === "rejected");

            if (falhou && !fallbackAtivo) {
                fallbackAtivo = true;

                document.addEventListener("click", () => {
                    resetarTudo();
                    video1.play().catch(() => {});
                    somInicio.play().catch(() => {});
                    fallbackAtivo = false;
                }, { once: true });
            }
        });
    }

    window.addEventListener("pageshow", () => {
        resetarTudo();
        iniciarPagina();
    });

    video1.addEventListener("ended", () => {
        video1.pause();
    });

    btn.addEventListener("click", () => {

        const selecionada = document.querySelector('input[name="q4"]:checked');
        if (!selecionada) {
            alert("Escolhe uma opção antes de continuar.");
            return;
        }

        video1.pause();
        somInicio.pause();

        video1.style.display = "none";
        video2.style.display = "block";

        video2.currentTime = 0;
        somFecho.currentTime = 0;

        video2.play().catch(() => {});
        somFecho.play().catch(() => {});
        video2.onended = () => {
            if (typeof nextQuestion === "function") {
                nextQuestion("q4", "pergunta5.html");
            } else {
                window.location.href = "pergunta5.html";
            }
        };
    });

});
