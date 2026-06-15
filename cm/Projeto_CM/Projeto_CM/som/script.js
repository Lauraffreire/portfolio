//centraliza os sons globais e os fades de audio entre cenas
const AUDIO_SCRIPT_URL = document.currentScript ? document.currentScript.src : window.location.href;
const audioAssetUrl = (path) => new URL(path, AUDIO_SCRIPT_URL).href;
const INTRO_MAGIC_SOUND_URL = audioAssetUrl("sommagicoinicio.mp3");
const TITLE_TUNNEL_ENTRY_SOUND_URL = audioAssetUrl("somentradatunel.mp3");
const CHESHIRE_PURR_SOUND_URL = audioAssetUrl("ronronar.mp3");
const GARDEN_BIRDS_SOUND_URL = audioAssetUrl("passaros.mp3");
const TEA_PORTAL_TRANSITION_SOUND_URL = audioAssetUrl("transicaotunel.mp3");
let introMagicSoundPlayed = false;
const PRELOADED_AUDIO_PATHS = [
    "sommagicoinicio.mp3",
    "somentradatunel.mp3",
    "transicaotunel.mp3",
    "dentrodotunel.mp3",
    "tunel.wav",
    "portas.mp3",
    "portalentradafloresta.mp3",
    "floresta.mp3",
    "lagarto.mp3",
    "flor1.mp3",
    "flor2.mp3",
    "flor3.mp3",
    "flor4.mp3",
    "flor5.mp3",
    "flor6.mp3",
    "trompete.mp3",
    "placas.mp3",
    "ronronar.mp3",
    "loica.mp3",
    "molharpincel.mp3",
    "pintar.mp3",
    "memoria_carta.mp3",
    "error.mp3",
    "tensao.mp3",
    "gritar.mp3",
    "splash.mp3",
    "candeeiro.mp3",
    "livro.mp3",
    "relogio_bolso.mp3",
    "tictac.mp3",
    "cadeiraaranger.mp3",
    "passaros.mp3",
    "transicao_porta.mp3"
];

const audioState = {
    context: null,
    preloadedAudio: new Map(),
    audioUnlocked: false,
    introMagicAudio: null,
    introMagicFadeId: 0,
    titleTunnelEntryAudio: null,
    titleTunnelEntryFadeId: 0,
    titleTunnelEntryTargetVolume: 0,
    titleTunnelEntrySceneId: null,
    cheshirePurrAudio: null,
    cheshirePurrSceneId: null,
    gardenBirdsAudio: null,
    gardenBirdsFadeId: 0,
    gardenBirdsTargetVolume: 0,
    gardenBirdsPlayBlocked: false,
    gardenBirdsSceneId: null
};

function getPreloadedAudioEntry(source) {
    const url = new URL(source, window.location.href).href;

    if (!audioState.preloadedAudio.has(url)) {
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.load();
        audioState.preloadedAudio.set(url, { audio, pool: [audio] });
    }

    return audioState.preloadedAudio.get(url);
}

function preloadAudioAssets() {
    PRELOADED_AUDIO_PATHS.forEach((path) => {
        getPreloadedAudioEntry(audioAssetUrl(path));
    });
}

function playPreloadedSound(source, options = {}) {
    const {
        volume = 1,
        loop = false,
        reset = true,
        maxPoolSize = 4
    } = options;
    const entry = getPreloadedAudioEntry(source);
    let audio = loop
        ? entry.audio
        : entry.pool.find((candidate) => candidate.paused || candidate.ended);

    if (!audio) {
        audio = entry.audio.cloneNode();
        audio.preload = "auto";
        if (entry.pool.length < maxPoolSize) {
            entry.pool.push(audio);
        }
    }

    audio.loop = loop;
    audio.muted = false;
    audio.volume = volume;

    if (reset) {
        try {
            audio.currentTime = 0;
        } catch (error) {

        }
    }

    audio.play().catch(() => {

    });

    return audio;
}

