//controla a cena vertical, os objetos interativos e a transicao da porta
const TUNNEL_SCENE_SOUND_URL = new URL(
    "../som/tunel.wav",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const LAMP_TOGGLE_SOUND_URL = new URL(
    "../som/candeeiro.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const CLOCK_TICK_SOUND_URL = new URL(
    "../som/tictac.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const POCKET_CLOCK_SOUND_URL = new URL(
    "../som/relogio_bolso.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const BOOK_TOGGLE_SOUND_URL = new URL(
    "../som/livro.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const CHAIR_RANGER_SOUND_URL = new URL(
    "../som/cadeiraaranger.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const DOOR_ROTATION_TRANSITION_SOUND_URL = new URL(
    "../som/transicao_porta.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const VERTICAL_DOOR_ROTATION_PROGRESS_PER_SECOND = 0.48;

const tunnelSceneAudioState = {
    audio: null,
    sceneId: null
};
const clockTickAudioState = {
    audio: null,
    sceneId: null
};
const pocketClockAudioState = {
    audio: null,
    sceneId: null,
    playbackRate: 1
};
const chairRangerAudioState = {
    audio: null
};

function playLampToggleSound() {
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(LAMP_TOGGLE_SOUND_URL, { volume: 0.65 })
        : new Audio(LAMP_TOGGLE_SOUND_URL);

    sound.volume = 0.65;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
}

function playBookToggleSound() {
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(BOOK_TOGGLE_SOUND_URL, { volume: 0.75 })
        : new Audio(BOOK_TOGGLE_SOUND_URL);

    sound.volume = 0.75;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
}

function getChairRangerAudio() {
    if (!chairRangerAudioState.audio) {
        chairRangerAudioState.audio = new Audio(CHAIR_RANGER_SOUND_URL);
        chairRangerAudioState.audio.preload = "auto";
        chairRangerAudioState.audio.loop = true;
        chairRangerAudioState.audio.volume = 0.72;
    }

    return chairRangerAudioState.audio;
}

function startChairRangerSound() {
    const audio = getChairRangerAudio();

    if (audio.paused) {
        audio.currentTime = 0;
    }

    audio.play().catch(() => {

    });
}

function stopChairRangerSound() {
    const audio = chairRangerAudioState.audio;

    if (!audio) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;
}

function playDoorRotationTransitionSound() {
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(DOOR_ROTATION_TRANSITION_SOUND_URL, { volume: 0.82 })
        : new Audio(DOOR_ROTATION_TRANSITION_SOUND_URL);

    sound.volume = 0.82;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
}

function getClockTickAudio() {
    if (!clockTickAudioState.audio) {
        clockTickAudioState.audio = new Audio(CLOCK_TICK_SOUND_URL);
        clockTickAudioState.audio.loop = true;
        clockTickAudioState.audio.volume = 0;
    }

    return clockTickAudioState.audio;
}

function getPocketClockAudio() {
    if (!pocketClockAudioState.audio) {
        pocketClockAudioState.audio = new Audio(POCKET_CLOCK_SOUND_URL);
        pocketClockAudioState.audio.loop = true;
        pocketClockAudioState.audio.volume = 0;
        pocketClockAudioState.audio.playbackRate = pocketClockAudioState.playbackRate;
    }

    return pocketClockAudioState.audio;
}

function setPocketClockAudioPlaybackRate(playbackRate = 1) {
    pocketClockAudioState.playbackRate = playbackRate;

    if (pocketClockAudioState.audio) {
        pocketClockAudioState.audio.playbackRate = playbackRate;
    }
}

function stopClockTickAudio({ reset = false } = {}) {
    const audio = clockTickAudioState.audio;

    if (!audio) {
        return;
    }

    audio.pause();
    audio.volume = 0;

    if (reset) {
        audio.currentTime = 0;
        clockTickAudioState.sceneId = null;
    }
}

function stopPocketClockAudio({ reset = false } = {}) {
    const audio = pocketClockAudioState.audio;

    if (!audio) {
        return;
    }

    audio.pause();
    audio.volume = 0;
    audio.playbackRate = 1;
    pocketClockAudioState.playbackRate = 1;

    if (reset) {
        audio.currentTime = 0;
        pocketClockAudioState.sceneId = null;
    }
}

function getVerticalScrollProgress(scene, progressOverride) {
    const sceneProgress = typeof progressOverride === "number"
        ? progressOverride
        : getSceneState(scene).progress;

    return clamp(sceneProgress, 0, 1);
}

function getVerticalScrollImageHeight(scene, frameRectOverride) {
    const frameRect = frameRectOverride || getFrameRect();
    const assetMeta = imageCatalog[scene.asset];
    return frameRect.width * (assetMeta.height / assetMeta.width);
}

function getVerticalScrollBaseOverflow(scene, frameRectOverride) {
    const frameRect = frameRectOverride || getFrameRect();
    const scaledHeight = getVerticalScrollImageHeight(scene, frameRect);

    return Math.max(0, scaledHeight - frameRect.height);
}

function getVerticalScrollTransitionRevealDistance(scene, frameRectOverride) {
    if (!scene.transitionAsset) {
        return 0;
    }

    const frameRect = frameRectOverride || getFrameRect();
    return frameRect.height * (scene.transitionRevealDistanceMultiplier || 1);
}

function getVerticalScrollTransitionRotationDistance(scene, frameRectOverride) {
    if (!scene.transitionAsset) {
        return 0;
    }

    const frameRect = frameRectOverride || getFrameRect();
    return frameRect.height * (scene.transitionRotationDistanceMultiplier || 0.85);
}

function getVerticalDoorRotationStartProgress(scene, frameRectOverride) {
    const overflowY = getVerticalScrollOverflow(scene, frameRectOverride);

    if (!overflowY || !scene.transitionAsset) {
        return 1;
    }

    return clamp(
        (getVerticalScrollBaseOverflow(scene, frameRectOverride) +
            getVerticalScrollTransitionRevealDistance(scene, frameRectOverride)) / overflowY,
        0,
        1
    );
}

function getVerticalScrollTransitionStageHeight(scene, frameRectOverride) {
    return getVerticalScrollTransitionRevealDistance(scene, frameRectOverride) +
        getVerticalScrollTransitionRotationDistance(scene, frameRectOverride);
}

function getVerticalScrollOverflow(scene, frameRectOverride) {
    return getVerticalScrollBaseOverflow(scene, frameRectOverride) +
        getVerticalScrollTransitionStageHeight(scene, frameRectOverride);
}

function getVerticalScrollTravel(scene, frameRectOverride, progressOverride) {
    return getVerticalScrollOverflow(scene, frameRectOverride) *
        getVerticalScrollProgress(scene, progressOverride);
}

function getVerticalScrollBackdropProgress(scene, progressOverride) {
    const frameRect = getFrameRect();
    const baseOverflow = getVerticalScrollBaseOverflow(scene, frameRect);

    if (!baseOverflow) {
        return 0;
    }

    return clamp(getVerticalScrollTravel(scene, frameRect, progressOverride) / baseOverflow, 0, 1);
}

//calcula o volume ambiente do tunel conforme o scroll vertical
function getTunnelSceneAudioVolume(scene) {
    if (!scene || !scene.tunnelAmbientSound) {
        return 0;
    }

    const frameRect = getFrameRect();
    const baseOverflow = getVerticalScrollBaseOverflow(scene, frameRect);
    const totalOverflow = getVerticalScrollOverflow(scene, frameRect);
    const transitionStage = totalOverflow - baseOverflow;
    const maxVolume = scene.tunnelAmbientSound.maxVolume ?? 0.55;

    if (transitionStage <= 0) {
        return maxVolume;
    }

    const transitionTravel = Math.max(0, getVerticalScrollTravel(scene, frameRect) - baseOverflow);
    const transitionProgress = clamp(transitionTravel / transitionStage, 0, 1);
    const fadeOutStart = scene.tunnelAmbientSound.fadeOutStart ?? 0;
    const fadeOutEnd = scene.tunnelAmbientSound.fadeOutEnd ?? 0.3;
    const fadeOutProgress = getFadeProgress(transitionProgress, fadeOutStart, fadeOutEnd);

    return maxVolume * (1 - fadeOutProgress);
}

function getTunnelSceneAudio() {
    if (!tunnelSceneAudioState.audio) {
        tunnelSceneAudioState.audio = new Audio(TUNNEL_SCENE_SOUND_URL);
        tunnelSceneAudioState.audio.loop = true;
        tunnelSceneAudioState.audio.volume = 0;
    }

    return tunnelSceneAudioState.audio;
}

function stopTunnelSceneAudio({ reset = false } = {}) {
    const audio = tunnelSceneAudioState.audio;

    if (!audio) {
        return;
    }

    audio.pause();
    audio.volume = 0;

    if (reset) {
        audio.currentTime = 0;
        tunnelSceneAudioState.sceneId = null;
    }
}

//liga ou desliga o som do tunel nesta cena
function syncTunnelSceneAudio(scene) {
    if (!scene || !scene.tunnelAmbientSound) {
        stopTunnelSceneAudio({ reset: true });
        return;
    }

    const audio = getTunnelSceneAudio();
    const nextVolume = clamp(getTunnelSceneAudioVolume(scene), 0, scene.tunnelAmbientSound.maxVolume ?? 0.55);

    if (tunnelSceneAudioState.sceneId !== scene.id) {
        audio.currentTime = 0;
        tunnelSceneAudioState.sceneId = scene.id;
    }

    audio.volume = nextVolume;

    if (nextVolume <= 0.005) {
        audio.pause();
        return;
    }

    if (audio.paused) {
        audio.play().catch(() => {

        });
    }
}

function getVerticalSceneItems(scene) {
    return scene && Array.isArray(scene.floatingItems) ? scene.floatingItems : [];
}

function getVerticalSceneLighting(scene) {
    return scene && scene.lighting ? scene.lighting : null;
}

function hasVerticalSceneItemToggle(item) {
    return Boolean(item && (item.openAsset || item.closedAsset));
}

function isVerticalSceneItemOpen(scene, item) {
    if (!scene || !item || !item.id || !hasVerticalSceneItemToggle(item)) {
        return false;
    }

    const sceneState = getSceneState(scene);
    const openItems = sceneState.openItems || {};

    if (Object.prototype.hasOwnProperty.call(openItems, item.id)) {
        return Boolean(openItems[item.id]);
    }

    return Boolean(item.startsOpen);
}

//decide que imagem cada objeto deve mostrar
function getVerticalSceneItemAsset(scene, item) {
    if (!item) {
        return "";
    }

    if (!hasVerticalSceneItemToggle(item)) {
        return item.asset;
    }

    return isVerticalSceneItemOpen(scene, item)
        ? (item.openAsset || item.asset)
        : (item.closedAsset || item.asset);
}

function isVerticalSceneLit(scene) {
    if (!scene || scene.kind !== "vertical-scroll" || !getVerticalSceneLighting(scene)) {
        return false;
    }

    return Boolean(getSceneState(scene).lampLit);
}

function getVerticalSceneImageFilter(scene) {
    const lighting = getVerticalSceneLighting(scene);

    if (!lighting) {
        return "";
    }

    return isVerticalSceneLit(scene)
        ? (lighting.sceneFilterOn || "")
        : (lighting.sceneFilterOff || "");
}

//calcula a posicao dos objetos sobre a imagem vertical
function getVerticalSceneItemRect(scene, mediaRect, item, referenceRects = null) {
    const assetMeta = imageCatalog[getVerticalSceneItemAsset(scene, item)];

    if (!assetMeta) {
        return null;
    }

    let width = (mediaRect.width * item.width) / 100;
    let left = mediaRect.left + (mediaRect.width * item.left) / 100 + (item.offsetX || 0);
    let top = mediaRect.top + (mediaRect.height * item.top) / 100 + (item.offsetY || 0);
    const itemIsOpenForLayout = hasVerticalSceneItemToggle(item)
        ? isVerticalSceneItemOpen(scene, item)
        : false;

    if (hasVerticalSceneItemToggle(item)) {
        const stateLeftOffset = itemIsOpenForLayout
            ? (item.openLeftOffset || 0)
            : (item.closedLeftOffset || 0);
        const stateTopOffset = itemIsOpenForLayout
            ? (item.openTopOffset || 0)
            : (item.closedTopOffset || 0);

        left += (mediaRect.width * stateLeftOffset) / 100;
        top += (mediaRect.height * stateTopOffset) / 100;
    }

    if (item.anchorToItemId && referenceRects && referenceRects.has(item.anchorToItemId)) {
        const anchorRect = referenceRects.get(item.anchorToItemId);

        if (Number.isFinite(item.widthRatioToItem)) {
            width = anchorRect.width * item.widthRatioToItem;
        }

        const height = width * (assetMeta.height / assetMeta.width);
        const anchorX = anchorRect.left + anchorRect.width * (item.anchorX ?? 0.5);
        const anchorY = anchorRect.top + anchorRect.height * (item.anchorY ?? 0.5);
        const selfAnchorX = item.spinOriginX ?? item.selfAnchorX ?? 0.5;
        const selfAnchorY = item.spinOriginY ?? item.selfAnchorY ?? 0.5;

        return {
            left: anchorX - width * selfAnchorX + (item.offsetX || 0),
            top: anchorY - height * selfAnchorY + (item.offsetY || 0),
            width,
            height
        };
    }

    const height = width * (assetMeta.height / assetMeta.width);
    const itemScale = hasVerticalSceneItemToggle(item)
        ? (itemIsOpenForLayout ? (item.openScale || 1) : (item.closedScale || 1))
        : 1;
    const scaledWidth = width * itemScale;
    const scaledHeight = height * itemScale;
    const travel = getVerticalScrollTravel(scene, getFrameRect());
    const parallaxFactor = Number.isFinite(item.parallaxFactor) ? item.parallaxFactor : 1;
    const parallaxOffsetY = travel * (1 - parallaxFactor);

    return {
        left: left - (scaledWidth - width) / 2,
        top: top + parallaxOffsetY - (scaledHeight - height) / 2,
        width: scaledWidth,
        height: scaledHeight
    };
}

//calcula o volume de sons com base na visibilidade do objeto
function getVerticalSceneItemVisibilityVolume(scene, soundConfig) {
    if (!scene || scene.kind !== "vertical-scroll" || !soundConfig) {
        return 0;
    }

    const item = getVerticalSceneItems(scene).find((candidate) => candidate.id === soundConfig.itemId);

    if (!item) {
        return 0;
    }

    const mediaRect = getVerticalScrollMediaRect(scene);
    const itemRect = getVerticalSceneItemRect(scene, mediaRect, item);
    const frameRect = getFrameRect();

    if (!itemRect || !frameRect.height) {
        return 0;
    }

    const maxVolume = soundConfig.maxVolume ?? 0.5;
    const topRatio = itemRect.top / frameRect.height;
    const bottomRatio = (itemRect.top + itemRect.height) / frameRect.height;
    const fadeInStart = soundConfig.fadeInStartViewportY ?? 1.35;
    const fullVolumeAt = soundConfig.fullVolumeViewportY ?? 0.95;
    const fadeOutEnd = soundConfig.fadeOutEndViewportY ?? -0.18;

    if (bottomRatio <= fadeOutEnd) {
        return 0;
    }

    if (topRatio > fullVolumeAt) {
        return maxVolume * (1 - getFadeProgress(topRatio, fullVolumeAt, fadeInStart));
    }

    return maxVolume;
}

function getClockTickVolume(scene) {
    return getVerticalSceneItemVisibilityVolume(scene, scene && scene.clockTickSound);
}

function getPocketClockVolume(scene) {
    return getVerticalSceneItemVisibilityVolume(scene, scene && scene.pocketClockSound);
}

//sincroniza o som do relogio alto com a sua visibilidade
function syncClockTickAudio(scene) {
    if (!scene || !scene.clockTickSound) {
        stopClockTickAudio({ reset: true });
        return;
    }

    const audio = getClockTickAudio();
    const nextVolume = clamp(getClockTickVolume(scene), 0, scene.clockTickSound.maxVolume ?? 0.5);

    if (clockTickAudioState.sceneId !== scene.id) {
        audio.currentTime = 0;
        clockTickAudioState.sceneId = scene.id;
    }

    audio.volume = nextVolume;

    if (nextVolume <= 0.005) {
        audio.pause();
        return;
    }

    if (audio.paused) {
        audio.play().catch(() => {

        });
    }
}

//sincroniza o som do relogio de bolso com a sua visibilidade
function syncPocketClockAudio(scene) {
    if (!scene || !scene.pocketClockSound) {
        stopPocketClockAudio({ reset: true });
        return;
    }

    const audio = getPocketClockAudio();
    const nextVolume = clamp(getPocketClockVolume(scene), 0, scene.pocketClockSound.maxVolume ?? 0.5);

    if (pocketClockAudioState.sceneId !== scene.id) {
        audio.currentTime = 0;
        pocketClockAudioState.sceneId = scene.id;
    }

    audio.playbackRate = pocketClockAudioState.playbackRate;
    audio.volume = nextVolume;

    if (nextVolume <= 0.005) {
        audio.pause();
        return;
    }

    if (audio.paused) {
        audio.play().catch(() => {

        });
    }
}

//altera o estado de luz do candeeiro
function setVerticalSceneLampState(scene, lampLit) {
    if (!scene || scene.kind !== "vertical-scroll" || !getVerticalSceneLighting(scene)) {
        return;
    }

    const sceneState = getSceneState(scene);

    if (sceneState.lampLit === lampLit) {
        return;
    }

    sceneState.lampLit = lampLit;
    renderScene();
}

//abre ou fecha objetos interativos como livros
function setVerticalSceneItemOpen(scene, itemId, isOpen) {
    if (!scene || scene.kind !== "vertical-scroll" || !itemId) {
        return;
    }

    const sceneState = getSceneState(scene);

    if (!sceneState.openItems) {
        sceneState.openItems = {};
    }

    if (sceneState.openItems[itemId] === isOpen) {
        return;
    }

    sceneState.openItems[itemId] = isOpen;
    renderScene();
}

//calcula a origem da luz do candeeiro
function getVerticalSceneLightOrigin(scene, mediaRect, lighting) {
    const triggerItemId = lighting && lighting.triggerItemId;

    if (triggerItemId) {
        const referenceRects = new Map();
        const triggerItem = getVerticalSceneItems(scene).find((item) => {
            const itemRect = getVerticalSceneItemRect(scene, mediaRect, item, referenceRects);

            if (item.id && itemRect) {
                referenceRects.set(item.id, itemRect);
            }

            return item.id === triggerItemId;
        });

        if (triggerItem) {
            const triggerItemRect = referenceRects.get(triggerItem.id);

            if (triggerItemRect) {
                return {
                    x: triggerItemRect.left + triggerItemRect.width * (lighting.glowAnchorX ?? 0.5) + (lighting.glowOffsetX || 0),
                    y: triggerItemRect.top + triggerItemRect.height * (lighting.glowAnchorY ?? 0.24) + (lighting.glowOffsetY || 0)
                };
            }
        }
    }

    return {
        x: mediaRect.left + (mediaRect.width * (lighting.glowCenterX || 0)) / 100,
        y: mediaRect.top + (mediaRect.height * (lighting.glowCenterY || 0)) / 100
    };
}

//desenha a luz e ambiente da cena vertical
function renderVerticalSceneLighting(scene, mediaRect) {
    const lighting = getVerticalSceneLighting(scene);

    if (!lighting || !isVerticalSceneLit(scene)) {
        return;
    }

    const lightOrigin = getVerticalSceneLightOrigin(scene, mediaRect, lighting);
    const frameRect = getFrameRect();
    const ambientCenterX = clamp((lightOrigin.x / Math.max(frameRect.width, 1)) * 100, 0, 100);
    const ambientCenterY = clamp((lightOrigin.y / Math.max(frameRect.height, 1)) * 100, 0, 100);

    const ambient = document.createElement("div");
    ambient.className = "scene-light-ambient";
    ambient.style.opacity = `${lighting.ambientOpacity ?? 0.28}`;
    ambient.style.background = `
        radial-gradient(circle at ${ambientCenterX}% ${ambientCenterY}%, rgba(255, 244, 209, 0.2), transparent 26%),
        linear-gradient(180deg, rgba(255, 225, 162, 0.14), rgba(255, 213, 128, 0.04) 30%, transparent 66%)
    `;
    dom.sceneOverlay.append(ambient);

    const glow = document.createElement("div");
    const glowSize = (mediaRect.width * (lighting.glowRadius || 40)) / 100;
    glow.className = "scene-light-glow";
    glow.style.left = `${lightOrigin.x - glowSize / 2}px`;
    glow.style.top = `${lightOrigin.y - glowSize / 2}px`;
    glow.style.width = `${glowSize}px`;
    glow.style.height = `${glowSize}px`;
    glow.style.opacity = `${lighting.glowOpacity ?? 0.88}`;
    dom.sceneOverlay.append(glow);
}

//desenha brilhos associados a objetos interativos
function renderVerticalItemGlow(item, itemRect) {
    if (!item.glow || item.glow.hidden) {
        return null;
    }

    const glowSize = itemRect.width * (item.glow.radius || 8);
    const glow = document.createElement("div");
    glow.className = "scene-light-glow scene-item-glow";
    glow.style.left = `${itemRect.left + itemRect.width * (item.glow.anchorX ?? 0.5) - glowSize / 2}px`;
    glow.style.top = `${itemRect.top + itemRect.height * (item.glow.anchorY ?? 0.2) - glowSize / 2}px`;
    glow.style.width = `${glowSize}px`;
    glow.style.height = `${glowSize}px`;
    glow.style.opacity = `${item.glow.opacity ?? 0.75}`;
    glow.style.transform = "scale(1)";
    glow.style.zIndex = `${Math.max((item.zIndex ?? 2) - 1, 1)}`;
    dom.sceneOverlay.append(glow);

    return glow;
}

//desenha e liga interacoes dos objetos flutuantes
function renderVerticalSceneItems(scene, mediaRect, options = {}) {
    const sceneState = getSceneState(scene);
    const items = getVerticalSceneItems(scene);
    const lighting = getVerticalSceneLighting(scene);
    const lampIsLit = isVerticalSceneLit(scene);
    const renderedItemRects = new Map();
    const renderedElements = new Map();

    if (!items.length) {
        return;
    }

    if (lighting && !options.suppressLighting) {
        renderVerticalSceneLighting(scene, mediaRect);
    }

    items.forEach((item) => {
        if (options.hideStones && item.id && item.id.startsWith("pedra-")) {
            return;
        }

        const itemRect = getVerticalSceneItemRect(scene, mediaRect, item, renderedItemRects);
        const itemAsset = getVerticalSceneItemAsset(scene, item);
        const itemIsOpen = isVerticalSceneItemOpen(scene, item);

        if (!itemRect || !itemAsset) {
            return;
        }

        if (item.id) {
            renderedItemRects.set(item.id, itemRect);
        }

        const itemGlowElement = renderVerticalItemGlow(item, itemRect);

        const itemFilter = lighting
            ? (lampIsLit
                ? (lighting.itemFilterOn || "")
                : (lighting.itemFilterOff || ""))
            : "";
        const triggerItemFilter = lighting
            ? (lampIsLit
                ? (lighting.triggerItemFilterOn || lighting.itemFilterOn || "")
                : (lighting.triggerItemFilterOff || lighting.itemFilterOff || ""))
            : itemFilter;

        if (item.id && lighting && item.id === lighting.triggerItemId) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "scene-prop-button scene-vertical-item-button";
            if (!lampIsLit && sceneState.lampHintActive) {
                button.classList.add("scene-lamp-click-hint");
            }
            button.setAttribute(
                "aria-label",
                lampIsLit
                    ? (item.activeInteractiveLabel || "Apagar o candeeiro")
                    : (item.interactiveLabel || "Acender o candeeiro")
            );
            button.setAttribute("aria-pressed", lampIsLit ? "true" : "false");
            applyRectStyles(button, itemRect);
            button.style.transformOrigin = item.transformOrigin || "top left";
            button.style.transform = `rotate(${item.rotation || 0}deg)`;
            button.style.zIndex = `${item.zIndex ?? 2}`;
            button.addEventListener("click", () => {
                playLampToggleSound();
                sceneState.lampHintActive = false;
                setVerticalSceneLampState(scene, !lampIsLit);
            });

            const image = document.createElement("img");
            image.className = "scene-prop--interactive scene-vertical-item";
            image.src = itemAsset;
            image.alt = "";
            image.style.filter = triggerItemFilter;
            image.style.transformOrigin = "top left";
            image.style.transform = `scale(${item.contentScale || 1})`;
            button.append(image);
            dom.sceneOverlay.append(button);
            return;
        }

        if (hasVerticalSceneItemToggle(item)) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "scene-prop-button scene-vertical-item-button";
            button.setAttribute(
                "aria-label",
                itemIsOpen
                    ? (item.activeInteractiveLabel || "Fechar o livro")
                    : (item.interactiveLabel || "Abrir o livro")
            );
            button.setAttribute("aria-pressed", itemIsOpen ? "true" : "false");
            applyRectStyles(button, itemRect);
            button.style.transformOrigin = item.transformOrigin || "top left";
            button.style.transform = `rotate(${item.rotation || 0}deg)`;
            button.style.zIndex = `${item.zIndex ?? 2}`;
            button.addEventListener("click", () => {
                playBookToggleSound();
                setVerticalSceneItemOpen(scene, item.id, !itemIsOpen);
            });

            const image = document.createElement("img");
            image.className = "scene-prop--interactive scene-vertical-item";
            image.src = itemAsset;
            image.alt = "";
            image.style.filter = itemFilter;
            image.style.transformOrigin = "top left";
            image.style.transform = `scale(${item.contentScale || 1})`;
            button.append(image);
            dom.sceneOverlay.append(button);
            return;
        }

        if (Array.isArray(item.alternateAssets) && item.alternateAssets.length >= 2) {
            const stack = document.createElement("div");
            stack.className = "scene-prop scene-vertical-item-stack";
            stack.style.left = `${itemRect.left}px`;
            stack.style.top = `${itemRect.top}px`;
            stack.style.width = `${itemRect.width}px`;
            stack.style.height = `${itemRect.height}px`;
            stack.style.transformOrigin = item.transformOrigin || "top left";
            stack.style.transform = `rotate(${item.rotation || 0}deg) scale(${item.contentScale || 1})`;
            stack.style.zIndex = `${item.zIndex ?? 2}`;

            const animationDurationMs = Math.max((item.alternateIntervalMs || 1000) * item.alternateAssets.length, 1);

            item.alternateAssets.slice(0, 2).forEach((assetName, assetIndex) => {
                const layer = document.createElement("img");
                layer.className = `scene-vertical-item-layer ${assetIndex === 0 ? "is-primary" : "is-secondary"}`;
                layer.src = assetName;
                layer.alt = "";
                layer.style.filter = itemFilter;
                layer.style.animationDuration = `${animationDurationMs}ms`;
                stack.append(layer);
            });

            dom.sceneOverlay.append(stack);
            return;
        }

        const image = document.createElement("img");
        image.className = `scene-prop scene-vertical-item${item.swingOnHover ? " is-hover-swing" : ""}${item.spinDurationMs ? " is-clock-hand-spinning" : ""}`;
        image.src = itemAsset;
        image.alt = "";
        image.style.left = `${itemRect.left}px`;
        image.style.top = `${itemRect.top}px`;
        image.style.width = `${itemRect.width}px`;
        image.style.height = `${itemRect.height}px`;
        image.style.filter = itemFilter;
        image.style.transformOrigin = item.spinOriginX || item.spinOriginY
            ? `${(item.spinOriginX ?? 0.5) * 100}% ${(item.spinOriginY ?? 0.5) * 100}%`
            : (item.transformOrigin || "top left");
        image.style.transform = `rotate(${item.rotation || 0}deg) scale(${item.contentScale || 1}) scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1})`;
        image.style.setProperty("--vertical-item-rotation", `${item.rotation || 0}deg`);
        image.style.setProperty("--vertical-item-scale", `${item.contentScale || 1}`);
        image.style.setProperty("--vertical-item-flip-x", item.flipX ? "-1" : "1");
        image.style.setProperty("--vertical-item-flip-y", item.flipY ? "-1" : "1");
        image.style.setProperty("--vertical-item-origin-x", `${(item.spinOriginX ?? 0.5) * 100}%`);
        image.style.setProperty("--vertical-item-origin-y", `${(item.spinOriginY ?? 0.5) * 100}%`);
        if (item.spinDurationMs) {
            image.style.animationDuration = `${item.spinDurationMs}ms`;
        }
        if (item.swingOnHover || item.rewindOnHover || item.rewindOnClick || item.extinguishGlowOnHover) {
            image.style.pointerEvents = "auto";
        }
        if (item.hoverGlow) {
            const hoverGlowSize = typeof item.hoverGlow === "object" ? item.hoverGlow.size || "1rem" : "1rem";
            const hoverGlowColor = typeof item.hoverGlow === "object" ? item.hoverGlow.color || "rgba(255, 230, 166, 0.38)" : "rgba(255, 230, 166, 0.38)";
            const hoverGlowFilter = `drop-shadow(0 0 ${hoverGlowSize} ${hoverGlowColor})`;
            image.style.pointerEvents = "auto";
            image.addEventListener("pointerenter", () => {
                image.style.filter = itemFilter ? `${itemFilter} ${hoverGlowFilter}` : hoverGlowFilter;
            });
            image.addEventListener("pointerleave", () => {
                image.style.filter = itemFilter;
            });
            image.addEventListener("pointercancel", () => {
                image.style.filter = itemFilter;
            });
        }
        const rewindVerticalScroll = () => {
            state.verticalScrollVelocity = Math.min(
                state.verticalScrollVelocity,
                item.rewindVelocity || item.rewindHoverVelocity || -140
            );
            state.verticalScrollDamping = item.rewindDamping || item.rewindHoverDamping || 0.86;
            startVerticalScrollInertia(scene.id);
        };
        if (item.rewindOnHover) {
            image.addEventListener("pointerenter", rewindVerticalScroll);
        }
        if (item.rewindOnClick) {
            image.addEventListener("click", rewindVerticalScroll);
        }
        if (item.hoverSound === "chair-ranger") {
            image.addEventListener("pointerenter", startChairRangerSound);
            image.addEventListener("pointerleave", stopChairRangerSound);
            image.addEventListener("pointerout", stopChairRangerSound);
            image.addEventListener("mouseleave", stopChairRangerSound);
            image.addEventListener("pointercancel", stopChairRangerSound);
        }
        if (item.extinguishGlowOnHover && item.id) {
            let relightTimer = 0;
            image.addEventListener("pointerenter", () => {
                if (relightTimer) {
                    window.clearTimeout(relightTimer);
                    relightTimer = 0;
                }
                if (itemGlowElement) {
                    itemGlowElement.style.opacity = "0";
                    itemGlowElement.style.transform = "scale(0.18)";
                }
                if (item.extinguishedAsset) {
                    image.src = item.extinguishedAsset;
                }
            });
            image.addEventListener("pointerleave", () => {
                if (relightTimer) {
                    window.clearTimeout(relightTimer);
                }
                relightTimer = window.setTimeout(() => {
                    if (itemGlowElement && itemGlowElement.isConnected) {
                        itemGlowElement.style.opacity = `${item.glow.opacity ?? 0.75}`;
                        itemGlowElement.style.transform = "scale(1)";
                    }
                    if (image.isConnected) {
                        image.src = itemAsset;
                    }
                    relightTimer = 0;
                }, item.relightDelayMs || 2000);
            });
        }
        if (item.speedsHandsOnHover && item.id) {
            const setAnchoredHandSpeed = (isFast) => {
                renderedElements.forEach((element, elementItemId) => {
                    const elementItem = items.find((candidate) => candidate.id === elementItemId);

                    if (!elementItem || elementItem.anchorToItemId !== item.id || !elementItem.spinDurationMs) {
                        return;
                    }

                    const playbackRate = isFast && elementItem.hoverSpinDurationMs
                        ? elementItem.spinDurationMs / elementItem.hoverSpinDurationMs
                        : 1;

                    element.getAnimations().forEach((animation) => {
                        if (typeof animation.updatePlaybackRate === "function") {
                            animation.updatePlaybackRate(playbackRate);
                        } else {
                            animation.playbackRate = playbackRate;
                        }
                    });
                });
            };

            image.addEventListener("pointerenter", () => {
                setAnchoredHandSpeed(true);
                setPocketClockAudioPlaybackRate(item.hoverAudioPlaybackRate || 2.4);
            });
            image.addEventListener("pointerleave", () => {
                setAnchoredHandSpeed(false);
                setPocketClockAudioPlaybackRate(1);
            });
        }
        image.style.zIndex = `${item.zIndex ?? 2}`;
        dom.sceneOverlay.append(image);
        if (item.id) {
            renderedElements.set(item.id, image);
        }
    });
}

