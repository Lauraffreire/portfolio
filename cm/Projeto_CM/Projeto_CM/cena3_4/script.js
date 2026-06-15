//controla a floresta, os elementos interativos, o fumo e as cartas
const FOREST_SCRIPT_URL = document.currentScript ? document.currentScript.src : window.location.href;
const FLOWER_SOUND_URLS = {
    "cena3_4/flor1.png": "../som/flor2.mp3",
    "cena3_4/flor2.png": "../som/flor3.mp3",
    "cena3_4/flor3.png": "../som/flor4.mp3",
    "cena3_4/flor4.png": "../som/flor5.mp3",
    "cena3_4/flor5.png": "../som/flor6.mp3",
    "cena3_4/flor6.png": "../som/flor1.mp3"
};
const FOREST_AMBIENT_SOUND_URL = new URL(
    "../som/floresta.mp3",
    FOREST_SCRIPT_URL
).href;
const LIZARD_SOUND_URL = new URL(
    "../som/lagarto.mp3",
    FOREST_SCRIPT_URL
).href;
const FOREST_AMBIENT_MAX_VOLUME = 0.16;

const forestAmbientState = {
    audio: null
};

//cria o contexto de audio partilhado para sons sintetizados
function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        return null;
    }

    if (!audioState.context) {
        audioState.context = new AudioContextClass();
    }

    return audioState.context;
}

function getAudioDurationMs(audio, fallbackMs = 900) {
    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        return clamp(audio.duration * 1000, 560, 3200);
    }

    return fallbackMs;
}

function getFlowerFallbackDurationMs(prop) {
    const decayMs = prop && prop.sound && Number.isFinite(prop.sound.decay)
        ? prop.sound.decay * 1000
        : 900;

    return clamp(decayMs * 2.6, 720, 1400);
}

//aplica animacao visual quando uma flor e tocada
function animateFlowerHit(element, durationMs = 900) {
    if (!element.animate) {
        return;
    }

    element.getAnimations().forEach((animation) => {
        animation.cancel();
    });

    element.animate(
        [
            { transform: "translate3d(0, 0, 0) scale(1)" },
            {
                offset: 0.12,
                transform: "translate3d(0, 1.2%, 0) scale(0.988, 1.014)"
            },
            {
                offset: 0.44,
                transform: "translate3d(0, -7.2%, 0) scale(1.012, 0.99)"
            },
            {
                offset: 0.82,
                transform: "translate3d(0, -4.8%, 0) scale(1.006, 0.994)"
            },
            { transform: "translate3d(0, 0, 0) scale(1)" }
        ],
        {
            duration: Math.max(durationMs, 1),
            easing: "cubic-bezier(0.18, 0.72, 0.22, 1)"
        }
    );
}

function isFlowerProp(prop) {
    return Boolean(prop && /\/flor\d+\./.test(prop.asset));
}

function getFlowerSoundUrl(prop) {
    const soundPath = FLOWER_SOUND_URLS[prop.asset] || "../som/flor2.mp3";

    return new URL(
        soundPath,
        FOREST_SCRIPT_URL
    ).href;
}

function playFlowerFileSound(prop) {
    const soundUrl = getFlowerSoundUrl(prop);
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(soundUrl, { volume: 0.75 })
        : new Audio(soundUrl);

    sound.volume = 0.75;
    if (!sound.paused) return sound;
    sound.play().catch(() => {

    });

    return sound;
}

function playPropFileSound(prop, options = {}) {
    const soundUrl = new URL(
        prop.soundFile,
        FOREST_SCRIPT_URL
    ).href;
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(soundUrl, { volume: prop.soundVolume ?? 0.85 })
        : new Audio(soundUrl);

    sound.volume = prop.soundVolume ?? 0.85;

    if (typeof options.onEnd === "function") {
        sound.addEventListener("ended", options.onEnd, { once: true });
        sound.addEventListener("error", options.onEnd, { once: true });
    }

    if (!sound.paused) return sound;

    sound.play().catch(() => {
        if (typeof options.onEnd === "function") {
            options.onEnd();
        }

    });

    return sound;
}

function playLizardSmokeSound() {
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(LIZARD_SOUND_URL, { volume: 0.8 })
        : new Audio(LIZARD_SOUND_URL);

    sound.volume = 0.8;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
}

function getForestAmbientAudio() {
    if (!forestAmbientState.audio) {
        forestAmbientState.audio = new Audio(FOREST_AMBIENT_SOUND_URL);
        forestAmbientState.audio.loop = true;
        forestAmbientState.audio.volume = 0;
    }

    return forestAmbientState.audio;
}

function playForestAmbientAtVolume(volume) {
    const audio = getForestAmbientAudio();
    const nextVolume = clamp(volume, 0, FOREST_AMBIENT_MAX_VOLUME);

    audio.volume = nextVolume;

    if (nextVolume <= 0) {
        return;
    }

    if (audio.paused) {
        audio.play().catch(() => {

        });
    }
}

function stopForestAmbient() {
    const audio = forestAmbientState.audio;

    if (!audio) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
}

