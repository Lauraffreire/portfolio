//controla a sequencia de portas e a entrada para a floresta
const DOOR_OPEN_SOUND_URL = new URL(
    "../som/portas.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const FOREST_PORTAL_ENTRY_SOUND_URL = new URL(
    "../som/portalentradafloresta.mp3",
    document.currentScript ? document.currentScript.src : window.location.href
).href;
const DOOR_SCROLL_PROGRESS_PER_SECOND = 1.3;

function playDoorOpenSound() {
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(DOOR_OPEN_SOUND_URL, { volume: 0.35 })
        : new Audio(DOOR_OPEN_SOUND_URL);

    sound.volume = 0.35;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
}

function playForestPortalEntrySound() {
    const sound = typeof window.playPreloadedSound === "function"
        ? window.playPreloadedSound(FOREST_PORTAL_ENTRY_SOUND_URL, { volume: 0.82 })
        : new Audio(FOREST_PORTAL_ENTRY_SOUND_URL);

    sound.volume = 0.82;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
}

function getDoorSequenceStep(stepIndex) {
    return doorSequence[clamp(stepIndex, 0, doorSequence.length - 1)];
}

function isDoorScrollTransitionStep(scene, sceneState = getSceneState(scene)) {
    if (!scene || scene.kind !== "doors") {
        return false;
    }

    const step = getDoorSequenceStep(sceneState.stepIndex);
    return Boolean(step.transitionOnScroll);
}

//calcula a escala e posicao da porta atual
function getDoorMediaRect(step, progress = 0) {
    const baseRect = getCoverMediaRect(imageCatalog[step.asset]);
    const initialRect = step.scale || step.translateX || step.translateY
        ? getAdjustedMediaRect(baseRect, step)
        : baseRect;

    if (!step.transitionOnScroll) {
        return initialRect;
    }

    const frameRect = getFrameRect();
    const targetScale = step.transitionZoomScale || 5;
    const focusPoint = step.transitionFocus || {
        x: step.hotspot.left + step.hotspot.width / 2,
        y: step.hotspot.top + step.hotspot.height / 2
    };
    const relativeHotspotCenterX = (initialRect.width * focusPoint.x) / 100;
    const relativeHotspotCenterY = (initialRect.height * focusPoint.y) / 100;
    const targetRect = {
        left: frameRect.width / 2 - relativeHotspotCenterX * targetScale,
        top: frameRect.height / 2 - relativeHotspotCenterY * targetScale,
        width: initialRect.width * targetScale,
        height: initialRect.height * targetScale
    };

    return {
        left: lerp(initialRect.left, targetRect.left, progress),
        top: lerp(initialRect.top, targetRect.top, progress),
        width: lerp(initialRect.width, targetRect.width, progress),
        height: lerp(initialRect.height, targetRect.height, progress)
    };
}

function getDoorImageOpacity(step, progress = 0) {
    if (!step.transitionOnScroll) {
        return 1;
    }

    const fadeStart = clamp(step.transitionFadeOutStart ?? 1, 0, 1);

    if (progress <= fadeStart || fadeStart >= 1) {
        return 1;
    }

    return clamp(1 - (progress - fadeStart) / (1 - fadeStart), 0, 1);
}

//calcula o fundo da floresta durante a transicao da porta
function getDoorForestParallaxRect(backdropScene, step, progress = 0, layer = "background") {
    const baseRect = getForestMediaRect(backdropScene, 0);
    const isForegroundLayer = layer === "foreground";
    const scale = lerp(
        isForegroundLayer
            ? (step.forestParallaxForegroundScale || 1)
            : (step.forestParallaxBackgroundScale || 1.06),
        1,
        progress
    );
    const translateX = lerp(
        isForegroundLayer
            ? (step.forestParallaxForegroundTranslateX || 0)
            : (step.forestParallaxBackgroundTranslateX || 0),
        0,
        progress
    );
    const translateY = lerp(
        isForegroundLayer
            ? (step.forestParallaxForegroundTranslateY || 0)
            : (step.forestParallaxBackgroundTranslateY || 0),
        0,
        progress
    );

    return getAdjustedMediaRect(baseRect, {
        scale,
        translateX,
        translateY
    });
}

