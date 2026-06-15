//controla a navegacao, o estado e a renderizacao principal da experiencia
const dom = {
    stage: document.querySelector("#stage"),
    sceneBadge: document.querySelector("#sceneBadge"),
    sceneTitle: document.querySelector("#sceneTitle"),
    sceneSummary: document.querySelector("#sceneSummary"),
    sceneProgressCard: document.querySelector("#sceneProgressCard"),
    sceneProgressText: document.querySelector("#sceneProgressText"),
    sceneProgressFill: document.querySelector("#sceneProgressFill"),
    fullscreenButton: document.querySelector("#fullscreenButton"),
    sceneFrame: document.querySelector("#sceneFrame"),
    sceneBackdrop: document.querySelector("#sceneBackdrop"),
    sceneUnderlay: document.querySelector("#sceneUnderlay"),
    sceneImage: document.querySelector("#sceneImage"),
    sceneContent: document.querySelector("#sceneContent"),
    sceneOverlay: document.querySelector("#sceneOverlay"),
    sceneCaption: document.querySelector("#sceneCaption"),
    sceneNav: document.querySelector("#sceneNav"),
    prevSceneButton: document.querySelector("#prevSceneButton"),
    restartSceneButton: document.querySelector("#restartSceneButton"),
    nextSceneButton: document.querySelector("#nextSceneButton")
};

const state = {
    currentSceneId: getInitialSceneId(),
    sceneState: new Map(),
    transitioning: false,
    skipHashSync: false,
    wheelLockedUntil: 0,
    sceneWheelTravel: 0,
    lastWheelAt: 0,
    scheduledRenderId: 0,
    verticalScrollRafId: 0,
    verticalScrollVelocity: 0,
    forestSmokeRuntime: null,
    gardenCardRuntime: null
};

function readSceneIdFromHash() {
    const hashMatch = window.location.hash.match(/cena-(\d+)/i);
    const parsedId = hashMatch ? Number(hashMatch[1]) : NaN;

    if (!Number.isFinite(parsedId)) {
        return null;
    }

    return clamp(parsedId, 1, SCENE_COUNT);
}

function getInitialSceneId() {
    return 1;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getSceneById(sceneId) {
    return scenes.find((scene) => scene.id === sceneId) || null;
}

function getCurrentScene() {
    return getSceneById(state.currentSceneId) || scenes[1];
}

function getDefaultSceneState(scene) {
    if (scene.kind === "title-screen") {
        return { progress: 0 };
    }

    if (scene.kind === "doors") {
        return { stepIndex: 0, scrollProgress: 0, scrollTargetProgress: 0, scrollAnimationFrameId: 0 };
    }

    if (scene.kind === "forest-scroll") {
        if (scene.smokeTransition) {
            return { progress: 0, smokeCoverage: 0, smokeUnlocked: false };
        }

        return { progress: 0 };
    }

    if (scene.kind === "vertical-scroll") {
        return { progress: 0, lampLit: false, openItems: {} };
    }

    if (scene.kind === "garden-paint") {
        return {
            paintedRoses: [],
            paintCharges: 0,
            roseCoverage: {},
            roseStrokes: {},
            visibleRoseIds: [],
            cardTransitionStarted: false,
            cardTransitionComplete: false
        };
    }

    return {};
}

function getSceneState(scene) {
    if (!state.sceneState.has(scene.id)) {
        state.sceneState.set(scene.id, getDefaultSceneState(scene));
    }

    return state.sceneState.get(scene.id);
}

//cria os botoes de navegacao das cenas
function buildNav() {
    dom.sceneNav.innerHTML = "";

    scenes.forEach((scene) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "scene-dot";
        button.dataset.sceneId = String(scene.id);
        button.textContent = String(scene.id);
        button.setAttribute("aria-label", scene.title);
        button.classList.add("is-ready");

        button.addEventListener("click", () => {
            goToScene(scene.id);
        });

        dom.sceneNav.append(button);
    });
}

//atualiza o estado visual da navegacao
function syncNav() {
    const buttons = dom.sceneNav.querySelectorAll(".scene-dot");

    buttons.forEach((button) => {
        const buttonSceneId = Number(button.dataset.sceneId);
        button.classList.toggle("is-active", buttonSceneId === state.currentSceneId);

        if (buttonSceneId === state.currentSceneId) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });
}

//aplica as cores da cena atual no tema global
function setPalette(scene) {
    document.documentElement.style.setProperty("--scene-accent", scene.palette.accent);
    document.documentElement.style.setProperty("--scene-accent-soft", scene.palette.accentSoft);
    document.documentElement.style.setProperty("--scene-glow", scene.palette.glow);
}

//mostra ou limpa a legenda da cena
function setCaption(text) {
    dom.sceneCaption.innerHTML = "";

    if (!text) {
        return;
    }

    const chip = document.createElement("div");
    chip.className = "caption-chip";
    chip.textContent = text;
    dom.sceneCaption.append(chip);
}

//atualiza a barra de progresso quando a cena precisa dela
function setProgress(current, total, label) {
    if (!total) {
        dom.sceneProgressCard.hidden = true;
        dom.sceneProgressText.textContent = "";
        dom.sceneProgressFill.style.width = "0%";
        return;
    }

    dom.sceneProgressCard.hidden = false;
    dom.sceneProgressText.textContent = label;
    dom.sceneProgressFill.style.width = `${(current / total) * 100}%`;
}

//limpa as camadas visuais antes de desenhar uma nova cena
function clearSceneLayers() {
    teardownForestSmokeRuntime();
    if (typeof teardownCanvasTunnel === "function") teardownCanvasTunnel();
    if (typeof stopChairRangerSound === "function") stopChairRangerSound();
    if (!state.gardenCardRuntime || !state.gardenCardRuntime.persistent) {
        teardownGardenCardRuntime();
    }
    dom.sceneBackdrop.hidden = false;

    dom.sceneUnderlay.innerHTML = "";
    dom.sceneContent.innerHTML = "";
    dom.sceneOverlay.innerHTML = "";
    dom.sceneOverlay.style.pointerEvents = "";
    dom.sceneFrame.classList.remove("is-panorama", "is-vertical-scroll");
}