function unlockPreloadedAudio() {
    if (audioState.audioUnlocked) {
        return;
    }

    audioState.audioUnlocked = true;

    audioState.preloadedAudio.forEach((entry) => {
        const audio = entry.audio;
        if (audio === audioState.introMagicAudio && !audio.paused) {
            return;
        }

        const previousVolume = audio.volume;
        const wasPaused = audio.paused;

        audio.muted = true;
        audio.volume = 0;
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
            audio.volume = previousVolume;
        }).catch(() => {
            audio.muted = false;
            audio.volume = previousVolume;
            if (!wasPaused) {
                audio.play().catch(() => {

                });
            }
        });
    });
}

window.playPreloadedSound = playPreloadedSound;
window.preloadAudioAssets = preloadAudioAssets;
window.unlockPreloadedAudio = unlockPreloadedAudio;

//toca o som inicial quando permitido pelo browser
function playIntroMagicSound() {
    if (introMagicSoundPlayed) {
        return;
    }

    const sound = audioState.introMagicAudio || getPreloadedAudioEntry(INTRO_MAGIC_SOUND_URL).audio;
    audioState.introMagicAudio = sound;
    sound.loop = true;
    sound.volume = 0.85;
    sound.play().then(() => {
        introMagicSoundPlayed = true;
    }).catch(() => {

    });
}

//toca a transicao da chavena fora do iframe para nao ser cortada
function playTeaPortalTransitionSound() {
    const sound = playPreloadedSound(TEA_PORTAL_TRANSITION_SOUND_URL, { volume: 0.8 });

    sound.volume = 0.8;
}

//desvanece o som inicial antes do tunel
function fadeOutIntroMagicSound(durationMs = 1400) {
    const audio = audioState.introMagicAudio;

    if (!audio) {
        return;
    }

    if (audioState.introMagicFadeId) {
        window.cancelAnimationFrame(audioState.introMagicFadeId);
        audioState.introMagicFadeId = 0;
    }

    const startVolume = audio.volume;
    const startTime = performance.now();
    const duration = Math.max(durationMs, 1);

    const step = (time) => {
        const progress = Math.min(1, (time - startTime) / duration);
        audio.volume = startVolume * (1 - progress);

        if (progress < 1) {
            audioState.introMagicFadeId = window.requestAnimationFrame(step);
            return;
        }

        audioState.introMagicFadeId = 0;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.85;
    };

    audioState.introMagicFadeId = window.requestAnimationFrame(step);
}

//liga gestos que desbloqueiam o som inicial
function bindIntroMagicSoundUnlock() {
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach((eventName) => {
        window.addEventListener(eventName, playIntroMagicSound, { once: true, passive: true });
        window.addEventListener(eventName, unlockPreloadedAudio, { once: true, passive: true });
    });
}

function getTitleTunnelEntryAudio() {
    if (!audioState.titleTunnelEntryAudio) {
        audioState.titleTunnelEntryAudio = getPreloadedAudioEntry(TITLE_TUNNEL_ENTRY_SOUND_URL).audio;
        audioState.titleTunnelEntryAudio.loop = true;
        audioState.titleTunnelEntryAudio.volume = 0;
    }

    return audioState.titleTunnelEntryAudio;
}

//faz fade do som de entrada no tunel
function fadeTitleTunnelEntryAudio(targetVolume, durationMs, options = {}) {
    const audio = getTitleTunnelEntryAudio();
    const startVolume = audio.volume;
    const startTime = performance.now();
    const duration = Math.max(durationMs, 1);

    if (audioState.titleTunnelEntryFadeId) {
        window.cancelAnimationFrame(audioState.titleTunnelEntryFadeId);
        audioState.titleTunnelEntryFadeId = 0;
    }

    audioState.titleTunnelEntryTargetVolume = targetVolume;

    if (targetVolume > 0 && audio.paused) {
        audio.play().catch(() => {
            if (audioState.titleTunnelEntryAudio === audio) {
                audioState.titleTunnelEntryTargetVolume = 0;
                audioState.titleTunnelEntrySceneId = null;
            }

        });
    }

    const step = (time) => {
        const progress = Math.min(1, (time - startTime) / duration);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress < 1) {
            audioState.titleTunnelEntryFadeId = window.requestAnimationFrame(step);
            return;
        }

        audioState.titleTunnelEntryFadeId = 0;
        audio.volume = targetVolume;

        if (options.stopAfter || targetVolume <= 0.001) {
            audio.pause();
            audio.currentTime = 0;
            audioState.titleTunnelEntryTargetVolume = 0;
            audioState.titleTunnelEntrySceneId = null;
        }
    };

    audioState.titleTunnelEntryFadeId = window.requestAnimationFrame(step);
}

