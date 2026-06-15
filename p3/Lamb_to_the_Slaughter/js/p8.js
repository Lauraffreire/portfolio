const bgCanvas = document.getElementById("bgCanvas");
const bgCtx = bgCanvas.getContext("2d");

const bloodCanvas = document.getElementById("bloodCanvas");
const ctx = bloodCanvas.getContext("2d");

/*canvas*/
function resizeCanvas() {
    bgCanvas.width = bloodCanvas.width = window.innerWidth;
    bgCanvas.height = bloodCanvas.height = window.innerHeight;

    drawBackground();
    drawBloodTexture();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

//fundo
function drawBackground() {
    const w = bgCanvas.width;
    const h = bgCanvas.height;

    const gradient = bgCtx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#240c06");
    gradient.addColorStop(1, "#240c06");

    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, w, h);
}

/*sangue*/
function drawBloodSpot(ctx, x, y, maxRadius = 80) {
    const radius = 3 + Math.random() * maxRadius;
    ctx.fillStyle = "#6e0f0f";

    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.1, radius, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();

    for (let j = 0; j < 7; j++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = radius * (0.5 + Math.random());
        const sx = x + Math.cos(angle) * dist;
        const sy = y + Math.sin(angle) * dist;

        ctx.beginPath();
        ctx.arc(sx, sy, Math.random() * 5 + 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBloodTexture() {
    const w = bloodCanvas.width;
    const h = bloodCanvas.height;

    for (let i = 0; i < 40000; i++) {
        ctx.fillStyle = `rgba(120,0,0,${Math.random() * 0.25})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    const usedSpots = [];
    const MIN_DISTANCE = 300;

    for (let i = 0; i < 70; i++) {
        let x, y, valid = false, tries = 0;

        while (!valid && tries < 50) {
            x = Math.random() * w;
            y = Math.random() * h;
            valid = usedSpots.every(s => Math.hypot(x - s.x, y - s.y) > MIN_DISTANCE);
            tries++;
        }

        usedSpots.push({ x, y });
        drawBloodSpot(ctx, x, y);
    }
}

/*borracha*/

const eraserSize = 60;

/*aúdio*/
const cleaningSound = new Audio("som/cleaning.mp4");
cleaningSound.loop = true;
cleaningSound.volume = 0;
cleaningSound.playbackRate = 1;

let lastX = null;
let lastY = null;
let lastTime = null;
let stopTimeout = null;

/* fade out suave */
function fadeOutAudio(audio, duration = 300) {
    const startVol = audio.volume;
    const steps = 20;
    let i = 0;

    const fade = setInterval(() => {
        i++;
        audio.volume = startVol * (1 - i / steps);
        if (i >= steps) {
            clearInterval(fade);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = startVol;
            audio.playbackRate = 1;
        }
    }, duration / steps);
}

/*mouse*/
function handleMouseMove(e) {
    const now = performance.now();

    if (lastX !== null) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dt = now - lastTime;

        const speed = Math.hypot(dx, dy) / dt; // px/ms

        /* MAPEAR VELOCIDADE */
        const volume = Math.min(1, speed * 3);
        const rate = Math.min(1.4, 1 + speed * 0.6);

        cleaningSound.volume = volume;
        cleaningSound.playbackRate = rate;

        if (cleaningSound.paused) {
            cleaningSound.play().catch(() => {});
        }
    }

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;

    /* apagar sangue */
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const gradient = ctx.createRadialGradient(
        e.clientX, e.clientY, 0,
        e.clientX, e.clientY, eraserSize * 1.5
    );

    gradient.addColorStop(0, "rgba(0,0,0,0.5)");
    gradient.addColorStop(0.5, "rgba(0,0,0,0.1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(e.clientX, e.clientY, eraserSize * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    clearTimeout(stopTimeout);
    stopTimeout = setTimeout(() => {
        fadeOutAudio(cleaningSound, 50);
    }, 50);
}

window.addEventListener("mousemove", handleMouseMove);

window.addEventListener("pageshow", () => {
    cleaningSound.pause();
    cleaningSound.currentTime = 0;
});
