//desenha e anima o tunel em canvas
const TUNNEL_TRANSITION_SOUND_URL = new URL(
    "../som/transicaotunel.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const INSIDE_TUNNEL_SOUND_URL = new URL(
    "../som/dentrodotunel.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;

const tunnelRuntime = {
    canvas: null,
    ctx: null,
    animId: null,
    depth: 0,
    scrollBoost: 0,
    zoomLevel: 0,
    lastFrameTime: 0,
    lastWheelTime: 0,
    fadeOverlay: null,
    phase: "fadein",
    phaseStart: 0,
    FADE_IN_MS: 200,
    FADE_OUT_MS: 900,
    sceneId: null,
    transitionSoundPlayed: false,
    insideTunnelAudio: null,
    insideTunnelFadeId: 0,
    insideTunnelPlayPending: false
};

const TUNNEL = {
    halfSize: 430,
    near: 90,
    segmentLength: 180,
    segmentCount: 96,
    autoSpeed: 1.15,
    wheelImpulse: 0.032,
    maxScrollBoost: 13.5,
    drag: 0.935,
    maxForwardSpeed: 16,
    maxReverseSpeed: 10
};

const TUNNEL_CORNERS = [{x:-1,y:-1},{x:1,y:-1},{x:1,y:1},{x:-1,y:1}];
const TUNNEL_WALLS   = [[0,1],[1,2],[2,3],[3,0]];

function playTunnelTransitionSound() {
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(TUNNEL_TRANSITION_SOUND_URL, { volume: 0.8 })
        : new Audio(TUNNEL_TRANSITION_SOUND_URL);

    sound.volume = 0.8;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
}

function getInsideTunnelAudio() {
    if (!tunnelRuntime.insideTunnelAudio) {
        tunnelRuntime.insideTunnelAudio = new Audio(INSIDE_TUNNEL_SOUND_URL);
        tunnelRuntime.insideTunnelAudio.loop = true;
        tunnelRuntime.insideTunnelAudio.volume = 0;
        tunnelRuntime.insideTunnelAudio.preload = "auto";
    }

    return tunnelRuntime.insideTunnelAudio;
}

//prepara o som interior do tunel apos gesto do utilizador
function primeInsideTunnelSound() {
    const audio = getInsideTunnelAudio();

    if (!audio.paused || tunnelRuntime.insideTunnelPlayPending) {
        return;
    }

    audio.muted = true;
    audio.volume = 0;
    tunnelRuntime.insideTunnelPlayPending = true;
    audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        tunnelRuntime.insideTunnelPlayPending = false;
    }).catch(() => {
        audio.muted = false;
        tunnelRuntime.insideTunnelPlayPending = false;
    });
}

//faz fade do som interior do tunel
function fadeInsideTunnelAudio(targetVolume, durationMs, options = {}) {
    const rt = tunnelRuntime;
    const audio = getInsideTunnelAudio();
    const startVolume = audio.volume;
    const startTime = performance.now();
    const duration = Math.max(durationMs, 1);

    if (rt.insideTunnelFadeId) {
        window.cancelAnimationFrame(rt.insideTunnelFadeId);
        rt.insideTunnelFadeId = 0;
    }

    if (targetVolume > 0 && audio.paused) {
        rt.insideTunnelPlayPending = true;
        audio.muted = false;
        audio.play().then(() => {
            rt.insideTunnelPlayPending = false;
        }).catch(() => {
            rt.insideTunnelPlayPending = false;

        });
    }

    const step = (time) => {
        const progress = Math.min(1, (time - startTime) / duration);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress < 1) {
            rt.insideTunnelFadeId = window.requestAnimationFrame(step);
            return;
        }

        rt.insideTunnelFadeId = 0;
        audio.volume = targetVolume;

        if (options.stopAfter || targetVolume <= 0.001) {
            audio.pause();
            audio.currentTime = 0;
        }
    };

    rt.insideTunnelFadeId = window.requestAnimationFrame(step);
}

//inicia o som continuo do tunel
function startInsideTunnelSound() {
    fadeInsideTunnelAudio(0.58, 2600);
}