//prepara o fundo correto para cada passo das portas
function getDoorBackdropConfig(step, progress = 0) {
    if (step.backdropSceneId) {
        const backdropScene = getSceneById(step.backdropSceneId);

        if (backdropScene && backdropScene.kind === "forest-scroll") {
            const forestRect = getDoorForestParallaxRect(backdropScene, step, 1, "background");

            return {
                assetName: backdropScene.asset,
                position: `${forestRect.left}px ${forestRect.top}px`,
                size: `${forestRect.width}px ${forestRect.height}px`
            };
        }

        if (backdropScene && backdropScene.asset) {
            return { assetName: backdropScene.asset };
        }
    }

    return { assetName: step.backdropAsset || step.asset };
}

//desenha a cena de fundo atras das portas
function renderDoorBackdropScene(step, progress = 0) {
    if (!step.backdropSceneId) {
        return;
    }

    const backdropScene = getSceneById(step.backdropSceneId);

    if (!backdropScene || backdropScene.kind !== "forest-scroll") {
        return;
    }


    const forestRect = getDoorForestParallaxRect(backdropScene, step, 1, "background");

    renderForestProps(backdropScene, forestRect, {
        targetLayer: dom.sceneUnderlay,
        interactive: false
    });
}

//desenha a porta anterior como camada de apoio
function renderDoorAssetUnderlay(step, mediaRect) {
    const backdropImage = createSceneLayerImage(step.asset, mediaRect, {
        filter: step.filter
    });

    dom.sceneUnderlay.append(backdropImage);
}

//desenha a cena das portas e o hotspot de entrada
function renderDoorScene(scene) {
    const doorState = getSceneState(scene);
    const stepIndex = clamp(doorState.stepIndex, 0, doorSequence.length - 1);
    const step = getDoorSequenceStep(stepIndex);
    const transitionProgress = step.transitionOnScroll ? doorState.scrollProgress : 0;
    const mediaRect = getDoorMediaRect(step, transitionProgress);
    const imageOpacity = getDoorImageOpacity(step, transitionProgress);
    const backdropConfig = getDoorBackdropConfig(step, transitionProgress);

    if (!step.transitionOnScroll && backdropConfig.assetName === step.asset && !backdropConfig.size) {
        dom.sceneBackdrop.style.backgroundImage = `
            radial-gradient(circle at 50% 18%, rgba(255, 247, 224, 0.05), transparent 22%),
            linear-gradient(180deg, rgba(20, 15, 12, 0.96), rgba(8, 6, 5, 1))
        `;
        dom.sceneBackdrop.style.backgroundPosition = "center center";
        dom.sceneBackdrop.style.backgroundSize = "cover";
        dom.sceneBackdrop.style.backgroundRepeat = "no-repeat";
        renderDoorAssetUnderlay(step, mediaRect);
    } else if (backdropConfig.size) {
        setBackdrop(backdropConfig.assetName, backdropConfig.position, {
            size: backdropConfig.size
        });
    } else {
        setBackdrop(backdropConfig.assetName);
    }

    if (step.transitionOnScroll) {
        renderDoorBackdropScene(step, transitionProgress);
    }

    setImagePlacement(step.asset, mediaRect, {
        filter: step.filter,
        opacity: imageOpacity
    });

    if (!step.transitionOnScroll) {
        const hotspot = document.createElement("button");
        hotspot.type = "button";
        hotspot.className = "hotspot-button";
        hotspot.setAttribute("aria-label", step.hotspotLabel);
        hotspot.style.borderRadius = step.hotspot.radius;
        positionHotspot(hotspot, mediaRect, step.hotspot);
        hotspot.addEventListener("click", advanceDoorSequence);

        dom.sceneOverlay.append(hotspot);
        setCaption(step.instruction);
        setProgress(stepIndex + 1, doorSequence.length, `Porta ${stepIndex + 1} / ${doorSequence.length}`);
        return;
    }

    const scrollArrow = document.createElement("div");
    scrollArrow.className = "title-scroll-arrow";
    scrollArrow.setAttribute("aria-hidden", "true");
    dom.sceneOverlay.append(scrollArrow);

    setCaption(
        transitionProgress > 0
            ? `Continua o scroll para entrares pela ultima porta. ${Math.round(transitionProgress * 100)}%`
            : step.instruction
    );
    setProgress(transitionProgress, 1, `Entrada ${Math.round(transitionProgress * 100)}%`);
}