//calcula a posicao da imagem longa conforme o scroll
function getVerticalScrollMediaRect(scene, progressOverride) {
    const frameRect = getFrameRect();
    const height = getVerticalScrollImageHeight(scene, frameRect);
    const travel = getVerticalScrollTravel(scene, frameRect, progressOverride);
    const overflowY = getVerticalScrollBaseOverflow(scene, frameRect);
    const top = overflowY > 0 || scene.transitionAsset
        ? -travel
        : (frameRect.height - height) / 2;

    return {
        left: 0,
        top,
        width: frameRect.width,
        height
    };
}

//calcula a composicao da transicao para a porta
function getVerticalScrollTransitionLayout(scene, progressOverride) {
    if (!scene.transitionAsset) {
        return null;
    }

    const frameRect = getFrameRect();
    const transitionDistance = getVerticalScrollTransitionStageHeight(scene, frameRect);

    if (!transitionDistance) {
        return null;
    }

    const baseOverflow = getVerticalScrollBaseOverflow(scene, frameRect);
    const travel = getVerticalScrollTravel(scene, frameRect, progressOverride);
    const transitionTravel = Math.max(0, travel - baseOverflow);
    const revealDistance = getVerticalScrollTransitionRevealDistance(scene, frameRect);
    const rotationDistance = getVerticalScrollTransitionRotationDistance(scene, frameRect);
    const progress = clamp(transitionTravel / transitionDistance, 0, 1);
    const revealProgress = revealDistance
        ? clamp(transitionTravel / revealDistance, 0, 1)
        : 1;
    const rotationProgress = rotationDistance
        ? clamp((transitionTravel - revealDistance) / rotationDistance, 0, 1)
        : 1;
    const stageTop = frameRect.height - revealProgress * frameRect.height;
    const seamShadeHeight = frameRect.height * (scene.transitionSeamShadeHeightMultiplier || 0.16);
    const seamShadeOpacity = getFadeInOutProgress(
        progress,
        scene.transitionSeamShadeStart ?? 0.06,
        scene.transitionSeamShadePeak ?? 0.22,
        scene.transitionSeamShadeEnd ?? 0.42
    );
    const baseTransitionRect = getCoverMediaRectForFrame(imageCatalog[scene.transitionAsset], frameRect);
    const scale = lerp(scene.transitionZoomStart || 1.22, scene.transitionZoomEnd || 1.08, rotationProgress);
    const translateY = lerp(scene.transitionTranslateYStart || 0, scene.transitionTranslateYEnd || 0, rotationProgress);

    return {
        progress,
        revealProgress,
        rotationProgress,
        stageRect: {
            left: 0,
            top: stageTop,
            width: frameRect.width,
            height: frameRect.height
        },
        seamShadeRect: {
            left: 0,
            top: stageTop - seamShadeHeight / 2,
            width: frameRect.width,
            height: seamShadeHeight
        },
        seamShadeOpacity,
        imageRect: getAdjustedMediaRect(baseTransitionRect, {
            scale,
            translateY
        }),
        rotation: lerp(180, 0, rotationProgress)
    };
}