//constroi a composicao visual da cena de titulo
function createTitleScreen(scene) {
    const panel = document.createElement("article");
    panel.className = "title-screen";
    panel.setAttribute("aria-label", scene.screenTitle || scene.title);

    if (scene.backgroundColor) {
        panel.style.setProperty("--title-screen-bg", scene.backgroundColor);
    }

    if (!isInteractiveTitleScene(scene)) {
        panel.innerHTML = `
            <div class="title-screen-inner">
                <p class="title-screen-tag">${scene.screenTag || scene.badge}</p>
                <h2 class="title-screen-title">${scene.screenTitle || scene.title}</h2>
                <p class="title-screen-copy">${scene.screenCopy || scene.summary}</p>
            </div>
            <div class="title-scroll-arrow" aria-hidden="true"></div>
        `;
        return panel;
    }

    const frameMeta = imageCatalog[scene.frameAsset];
    const frameRect = getFrameRect();
    const titleLayout = scene.titleLayout || {};
    const zoomConfig = scene.zoom || {};
    const transitionConfig = getTitleSceneTransitionConfig(scene) || {};
    const anchorWidth = Math.min(
        frameRect.width * (titleLayout.anchorViewportWidthRatio || 0.8),
        titleLayout.anchorMaxWidth || 820
    );
    const anchorHeight = anchorWidth * (frameMeta.height / frameMeta.width);
    const baseLeft = (frameRect.width - anchorWidth) / 2;
    const baseTop = (frameRect.height - anchorHeight) / 2;
    const focusX = clamp(zoomConfig.focusX ?? 0.5, 0, 1);
    const focusY = clamp(zoomConfig.focusY ?? 0.5, 0, 1);
    const progress = getTitleSceneProgress(scene);
    const transitionProgress = getTitleSceneTransitionProgress(scene);
    const easedProgress = easeInOutCubic(progress);
    const focusPointX = baseLeft + anchorWidth * focusX;
    const focusPointY = baseTop + anchorHeight * focusY;
    const translateX = (frameRect.width / 2 - focusPointX) * easedProgress;
    const translateY = (frameRect.height / 2 - focusPointY) * easedProgress;
    const scale = 1 + easedProgress * (Math.max(zoomConfig.maxScale || 1, 1) - 1);
    const fadeOutOpacity = 1 - getFadeProgress(
        getTitleSceneTotalProgress(scene),
        scene.fadeOutStartTotal ?? (transitionConfig.fadeOutStart ?? 0.06),
        scene.fadeOutEndTotal   ?? (transitionConfig.fadeOutEnd   ?? 0.42)
    );

    panel.classList.add("title-screen--art");
    panel.style.opacity = `${clamp(fadeOutOpacity, 0, 1)}`;

    const anchor = document.createElement("div");
    anchor.className = "title-screen-anchor";
    anchor.style.width = `${anchorWidth}px`;
    anchor.style.transformOrigin = `${focusX * 100}% ${focusY * 100}%`;
    anchor.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    const frameImage = document.createElement("img");
    frameImage.className = "title-screen-frame";
    frameImage.src = scene.frameAsset;
    frameImage.alt = "";
    frameImage.draggable = false;
    frameImage.style.transform = `scale(${titleLayout.frameScale || 1})`;

    const titleImage = document.createElement("img");
    titleImage.className = "title-screen-logo";
    titleImage.src = scene.titleAsset;
    titleImage.alt = scene.screenTitle || scene.title;
    titleImage.draggable = false;
    titleImage.style.width = `${(titleLayout.titleWidthRatio || 0.7) * 100}%`;
    titleImage.style.top = `${titleLayout.titleTopPercent ?? 50}%`;
    titleImage.style.left = `${titleLayout.titleLeftPercent ?? 50}%`;
    titleImage.style.transform = `translate(${titleLayout.titleTranslateXPercent ?? -50}%, ${titleLayout.titleTranslateYPercent ?? -50}%)`;

    anchor.append(frameImage, titleImage);
    const scrollArrow = document.createElement("div");
    scrollArrow.className = "title-scroll-arrow";
    scrollArrow.setAttribute("aria-hidden", "true");

    panel.append(anchor, scrollArrow);

    return panel;
}

//mantem o palco ajustado ao tamanho da janela
function resizeSceneFrame() {
    const stageRect = dom.stage.getBoundingClientRect();

    if (!stageRect.width || !stageRect.height) {
        return;
    }

    dom.sceneFrame.style.width = `${stageRect.width}px`;
    dom.sceneFrame.style.height = `${stageRect.height}px`;
}

function getFrameRect() {
    return dom.sceneFrame.getBoundingClientRect();
}

function getCoverMediaRect(assetMeta) {
    return getCoverMediaRectForFrame(assetMeta, getFrameRect());
}

//calcula o enquadramento de uma imagem em modo cover
function getCoverMediaRectForFrame(assetMeta, frameRect) {
    const frameRatio = frameRect.width / frameRect.height;
    const assetRatio = assetMeta.width / assetMeta.height;

    if (assetRatio > frameRatio) {
        const height = frameRect.height;
        const width = height * assetRatio;
        return {
            left: (frameRect.width - width) / 2,
            top: 0,
            width,
            height
        };
    }

    const width = frameRect.width;
    const height = width / assetRatio;
    return {
        left: 0,
        top: (frameRect.height - height) / 2,
        width,
        height
    };
}

//aplica posicao, escala e filtros a imagem principal
function setImagePlacement(assetName, rect, options = {}) {
    dom.sceneImage.hidden = false;
    dom.sceneImage.src = assetName;
    dom.sceneImage.alt = imageCatalog[assetName].alt;
    dom.sceneImage.style.left = `${rect.left}px`;
    dom.sceneImage.style.top = `${rect.top}px`;
    dom.sceneImage.style.width = `${rect.width}px`;
    dom.sceneImage.style.height = `${rect.height}px`;
    dom.sceneImage.style.filter = options.filter || "";
    dom.sceneImage.style.opacity = `${options.opacity ?? 1}`;
}

//cria uma imagem posicionada para camadas de cena
function createSceneLayerImage(assetName, rect, options = {}) {
    const image = document.createElement("img");
    image.className = options.className || "scene-underlay-image";
    image.src = assetName;
    image.alt = options.alt || "";
    applyRectStyles(image, rect);
    image.style.filter = options.filter || "";
    return image;
}

//aplica ajustes manuais ao retangulo de media
function getAdjustedMediaRect(rect, options = {}) {
    const scale = options.scale || 1;
    const translateX = options.translateX || 0;
    const translateY = options.translateY || 0;
    const width = rect.width * scale;
    const height = rect.height * scale;

    return {
        left: rect.left - (width - rect.width) / 2 + (rect.width * translateX) / 100,
        top: rect.top - (height - rect.height) / 2 + (rect.height * translateY) / 100,
        width,
        height
    };
}