//sincroniza o ambiente sonoro da floresta com a cena atual
function syncForestAmbientAudio(scene) {
    if (scene && scene.kind === "forest-scroll") {
        playForestAmbientAtVolume(FOREST_AMBIENT_MAX_VOLUME);
        return;
    }

    if (scene && Number.isFinite(scene.forestAmbientVolume)) {
        playForestAmbientAtVolume(scene.forestAmbientVolume);
        return;
    }

    if (scene && scene.kind === "doors") {
        const doorState = getSceneState(scene);
        const step = getDoorSequenceStep(doorState.stepIndex);
        const backdropScene = step && step.backdropSceneId ? getSceneById(step.backdropSceneId) : null;

        if (backdropScene && backdropScene.kind === "forest-scroll") {
            playForestAmbientAtVolume((doorState.scrollProgress || 0) * FOREST_AMBIENT_MAX_VOLUME);
            return;
        }
    }

    stopForestAmbient();
}

function syncForestAmbientAudioForDoorTransition(scene, progress) {
    const step = scene && scene.kind === "doors"
        ? getDoorSequenceStep(getSceneState(scene).stepIndex)
        : null;
    const backdropScene = step && step.backdropSceneId ? getSceneById(step.backdropSceneId) : null;

    if (!backdropScene || backdropScene.kind !== "forest-scroll") {
        return;
    }

    playForestAmbientAtVolume(clamp(progress, 0, 1) * FOREST_AMBIENT_MAX_VOLUME);
}

//toca o som sintetizado de uma flor com panoramica
function playFlowerSound(prop, element, sceneRect) {
    const context = getAudioContext();

    if (!context) {
        return;
    }

    if (context.state === "suspended") {
        context.resume();
    }

    const now = context.currentTime;
    const attack = prop.sound.attack || 0.01;
    const decay = prop.sound.decay || 0.26;
    const startFrequency = prop.sound.frequency;
    const endFrequency = startFrequency * (prop.sound.bend || 0.9);
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const merger = context.createGain();
    const supportsStereoPanner = typeof context.createStereoPanner === "function";
    const panner = supportsStereoPanner ? context.createStereoPanner() : null;

    oscillator.type = prop.sound.waveform || "triangle";
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + decay);

    overtone.type = "sine";
    overtone.frequency.setValueAtTime(startFrequency * 2, now);
    overtone.frequency.exponentialRampToValueAtTime(endFrequency * 1.5, now + decay * 0.9);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(startFrequency * 5.5, now);
    filter.frequency.exponentialRampToValueAtTime(startFrequency * 1.8, now + decay);
    filter.Q.setValueAtTime(1.6, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    merger.gain.setValueAtTime(0.85, now);

    oscillator.connect(filter);
    overtone.connect(merger);
    filter.connect(merger);
    merger.connect(gain);

    if (panner && sceneRect) {
        const elementRect = element.getBoundingClientRect();
        const centerX = elementRect.left + elementRect.width / 2;
        const pan = clamp(((centerX - sceneRect.left) / sceneRect.width) * 2 - 1, -0.8, 0.8);
        panner.pan.setValueAtTime(pan, now);
        gain.connect(panner);
        panner.connect(context.destination);
    } else {
        gain.connect(context.destination);
    }

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + decay + 0.05);
    overtone.stop(now + decay + 0.03);
}

//coordena som e animacao quando um elemento da floresta e ativado
function triggerFlowerDrum(prop, button, options = {}) {
    if (isFlowerProp(prop)) {
        const sound = playFlowerFileSound(prop);
        const fallbackDurationMs = getFlowerFallbackDurationMs(prop);

        animateFlowerHit(button, getAudioDurationMs(sound, fallbackDurationMs));

        if (sound && !Number.isFinite(sound.duration)) {
            sound.addEventListener("loadedmetadata", () => {
                animateFlowerHit(button, getAudioDurationMs(sound, fallbackDurationMs));
            }, { once: true });
        }

        return;
    }

    if (prop.soundFile) {
        const sound = playPropFileSound(prop, options);
        animateFlowerHit(button, getAudioDurationMs(sound, 900));
        return;
    }

    animateFlowerHit(button, getFlowerFallbackDurationMs(prop));
    playFlowerSound(prop, button, dom.sceneFrame.getBoundingClientRect());
}

function setInteractiveForestPropVisual(prop, image, isPressed) {
    const nextAsset = isPressed && prop.pressedAsset ? prop.pressedAsset : prop.asset;
    const idleTransform = prop.idleTransform || "";
    const nextTransform = isPressed
        ? (prop.pressedTransform || idleTransform)
        : idleTransform;

    image.src = nextAsset;
    image.style.transform = nextTransform;
}

function getForestPanValue(scene, progressOverride) {
    const forestProgress = typeof progressOverride === "number"
        ? progressOverride
        : getSceneState(scene).progress;

    return lerp(scene.panStart, scene.panEnd, forestProgress);
}

//calcula o enquadramento panoramico da floresta
function getForestMediaRect(scene, progressOverride) {
    const frameRect = getFrameRect();
    const assetMeta = imageCatalog[scene.asset];
    const assetRatio = assetMeta.width / assetMeta.height;
    const height = frameRect.height * (scene.displayScale || 1);
    const width = height * assetRatio;
    const top = (frameRect.height - height) / 2;
    const left = lerp(0, frameRect.width - width, getForestPanValue(scene, progressOverride));

    return { left, top, width, height };
}

function getForestSmokeConfig(scene) {
    if (!scene || scene.kind !== "forest-scroll") {
        return null;
    }

    return scene.smokeTransition || null;
}

function hasPendingForestSmokeTransition(scene) {
    const smokeConfig = getForestSmokeConfig(scene);

    if (!smokeConfig) {
        return false;
    }

    return !getSceneState(scene).smokeUnlocked;
}

function isInteractiveTitleScene(scene) {
    return Boolean(scene && scene.kind === "title-screen" && scene.frameAsset && scene.titleAsset && scene.zoom);
}