//desenha a porta invertida e a sua rotacao
function renderVerticalScrollTransition(scene, layout) {
    if (!layout) {
        return;
    }

    const sceneState = getSceneState(scene);
    if (layout.rotationProgress > 0 && !sceneState.doorRotationTransitionSoundPlayed) {
        sceneState.doorRotationTransitionSoundPlayed = true;
        playDoorRotationTransitionSound();
    }

    const hasExplicitTransitionBackdrop = Object.prototype.hasOwnProperty.call(scene, "transitionBackdropAsset");
    const transitionBackdropAsset = hasExplicitTransitionBackdrop
        ? scene.transitionBackdropAsset
        : scene.transitionAsset;
    const transitionStage = document.createElement("div");
    transitionStage.className = "scene-scroll-transition";
    applyRectStyles(transitionStage, layout.stageRect);
    if (transitionBackdropAsset) {
        transitionStage.style.backgroundImage = `
            linear-gradient(180deg, rgba(8, 8, 8, 0.14), rgba(8, 8, 8, 0.34)),
            url("${encodeURI(transitionBackdropAsset)}")
        `;
        transitionStage.style.backgroundPosition = "center center";
        transitionStage.style.backgroundSize = "cover";
        transitionStage.style.backgroundRepeat = "no-repeat";
    } else {
        transitionStage.style.backgroundImage = "linear-gradient(180deg, rgba(12, 10, 9, 0.96), rgba(0, 0, 0, 1))";
        transitionStage.style.backgroundPosition = "center center";
        transitionStage.style.backgroundSize = "cover";
        transitionStage.style.backgroundRepeat = "no-repeat";
    }

    const transitionImage = document.createElement("img");
    transitionImage.className = "scene-scroll-transition-image";
    transitionImage.src = scene.transitionAsset;
    transitionImage.alt = imageCatalog[scene.transitionAsset].alt;
    applyRectStyles(transitionImage, layout.imageRect);
    transitionImage.style.filter = scene.transitionFilter || "";
    transitionImage.style.transform = `translate3d(0, 0, 0) rotate(${layout.rotation}deg)`;

    const transitionVignette = document.createElement("div");
    transitionVignette.className = "scene-vignette scene-scroll-transition-vignette";

    transitionStage.append(transitionImage);
    transitionStage.append(transitionVignette);
    dom.sceneOverlay.append(transitionStage);
}