function getLayerRect(mediaRect, layer) {
    return {
        left: mediaRect.left + (mediaRect.width * layer.left) / 100,
        top: mediaRect.top + (mediaRect.height * layer.top) / 100,
        width: (mediaRect.width * layer.width) / 100,
        height: (mediaRect.height * layer.height) / 100
    };
}

function applyRectStyles(element, rect) {
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
}

function isFullscreenSupported() {
    return Boolean(
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen
    );
}

function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function getFullscreenButtonIcon(isFullscreen) {
    if (isFullscreen) {
        return `
            <svg class="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M14 20h6v-6"></path>
                <path d="M20 20l-8-8"></path>
                <path d="M10 4H4v6"></path>
                <path d="M4 4l8 8"></path>
            </svg>
        `;
    }

    return `
        <svg class="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M14 4h6v6"></path>
            <path d="M20 4l-8 8"></path>
            <path d="M10 20H4v-6"></path>
            <path d="M4 20l8-8"></path>
        </svg>
    `;
}

//sincroniza o icone e acessibilidade do botao de ecra inteiro
function syncFullscreenButton() {
    if (!dom.fullscreenButton) {
        return;
    }

    if (!isFullscreenSupported()) {
        dom.fullscreenButton.hidden = true;
        return;
    }

    const isFullscreen = Boolean(getFullscreenElement());
    dom.fullscreenButton.hidden = false;
    dom.fullscreenButton.innerHTML = getFullscreenButtonIcon(isFullscreen);
    dom.fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
    dom.fullscreenButton.setAttribute("aria-label", isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia");
}

async function toggleFullscreen() {
    if (!isFullscreenSupported()) {
        return;
    }

    const fullscreenElement = getFullscreenElement();

    try {
        if (fullscreenElement) {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } else if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        }
    } catch (error) {
        console.error(error);
    } finally {
        syncFullscreenButton();
    }
}

//conta quantas rosas ja foram pintadas
function getGardenPaintedCount(scene) {
    const gardenState = getSceneState(scene);
    const paintedRoses = gardenState.paintedRoses || [];
    const visibleRoseIds = gardenState.visibleRoseIds || [];

    if (!visibleRoseIds.length) {
        return paintedRoses.length;
    }

    const visibleRoseIdSet = new Set(visibleRoseIds);
    return paintedRoses.filter((roseId) => visibleRoseIdSet.has(roseId)).length;
}

function getGardenRoseTotal(scene) {
    const visibleRoseIds = getSceneState(scene).visibleRoseIds || [];
    return visibleRoseIds.length || scene.roseCount || 0;
}

//verifica se a cena das rosas terminou
function isGardenPaintComplete(scene) {
    return scene.kind === "garden-paint" && getGardenPaintedCount(scene) >= getGardenRoseTotal(scene);
}

function getGardenCardTransitionConfig(scene) {
    if (!scene || scene.kind !== "garden-paint") {
        return null;
    }

    return scene.cardTransition || null;
}

//verifica se ainda falta a transicao das cartas
function hasPendingGardenCardTransition(scene) {
    return Boolean(
        getGardenCardTransitionConfig(scene)
        && isGardenPaintComplete(scene)
        && !getSceneState(scene).cardTransitionComplete
    );
}

function isGardenCardTransitionActive(scene) {
    return Boolean(state.gardenCardRuntime && scene && state.gardenCardRuntime.sceneId === scene.id);
}

function isGardenCardTransitionRunning() {
    return Boolean(state.gardenCardRuntime);
}

//posiciona uma zona clicavel sobre a imagem da cena
function positionHotspot(button, mediaRect, hotspot) {
    applyRectStyles(button, getLayerRect(mediaRect, hotspot));
}

function lerp(start, end, progress) {
    return start + (end - start) * progress;
}

function getFadeProgress(value, start, end) {
    if (end <= start) {
        return value >= end ? 1 : 0;
    }

    return clamp((value - start) / (end - start), 0, 1);
}

//calcula uma opacidade que entra e sai durante uma transicao
function getFadeInOutProgress(value, start, peak, end) {
    if (value <= start || value >= end) {
        return 0;
    }

    if (peak <= start) {
        return 1 - getFadeProgress(value, start, end);
    }

    if (peak >= end) {
        return getFadeProgress(value, start, end);
    }

    if (value <= peak) {
        return getFadeProgress(value, start, peak);
    }

    return 1 - getFadeProgress(value, peak, end);
}

function getTitleSceneTransitionConfig(scene) {
    if (!isInteractiveTitleScene(scene)) {
        return null;
    }

    return scene.transition || null;
}

//normaliza os tempos de scroll da cena de titulo
function getTitleSceneTiming(scene) {
    const zoomDistanceMultiplier = scene && scene.zoom
        ? Math.max(scene.zoom.scrollDistanceMultiplier || 0, 0)
        : 0;
    const transitionDistanceMultiplier = getTitleSceneTransitionConfig(scene)
        ? Math.max(scene.transition.scrollDistanceMultiplier || 0, 0)
        : 0;
    const totalDistanceMultiplier = zoomDistanceMultiplier + transitionDistanceMultiplier;
    const zoomShare = totalDistanceMultiplier > 0
        ? zoomDistanceMultiplier / totalDistanceMultiplier
        : 1;

    return {
        zoomDistanceMultiplier,
        transitionDistanceMultiplier,
        totalDistanceMultiplier,
        zoomShare
    };
}

//combina o progresso do titulo e da transicao seguinte
function getTitleSceneTotalProgress(scene) {
    if (!scene || scene.kind !== "title-screen") {
        return 0;
    }

    const progress = Number(getSceneState(scene).progress);

    return clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
}

function getTitleSceneProgress(scene) {
    if (!isInteractiveTitleScene(scene)) {
        return 0;
    }

    const { zoomShare } = getTitleSceneTiming(scene);

    if (zoomShare <= 0) {
        return 1;
    }

    return clamp(getTitleSceneTotalProgress(scene) / zoomShare, 0, 1);
}

//calcula quanto da transicao do titulo ja decorreu
function getTitleSceneTransitionProgress(scene) {
    if (!isInteractiveTitleScene(scene)) {
        return 0;
    }

    const { zoomShare } = getTitleSceneTiming(scene);
    const remainingShare = Math.max(1 - zoomShare, Number.EPSILON);

    return clamp((getTitleSceneTotalProgress(scene) - zoomShare) / remainingShare, 0, 1);
}