//limpa temporizadores e elementos do fumo da floresta
function teardownForestSmokeRuntime() {
    const runtime = state.forestSmokeRuntime;

    if (!runtime) {
        return;
    }

    if (runtime.controller) {
        runtime.controller.abort();
    }

    if (runtime.emitterIntervalId) {
        window.clearInterval(runtime.emitterIntervalId);
    }

    if (runtime.idleTimeoutId) {
        window.clearTimeout(runtime.idleTimeoutId);
    }

    if (runtime.transitionTimeoutId) {
        window.clearTimeout(runtime.transitionTimeoutId);
    }

    if (runtime.engulfRafId) {
        window.cancelAnimationFrame(runtime.engulfRafId);
    }

    dom.sceneFrame.classList.remove("has-lizard-smoke");
    if (!runtime.transitioningToNextScene && runtime.layer && runtime.layer.isConnected) {
        runtime.layer.remove();
    }
    state.forestSmokeRuntime = null;
}

//limpa a transicao das cartas do jardim
function teardownGardenCardRuntime() {
    const runtime = state.gardenCardRuntime;

    if (!runtime) {
        return;
    }

    if (runtime.intervalId) {
        window.clearInterval(runtime.intervalId);
    }

    if (runtime.advanceTimeoutId) {
        window.clearTimeout(runtime.advanceTimeoutId);
    }

    if (runtime.revealIntervalId) {
        window.clearInterval(runtime.revealIntervalId);
    }

    if (runtime.finishTimeoutId) {
        window.clearTimeout(runtime.finishTimeoutId);
    }

    if (runtime.overlay && runtime.overlay.parentNode) {
        runtime.overlay.remove();
    }

    dom.sceneFrame.classList.remove("has-garden-card-transition");
    state.gardenCardRuntime = null;
}

//distribui as cartas que cobrem o ecra
function buildGardenCardRevealLayout(frameRect, config) {
    const cardWidth = clamp(
        frameRect.width * (config.cardWidthRatio || 0.29),
        config.cardMinWidth || 170,
        config.cardMaxWidth || 320
    );
    const cardHeight = cardWidth * (config.cardHeightRatio || 1.08);
    const stepX = cardWidth * (config.cardStepXRatio || 0.68);
    const stepY = cardHeight * (config.cardStepYRatio || 0.58);
    const jitterX = cardWidth * (config.cardJitterXRatio || 0.24);
    const jitterY = cardHeight * (config.cardJitterYRatio || 0.2);
    const columns = Math.ceil((frameRect.width + cardWidth * 1.5) / stepX);
    const rows = Math.ceil((frameRect.height + cardHeight * 1.35) / stepY);
    const assets = config.assets && config.assets.length ? config.assets : gardenCardAssets;
    const cards = [];

    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            const rowOffset = row % 2 === 0 ? 0 : stepX * 0.34;
            const scale = 0.92 + Math.random() * 0.18;
            const width = cardWidth * scale;
            const height = cardHeight * scale;

            cards.push({
                assetName: assets[Math.floor(Math.random() * assets.length)],
                left: -cardWidth * 0.46 + column * stepX + rowOffset + (Math.random() - 0.5) * jitterX,
                top: -cardHeight * 0.42 + row * stepY + (Math.random() - 0.5) * jitterY,
                width,
                height,
                rotation: (Math.random() - 0.5) * 64,
                animationDuration: 340 + Math.random() * 140
            });
        }
    }

    return shuffleArray(cards);
}

//cria cada carta da transicao visual
function createGardenRevealCard(cardData, index) {
    const card = document.createElement("div");
    const image = document.createElement("img");

    card.className = "garden-card-reveal-card";
    card.style.left = `${cardData.left}px`;
    card.style.top = `${cardData.top}px`;
    card.style.width = `${cardData.width}px`;
    card.style.height = `${cardData.height}px`;
    card.style.zIndex = String(index + 1);
    card.style.setProperty("--garden-card-rotate", `${cardData.rotation.toFixed(1)}deg`);
    card.style.animationDuration = `${cardData.animationDuration.toFixed(0)}ms`;

    image.className = "garden-card-reveal-card-image";
    image.src = cardData.assetName;
    image.alt = "";

    card.append(image);
    return card;
}

//termina a transicao das cartas e muda de cena
function finishGardenCardTransition(runtime) {
    if (!runtime || state.gardenCardRuntime !== runtime) {
        return;
    }

    const sourceScene = getSceneById(runtime.sceneId);

    if (sourceScene) {
        getSceneState(sourceScene).cardTransitionComplete = true;
    }

    teardownGardenCardRuntime();

    if (typeof updateSceneControlLocks === "function") {
        updateSceneControlLocks();
    }
}

//revela as cartas gradualmente antes de terminar
function revealGardenCards(runtime) {
    if (!runtime || state.gardenCardRuntime !== runtime || runtime.phase === "revealing") {
        return;
    }

    runtime.phase = "revealing";
    runtime.overlay.classList.add("is-revealing");
    runtime.revealCards = shuffleArray(Array.from(runtime.layer.querySelectorAll(".garden-card-reveal-card")));
    runtime.revealIndex = 0;

    const revealBatch = () => {
        if (!state.gardenCardRuntime || state.gardenCardRuntime !== runtime) {
            return;
        }

        const revealBatchSize = runtime.config.revealBatchSize || 1;

        for (
            let batchIndex = 0;
            batchIndex < revealBatchSize && runtime.revealIndex < runtime.revealCards.length;
            batchIndex += 1
        ) {
            const card = runtime.revealCards[runtime.revealIndex];

            if (card) {
                card.classList.add("is-revealing");
            }

            runtime.revealIndex += 1;
        }

        if (runtime.revealIndex < runtime.revealCards.length) {
            return;
        }

        if (runtime.revealIntervalId) {
            window.clearInterval(runtime.revealIntervalId);
            runtime.revealIntervalId = 0;
        }

        runtime.finishTimeoutId = window.setTimeout(() => {
            finishGardenCardTransition(runtime);
        }, runtime.config.revealDurationMs || 360);
    };

    revealBatch();
    runtime.revealIntervalId = window.setInterval(revealBatch, runtime.config.revealIntervalMs || 56);
}