//para o som continuo do tunel
function stopInsideTunnelSound({ fade = true } = {}) {
    const audio = tunnelRuntime.insideTunnelAudio;

    if (!audio) {
        return;
    }

    if (fade) {
        fadeInsideTunnelAudio(0, 900, { stopAfter: true });
        return;
    }

    if (tunnelRuntime.insideTunnelFadeId) {
        window.cancelAnimationFrame(tunnelRuntime.insideTunnelFadeId);
        tunnelRuntime.insideTunnelFadeId = 0;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
}

//projeta pontos do tunel em perspectiva
function tunnelProjectPoint(cx, cy, px, py, z) {
    const baseSize = Math.min(tunnelRuntime.canvas.width / (window.devicePixelRatio || 1),
                              tunnelRuntime.canvas.height / (window.devicePixelRatio || 1));

    const focalMult = 1.18 + tunnelRuntime.zoomLevel * 4.2;
    const focal = baseSize * focalMult;
    const scale = focal / z;
    return { x: cx + px * scale, y: cy + py * scale };
}

//calcula um anel do tunel a uma dada profundidade
function tunnelFrameAt(cx, cy, w, h, z) {
    const twist = tunnelRuntime.depth * 0.0023 + z * 0.00082;
    const cos = Math.cos(twist);
    const sin = Math.sin(twist);
    const driftX = Math.sin((tunnelRuntime.depth + z) * 0.0011) * (w * 0.07);
    const driftY = Math.cos((tunnelRuntime.depth + z) * 0.00135) * (h * 0.05);
    const radiusLimit = Math.min(w, h) * 0.44;
    const radius = Math.min(TUNNEL.halfSize, radiusLimit);
    return TUNNEL_CORNERS.map(c => {
        const rx = (c.x * radius) * cos - (c.y * radius) * sin + driftX;
        const ry = (c.x * radius) * sin + (c.y * radius) * cos + driftY;
        return tunnelProjectPoint(cx, cy, rx, ry, z);
    });
}

//desenha um frame completo do tunel
function drawTunnelFrame() {
    const cvs = tunnelRuntime.canvas;
    const ctx = tunnelRuntime.ctx;
    const pr = window.devicePixelRatio || 1;
    const w = cvs.width / pr;
    const h = cvs.height / pr;
    const cx = w / 2;
    const cy = h / 2;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#2a0030");
    bg.addColorStop(0.4, "#160026");
    bg.addColorStop(1, "#020018");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const segOff = tunnelRuntime.depth % TUNNEL.segmentLength;
    for (let i = TUNNEL.segmentCount; i >= 0; i--) {
        const zNear = TUNNEL.near + i * TUNNEL.segmentLength - segOff;
        const zFar  = zNear + TUNNEL.segmentLength;
        if (zNear <= 26 || zFar <= TUNNEL.near + 1) continue;

        const fNear = tunnelFrameAt(cx, cy, w, h, zNear);
        const fFar  = tunnelFrameAt(cx, cy, w, h, zFar);
        const d01   = Math.min(1, zNear / (TUNNEL.segmentCount * TUNNEL.segmentLength));

        for (let wid = 0; wid < TUNNEL_WALLS.length; wid++) {
            const [ai, bi] = TUNNEL_WALLS[wid];
            const hue   = wid % 2 === 0 ? 305 : 274;
            const light = 27 - d01 * 17 + (wid % 2 === 0 ? 2 : -2);
            const sat   = 46 + wid * 3;
            ctx.fillStyle = `hsla(${hue},${sat}%,${light}%,0.9)`;
            ctx.beginPath();
            ctx.moveTo(fNear[ai].x, fNear[ai].y);
            ctx.lineTo(fNear[bi].x, fNear[bi].y);
            ctx.lineTo(fFar[bi].x,  fFar[bi].y);
            ctx.lineTo(fFar[ai].x,  fFar[ai].y);
            ctx.closePath();
            ctx.fill();
        }

        const fa = Math.max(0.05, 0.28 - d01 * 0.2);
        ctx.strokeStyle = `rgba(188,154,240,${fa})`;
        ctx.lineWidth = Math.max(0.55, (h / zNear) * 0.16);
        ctx.beginPath();
        ctx.moveTo(fNear[0].x, fNear[0].y);
        for (let k = 1; k < fNear.length; k++) ctx.lineTo(fNear[k].x, fNear[k].y);
        ctx.closePath();
        ctx.stroke();
    }

    const vig = ctx.createRadialGradient(cx, cy, Math.min(w,h)*0.15, cx, cy, Math.max(w,h)*0.78);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(1,0,10,0.68)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
}

//atualiza movimento, zoom, som e fade do tunel
function tunnelAnimate(ts) {
    const rt = tunnelRuntime;
    if (state.currentSceneId !== rt.sceneId) return;

    if (!rt.lastFrameTime) rt.lastFrameTime = ts;
    const ff = Math.min(2.5, (ts - rt.lastFrameTime) / (1000/60));
    rt.lastFrameTime = ts;

    rt.scrollBoost *= Math.pow(TUNNEL.drag, ff);
    const speed = Math.max(-TUNNEL.maxReverseSpeed, Math.min(TUNNEL.maxForwardSpeed, TUNNEL.autoSpeed + rt.scrollBoost));
    rt.depth = Math.max(0, rt.depth + speed * ff);


    const scrollForward = Math.max(0, rt.scrollBoost);
    const prevZoom = rt.zoomLevel;
    rt.zoomLevel = Math.min(1, rt.zoomLevel + scrollForward * 0.0008 * ff);

    drawTunnelFrame();


    if (rt.fadeOverlay) {
        const elapsed = ts - rt.phaseStart;
        if (rt.phase === "fadein") {
            const t = Math.min(1, elapsed / rt.FADE_IN_MS);
            rt.fadeOverlay.style.opacity = String(1 - t);
            if (t >= 1) {
                rt.phase = "running";
                rt.phaseStart = ts;
            }
        } else if (rt.phase === "running") {

            if (prevZoom < 1 && rt.zoomLevel >= 1) {
                rt.phase = "fadeout";
                rt.phaseStart = ts;
                if (!rt.transitionSoundPlayed) {
                    rt.transitionSoundPlayed = true;
                    stopInsideTunnelSound({ fade: true });
                    playTunnelTransitionSound();
                }
            }
        } else if (rt.phase === "fadeout") {
            const t = Math.min(1, elapsed / rt.FADE_OUT_MS);

            const eased = t * t * t;
            rt.fadeOverlay.style.opacity = String(eased);
            if (t >= 1) {
                teardownCanvasTunnel();
                const nextId = getCurrentScene().nextSceneId || state.currentSceneId + 1;
                const nextScene = getSceneById(nextId);
                if (nextScene) {
                    state.sceneState.set(nextScene.id, getDefaultSceneState(nextScene));
                    getSceneState(nextScene).cameFromTunnel = true;
                }
                goToScene(nextId, { animate: false });
                return;
            }
        }
    }

    rt.animId = window.requestAnimationFrame(tunnelAnimate);
}

//limpa canvas, eventos e audio ao sair do tunel
function teardownCanvasTunnel() {
    const rt = tunnelRuntime;
    if (rt.animId) { window.cancelAnimationFrame(rt.animId); rt.animId = null; }
    window.removeEventListener("wheel", tunnelOnWheel);
    window.removeEventListener("pointerdown", retryInsideTunnelSoundFromGesture);
    window.removeEventListener("click", retryInsideTunnelSoundFromGesture);
    window.removeEventListener("keydown", retryInsideTunnelSoundFromGesture);
    stopInsideTunnelSound({ fade: false });
    rt.canvas = null; rt.ctx = null; rt.fadeOverlay = null;
    rt.phase = "fadein"; rt.depth = 0; rt.scrollBoost = 0; rt.zoomLevel = 0; rt.lastFrameTime = 0;
    rt.transitionSoundPlayed = false;
}

//converte scroll em impulso de movimento no tunel
function tunnelOnWheel(e) {
    if (state.currentSceneId !== tunnelRuntime.sceneId) return;
    if (tunnelRuntime.insideTunnelAudio && tunnelRuntime.insideTunnelAudio.paused && tunnelRuntime.phase !== "fadeout") {
        startInsideTunnelSound();
    }
    tunnelRuntime.scrollBoost = Math.max(-TUNNEL.maxScrollBoost,
        Math.min(TUNNEL.maxScrollBoost, tunnelRuntime.scrollBoost + e.deltaY * TUNNEL.wheelImpulse));
}

//tenta tocar o som do tunel apos um gesto
function retryInsideTunnelSoundFromGesture() {
    if (state.currentSceneId !== tunnelRuntime.sceneId || tunnelRuntime.phase === "fadeout") {
        return;
    }

    if (!tunnelRuntime.insideTunnelAudio || tunnelRuntime.insideTunnelAudio.paused) {
        startInsideTunnelSound();
    }
}

//ajusta o canvas a janela e densidade do ecra
function tunnelResizeCanvas() {
    const rt = tunnelRuntime;
    if (!rt.canvas) return;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    rt.canvas.width  = Math.round(window.innerWidth * pr);
    rt.canvas.height = Math.round(window.innerHeight * pr);
    rt.canvas.style.width  = window.innerWidth  + "px";
    rt.canvas.style.height = window.innerHeight + "px";
    rt.ctx.setTransform(pr, 0, 0, pr, 0, 0);
}

//monta o canvas e inicia a animacao do tunel
function renderCanvasTunnelScene(scene) {
    const rt = tunnelRuntime;

    dom.sceneImage.hidden = true;
    dom.sceneBackdrop.style.background = "#090016";


    const cvs = document.createElement("canvas");
    cvs.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    dom.sceneOverlay.style.pointerEvents = "auto";
    dom.sceneOverlay.append(cvs);


    const fade = document.createElement("div");
    fade.style.cssText = "position:absolute;inset:0;background:#000;opacity:1;pointer-events:none;z-index:10;transition:none;";
    dom.sceneOverlay.append(fade);

    rt.canvas = cvs;
    rt.ctx = cvs.getContext("2d");
    rt.fadeOverlay = fade;
    rt.phase = "fadein";
    rt.phaseStart = performance.now();
    rt.sceneId = scene.id;
    rt.transitionSoundPlayed = false;
    rt.FADE_IN_MS  = scene.fadeInDuration || 900;
    rt.FADE_OUT_MS = 1400;
    startInsideTunnelSound();

    tunnelResizeCanvas();
    window.addEventListener("wheel", tunnelOnWheel, { passive: true });
    window.addEventListener("pointerdown", retryInsideTunnelSoundFromGesture, { passive: true });
    window.addEventListener("click", retryInsideTunnelSoundFromGesture, { passive: true });
    window.addEventListener("keydown", retryInsideTunnelSoundFromGesture);

    setCaption(scene.instruction || "");
    setProgress(0, 0, "");

    rt.lastFrameTime = 0;
    rt.animId = window.requestAnimationFrame(tunnelAnimate);
}