//desenha o escurecimento entre tunel e porta
function renderVerticalScrollBlackFade(scene, transitionLayout = null) {
    const frameRect = getFrameRect();
    const baseOverflow = getVerticalScrollBaseOverflow(scene, frameRect);
    const totalOverflow = getVerticalScrollOverflow(scene, frameRect);
    const travel = getVerticalScrollTravel(scene, frameRect);
    const transitionStage = totalOverflow - baseOverflow;

    if (transitionStage <= 0) return;

    const transitionTravel = Math.max(0, travel - baseOverflow);
    const transitionProgress = clamp(transitionTravel / transitionStage, 0, 1);


    const opacity = getFadeInOutProgress(transitionProgress, 0, 0.3, 0.55);

    if (opacity <= 0.005) return;

    const fadeOverlay = document.createElement("div");
    fadeOverlay.className = "scene-tunnel-fade";
    fadeOverlay.style.opacity = opacity.toFixed(3);
    dom.sceneOverlay.append(fadeOverlay);
}

//desenha a cena vertical completa
function renderVerticalScrollScene(scene) {
    const sceneState = getSceneState(scene);
    const cameFromTunnel = Boolean(sceneState.cameFromTunnel);

    if (cameFromTunnel && !sceneState.lampHintActive) {
        sceneState.lampHintActive = true;
    }

    const mediaRect = getVerticalScrollMediaRect(scene);
    const transitionLayout = getVerticalScrollTransitionLayout(scene);

    dom.sceneFrame.classList.add("is-vertical-scroll");
    setBackdrop(scene.asset, `center ${getVerticalScrollBackdropProgress(scene) * 100}%`);
    setImagePlacement(scene.asset, mediaRect, {
        filter: getVerticalSceneImageFilter(scene)
    });
    renderVerticalSceneItems(scene, mediaRect, {
        suppressLighting: Boolean(transitionLayout && transitionLayout.progress > 0),
        hideStones: Boolean(transitionLayout && transitionLayout.progress > 0)
    });
    renderVerticalScrollTransition(scene, transitionLayout);
    renderVerticalScrollBlackFade(scene, transitionLayout);


    if (cameFromTunnel) {
        sceneState.cameFromTunnel = false;
        const fadeEl = document.createElement("div");
        fadeEl.style.cssText = "position:absolute;inset:0;background:#000;opacity:1;pointer-events:none;z-index:20;";
        dom.sceneOverlay.append(fadeEl);

        const startTime = performance.now();
        const holdDuration = 160;
        const fadeDuration = 720;

        const fadeFromBlack = (time) => {
            if (!fadeEl.isConnected) return;
            const elapsed = time - startTime;
            const t = Math.min(1, Math.max(0, (elapsed - holdDuration) / fadeDuration));
            const eased = 1 - Math.pow(1 - t, 3);
            fadeEl.style.opacity = String(1 - eased);
            if (t >= 1) { fadeEl.remove(); return; }
            requestAnimationFrame(fadeFromBlack);
        };
        requestAnimationFrame(fadeFromBlack);
    }
    setCaption(transitionLayout && transitionLayout.progress > 0 ? scene.transitionInstruction || scene.instruction : scene.instruction);
    setProgress(
        sceneState.progress,
        1,
        transitionLayout && transitionLayout.progress > 0
            ? `Transicao ${Math.round(transitionLayout.progress * 100)}%`
            : `Imagem ${Math.round(sceneState.progress * 100)}%`
    );
}