//inicia a transicao das cartas se ainda estiver pendente
function ensureGardenCardTransition(scene, force = false) {
    const config = getGardenCardTransitionConfig(scene);
    const gardenState = getSceneState(scene);

    if (!config || gardenState.cardTransitionComplete) {
        return;
    }
    if (!force && !isGardenPaintComplete(scene)) {
        return;
    }

    if (state.gardenCardRuntime && state.gardenCardRuntime.sceneId === scene.id) {
        return;
    }

    const frameRect = getFrameRect();
    const overlay = document.createElement("div");
    const backdrop = document.createElement("div");
    const layer = document.createElement("div");
    const cards = buildGardenCardRevealLayout(frameRect, config);
    const runtime = {
        sceneId: scene.id,
        overlay,
        backdrop,
        layer,
        cards,
        nextIndex: 0,
        intervalId: 0,
        advanceTimeoutId: 0,
        revealIntervalId: 0,
        finishTimeoutId: 0,
        revealCards: [],
        revealIndex: 0,
        phase: "covering",
        persistent: true,
        config
    };

    gardenState.cardTransitionStarted = true;
    overlay.className = "garden-card-reveal";
    backdrop.className = "garden-card-reveal-backdrop";
    layer.className = "garden-card-reveal-layer";
    overlay.append(backdrop, layer);
    dom.sceneFrame.append(overlay);
    dom.sceneFrame.classList.add("has-garden-card-transition");
    state.gardenCardRuntime = runtime;


    const nextSceneForPreload = getSceneById(config.nextSceneId || scene.id + 1);
    if (nextSceneForPreload && nextSceneForPreload.background) {
        const preloadImg = new Image();
        preloadImg.src = nextSceneForPreload.background;
    }

    const spawnBatch = () => {
        if (state.currentSceneId !== scene.id || state.gardenCardRuntime !== runtime) {
            return;
        }

        const cardsPerBatch = runtime.config.cardsPerBatch || 3;

        for (let batchIndex = 0; batchIndex < cardsPerBatch && runtime.nextIndex < runtime.cards.length; batchIndex += 1) {
            const cardData = runtime.cards[runtime.nextIndex];
            const card = createGardenRevealCard(cardData, runtime.nextIndex);

            runtime.layer.append(card);
            runtime.nextIndex += 1;
        }

        const revealProgress = runtime.cards.length ? runtime.nextIndex / runtime.cards.length : 1;

        if (runtime.nextIndex < runtime.cards.length) {
            return;
        }

        if (runtime.intervalId) {
            window.clearInterval(runtime.intervalId);
            runtime.intervalId = 0;
        }

        lockWheel(1000);
        runtime.advanceTimeoutId = window.setTimeout(() => {
            if (state.currentSceneId !== scene.id || state.gardenCardRuntime !== runtime) {
                return;
            }

            const nextSceneId = runtime.config.nextSceneId || scene.id + 1;

            goToScene(nextSceneId, {
                animate: false,
                ignoreGardenCardLock: true,
                ignoreGardenCardRuntime: true
            });

            if (state.currentSceneId !== nextSceneId || state.gardenCardRuntime !== runtime) {
                return;
            }

            revealGardenCards(runtime);
        }, runtime.config.coverHoldDurationMs || 2000);
    };

    spawnBatch();
    runtime.intervalId = window.setInterval(spawnBatch, config.spawnIntervalMs || 64);
}

//guarda a posicao atual do cursor no fumo
function setForestSmokePointer(runtime, clientX, clientY) {
    const frameRect = getFrameRect();

    runtime.pointerX = clamp(clientX - frameRect.left, 0, frameRect.width);
    runtime.pointerY = clamp(clientY - frameRect.top, 0, frameRect.height);
    runtime.cursor.style.left = `${runtime.pointerX}px`;
    runtime.cursor.style.top = `${runtime.pointerY}px`;
}

//atualiza quanto do ecra ja esta coberto por fumo
function updateForestSmokeCoverage(scene, runtime, coverage) {
    const clampedCoverage = clamp(coverage, 0, 1);
    const density = easeOutCubic(clampedCoverage);

    getSceneState(scene).smokeCoverage = clampedCoverage;
    runtime.layer.style.setProperty("--lizard-smoke-density", density.toFixed(3));
    runtime.veil.style.opacity = `${lerp(0.08, 1, density)}`;
    runtime.veil.style.transform = `scale(${lerp(1.03, 1.2, density)})`;
    runtime.clouds.style.opacity = `${lerp(0.12, 0.96, density)}`;
    runtime.clouds.style.transform = `scale(${lerp(1.04, 1.3, density)})`;
    runtime.cursor.style.opacity = runtime.pointerActive ? `${clamp(0.9 - clampedCoverage * 0.34, 0.38, 0.9)}` : "0";
    runtime.cursor.style.transform = `translate(-50%, -50%) scale(${lerp(0.92, 1.22, density)})`;
}

