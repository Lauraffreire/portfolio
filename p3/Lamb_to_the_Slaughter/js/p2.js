const canvas = document.getElementById("blurCanvas");

window.addEventListener("mousemove", (e) => {
    canvas.style.setProperty("--mx", e.clientX + "px");
    canvas.style.setProperty("--my", e.clientY + "px");
});

canvas.style.setProperty("--mx", "-9999px");
canvas.style.setProperty("--my", "-9999px");

// Música de fundo
let bgMusic = document.getElementById("bgMusic");

if (!bgMusic) {
    bgMusic = document.createElement("audio");
    bgMusic.id = "bgMusic";
    bgMusic.src = "som/background.mp3";
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    document.body.appendChild(bgMusic);
}

let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;
    bgMusic.play().catch(() => {});
    audioUnlocked = true;

    document.removeEventListener('mousemove', unlockAudio);
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
}

// Liga o desbloqueio na primeira interação
document.addEventListener('mousemove', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });

window.addEventListener('pageshow', () => {
    if (audioUnlocked) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(() => {});
    }
});


