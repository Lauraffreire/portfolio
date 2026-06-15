const container = document.getElementById("canvas-container");

const carneCanvas = document.getElementById("carne-canvas");
const carneCtx = carneCanvas.getContext("2d");

const laCanvas = document.getElementById("la-canvas");
const laCtx = laCanvas.getContext("2d");

// Detectar mobile
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/*sons*/
const scratchSounds = [];
for (let i = 1; i <= 7; i++) {
    const audio = new Audio(`som/${i}.mp4`);
    audio.preload = "auto";
    scratchSounds.push(audio);
}

let lastSoundTime = 0;
const SOUND_COOLDOWN = 400;
let smoothedSpeed = 0;
const SPEED_SMOOTHING = 0.15;
let audioUnlocked = false;

// desbloquear áudio
function unlockAllAudio() {
    if (audioUnlocked) return;

    scratchSounds.forEach(sound => {
        sound.volume = 0;
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
            sound.volume = 1;
        }).catch(() => {});
    });

    audioUnlocked = true;
}

// primeira interação
document.addEventListener("mousemove", unlockAllAudio);
document.addEventListener("click", unlockAllAudio);
document.addEventListener("touchstart", unlockAllAudio);

// quando volta com back/forward
window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        scratchSounds.forEach(sound => {
            sound.currentTime = 0;
            sound.play().then(() => sound.pause()).catch(() => {});
        });
        audioUnlocked = true;
    }
});

function playScratchSound(speed) {
    const now = performance.now();

    if (!audioUnlocked) return;
    if (speed < 12) return;
    if (now - lastSoundTime < SOUND_COOLDOWN) return;

    lastSoundTime = now;

    const sound = scratchSounds[Math.floor(Math.random() * scratchSounds.length)];
    sound.currentTime = 0;
    sound.volume = Math.min(0.8, Math.pow(speed / 40, 1.4));
    sound.play().catch(() => {});
}

/*imgs*/
const carneImg = new Image();
carneImg.src = 'homepage/carne.png';

const laImg = new Image();
laImg.src = 'homepage/la_image.png';

/*resize*/
function resize() {
    carneCanvas.width = laCanvas.width = container.clientWidth;
    carneCanvas.height = laCanvas.height = container.clientHeight;
}
window.addEventListener("resize", resize);
resize();

/*ribbons*/
const ribbons = [];
const ribbonCount = 10;
const pointCount = 12;
const baseSpring = 0.01;
const baseFriction = 0.9;
const maxBrushWidth = 70;

for (let i = 0; i < ribbonCount; i++) {
    const points = [];
    for (let j = 0; j < pointCount; j++) {
        points.push({
            x: laCanvas.width / 2,
            y: laCanvas.height / 2
        });
    }
    ribbons.push({
        points,
        velocity: { x: 0, y: 0 },
        offset: (i - ribbonCount / 2) * 2
    });
}

/*mouse*/
const mouse = {
    x: laCanvas.width / 2,
    y: laCanvas.height / 2
};

let lastMouse = { ...mouse };

let autoMouse = { ...mouse };
let autoTarget = { ...mouse };
let framesToNextTarget = 100;

document.addEventListener("mousemove", e => {
    const rect = laCanvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

/*update*/
function updateRibbons() {

    // movimento automático no mobile
    if (isMobile) {
        framesToNextTarget--;
        if (framesToNextTarget <= 0) {
            autoTarget.x = Math.random() * laCanvas.width;
            autoTarget.y = Math.random() * laCanvas.height;
            framesToNextTarget = 40 + Math.random() * 80;
        }

        autoMouse.x += (autoTarget.x - autoMouse.x) * 0.07;
        autoMouse.y += (autoTarget.y - autoMouse.y) * 0.1;

        mouse.x = autoMouse.x;
        mouse.y = autoMouse.y;
    }

    const dx = mouse.x - lastMouse.x;
    const dy = mouse.y - lastMouse.y;
    const rawSpeed = Math.hypot(dx, dy);

    smoothedSpeed += (rawSpeed - smoothedSpeed) * SPEED_SMOOTHING;

    playScratchSound(smoothedSpeed);

    const moving = smoothedSpeed > 0.5;

    ribbons.forEach(ribbon => {
        const head = ribbon.points[0];

        if (moving) {
            const dx = mouse.x + ribbon.offset - head.x;
            const dy = mouse.y - head.y;
            ribbon.velocity.x = ribbon.velocity.x * baseFriction + dx * baseSpring;
            ribbon.velocity.y = ribbon.velocity.y * baseFriction + dy * baseSpring;
        } else {
            ribbon.velocity.x *= 0.92;
            ribbon.velocity.y *= 0.92;
            if (Math.hypot(ribbon.velocity.x, ribbon.velocity.y) < 0.05) {
                ribbon.velocity.x = 0;
                ribbon.velocity.y = 0;
            }
        }

        head.x += ribbon.velocity.x;
        head.y += ribbon.velocity.y;

        for (let i = 1; i < ribbon.points.length; i++) {
            const p = ribbon.points[i];
            const prev = ribbon.points[i - 1];
            p.x += (prev.x - p.x) * 0.3;
            p.y += (prev.y - p.y) * 0.3;
        }
    });

    lastMouse = { ...mouse };
}

/*draw*/
function drawCoverImage(ctx, img, canvas) {
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function draw() {
    carneCtx.clearRect(0, 0, carneCanvas.width, carneCanvas.height);
    drawCoverImage(carneCtx, carneImg, carneCanvas);

    laCtx.clearRect(0, 0, laCanvas.width, laCanvas.height);
    drawCoverImage(laCtx, laImg, laCanvas);

    laCtx.save();
    laCtx.globalCompositeOperation = 'destination-out';
    laCtx.lineCap = 'round';
    laCtx.lineJoin = 'round';

    ribbons.forEach(ribbon => {
        const pts = ribbon.points;
        const speed = Math.hypot(ribbon.velocity.x, ribbon.velocity.y);

        for (let i = 0; i < pts.length - 1; i++) {
            const t = (i + 0.5) / (pts.length - 1);
            let width = Math.sin(Math.PI * t) * maxBrushWidth;
            width *= Math.min(1, speed / 10);
            if (width < 0.5) continue;

            laCtx.lineWidth = width;
            laCtx.beginPath();
            laCtx.moveTo(pts[i].x, pts[i].y);
            laCtx.lineTo(pts[i + 1].x, pts[i + 1].y);
            laCtx.stroke();
        }
    });

    laCtx.restore();
}

/*loop*/
function animate() {
    updateRibbons();
    draw();
    requestAnimationFrame(animate);
}

/*start*/
let imagesLoaded = 0;
[carneImg, laImg].forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) animate();
    };
});