function addForestSmokeCoverage(scene, runtime, amount) {
    const sceneState = getSceneState(scene);

    if (runtime.engulfing || sceneState.smokeUnlocked) {
        return;
    }

    const currentCoverage = sceneState.smokeCoverage || 0;
    const cappedCoverage = runtime.config.passiveCoverageCap ?? 1;

    const nextCoverage = clamp(currentCoverage + amount, 0, cappedCoverage);

    if (nextCoverage <= currentCoverage) {
        return;
    }

    updateForestSmokeCoverage(scene, runtime, nextCoverage);

    if (nextCoverage >= 1) {
        startForestSmokeEngulf(scene, runtime);
    }
}

//cria uma nuvem individual de fumo
function createForestSmokePuff(runtime, options = {}) {
    const puff = document.createElement("span");
    const sizeFactor = options.sizeFactor || 1;
    const speedFactor = options.speedFactor || 1;
    const originX = options.x ?? runtime.pointerX;
    const originY = options.y ?? runtime.pointerY;
    const size = (46 + Math.random() * 54) * sizeFactor;
    const stretch = 0.82 + Math.random() * 0.34;
    const duration = (1100 + Math.random() * 900) / speedFactor;
    const endScale = 1.7 + Math.random() * 0.85 * sizeFactor;
    const finalRadius = Math.max(size, size * stretch) * endScale * 0.42;
    const frameRect = getFrameRect();
    const minFinalX = finalRadius;
    const maxFinalX = Math.max(minFinalX, frameRect.width - finalRadius);
    const minFinalY = finalRadius;
    const maxFinalY = Math.max(minFinalY, frameRect.height - finalRadius);
    const rawDriftX = (Math.random() - 0.5) * 90 * sizeFactor + (options.driftX || 0);
    const rawDriftY = (-38 - Math.random() * 106) * sizeFactor + (options.driftY || 0);
    const driftX = clamp(originX + rawDriftX, minFinalX, maxFinalX) - originX;
    const driftY = clamp(originY + rawDriftY, minFinalY, maxFinalY) - originY;
    const opacity = clamp(0.28 + Math.random() * 0.26 + (options.opacityBoost || 0), 0.2, 0.86);
    const tilt = (Math.random() - 0.5) * 26;
    const borderRadius = [
        `${(44 + Math.random() * 12).toFixed(1)}%`,
        `${(48 + Math.random() * 10).toFixed(1)}%`,
        `${(46 + Math.random() * 12).toFixed(1)}%`,
        `${(42 + Math.random() * 14).toFixed(1)}%`
    ].join(" ");
    const borderRadiusVertical = [
        `${(42 + Math.random() * 14).toFixed(1)}%`,
        `${(44 + Math.random() * 12).toFixed(1)}%`,
        `${(50 + Math.random() * 10).toFixed(1)}%`,
        `${(46 + Math.random() * 12).toFixed(1)}%`
    ].join(" ");

    puff.className = "lizard-smoke-puff";
    puff.style.left = `${originX + (options.offsetX || 0)}px`;
    puff.style.top = `${originY + (options.offsetY || 0)}px`;
    puff.style.width = `${size}px`;
    puff.style.height = `${size * stretch}px`;
    puff.style.borderRadius = `${borderRadius} / ${borderRadiusVertical}`;
    puff.style.setProperty("--lizard-smoke-drift-x", `${driftX.toFixed(1)}px`);
    puff.style.setProperty("--lizard-smoke-drift-y", `${driftY.toFixed(1)}px`);
    puff.style.setProperty("--lizard-smoke-scale-end", endScale.toFixed(3));
    puff.style.setProperty("--lizard-smoke-opacity", opacity.toFixed(3));
    puff.style.setProperty("--lizard-smoke-tilt", `${tilt.toFixed(1)}deg`);
    puff.style.animationDuration = `${duration.toFixed(0)}ms`;

    runtime.puffLayer.append(puff);
    puff.addEventListener("animationend", () => {
        puff.classList.add("is-settled");
        runtime.settledPuffs.push(puff);
        const maxPuffs = runtime.config.maxPuffs || 120;
        while (runtime.settledPuffs.length > maxPuffs) {
            const oldPuff = runtime.settledPuffs.shift();
            if (oldPuff && oldPuff.isConnected) {
                oldPuff.remove();
            }
        }
    }, { once: true });
}

//cria varias nuvens de fumo durante a transicao
function createForestSmokeBurst(runtime, progress = 0) {
    const burstCount = 2 + Math.round(progress * 3);
    const spread = lerp(26, 180, progress);

    for (let index = 0; index < burstCount; index += 1) {
        createForestSmokePuff(runtime, {
            sizeFactor: lerp(1.08, 1.9, progress),
            speedFactor: lerp(1.15, 1.65, progress),
            opacityBoost: 0.12,
            offsetX: (Math.random() - 0.5) * spread,
            offsetY: (Math.random() - 0.5) * (spread * 0.66),
            driftX: (Math.random() - 0.5) * spread * 0.6,
            driftY: -32 - Math.random() * spread * 0.7
        });
    }
}