//aplica scroll manual a cena vertical
function handleVerticalScrollWheel(delta) {
    const scene = getCurrentScene();
    const overflowY = getVerticalScrollOverflow(scene);

    if (!overflowY) {
        if (delta > 0) {
            goToScene(scene.id + 1);
            lockWheel(900);
        }
        return;
    }

    if (scene.transitionAsset && delta > 0) {
        const sceneState = getSceneState(scene);
        const currentProgress = getVerticalScrollProgress(scene);
        const rotationStartProgress = getVerticalDoorRotationStartProgress(scene);
        const nextProgress = currentProgress + delta / overflowY;

        if (currentProgress >= rotationStartProgress || nextProgress >= rotationStartProgress) {
            sceneState.progress = Math.max(currentProgress, rotationStartProgress);
            sceneState.verticalRotationTargetProgress = 1;
            state.verticalScrollVelocity = 0;
            state.verticalScrollDamping = 0.86;
            if (state.verticalScrollRafId) {
                window.cancelAnimationFrame(state.verticalScrollRafId);
                state.verticalScrollRafId = 0;
            }
            startVerticalDoorRotationAnimation(scene.id);
            return;
        }
    }

    state.verticalScrollVelocity = clamp(state.verticalScrollVelocity + delta * 0.18, -260, 260);
    startVerticalScrollInertia(scene.id);
}