//para o som de entrada no tunel
function stopTitleTunnelEntryAudio({ fade = true } = {}) {
    const audio = audioState.titleTunnelEntryAudio;

    if (!audio) {
        return;
    }

    if (fade) {
        if (audioState.titleTunnelEntryTargetVolume !== 0 || audio.volume > 0.001) {
            fadeTitleTunnelEntryAudio(0, 900, { stopAfter: true });
        }
        return;
    }

    if (audioState.titleTunnelEntryFadeId) {
        window.cancelAnimationFrame(audioState.titleTunnelEntryFadeId);
        audioState.titleTunnelEntryFadeId = 0;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    audioState.titleTunnelEntryTargetVolume = 0;
    audioState.titleTunnelEntrySceneId = null;
}

//garante que o som do titulo esta a tocar no volume certo
function ensureTitleTunnelEntryAudio(scene, targetVolume = 0.78, fadeMs = 700) {
    const audio = audioState.titleTunnelEntryAudio;

    if (
        audioState.titleTunnelEntrySceneId !== scene.id
        || audioState.titleTunnelEntryTargetVolume !== targetVolume
        || (audio && audio.paused)
    ) {
        audioState.titleTunnelEntrySceneId = scene.id;
        fadeTitleTunnelEntryAudio(targetVolume, fadeMs);
    }
}

//sincroniza o som do titulo com o progresso da cena
function syncTitleTunnelEntryAudio(scene) {
    if (!isInteractiveTitleScene(scene)) {
        stopTitleTunnelEntryAudio({ fade: false });
        return;
    }

    const totalProgress = getTitleSceneTotalProgress(scene);
    const targetVolume = 0.78;

    if (totalProgress > 0) {
        ensureTitleTunnelEntryAudio(scene, targetVolume, 700);
        return;
    }

    stopTitleTunnelEntryAudio({ fade: true });
}

function getCheshirePurrAudio() {
    if (!audioState.cheshirePurrAudio) {
        audioState.cheshirePurrAudio = getPreloadedAudioEntry(CHESHIRE_PURR_SOUND_URL).audio;
        audioState.cheshirePurrAudio.loop = true;
        audioState.cheshirePurrAudio.volume = 0.28;
    }

    return audioState.cheshirePurrAudio;
}

function stopCheshirePurrAudio({ reset = false } = {}) {
    const audio = audioState.cheshirePurrAudio;

    if (!audio) {
        return;
    }

    audio.pause();

    if (reset) {
        audio.currentTime = 0;
        audioState.cheshirePurrSceneId = null;
    }
}

//toca ou para o ronronar na cena do gato
function syncCheshirePurrAudio(scene) {
    if (!scene || scene.kind !== "cheshire-scene") {
        stopCheshirePurrAudio({ reset: true });
        return;
    }

    const audio = getCheshirePurrAudio();

    if (audioState.cheshirePurrSceneId !== scene.id) {
        audio.currentTime = 0;
        audioState.cheshirePurrSceneId = scene.id;
    }

    audio.volume = 0.28;

    if (audio.paused) {
        audio.play().catch(() => {

        });
    }
}

function getGardenBirdsAudio() {
    if (!audioState.gardenBirdsAudio) {
        audioState.gardenBirdsAudio = getPreloadedAudioEntry(GARDEN_BIRDS_SOUND_URL).audio;
        audioState.gardenBirdsAudio.loop = true;
        audioState.gardenBirdsAudio.preload = "auto";
        audioState.gardenBirdsAudio.volume = 0;
    }

    return audioState.gardenBirdsAudio;
}

//faz fade do ambiente de passaros do jardim
function fadeGardenBirdsAudio(targetVolume, durationMs, options = {}) {
    const audio = getGardenBirdsAudio();
    const startVolume = audio.volume;
    const startTime = performance.now();
    const duration = Math.max(durationMs, 1);

    if (audioState.gardenBirdsFadeId) {
        window.cancelAnimationFrame(audioState.gardenBirdsFadeId);
        audioState.gardenBirdsFadeId = 0;
    }

    audioState.gardenBirdsTargetVolume = targetVolume;
    audioState.gardenBirdsPlayBlocked = false;

    if (targetVolume > 0 && audio.paused) {
        audio.play().catch(() => {
            if (audioState.gardenBirdsFadeId) {
                window.cancelAnimationFrame(audioState.gardenBirdsFadeId);
                audioState.gardenBirdsFadeId = 0;
            }
            audio.volume = 0;
            audioState.gardenBirdsPlayBlocked = true;

        });
    }

    const step = (time) => {
        const progress = Math.min(1, (time - startTime) / duration);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress < 1) {
            audioState.gardenBirdsFadeId = window.requestAnimationFrame(step);
            return;
        }

        audioState.gardenBirdsFadeId = 0;
        audio.volume = targetVolume;

        if (options.stopAfter || targetVolume <= 0.001) {
            audio.pause();
            audio.currentTime = 0;
            audioState.gardenBirdsTargetVolume = 0;
            audioState.gardenBirdsPlayBlocked = false;
            audioState.gardenBirdsSceneId = null;
        }
    };

    audioState.gardenBirdsFadeId = window.requestAnimationFrame(step);
}