function getTitleSceneNextScene(scene) {
    if (!scene || scene.kind !== "title-screen") {
        return null;
    }

    const transitionConfig = getTitleSceneTransitionConfig(scene);
    const nextSceneId = transitionConfig && transitionConfig.nextSceneId
        ? transitionConfig.nextSceneId
        : scene.id + 1;

    return getSceneById(nextSceneId);
}

function isTitleSceneComplete(scene) {
    if (!isInteractiveTitleScene(scene)) {
        return true;
    }

    return getTitleSceneTotalProgress(scene) >= 1;
}

//decide se o titulo deve avancar automaticamente
function shouldAutoAdvanceTitleScene(scene) {
    if (!isInteractiveTitleScene(scene)) {
        return false;
    }

    const { zoomShare } = getTitleSceneTiming(scene);
    const totalProgress = getTitleSceneTotalProgress(scene);
    const fadeOutEnd = scene.fadeOutEndTotal ?? 1;
    const autoAdvanceZoomProgress = clamp(scene.autoAdvanceZoomProgress ?? 0.92, 0.75, 1);
    const autoAdvanceProgress = zoomShare * autoAdvanceZoomProgress;

    return totalProgress >= Math.min(autoAdvanceProgress, fadeOutEnd);
}

function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
}

function easeInOutCubic(value) {
    if (value < 0.5) {
        return 4 * value * value * value;
    }

    return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

//baralha uma lista sem alterar a original
function shuffleArray(values) {
    const items = [...values];

    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return items;
}

//define o fundo visual da cena atual
function setBackdrop(assetName, position = "center center", options = {}) {
    dom.sceneBackdrop.style.backgroundImage = `
        linear-gradient(180deg, rgba(8, 8, 8, 0.14), rgba(8, 8, 8, 0.34)),
        url("${encodeURI(assetName)}")
    `;
    dom.sceneBackdrop.style.backgroundPosition = options.size
        ? `center center, ${position}`
        : position;
    dom.sceneBackdrop.style.backgroundSize = options.size
        ? `100% 100%, ${options.size}`
        : "cover";
    dom.sceneBackdrop.style.backgroundRepeat = options.size
        ? `no-repeat, ${options.repeat || "no-repeat"}`
        : options.repeat || "no-repeat";
}

function getScenePrimaryAsset(scene) {
    if (!scene) {
        return null;
    }

    if (scene.asset) {
        return scene.asset;
    }

    if (scene.kind === "doors") {
        const firstStep = getDoorSequenceStep(0);
        return firstStep ? firstStep.asset : null;
    }

    return null;
}

//calcula o enquadramento de previsualizacao da proxima cena
function getScenePreviewRect(scene, assetName) {
    if (!scene || !assetName || !imageCatalog[assetName]) {
        return null;
    }

    if (scene.kind === "vertical-scroll") {
        return getVerticalScrollMediaRect(scene, 0);
    }

    return getCoverMediaRect(imageCatalog[assetName]);
}

//desenha a passagem visual do titulo para o tunel
function renderTitleSceneTransition(scene, transitionProgress) {
    const transitionConfig = getTitleSceneTransitionConfig(scene);
    const nextScene = getTitleSceneNextScene(scene);
    const nextAsset = getScenePrimaryAsset(nextScene);

    if (!transitionConfig || !nextScene || !nextAsset || !imageCatalog[nextAsset]) {
        return;
    }

    const nextScenePreviewOpacity = getFadeProgress(
        transitionProgress,
        transitionConfig.fadeInStart ?? 0.48,
        transitionConfig.fadeInEnd ?? 1
    );
    const veilFadeInProgress = getFadeProgress(
        transitionProgress,
        transitionConfig.veilStart ?? 0.18,
        transitionConfig.veilPeak ?? 0.5
    );
    const veilOpacity = veilFadeInProgress * (transitionConfig.maxVeilOpacity ?? 1);

    if (nextScenePreviewOpacity > 0) {
        const previewRect = getScenePreviewRect(nextScene, nextAsset);

        if (previewRect) {
            const preview = document.createElement("div");
            preview.className = "title-screen-transition";
            preview.style.opacity = `${nextScenePreviewOpacity}`;

            const previewImage = createSceneLayerImage(nextAsset, previewRect, {
                className: "title-screen-transition-image",
                alt: imageCatalog[nextAsset].alt
            });

            preview.append(previewImage);
            dom.sceneUnderlay.append(preview);
        }
    }

    if (veilOpacity > 0) {
        const veil = document.createElement("div");
        veil.className = "title-screen-transition-veil";
        veil.style.opacity = `${clamp(veilOpacity, 0, 1)}`;
        dom.sceneOverlay.append(veil);
    }
}

//desenha a cena inicial e gere o seu progresso
function renderTitleScene(scene) {
    const progress = getTitleSceneProgress(scene);
    const transitionProgress = getTitleSceneTransitionProgress(scene);
    const totalProgress = getTitleSceneTotalProgress(scene);
    const transitionConfig = getTitleSceneTransitionConfig(scene) || {};
    const fadeOutStart = scene.fadeOutStartTotal ?? (transitionConfig.fadeOutStart ?? 0.06);
    dom.sceneImage.hidden = true;
    dom.sceneImage.alt = "";
    dom.sceneImage.style.left = "";
    dom.sceneImage.style.top = "";
    dom.sceneImage.style.width = "";
    dom.sceneImage.style.height = "";
    dom.sceneBackdrop.style.background = totalProgress >= fadeOutStart || transitionProgress > 0
        ? "#000"
        : (scene.backgroundColor || scene.palette.accentSoft);
    renderTitleSceneTransition(scene, transitionProgress);
    dom.sceneContent.append(createTitleScreen(scene));

    if (isInteractiveTitleScene(scene)) {
        const caption = transitionProgress > 0
            ? (scene.transitionInstruction || scene.instruction || "")
            : (scene.instruction || "");
        const progressLabel = transitionProgress > 0
            ? `Transicao ${Math.round(transitionProgress * 100)}%`
            : `Titulo ${Math.round(progress * 100)}%`;
        const progressValue = transitionProgress > 0 ? transitionProgress : progress;

        setCaption(caption);
        setProgress(progressValue, 1, progressLabel);

        if (shouldAutoAdvanceTitleScene(scene)) {
            if (typeof primeInsideTunnelSound === "function") {
                primeInsideTunnelSound();
            }
            scheduleTitleSceneAutoAdvance(scene, 0);
        }

        return;
    }

    setCaption(scene.instruction || "");
    setProgress(0, 0, "");
}

//carrega a mesa de cha num iframe e ouve a saida pelo portal
function renderTeaTableScene(scene) {
    dom.sceneImage.hidden = true;
    dom.sceneBackdrop.style.background = scene.palette ? scene.palette.accentSoft : "#2f2119";

    const iframe = createSceneIframe({
        title: "Mesa de Cha",
        basePath: "cena6/",
        body: TEA_TABLE_SCENE_BODY,
        allow: "autoplay; fullscreen"
    });
    dom.sceneOverlay.style.pointerEvents = "auto";
    dom.sceneOverlay.append(iframe);

    const onMessage = (event) => {
        if (event.source !== iframe.contentWindow || !event.data || event.data.type !== "tea-portal") {
            return;
        }

        window.removeEventListener("message", onMessage);
        goToScene((scene.nextSceneId || scene.id + 1), { animate: false });
    };

    window.addEventListener("message", onMessage);

    setCaption(scene.instruction || "");
    setProgress(0, 0, "");
}

//carrega o jogo da memoria e gere o regresso ao tunel
function renderMemoryGameScene(scene) {
    dom.sceneImage.hidden = true;
    dom.sceneBackdrop.style.background = scene.palette ? scene.palette.accentSoft : "#1a0808";

    const iframe = createSceneIframe({
        title: "Jogo da Memoria",
        basePath: "cena8/",
        body: MEMORY_GAME_SCENE_BODY,
        allow: "autoplay; fullscreen"
    });
    dom.sceneOverlay.style.pointerEvents = "auto";
    dom.sceneOverlay.append(iframe);

    const onMessage = (event) => {
        if (event.source !== iframe.contentWindow || !event.data || event.data.type !== "memory-return-tunnel") {
            return;
        }

        window.removeEventListener("message", onMessage);
        const tunnelScene = getSceneById(2);
        state.sceneState.clear();
        if (tunnelScene) {
            state.sceneState.set(tunnelScene.id, getDefaultSceneState(tunnelScene));
        }
        goToScene(2, { animate: false, allowBackward: true });
    };

    window.addEventListener("message", onMessage);
    setCaption("");
    setProgress(0, 0, "");
}

//carrega o jardim, sincroniza rosas pintadas e conclui a cena
function renderGardenScene(scene) {
    dom.sceneImage.hidden = true;
    dom.sceneBackdrop.style.background = scene.palette ? scene.palette.accentSoft : "#142013";

    const iframe = document.createElement("iframe");
    const gardenIframeLeftPercent = 2;
    const gardenIframeWidthPercent = 104;
    const gardenVisibleRightRatio = (100 - gardenIframeLeftPercent) / gardenIframeWidthPercent;

    iframe.src = `cena7/index.html?visibleRight=${gardenVisibleRightRatio}`;
    iframe.style.cssText = `position:absolute;left:${gardenIframeLeftPercent}%;top:0;width:${gardenIframeWidthPercent}%;height:100%;border:none;z-index:1;`;
    iframe.setAttribute("allow", "autoplay; fullscreen");
    iframe.setAttribute("allowfullscreen", "");
    dom.sceneOverlay.style.pointerEvents = "auto";
    dom.sceneOverlay.append(iframe);


    const gardenState = getSceneState(scene);
    if (!gardenState.paintedRoses) gardenState.paintedRoses = [];

    const completeGardenPaintScene = (messageData = {}) => {
        gardenState.paintedRoses = messageData.paintedRoses || gardenState.paintedRoses;
        const total = messageData.total || gardenState.paintedRoses.length;
        gardenState.visibleRoseIds = Array.from({length: total}, (_, i) => String(i + 1));
        setCaption("Todas as rosas ficaram vermelhas.");
        setProgress(total, total, `Rosas ${total} / ${total}`);

        if (!gardenState.cardTransitionComplete) {
            ensureGardenCardTransition(scene);
        }
    };

    iframe.addEventListener("load", () => {
        try {
            iframe.contentWindow.addEventListener("pointerdown", retryGardenBirdsAudioFromGesture, { capture: true, passive: true });
            iframe.contentWindow.addEventListener("mousedown", retryGardenBirdsAudioFromGesture, { capture: true, passive: true });
            iframe.contentWindow.addEventListener("touchstart", retryGardenBirdsAudioFromGesture, { capture: true, passive: true });
            iframe.contentWindow.addEventListener("click", retryGardenBirdsAudioFromGesture, { capture: true, passive: true });
            iframe.contentWindow.addEventListener("keydown", retryGardenBirdsAudioFromGesture, { capture: true });
        } catch (error) {

        }


        if (gardenState.paintedRoses.length > 0) {
            iframe.contentWindow.postMessage({
                type: "garden-restore",
                paintedRoses: gardenState.paintedRoses
            }, "*");
        }
    }, { once: true });


    const onMessage = (e) => {
        if (e.source !== iframe.contentWindow) return;
        if (e.data && e.data.type === "garden-progress") {
            retryGardenBirdsAudioFromGesture();
            const { painted, total } = e.data;
            gardenState.paintedRoses = e.data.paintedRoses || gardenState.paintedRoses;
            if (total && (!gardenState.visibleRoseIds || !gardenState.visibleRoseIds.length)) {
                gardenState.visibleRoseIds = Array.from({length: total}, (_, i) => String(i + 1));
            }
            setProgress(painted, total, `Rosas ${painted} / ${total}`);
            if (painted < total) {
                setCaption(`Clica nas rosas para as pintar de vermelho. Faltam ${total - painted}.`);
            } else if (total) {
                completeGardenPaintScene(e.data);
            }
        }
        if (e.data && e.data.type === "garden-complete") {
            retryGardenBirdsAudioFromGesture();
            window.removeEventListener("message", onMessage);
            completeGardenPaintScene(e.data);
        }
    };
    window.addEventListener("message", onMessage);

    setCaption(scene.instruction || "Clica nas rosas para as pintar de vermelho.");
    setProgress(gardenState.paintedRoses.length, 0, "");
}

//monta o html completo usado pelas cenas em iframe
function createSceneIframeDocument({ title, basePath, body }) {
    const baseHref = new URL(basePath, window.location.href).href;

    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${baseHref}">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${body}
  <script>
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach((eventName) => {
      window.addEventListener(eventName, () => {
        if (window.parent && window.parent !== window && typeof window.parent.unlockPreloadedAudio === "function") {
          window.parent.unlockPreloadedAudio();
        }
      }, { once: true, passive: true });
    });
  </script>
  <script src="script.js"></script>
</body>
</html>`;
}

//cria um iframe preparado para uma cena isolada
function createSceneIframe(config) {
    const iframe = document.createElement("iframe");
    iframe.srcdoc = createSceneIframeDocument(config);
    iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1;";
    if (config.allow) {
        iframe.setAttribute("allow", config.allow);
    }
    iframe.setAttribute("allowfullscreen", "");

    return iframe;
}

//carrega a cena do gato e espera pelo portal das placas
function renderCheshireScene(scene) {
    dom.sceneImage.hidden = true;
    dom.sceneBackdrop.style.background = "#0d2a23";

    const iframe = createSceneIframe({
        title: "Cena 5",
        basePath: "cena5/",
        body: CHESHIRE_SCENE_BODY
    });
    dom.sceneOverlay.style.pointerEvents = "auto";
    dom.sceneOverlay.append(iframe);


    const onMessage = (e) => {
        if (e.source !== iframe.contentWindow) return;
        if (e.data && e.data.type === "cheshire-portal") {
            window.removeEventListener("message", onMessage);
            const nextId = scene.nextSceneId || scene.id + 1;
            goToScene(nextId, { animate: true });
        }
    };
    window.addEventListener("message", onMessage);

    setCaption(scene.instruction || "");
    setProgress(0, 0, "");
}

//orquestra o desenho da cena atual e os sons associados
function renderScene() {
    if (state.scheduledRenderId) {
        window.cancelAnimationFrame(state.scheduledRenderId);
        state.scheduledRenderId = 0;
    }

    const scene = getCurrentScene();
    const forwardLocked = (
        isInteractiveTitleScene(scene) && !isTitleSceneComplete(scene)
    ) || (
        scene.kind === "garden-paint" && (
            !isGardenPaintComplete(scene)
            || hasPendingGardenCardTransition(scene)
            || isGardenCardTransitionActive(scene)
        )
    ) || hasPendingForestSmokeTransition(scene);

    setPalette(scene);
    clearSceneLayers();
    resizeSceneFrame();
    syncNav();

    dom.sceneBadge.textContent = scene.badge;
    dom.sceneTitle.textContent = scene.title;
    dom.sceneSummary.textContent = scene.summary;
    if (scene.kind === "doors") {
        renderDoorScene(scene);
    } else if (scene.kind === "cheshire-scene") {
        renderCheshireScene(scene);
    } else if (scene.kind === "canvas-tunnel") {
        renderCanvasTunnelScene(scene);
    } else if (scene.kind === "vertical-scroll") {
        renderVerticalScrollScene(scene);
    } else if (scene.kind === "forest-scroll") {
        renderForestScene(scene);
    } else if (scene.kind === "memory-game") {
        renderMemoryGameScene(scene);
    } else if (scene.kind === "tea-table") {
        renderTeaTableScene(scene);
    } else if (scene.kind === "title-screen") {
        renderTitleScene(scene);
    } else if (scene.kind === "garden-paint") {
        renderGardenScene(scene);
    }

    if (typeof syncForestAmbientAudio === "function") {
        syncForestAmbientAudio(scene);
    }

    syncTitleTunnelEntryAudio(scene);

    if (typeof syncTunnelSceneAudio === "function") {
        syncTunnelSceneAudio(scene);
    }

    if (typeof syncClockTickAudio === "function") {
        syncClockTickAudio(scene);
    }

    if (typeof syncPocketClockAudio === "function") {
        syncPocketClockAudio(scene);
    }

    syncCheshirePurrAudio(scene);
    syncGardenBirdsAudio(scene);

    updateSceneControlLocks(scene, forwardLocked);
}

//bloqueia ou desbloqueia controlos consoante o estado da cena
function updateSceneControlLocks(scene = getCurrentScene(), forwardLockedOverride = null) {
    const cardTransitionLocked = isGardenCardTransitionRunning();
    const forwardLocked = forwardLockedOverride ?? (
        (isInteractiveTitleScene(scene) && !isTitleSceneComplete(scene))
        || (
            scene.kind === "garden-paint" && (
                !isGardenPaintComplete(scene)
                || hasPendingGardenCardTransition(scene)
                || isGardenCardTransitionActive(scene)
            )
        )
        || hasPendingForestSmokeTransition(scene)
    );

    dom.prevSceneButton.disabled = scene.id === 1 || state.transitioning || cardTransitionLocked;
    dom.nextSceneButton.disabled = state.transitioning || forwardLocked || cardTransitionLocked;
    dom.restartSceneButton.disabled = state.transitioning || cardTransitionLocked;
}

//agenda um redesenho para o proximo frame
function scheduleRenderScene() {
    if (state.scheduledRenderId) {
        return;
    }

    state.scheduledRenderId = window.requestAnimationFrame(() => {
        state.scheduledRenderId = 0;
        renderScene();
    });
}

//escreve a cena atual no hash do url
function updateHash(sceneId) {
    const nextHash = `#cena-${sceneId}`;

    if (window.location.hash === nextHash) {
        return;
    }

    state.skipHashSync = true;
    window.location.hash = nextHash;
}

//substitui o hash inicial sem criar historico extra
function replaceHash(sceneId) {
    const nextHash = `#cena-${sceneId}`;

    if (window.location.hash === nextHash) {
        return;
    }

    if (window.history && typeof window.history.replaceState === "function") {
        window.history.replaceState(null, "", nextHash);
        return;
    }

    state.skipHashSync = true;
    window.location.hash = nextHash;
}

//envolve a troca de cena numa transicao visual curta
function withTransition(action) {
    if (state.transitioning) {
        return;
    }

    state.transitioning = true;
    dom.prevSceneButton.disabled = true;
    dom.nextSceneButton.disabled = true;
    dom.restartSceneButton.disabled = true;
    dom.sceneFrame.classList.add("is-transitioning");

    window.setTimeout(() => {
        action();
        renderScene();

        window.requestAnimationFrame(() => {
            dom.sceneFrame.classList.remove("is-transitioning");

            window.setTimeout(() => {
                state.transitioning = false;
                renderScene();
            }, 240);
        });
    }, 180);
}

//muda de cena respeitando bloqueios e regras de progressao
function goToScene(sceneId, options = {}) {
    const isLoopingForward = state.currentSceneId === SCENE_COUNT && sceneId > SCENE_COUNT;
    const targetSceneId = isLoopingForward ? 1 : clamp(sceneId, 1, SCENE_COUNT);
    const {
        animate = true,
        syncHash = true,
        allowBackward = false,
        ignoreSmokeLock = false,
        ignoreGardenCardLock = false,
        ignoreGardenCardRuntime = false
    } = options;
    const currentScene = getCurrentScene();
    const targetScene = getSceneById(targetSceneId);

    if (targetSceneId !== state.currentSceneId) {
        if (state.verticalScrollRafId) {
            window.cancelAnimationFrame(state.verticalScrollRafId);
            state.verticalScrollRafId = 0;
        }
        state.verticalScrollVelocity = 0;

        if (targetScene && targetScene.kind === "canvas-tunnel") {
            fadeOutIntroMagicSound(1400);
            stopTitleTunnelEntryAudio({ fade: true });
        }
    }

    if (isGardenCardTransitionRunning() && !ignoreGardenCardRuntime) {
        renderScene();
        return;
    }

    if (targetSceneId < state.currentSceneId && !allowBackward && !isLoopingForward) {
        renderScene();
        return;
    }

    if (targetSceneId > state.currentSceneId && hasPendingForestSmokeTransition(currentScene) && !ignoreSmokeLock) {
        renderScene();
        return;
    }

    if (targetSceneId > state.currentSceneId && isInteractiveTitleScene(currentScene) && !isTitleSceneComplete(currentScene)) {
        renderScene();
        return;
    }

    if (
        targetSceneId > state.currentSceneId
        && (hasPendingGardenCardTransition(currentScene) || isGardenCardTransitionActive(currentScene))
        && !ignoreGardenCardLock
    ) {
        renderScene();
        return;
    }

    if (currentScene.kind === "garden-paint" && targetSceneId > currentScene.id && !isGardenPaintComplete(currentScene)) {
        renderScene();
        return;
    }

    if (targetSceneId === state.currentSceneId && !options.force) {
        renderScene();
        return;
    }

    const applySceneChange = () => {
        if (isLoopingForward) {
            state.sceneState.clear();
        }

        state.currentSceneId = targetSceneId;

        if (isLoopingForward) {
            state.sceneState.set(targetSceneId, getDefaultSceneState(targetScene));
        }

        if (syncHash) {
            updateHash(targetSceneId);
        }
    };

    if (animate) {
        withTransition(applySceneChange);
        return;
    }

    applySceneChange();
    renderScene();
}

//reinicia o estado da cena atual
function resetCurrentScene() {
    const scene = getCurrentScene();
    state.sceneState.set(scene.id, getDefaultSceneState(scene));
    renderScene();
}

//pre-carrega imagens usadas pelas cenas
function preloadAssets() {
    const assetNames = new Set(Object.keys(imageCatalog));

    Object.keys(propCatalog).forEach((assetName) => {
        assetNames.add(assetName);
    });

    gardenCardAssets.forEach((assetName) => {
        assetNames.add(assetName);
    });

    scenes.forEach((scene) => {
        if (scene.props) {
            scene.props.forEach((prop) => {
                assetNames.add(prop.asset);

                if (prop.pressedAsset) {
                    assetNames.add(prop.pressedAsset);
                }
            });
        }

        getVerticalSceneItems(scene).forEach((item) => {
            assetNames.add(item.asset);

            if (item.openAsset) {
                assetNames.add(item.openAsset);
            }

            if (item.closedAsset) {
                assetNames.add(item.closedAsset);
            }

            if (item.extinguishedAsset) {
                assetNames.add(item.extinguishedAsset);
            }

            if (Array.isArray(item.alternateAssets)) {
                item.alternateAssets.forEach((assetName) => {
                    assetNames.add(assetName);
                });
            }
        });
    });

    assetNames.forEach((assetName) => {
        const image = new Image();
        image.src = assetName;
    });
}

function isWheelLocked() {
    return performance.now() < state.wheelLockedUntil;
}

//impede multiplos avancos seguidos por scroll
function lockWheel(duration = 280) {
    state.wheelLockedUntil = performance.now() + duration;
    state.sceneWheelTravel = 0;
    state.lastWheelAt = 0;
}

//acumula scroll ate haver intencao clara de avancar
function shouldAdvanceSceneFromWheel(delta) {
    if (delta <= 0) {
        state.sceneWheelTravel = 0;
        state.lastWheelAt = 0;
        return false;
    }

    const now = performance.now();

    if (now - state.lastWheelAt > 220) {
        state.sceneWheelTravel = 0;
    }

    state.lastWheelAt = now;
    state.sceneWheelTravel += delta;

    if (state.sceneWheelTravel < 140) {
        return false;
    }

    state.sceneWheelTravel = 0;
    state.lastWheelAt = 0;
    return true;
}

//agenda a passagem automatica do titulo para a cena seguinte
function scheduleTitleSceneAutoAdvance(scene, delayMs = 160, options = {}) {
    const sceneState = getSceneState(scene);

    if (sceneState.titleAutoAdvanceScheduled) {
        return;
    }

    sceneState.titleAutoAdvanceScheduled = true;

    if (options.showTitleFade && sceneState.progress < 1) {
        sceneState.progress = 1;
        window.requestAnimationFrame(() => {
            if (state.currentSceneId === scene.id) {
                renderScene();
            }
        });
    }

    window.setTimeout(() => {
        if (state.currentSceneId !== scene.id) {
            return;
        }

        const nextScene = getTitleSceneNextScene(scene);

        if (!nextScene) {
            return;
        }

        sceneState.progress = 1;
        state.sceneState.set(nextScene.id, getDefaultSceneState(nextScene));
        goToScene(nextScene.id, { animate: false });
        lockWheel(700);
    }, delayMs);
}

//transforma scroll em progresso da cena de titulo
function handleTitleScreenWheel(delta) {
    const scene = getCurrentScene();

    if (!isInteractiveTitleScene(scene)) {
        return;
    }

    const sceneState = getSceneState(scene);
    const currentProgress = getTitleSceneTotalProgress(scene);
    const { totalDistanceMultiplier, zoomShare } = getTitleSceneTiming(scene);
    const scrollDistance = Math.max(getFrameRect().height * (totalDistanceMultiplier || 1), 1);
    const nextProgress = currentProgress + delta / scrollDistance;
    const entersTransition = delta > 0 && zoomShare < 1 && currentProgress < zoomShare && nextProgress >= zoomShare;

    if (delta > 0 && nextProgress > 0) {
        ensureTitleTunnelEntryAudio(scene, 0.78, 700);
    }

    if (entersTransition) {
        if (typeof primeInsideTunnelSound === "function") {
            primeInsideTunnelSound();
        }
        sceneState.progress = 1;
        renderScene();
        scheduleTitleSceneAutoAdvance(scene, 260);
        return;
    }

    if (nextProgress >= 1) {
        sceneState.progress = 1;
        renderScene();

        if (delta > 0) {
            if (typeof primeInsideTunnelSound === "function") {
                primeInsideTunnelSound();
            }
            scheduleTitleSceneAutoAdvance(scene, 260, { showTitleFade: true });
        }

        return;
    }

    sceneState.progress = clamp(nextProgress, 0, 1);
    renderScene();
}

//encaminha o scroll para a cena que esta ativa
function handleWheel(event) {
    if (state.transitioning || isWheelLocked() || isGardenCardTransitionRunning()) {
        return;
    }

    const scene = getCurrentScene();
    const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (Math.abs(dominantDelta) < 14) {
        return;
    }

    if (isInteractiveTitleScene(scene)) {
        event.preventDefault();
        handleTitleScreenWheel(dominantDelta);
        return;
    }

    if (scene.kind === "forest-scroll") {
        const horizontalDelta = event.deltaX;
        if (Math.abs(horizontalDelta) < 14) {
            return;
        }

        event.preventDefault();
        handleForestWheel(horizontalDelta);
        return;
    }

    if (scene.kind === "vertical-scroll") {
        event.preventDefault();
        handleVerticalScrollWheel(dominantDelta);
        return;
    }

    if (scene.kind === "doors") {
        if (isDoorScrollTransitionStep(scene)) {
            event.preventDefault();
            handleDoorWheel(dominantDelta);
        }
        return;
    }

    if (scene.kind === "canvas-tunnel") {
        event.preventDefault();

        return;
    }

    if (scene.kind === "garden-paint") {
        event.preventDefault();

        if (isGardenPaintComplete(scene) && shouldAdvanceSceneFromWheel(dominantDelta)) {
            goToScene(state.currentSceneId + 1);
            lockWheel(900);
        }

        return;
    }

    event.preventDefault();

    if (!shouldAdvanceSceneFromWheel(dominantDelta)) {
        return;
    }

    goToScene(state.currentSceneId + 1);
    lockWheel(900);
}

//trata atalhos de teclado para navegacao e reinicio
function handleKeyboard(event) {
    if (isGardenCardTransitionRunning()) {
        return;
    }

    if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(event.target.tagName)) {
        return;
    }

    if (event.key === "ArrowUp") {
        if (isInteractiveTitleScene(getCurrentScene())) {
            handleTitleScreenWheel(-120);
        } else if (getCurrentScene().kind === "vertical-scroll") {
            handleVerticalScrollWheel(-120);
        } else if (isDoorScrollTransitionStep(getCurrentScene())) {
            handleDoorWheel(-120);
        }
        return;
    }

    if (event.key === "ArrowDown") {
        if (isInteractiveTitleScene(getCurrentScene())) {
            handleTitleScreenWheel(120);
        } else if (getCurrentScene().kind === "vertical-scroll") {
            handleVerticalScrollWheel(120);
        } else if (isDoorScrollTransitionStep(getCurrentScene())) {
            handleDoorWheel(120);
        }
        return;
    }

    if (event.key === "ArrowLeft") {
        if (getCurrentScene().kind === "forest-scroll") {
            handleForestWheel(-120);
        }
        return;
    }

    if (event.key === "ArrowRight") {
        const scene = getCurrentScene();

        if (isInteractiveTitleScene(scene)) {
            if (isTitleSceneComplete(scene)) {
                goToScene(state.currentSceneId + 1);
            } else {
                handleTitleScreenWheel(120);
            }
        } else if (scene.kind === "doors") {
            if (isDoorScrollTransitionStep(scene)) {
                handleDoorWheel(120);
            } else {
                advanceDoorSequence();
            }
        } else if (scene.kind === "forest-scroll") {
            handleForestWheel(120);
        } else if (scene.kind === "garden-paint") {
            if (isGardenPaintComplete(scene)) {
                goToScene(state.currentSceneId + 1);
            }
        } else {
            goToScene(state.currentSceneId + 1);
        }
    }

    if (event.key.toLowerCase() === "r") {
        resetCurrentScene();
    }
}