function startVerticalDoorRotationAnimation(sceneId) {
    if (state.verticalScrollRafId) {
        return;
    }

    const scene = getSceneById(sceneId);
    const sceneState = scene ? getSceneState(scene) : null;

    if (sceneState) {
        sceneState.verticalRotationLastTime = performance.now();
    }

    state.verticalScrollRafId = window.requestAnimationFrame(() => animateVerticalDoorRotation(sceneId));
}

function animateVerticalDoorRotation(sceneId) {
    state.verticalScrollRafId = 0;

    const scene = getCurrentScene();

    if (scene.kind !== "vertical-scroll" || scene.id !== sceneId) {
        state.verticalScrollVelocity = 0;
        return;
    }

    const sceneState = getSceneState(scene);
    const targetProgress = Number.isFinite(sceneState.verticalRotationTargetProgress)
        ? sceneState.verticalRotationTargetProgress
        : 1;
    const now = performance.now();
    const elapsedSeconds = Math.min((now - (sceneState.verticalRotationLastTime || now)) / 1000, 0.08);
    const maxStep = VERTICAL_DOOR_ROTATION_PROGRESS_PER_SECOND * elapsedSeconds;
    const distance = targetProgress - sceneState.progress;

    sceneState.verticalRotationLastTime = now;

    if (Math.abs(distance) <= maxStep) {
        sceneState.progress = targetProgress;
    } else {
        sceneState.progress += Math.sign(distance) * maxStep;
    }

    sceneState.progress = clamp(sceneState.progress, 0, 1);
    renderScene();

    if (sceneState.progress >= 1 && targetProgress >= 1) {
        const nextScene = getSceneById(scene.id + 1);

        if (nextScene) {
            state.sceneState.set(nextScene.id, getDefaultSceneState(nextScene));
        }

        goToScene(scene.id + 1, { animate: false });
        lockWheel(700);
        return;
    }

    state.verticalScrollRafId = window.requestAnimationFrame(() => animateVerticalDoorRotation(sceneId));
}