//fecha a transicao de fumo e avanca de cena
function finishForestSmokeTransition(scene, runtime) {
    const sceneState = getSceneState(scene);
    const nextSceneId = runtime.config.nextSceneId || scene.id + 1;
    const holdDuration = runtime.config.holdDurationMs || 120;
    const revealDelay = runtime.config.revealDelayMs || 120;
    const revealDuration = runtime.config.revealDurationMs || 900;

    if (runtime.layer && runtime.layer.isConnected) {
        runtime.layer.classList.add("is-transition-cover");
        dom.sceneFrame.append(runtime.layer);
    }

    lockWheel(holdDuration + revealDelay + revealDuration + 250);
    window.setTimeout(() => {
        if (state.currentSceneId !== scene.id || state.forestSmokeRuntime !== runtime) {
            return;
        }

        sceneState.smokeUnlocked = true;
        sceneState.smokeCoverage = 0;
        runtime.transitioningToNextScene = true;
        goToScene(nextSceneId, { animate: false, ignoreSmokeLock: true });

        window.setTimeout(() => {
            if (!runtime.layer || !runtime.layer.isConnected) {
                return;
            }

            runtime.layer.classList.add("is-revealing-next");
            window.setTimeout(() => {
                if (runtime.layer && runtime.layer.isConnected) {
                    runtime.layer.remove();
                }
            }, revealDuration);
        }, revealDelay);
    }, holdDuration);
}

//inicia o fumo que cobre o ecra
function startForestSmokeEngulf(scene, runtime) {
    if (runtime.engulfing || getSceneState(scene).smokeUnlocked) {
        return;
    }

    runtime.engulfing = true;
    runtime.layer.classList.add("is-engulfing");

    if (runtime.transitionTimeoutId) {
        window.clearTimeout(runtime.transitionTimeoutId);
        runtime.transitionTimeoutId = 0;
    }

    if (runtime.idleTimeoutId) {
        window.clearTimeout(runtime.idleTimeoutId);
        runtime.idleTimeoutId = 0;
    }

    const startCoverage = getSceneState(scene).smokeCoverage || 0;

    if (startCoverage >= 0.995) {
        updateForestSmokeCoverage(scene, runtime, 1);
        finishForestSmokeTransition(scene, runtime);
        return;
    }

    const startTime = performance.now();
    let lastBurstAt = startTime;

    const step = (now) => {
        if (state.currentSceneId !== scene.id || state.forestSmokeRuntime !== runtime) {
            return;
        }

        const progress = clamp((now - startTime) / (runtime.config.fillDurationMs || 980), 0, 1);
        const easedProgress = easeOutCubic(progress);
        const nextCoverage = lerp(startCoverage, 1, easedProgress);

        updateForestSmokeCoverage(scene, runtime, nextCoverage);

        if (now - lastBurstAt >= 180) {
            createForestSmokeBurst(runtime, easedProgress);
            lastBurstAt = now;
        }

        if (progress < 1) {
            runtime.engulfRafId = window.requestAnimationFrame(step);
            return;
        }

        finishForestSmokeTransition(scene, runtime);
    };

    runtime.engulfRafId = window.requestAnimationFrame(step);
}

//gera fumo passivo quando o cursor fica parado
function scheduleForestSmokeIdle(scene, runtime) {
    if (runtime.engulfing || getSceneState(scene).smokeUnlocked || !runtime.pointerActive) {
        return;
    }

    if (runtime.idleTimeoutId) {
        window.clearTimeout(runtime.idleTimeoutId);
    }

    runtime.idleTimeoutId = window.setTimeout(() => {
        runtime.pointerIdle = true;
        runtime.idleTimeoutId = 0;
    }, runtime.config.idleDelayMs || 3000);
}