//avanca para a proxima porta ou inicia a transicao final
function advanceDoorSequence() {
    const scene = getCurrentScene();

    if (scene.kind !== "doors") {
        return;
    }

    const doorState = getSceneState(scene);
    const isLastStep = doorState.stepIndex >= doorSequence.length - 1;

    if (isLastStep) {
        return;
    }

    playDoorOpenSound();

    const applyDoorStepChange = () => {
        doorState.stepIndex += 1;
        doorState.scrollProgress = 0;
        doorState.scrollTargetProgress = 0;
        doorState.scrollAnimationFrameId = 0;
    };

    if (doorState.stepIndex === 0) {
        withTransition(applyDoorStepChange);
        return;
    }

    applyDoorStepChange();
    renderScene();
}

//transforma scroll no progresso da transicao da ultima porta
function handleDoorWheel(delta) {
    const scene = getCurrentScene();

    if (scene.kind !== "doors") {
        return;
    }

    const doorState = getSceneState(scene);
    const step = getDoorSequenceStep(doorState.stepIndex);

    if (!step.transitionOnScroll) {
        return;
    }

    if (delta <= 0 && doorState.scrollProgress <= 0) {
        return;
    }

    const nextProgress = delta > 0 ? 1 : 0;

    if (delta > 0 && !doorState.forestPortalEntrySoundPlayed) {
        doorState.forestPortalEntrySoundPlayed = true;
        playForestPortalEntrySound();
    }

    doorState.scrollTargetProgress = clamp(nextProgress, 0, 1);
    startDoorScrollAnimation(scene);
}

function startDoorScrollAnimation(scene) {
    const doorState = getSceneState(scene);

    if (doorState.scrollAnimationFrameId) {
        return;
    }

    doorState.scrollAnimationLastTime = performance.now();
    doorState.scrollAnimationFrameId = window.requestAnimationFrame(() => animateDoorScrollTransition(scene.id));
}

function animateDoorScrollTransition(sceneId) {
    const scene = getSceneById(sceneId);

    if (!scene || state.currentSceneId !== sceneId || scene.kind !== "doors") {
        return;
    }

    const doorState = getSceneState(scene);
    const targetProgress = Number.isFinite(doorState.scrollTargetProgress)
        ? doorState.scrollTargetProgress
        : doorState.scrollProgress;
    const now = performance.now();
    const elapsedSeconds = Math.min((now - (doorState.scrollAnimationLastTime || now)) / 1000, 0.08);
    const maxStep = DOOR_SCROLL_PROGRESS_PER_SECOND * elapsedSeconds;
    const distance = targetProgress - doorState.scrollProgress;

    doorState.scrollAnimationLastTime = now;

    if (Math.abs(distance) <= maxStep) {
        doorState.scrollProgress = targetProgress;
    } else {
        doorState.scrollProgress += Math.sign(distance) * maxStep;
    }

    doorState.scrollProgress = clamp(doorState.scrollProgress, 0, 1);

    if (typeof syncForestAmbientAudioForDoorTransition === "function") {
        syncForestAmbientAudioForDoorTransition(scene, doorState.scrollProgress);
    }

    renderScene();

    if (doorState.scrollProgress >= 1 && targetProgress >= 1) {
        doorState.scrollAnimationFrameId = 0;
        finishDoorScrollTransition(scene);
        return;
    }

    if (doorState.scrollProgress !== targetProgress) {
        doorState.scrollAnimationFrameId = window.requestAnimationFrame(() => animateDoorScrollTransition(sceneId));
        return;
    }

    doorState.scrollAnimationFrameId = 0;
}

function finishDoorScrollTransition(scene) {
    const nextScene = getSceneById(scene.id + 1);

    if (nextScene && nextScene.kind === "forest-scroll") {
        state.sceneState.set(nextScene.id, getDefaultSceneState(nextScene));
        goToScene(scene.id + 1, { animate: false });
        lockWheel(700);
        return;
    }

    renderScene();
}