//continua o movimento depois de um impulso de scroll
function startVerticalScrollInertia(sceneId) {
    if (state.verticalScrollRafId) {
        return;
    }

    const step = () => {
        state.verticalScrollRafId = 0;

        const scene = getCurrentScene();

        if (scene.kind !== "vertical-scroll" || scene.id !== sceneId) {
            state.verticalScrollVelocity = 0;
            return;
        }

        const velocity = state.verticalScrollVelocity;

        if (Math.abs(velocity) < 0.35) {
            state.verticalScrollVelocity = 0;
            return;
        }

        applyVerticalScrollDelta(scene, velocity);

        if (state.currentSceneId !== sceneId) {
            state.verticalScrollVelocity = 0;
            return;
        }

        const damping = Number.isFinite(state.verticalScrollDamping) ? state.verticalScrollDamping : 0.86;
        state.verticalScrollVelocity *= damping;
        state.verticalScrollDamping = 0.86;
        state.verticalScrollRafId = window.requestAnimationFrame(step);
    };

    state.verticalScrollRafId = window.requestAnimationFrame(step);
}

//atualiza o progresso vertical e avanca quando chega ao fim
function applyVerticalScrollDelta(scene, delta) {
    const sceneState = getSceneState(scene);
    const currentProgress = sceneState.progress;
    const overflowY = getVerticalScrollOverflow(scene);
    const nextProgress = currentProgress + delta / overflowY;

    if (nextProgress > 1) {
        sceneState.progress = 1;
        renderScene();

        if (scene.transitionAsset) {
            const nextScene = getSceneById(scene.id + 1);

            if (nextScene) {
                state.sceneState.set(nextScene.id, getDefaultSceneState(nextScene));
            }

            goToScene(scene.id + 1, { animate: false });
            lockWheel(700);
            return;
        }

        if (currentProgress >= 1) {
            goToScene(scene.id + 1);
            lockWheel(900);
        }

        return;
    }

    if (nextProgress < 0) {
        sceneState.progress = 0;
        scheduleRenderScene();
        return;
    }

    sceneState.progress = clamp(nextProgress, 0, 1);
    scheduleRenderScene();
}
