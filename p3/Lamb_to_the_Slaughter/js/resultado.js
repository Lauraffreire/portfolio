document.addEventListener("DOMContentLoaded", () => {
    mostrarResultado();
});

function mostrarResultado() {
    const rawScore = parseInt(localStorage.getItem("maryScore") || "0", 10);
    const percentage = Math.min(Math.max(rawScore, 0), 100);
    const percentEl = document.getElementById("percent");
    const titleEl = document.getElementById("result-title");
    const textEl = document.getElementById("result-text");
    const videoEl = document.getElementById("result-video");
    if (!percentEl || !titleEl || !textEl || !videoEl) return;
    percentEl.textContent = `${percentage}% Mary`;
    let title = "";
    let html = "";
    let videoSrc = "";
    let audioSrc = "";
    if (percentage <= 15) {
        title = "Coração de Algodão";
        videoSrc = "img/15.mp4";
        audioSrc = "som/15.mp3";
        html = "<p><strong>Diagnóstico:</strong> És basicamente o oposto da Mary. Tens boa fé, boa energia e provavelmente pedes desculpa quando alguém te pisa.</p> " +
            "<p><strong>O teu estilo:</strong> Confias no diálogo, acreditas no melhor das pessoas e resolves tudo com chá, mantas e conversas profundas.</p> " +
            "<p><strong>Chance de cometer crime passional:</strong> 0.01% - e seria por acidente.</p> " +
            "<p><strong>Comentário da Mary:</strong> \"Tão puro, tão ingénuo... quase dá pena.\"</p>";
    } else if (percentage <= 35) {
        tisposptle = "Cidadão Funcional";
        videoSrc = "img/35.mp4";
        audioSrc = "som/35.mp3";
        html = "<p><strong>Diagnóstico:</strong> Mentalmente estável, surpreendentemente até.</p> " +
            "<p><strong>O teu estilo:</strong> Conversas, conforto e gelado a tua combinação favorita.</p> " +
            "<p><strong>Chance de cometer crime passional:</strong> 5% só em circunstâncias muito extremas.</p> " +
            "<p><strong>Comentário da Mary:</strong> \"Discreto/a, simples… pelo menos não és chato/a.\"</p>";
    } else if (percentage <= 55) {
        title = "Serenidade Sombria";
        videoSrc = "img/55.mp4";
        audioSrc = "som/55.mp3";
        html = "<p><strong>Diagnóstico:</strong> Tens um lado sombrio discreto, daqueles que só aparece quando alguém te irrita a sério.</p> " +
            "<p><strong>O teu estilo:</strong> Não ficas zangado/a, ficas estratégico/a. Observas, calculas e só depois ages.</p> " +
            "<p><strong>Chance de cometer crime passional:</strong> 30%, depende do dia e do café que tomaste.</p> " +
            "<p><strong>Comentário da Mary:</strong> \"Vejo potencial... precisas de mentoria?\"</p>";
    } else if (percentage <= 75) {
        title = "Perigo Silencioso";
        videoSrc = "img/75.mp4";
        audioSrc = "som/75.mp3";
        html = "<p><strong>Diagnóstico:</strong> És o tipo de pessoa que sorri calmamente enquanto o mundo desaba. Preocupante, mas elegante.</p> " +
            "<p><strong>O teu estilo:</strong> Ficas sereno/a nas piores situações e tens uma capacidade assustadora de parecer convincente.</p> " +
            "<p><strong>Potencial de caos:</strong> 75%, não recomendo que te contrariem antes do jantar.</p> " +
            "<p><strong>Comentário da Mary:</strong> \"Estou orgulhosa. És quase tão convincente quanto eu… quase.\"</p>";
    } else {
        title = "Mary Reencarnada";
        videoSrc = "img/100.mp4";
        audioSrc = "som/100.mp3";
        html = "<p><strong>Diagnóstico:</strong> Parabéns? És psicologicamente idêntica à Mary.</p> " +
            "<p><strong>O teu estilo:</strong> Em crises entras em piloto automático, tens uma criatividade… questionável, e planeias sob pressão como se fosse um hobby.</p> " +
            "<p><strong>Chance de cometer crime passional:</strong> 99% (o 1% é só porque ainda não houve oportunidade).</p> " +
            "<p><strong>Comentário da Mary:</strong> \"Finalmente, alguém ao meu nível. Jantas comigo? Eu cozinho…\"</p> " +
            "<p><strong>Nota:</strong> Por favor mantém-te longe de congeladores e polícias. Por precaução.</p>";
    }
    titleEl.textContent = title;
    textEl.innerHTML = html;
    videoEl.src = videoSrc;
    videoEl.muted = true;
    videoEl.loop = false;
    videoEl.currentTime = 0;
    videoEl.play().catch(() => {
    });
    const audio = new Audio(audioSrc);
    audio.volume = 0.7;
    audio.loop = false;
    audio.currentTime = 0;
    audio.play().catch(() => {
    });
    videoEl.addEventListener("ended", () => videoEl.pause());
    audio.addEventListener("ended", () => audio.pause());
}

function resetQuiz() {
    localStorage.setItem("maryScore", "0");
    window.location.href = "index.html";
}