//para o ambiente de passaros
function stopGardenBirdsAudio({ fade = true } = {}) {
    const audio = audioState.gardenBirdsAudio;

    if (!audio) {
        return;
    }

    if (fade) {
        if (audioState.gardenBirdsTargetVolume !== 0 || audio.volume > 0.001) {
            fadeGardenBirdsAudio(0, 1200, { stopAfter: true });
        }
        return;
    }

    if (audioState.gardenBirdsFadeId) {
        window.cancelAnimationFrame(audioState.gardenBirdsFadeId);
        audioState.gardenBirdsFadeId = 0;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    audioState.gardenBirdsTargetVolume = 0;
    audioState.gardenBirdsPlayBlocked = false;
    audioState.gardenBirdsSceneId = null;
}

//retoma os passaros quando um gesto desbloqueia audio
function retryGardenBirdsAudioFromGesture() {
    const scene = getCurrentScene();

    if (
        !scene
        || scene.kind !== "garden-paint"
        || audioState.gardenBirdsTargetVolume <= 0
    ) {
        return;
    }

    const audio = getGardenBirdsAudio();
    const targetVolume = audioState.gardenBirdsTargetVolume;

    if (!audio.paused && !audioState.gardenBirdsPlayBlocked) {
        return;
    }

    audio.volume = Math.min(audio.volume, targetVolume);
    audio.play().then(() => {
        audioState.gardenBirdsPlayBlocked = false;
        fadeGardenBirdsAudio(targetVolume, 900);
    }).catch(() => {
        audioState.gardenBirdsPlayBlocked = true;
    });
}

//sincroniza os passaros com a cena de pintar rosas
function syncGardenBirdsAudio(scene) {
    if (!scene || scene.kind !== "garden-paint") {
        stopGardenBirdsAudio({ fade: true });
        return;
    }

    const targetVolume = scene.birdsAmbientVolume ?? 0.14;
    const audio = audioState.gardenBirdsAudio;

    if (
        audioState.gardenBirdsSceneId !== scene.id
        || audioState.gardenBirdsTargetVolume !== targetVolume
        || (audio && audio.paused)
    ) {
        audioState.gardenBirdsSceneId = scene.id;
        fadeGardenBirdsAudio(targetVolume, 1600);
    }
}

preloadAudioAssets();