//prepara eventos e camadas do fumo interativo
function setupForestSmokeInteraction(scene) {
    const smokeConfig = getForestSmokeConfig(scene);
    const sceneState = getSceneState(scene);

    if (!smokeConfig || sceneState.smokeUnlocked) {
        return;
    }

    const activationProgress = smokeConfig.activationProgress ?? 0.98;

    if ((sceneState.progress || 0) < activationProgress) {
        return;
    }

    const layer = document.createElement("div");
    layer.className = "lizard-smoke-layer";

    const veil = document.createElement("div");
    veil.className = "lizard-smoke-veil";

    const clouds = document.createElement("div");
    clouds.className = "lizard-smoke-clouds";

    const puffLayer = document.createElement("div");
    puffLayer.className = "lizard-smoke-puffs";

    const cursor = document.createElement("div");
    cursor.className = "lizard-smoke-cursor";

    layer.append(veil, clouds, puffLayer, cursor);
    dom.sceneOverlay.append(layer);
    dom.sceneFrame.classList.add("has-lizard-smoke");

    const controller = new AbortController();
    const runtime = {
        sceneId: scene.id,
        config: smokeConfig,
        controller,
        layer,
        veil,
        clouds,
        puffLayer,
        cursor,
        pointerX: getFrameRect().width * 0.5,
        pointerY: getFrameRect().height * 0.62,
        pointerActive: false,
        pointerIdle: false,
        settledPuffs: [],
        transitioningToNextScene: false,
        emitterIntervalId: 0,
        idleTimeoutId: 0,
        transitionTimeoutId: 0,
        engulfRafId: 0,
        engulfing: false,
        lizardSoundPlayed: false
    };

    state.forestSmokeRuntime = runtime;
    cursor.style.left = `${runtime.pointerX}px`;
    cursor.style.top = `${runtime.pointerY}px`;
    updateForestSmokeCoverage(scene, runtime, sceneState.smokeCoverage || 0);

    runtime.transitionTimeoutId = window.setTimeout(() => {
        if (state.currentSceneId !== scene.id || state.forestSmokeRuntime !== runtime) {
            return;
        }

        runtime.transitionTimeoutId = 0;
        startForestSmokeEngulf(scene, runtime);
    }, smokeConfig.timedTransitionDelayMs ?? 5000);


    runtime.pointerMoving = false;
    let pointerMoveClearId = 0;

    runtime.emitterIntervalId = window.setInterval(() => {
        if (runtime.engulfing) {
            createForestSmokePuff(runtime, { sizeFactor: 1.18, speedFactor: 1.28, opacityBoost: 0.08 });
            return;
        }

        if (!runtime.pointerActive) {
            return;
        }


        if (runtime.pointerIdle && !runtime.pointerMoving) {
            createForestSmokePuff(runtime, { sizeFactor: 1.18, speedFactor: 0.86, opacityBoost: 0.12 });
            createForestSmokePuff(runtime, {
                sizeFactor: 0.92,
                speedFactor: 0.82,
                opacityBoost: 0.08,
                offsetX: (Math.random() - 0.5) * 34,
                offsetY: (Math.random() - 0.5) * 24
            });
        } else {
            createForestSmokePuff(runtime, { sizeFactor: 0.9, speedFactor: 1 });
        }

        const gain = runtime.config.disableIdleCoverageTransition || runtime.pointerMoving || !runtime.pointerIdle
            ? (runtime.config.movingCoverageGain || 0.001)
            : (runtime.config.idleCoverageGain || runtime.config.passiveCoverageGain || 0.005);

        addForestSmokeCoverage(scene, runtime, gain);
    }, smokeConfig.emitIntervalMs || 84);

    const activateSmoke = (event) => {
        if (state.currentSceneId !== scene.id || state.forestSmokeRuntime !== runtime) {
            return;
        }

        const previousX = runtime.pointerX;
        const previousY = runtime.pointerY;
        const wasPointerActive = runtime.pointerActive;

        runtime.pointerActive = true;
        setForestSmokePointer(runtime, event.clientX, event.clientY);
        updateForestSmokeCoverage(scene, runtime, getSceneState(scene).smokeCoverage || 0);

        if (!wasPointerActive && !runtime.lizardSoundPlayed) {
            runtime.lizardSoundPlayed = true;
            playLizardSmokeSound();
        }

        if (!runtime.engulfing) {
            const distance = Math.hypot(runtime.pointerX - previousX, runtime.pointerY - previousY);

            if (distance > 1.5) {

                runtime.pointerMoving = true;
                runtime.pointerIdle = false;
                if (pointerMoveClearId) window.clearTimeout(pointerMoveClearId);
                pointerMoveClearId = window.setTimeout(() => {
                    runtime.pointerMoving = false;
                    pointerMoveClearId = 0;
                    scheduleForestSmokeIdle(scene, runtime);
                }, 200);
            }

            scheduleForestSmokeIdle(scene, runtime);
        }
    };

    const deactivateSmoke = () => {
        runtime.pointerActive = false;
        runtime.pointerMoving = false;
        runtime.pointerIdle = false;
        if (pointerMoveClearId) { window.clearTimeout(pointerMoveClearId); pointerMoveClearId = 0; }
        if (runtime.idleTimeoutId) { window.clearTimeout(runtime.idleTimeoutId); runtime.idleTimeoutId = 0; }
        runtime.cursor.style.opacity = "0";
    };

    dom.sceneFrame.addEventListener("pointerenter", activateSmoke, { signal: controller.signal });
    dom.sceneFrame.addEventListener("pointermove", activateSmoke, { signal: controller.signal });
    dom.sceneFrame.addEventListener("pointerdown", activateSmoke, { signal: controller.signal });
    dom.sceneFrame.addEventListener("pointerleave", deactivateSmoke, { signal: controller.signal });
}

//desenha flores e elementos interativos da floresta
function renderForestProps(scene, forestRect, options = {}) {
    if (!scene.props) {
        return;
    }

    const targetLayer = options.targetLayer || dom.sceneOverlay;
    const interactive = options.interactive !== false;

    scene.props.forEach((prop) => {
        const propMeta = propCatalog[prop.asset];

        if (!propMeta) {
            return;
        }

        const width = (forestRect.width * prop.width) / 100;
        const height = width * (propMeta.height / propMeta.width);
        const left = forestRect.left + (forestRect.width * prop.x) / 100 - width / 2;
        const top = forestRect.top + (forestRect.height * prop.y) / 100 - height / 2;

        if (prop.sound && interactive) {
            const propButton = document.createElement("button");
            propButton.type = "button";
            propButton.className = "scene-prop-button";
            propButton.setAttribute("aria-label", `Tocar ${prop.label.toLowerCase()}`);
            propButton.style.left = `${left}px`;
            propButton.style.top = `${top}px`;
            propButton.style.width = `${width}px`;
            propButton.style.height = `${height}px`;

            const propImage = document.createElement("img");
            propImage.className = "scene-prop scene-prop--interactive";
            propImage.alt = "";
            propImage.style.width = "100%";
            propImage.style.height = "100%";
            setInteractiveForestPropVisual(prop, propImage, false);

            let heldBySound = false;
            const releasePressedVisual = () => {
                if (heldBySound) {
                    return;
                }

                setInteractiveForestPropVisual(prop, propImage, false);
            };
            const releasePressedVisualAfterSound = () => {
                heldBySound = false;
                setInteractiveForestPropVisual(prop, propImage, false);
            };
            const triggerInteractiveProp = () => {
                setInteractiveForestPropVisual(prop, propImage, true);

                if (prop.holdPressedUntilSoundEnds && prop.soundFile) {
                    heldBySound = true;
                    triggerFlowerDrum(prop, propButton, {
                        onEnd: releasePressedVisualAfterSound
                    });
                    return;
                }

                triggerFlowerDrum(prop, propButton);
            };

            propButton.addEventListener("pointerdown", (event) => {
                if (typeof propButton.setPointerCapture === "function") {
                    propButton.setPointerCapture(event.pointerId);
                }

                triggerInteractiveProp();
            });

            propButton.addEventListener("pointerup", releasePressedVisual);
            propButton.addEventListener("pointercancel", releasePressedVisual);
            propButton.addEventListener("lostpointercapture", releasePressedVisual);
            propButton.addEventListener("blur", releasePressedVisual);
            propButton.addEventListener("keydown", (event) => {
                if ((event.key !== "Enter" && event.key !== " ") || event.repeat) {
                    return;
                }

                event.preventDefault();
                triggerInteractiveProp();
            });
            propButton.addEventListener("keyup", (event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                releasePressedVisual();
            });

            propButton.append(propImage);
            targetLayer.append(propButton);
            return;
        }

        const propImage = document.createElement("img");
        propImage.className = "scene-prop";
        propImage.src = prop.asset;
        propImage.alt = "";
        propImage.style.left = `${left}px`;
        propImage.style.top = `${top}px`;
        propImage.style.width = `${width}px`;
        propImage.style.height = `${height}px`;

        targetLayer.append(propImage);
    });
}

