//controla o gato, as placas, o parallax e a transicao para a mesa
const catTree     = document.getElementById("cat-tree");
const catEyes     = document.getElementById("cat-eyes");
const catFloor    = document.getElementById("cat-floor");
const catTreeImg  = document.getElementById("cat-tree-img");
const catEyesImg  = document.getElementById("cat-eyes-img");
const catFloorImg = document.getElementById("cat-floor-img");

const treeFrames  = ["images/gato3.png", "images/gato4.png"];
const eyesFrames  = ["olhos1.png", "olhos2.png"];
const floorFrames = ["images/gato1.png", "images/gato2.png"];
const SIGN_SOUND_URL = new URL(
  "../som/placas.mp3",
  document.currentScript ? document.currentScript.src : window.location.href
).href;

let treeFrameIdx  = 0;
let eyesFrameIdx  = 0;
let floorFrameIdx = 0;
let treeTimer     = null;
let eyesTimer     = null;
let floorTimer    = null;
let eyesReady     = false;

//anima o gato que esta no tronco
function startTreeAnim() {
  if (treeTimer) return;
  treeTimer = setInterval(() => {
    treeFrameIdx = (treeFrameIdx + 1) % treeFrames.length;
    catTreeImg.src = treeFrames[treeFrameIdx];
  }, 500);
}
function stopTreeAnim()  { clearInterval(treeTimer);  treeTimer  = null; }
//anima os olhos e sorriso do gato
function startEyesAnim() {
  if (eyesTimer) return;
  eyesTimer = setInterval(() => {
    eyesFrameIdx = (eyesFrameIdx + 1) % eyesFrames.length;
    catEyesImg.src = eyesFrames[eyesFrameIdx];
  }, 500);
}
function stopEyesAnim()  { clearInterval(eyesTimer);  eyesTimer  = null; }
//anima o gato que esta no chao
function startFloorAnim() {
  if (floorTimer) return;
  floorTimer = setInterval(() => {
    floorFrameIdx = (floorFrameIdx + 1) % floorFrames.length;
    catFloorImg.src = floorFrames[floorFrameIdx];
  }, 500);
}
function stopFloorAnim() { clearInterval(floorTimer); floorTimer = null; }

function playSignSound() {
  const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === "function"
    ? window.parent.playPreloadedSound(SIGN_SOUND_URL, { volume: 0.55 })
    : new Audio(SIGN_SOUND_URL);

  sound.volume = 0.55;
  if (!sound.paused) return;
  sound.play().catch(() => {

  });
}

startTreeAnim();

catTree.addEventListener("mouseenter", () => {
  catTree.classList.add("hidden");
  stopTreeAnim();
  eyesReady = false;
  catEyesImg.src = eyesFrames[0];
  eyesFrameIdx = 0;
  catEyes.classList.add("visible");
  startEyesAnim();
  setTimeout(() => { eyesReady = true; }, 220);
});
function showFloorCatFromEyes() {
  if (!eyesReady || !catEyes.classList.contains("visible")) return;
  catEyes.classList.remove("visible");
  stopEyesAnim();
  catFloorImg.src = floorFrames[0];
  floorFrameIdx = 0;
  catFloor.classList.add("visible");
  startFloorAnim();
}
catEyes.addEventListener("mouseenter", showFloorCatFromEyes);
catFloor.addEventListener("mouseenter", () => {
  catFloor.classList.remove("visible");
  stopFloorAnim();
  catEyes.classList.remove("visible");
  stopEyesAnim();
  eyesReady = false;
  catTreeImg.src = treeFrames[0];
  treeFrameIdx = 0;
  catTree.classList.remove("hidden");
  startTreeAnim();
});


document.querySelectorAll(".sign").forEach((sign) => {
  sign.addEventListener("mouseenter", () => sign.classList.add("is-active"));
  sign.addEventListener("mouseleave", () => sign.classList.remove("is-active"));
  sign.addEventListener("focus",      () => sign.classList.add("is-active"));
  sign.addEventListener("blur",       () => sign.classList.remove("is-active"));
});


const scene = document.getElementById("scene");
let parallaxEnabled = true;
let parallaxRafId = 0;
const parallaxTarget = { x: 0, y: 0 };
const parallaxCurrent = { x: 0, y: 0 };

function renderParallax() {
  parallaxRafId = 0;

  if (!parallaxEnabled) return;

  parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * 0.16;
  parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * 0.16;
  scene.style.transition = "none";
  scene.style.transform = `translate3d(0, 0, 0) rotateX(${parallaxCurrent.y * -3}deg) rotateY(${parallaxCurrent.x * 5}deg)`;

  if (
    Math.abs(parallaxTarget.x - parallaxCurrent.x) > 0.001 ||
    Math.abs(parallaxTarget.y - parallaxCurrent.y) > 0.001
  ) {
    parallaxRafId = requestAnimationFrame(renderParallax);
  }
}

function scheduleParallax() {
  if (!parallaxRafId) {
    parallaxRafId = requestAnimationFrame(renderParallax);
  }
}

scene.addEventListener("mousemove", (e) => {
  if (!parallaxEnabled) return;
  const r  = scene.getBoundingClientRect();
  parallaxTarget.x = (e.clientX - r.left) / r.width  - 0.5;
  parallaxTarget.y = (e.clientY - r.top)  / r.height - 0.5;
  scheduleParallax();
});
scene.addEventListener("mouseleave", () => {
  if (!parallaxEnabled) return;
  parallaxTarget.x = 0;
  parallaxTarget.y = 0;
  scheduleParallax();
});


const SCALE   = 3.0;
const ZOOM_MS = 750;

const zoomTargets = {


  "sign-thatway": { tx: -100,  ty: 80,  scale: SCALE },


  "sign-down":    { tx: 2,   ty: -55, scale: SCALE },


  "sign-up":      { tx: -100,  ty: -40,  scale: SCALE },


  "sign-thisway": { tx: -2,  ty: 42,  scale: SCALE },


  "sign-goback":  { tx: 30,  ty: 40,  scale: SCALE },


  "sign-yonder":  { tx: 30,  ty: 40,  scale: 3.0, portal: true }
};

let isZooming = false;

//aplica o zoom acumulado ate a placa seguinte
function applyZoom(tx, ty, scale, durationMs) {
  if (parallaxRafId) {
    cancelAnimationFrame(parallaxRafId);
    parallaxRafId = 0;
  }

  scene.style.transition = `transform ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  scene.style.transform  = `translate3d(${tx}vw, ${ty}vh, 0) scale(${scale})`;
}

document.querySelectorAll(".sign").forEach(btn => {
  btn.addEventListener("click", () => {
    if (isZooming) return;

    const signCls = [...btn.classList].find(c => c.startsWith("sign-") && c !== "sign" && zoomTargets[c]);
    if (!signCls) return;

    const cfg = zoomTargets[signCls];
    playSignSound();
    isZooming = true;
    parallaxEnabled = false;


    btn.classList.add("sign-shake");
    setTimeout(() => btn.classList.remove("sign-shake"), 350);


    applyZoom(cfg.tx, cfg.ty, cfg.scale, ZOOM_MS);

    setTimeout(() => {
      if (cfg.portal) {
        triggerPortal();
      } else {
        isZooming = false;

      }
    }, ZOOM_MS + 50);
  });
});

//avisa a pagina principal que a cena terminou
function triggerPortal() {
  window.parent.postMessage({ type: "cheshire-portal" }, "*");
}
