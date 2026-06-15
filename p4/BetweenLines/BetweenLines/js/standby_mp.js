
const sbVideoEl = document.getElementById('videoEl');

// configuração do timer de presença
const PRESENCE_SEC  = 8;     // segundos necessários para avançar
const ABSENCE_GRACE = 1500;  // ms de tolerância antes de resetar

let presenceTimer    = null;
let presenceStart    = null;
let absenceGrace     = null;
let progressInterval = null;
let sbLastInCenter   = false;
let sbMaskPoint      = null;

const sbMaskCanvas = document.createElement('canvas');
const sbMaskCtx = sbMaskCanvas.getContext('2d', { willReadFrequently: true });

function sbUpdateMaskPoint(maskSource) {
    if (!maskSource) {
        sbMaskPoint = null;
        return;
    }

    const sampleW = 80;
    const sampleH = 45;
    sbMaskCanvas.width = sampleW;
    sbMaskCanvas.height = sampleH;
    sbMaskCtx.clearRect(0, 0, sampleW, sampleH);
    sbMaskCtx.drawImage(maskSource, 0, 0, sampleW, sampleH);

    const data = sbMaskCtx.getImageData(0, 0, sampleW, sampleH).data;
    let sx = 0, sy = 0, count = 0;

    for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
            const alpha = data[(y * sampleW + x) * 4] / 255;
            if (alpha < 0.35) continue;
            sx += x;
            sy += y;
            count++;
        }
    }

    sbMaskPoint = count >= 28
        ? { x: sx / count / (sampleW - 1), y: sy / count / (sampleH - 1) }
        : null;
}

function sbResetPresence() {
    clearTimeout(presenceTimer);     presenceTimer    = null;
    clearInterval(progressInterval); progressInterval = null;
    clearTimeout(absenceGrace);      absenceGrace     = null;
    presenceStart = null;
    sbUpdatePresenceProgress(0);
}

function sbResumePresenceIfCentered() {
    if (sbLastInCenter) sbSignalPresent();
}

function sbHandleControlPoint(point) {
    if (!point) {
        if (typeof sbSetProximityPosition === 'function') sbSetProximityPosition(0.5, 0.5, false);
        sbSignalAbsent();
        return;
    }

    if (typeof sbSetProximityPosition === 'function') sbSetProximityPosition(1 - point.x, point.y, true);

    const inCenterH = point.x >= 0.24 && point.x <= 0.76;
    const inCenterV = point.y >= 0.04 && point.y <= 0.96;

    if (inCenterH && inCenterV) sbSignalPresent();
    else                        sbSignalAbsent();
}

// pessoa detetada no centro — inicia ou mantém a contagem
function sbSignalPresent() {
    sbLastInCenter = true;
    clearTimeout(absenceGrace);
    absenceGrace = null;

    if (presenceTimer) return; // já está a contar, não reiniciar

    presenceStart = performance.now();
    sbUpdatePresenceProgress(0);

    // dispara a saída do standby ao fim de PRESENCE_SEC segundos
    presenceTimer = setTimeout(() => {
        presenceTimer = null;
        clearInterval(progressInterval);
        progressInterval = null;
        if (sbActive) sbExit();
    }, PRESENCE_SEC * 1000);

    // atualiza o anel de progresso a cada 50ms
    progressInterval = setInterval(() => {
        const elapsed = (performance.now() - presenceStart) / (PRESENCE_SEC * 1000);
        sbUpdatePresenceProgress(Math.min(elapsed, 1));
    }, 50);

}

// pessoa saiu do centro — aguarda a grace period antes de resetar
function sbSignalAbsent() {
    sbLastInCenter = false;
    if (absenceGrace) return; // já está em espera
    absenceGrace = setTimeout(() => {
        absenceGrace = null;
        clearTimeout(presenceTimer);     presenceTimer    = null;
        clearInterval(progressInterval); progressInterval = null;
        presenceStart = null;
        sbUpdatePresenceProgress(0);
    }, ABSENCE_GRACE);
}

// atualiza o anel SVG de progresso do botão central
function sbUpdatePresenceProgress(fraction) {
    const offset = CIRC_BEGIN * (1 - fraction);
    if (standbyProg) standbyProg.style.strokeDashoffset = offset;
    if (standbyBtn)  standbyBtn.classList.toggle('hovering', fraction > 0);
}

// inicializa a câmara e os modelos MediaPipe
async function sbInitCam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 360, facingMode: 'user' }
        });
        sbVideoEl.srcObject = stream;
        await sbVideoEl.play();
        sbSetupMP();
    } catch(e) {
        console.warn('Câmara indisponível no standby:', e);
    }
}

function sbSetupMP() {

    // selfie segmentation — gera a silhueta espelhada para o sbUpdateMask
    const selfie = new SelfieSegmentation({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`
    });
    selfie.setOptions({ modelSelection: 1 });
    selfie.onResults(r => {
        if (!sbActive) return;
        sbUpdateMaskPoint(r.segmentationMask);
        // espelhar horizontalmente para coincidir com o que a pessoa vê
        const mask = r.segmentationMask;
        const mirrorCanvas = document.createElement('canvas');
        mirrorCanvas.width  = mask.width;
        mirrorCanvas.height = mask.height;
        const mCtx = mirrorCanvas.getContext('2d');
        mCtx.save();
        mCtx.translate(mask.width, 0);
        mCtx.scale(-1, 1);
        mCtx.drawImage(mask, 0, 0);
        mCtx.restore();
        sbUpdateMask(mirrorCanvas);
    });

    // pose — deteta se a pessoa está no centro horizontal e vertical
    const pose = new Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
    pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: .4,
        minTrackingConfidence: .4
    });
    pose.onResults(r => {
        if (!sbActive) return;
        const center = sbMaskPoint || getPoseControlPoint(r.poseLandmarks);
        sbHandleControlPoint(center);
    });

    // loop da câmara
    const cam = new Camera(sbVideoEl, {
        onFrame: async () => {
            if (!sbActive) {
                // quando o standby sai, passa o frame para o forms.js processar
                if (typeof formsOnFrame === 'function') await formsOnFrame(sbVideoEl);
                return;
            }
            await pose.send({ image: sbVideoEl });
            await selfie.send({ image: sbVideoEl });
        },
        width: 640, height: 360
    });
    cam.start();
}

sbInitCam();