//desenha a floresta panoramica completa
function renderForestScene(scene) {
    const forestState = getSceneState(scene);
    const forestRect = getForestMediaRect(scene);
    const smokeLocked = hasPendingForestSmokeTransition(scene);
    const smokeCoverage = forestState.smokeCoverage || 0;
    const smokeConfig = getForestSmokeConfig(scene);
    const smokeActivationProgress = smokeConfig ? (smokeConfig.activationProgress ?? 0.98) : 1;
    const smokeActive = smokeLocked && forestState.progress >= smokeActivationProgress;
    const now = performance.now();
    const arrowDelayMs = scene.horizontalScrollArrowDelayMs || 0;

    if (scene.horizontalScrollArrow && arrowDelayMs > 0 && !forestState.arrowEnteredAt) {
        forestState.arrowEnteredAt = now;
        window.setTimeout(() => {
            if (state.currentSceneId === scene.id) {
                renderScene();
            }
        }, arrowDelayMs);
    }

    dom.sceneFrame.classList.add("is-panorama");
    setBackdrop(scene.asset, `${forestRect.left}px ${forestRect.top}px`, {
        size: `${forestRect.width}px ${forestRect.height}px`
    });
    setImagePlacement(scene.asset, forestRect);
    renderForestProps(scene, forestRect);
    if (scene.horizontalScrollArrow && (!arrowDelayMs || now - (forestState.arrowEnteredAt || now) >= arrowDelayMs)) {
        const scrollArrow = document.createElement("div");
        scrollArrow.className = "forest-scroll-arrow";
        scrollArrow.setAttribute("aria-hidden", "true");
        dom.sceneOverlay.append(scrollArrow);
    }
    setupForestSmokeInteraction(scene);
    setCaption(scene.instruction);
    setProgress(
        smokeActive ? smokeCoverage : forestState.progress,
        1,
        smokeActive
            ? `Fumo ${Math.round(smokeCoverage * 100)}%`
            : `Scroll ${Math.round(forestState.progress * 100)}%`
    );
}

//salta entre as metades da floresta quando necessario
function jumpBetweenForestScenes(direction) {
    const currentScene = getCurrentScene();

    if (direction > 0 && hasPendingForestSmokeTransition(currentScene)) {
        renderScene();
        lockWheel(220);
        return;
    }

    if (direction < 0) {
        const previousSceneId = state.currentSceneId + direction;
        const previousScene = getSceneById(previousSceneId);

        if (!previousScene || previousScene.kind !== "forest-scroll") {
            lockWheel(180);
            return;
        }

        const previousSceneState = getSceneState(previousScene);
        previousSceneState.progress = 1;
        goToScene(previousSceneId, { animate: false, allowBackward: true });
        lockWheel(700);
        return;
    }

    const nextSceneId = state.currentSceneId + direction;
    const nextScene = getSceneById(nextSceneId);

    if (!nextScene || nextScene.kind !== "forest-scroll") {
        goToScene(nextSceneId);
        lockWheel(900);
        return;
    }

    const nextSceneState = getSceneState(nextScene);
    nextSceneState.progress = 0;
    goToScene(nextSceneId, { animate: false });
    lockWheel(700);
}

//transforma scroll horizontal no progresso da floresta
function handleForestWheel(delta) {
    const scene = getCurrentScene();
    const forestState = getSceneState(scene);
    const currentProgress = forestState.progress;
    const nextProgress = currentProgress + delta * 0.00065;
    const smokeTransitionPending = hasPendingForestSmokeTransition(scene);

    if (nextProgress > 1) {
        forestState.progress = 1;
        renderScene();

        if (currentProgress >= 1 && !smokeTransitionPending) {
            jumpBetweenForestScenes(1);
        }

        return;
    }

    if (nextProgress < 0) {
        forestState.progress = 0;
        renderScene();

        if (currentProgress <= 0) {
            jumpBetweenForestScenes(-1);
        }

        return;
    }

    forestState.progress = clamp(nextProgress, 0, 1);
    renderScene();
}