//sincroniza a cena quando o hash do url muda
function handleHashChange() {
    if (state.skipHashSync) {
        state.skipHashSync = false;
        return;
    }

    goToScene(readSceneIdFromHash() || 1, { animate: false, syncHash: false });
}

//reage a entrada ou saida do modo de ecra inteiro
function handleFullscreenChange() {
    syncFullscreenButton();
    renderScene();
}

//inicializa navegacao, eventos, sons e primeira renderizacao
function init() {
    replaceHash(state.currentSceneId);
    state.skipHashSync = false;
    buildNav();
    preloadAssets();
    syncFullscreenButton();
    renderScene();
    playIntroMagicSound();
    bindIntroMagicSoundUnlock();

    dom.prevSceneButton.addEventListener("click", () => {
        goToScene(state.currentSceneId - 1);
    });

    dom.nextSceneButton.addEventListener("click", () => {
        goToScene(state.currentSceneId + 1);
    });

    dom.restartSceneButton.addEventListener("click", () => {
        resetCurrentScene();
    });

    if (dom.fullscreenButton) {
        dom.fullscreenButton.addEventListener("click", () => {
            toggleFullscreen();
        });
    }

    window.addEventListener("resize", renderScene);
    window.addEventListener("keydown", handleKeyboard);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("pointerdown", retryGardenBirdsAudioFromGesture, { passive: true });
    window.addEventListener("mousedown", retryGardenBirdsAudioFromGesture, { passive: true });
    window.addEventListener("touchstart", retryGardenBirdsAudioFromGesture, { passive: true });
    window.addEventListener("click", retryGardenBirdsAudioFromGesture, { passive: true });
    window.addEventListener("keydown", retryGardenBirdsAudioFromGesture);
}

init();
