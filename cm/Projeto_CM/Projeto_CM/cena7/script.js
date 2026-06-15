//controla a pintura das rosas e a transicao das cartas
const CARD_ASSETS = ['c1.png','c2.png','c3.png','c4.png'];
const SPAWN_INTERVAL = 64;
const CARDS_PER_BATCH = 4;
const COVER_HOLD_MS = 1800;
const REVEAL_INTERVAL = 56;
const REVEAL_BATCH = 2;
const CARD_SOUND_URL = new URL(
  '../som/memoria_carta.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;
const DIP_BRUSH_SOUND_URL = new URL(
  '../som/molharpincel.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;
const PAINT_ROSE_SOUND_URL = new URL(
  '../som/pintar.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;
const CARD_SOUND_POOL_SIZE = 8;
const cardSoundPool = Array.from({ length: CARD_SOUND_POOL_SIZE }, () => {
  const audio = new Audio(CARD_SOUND_URL);
  audio.preload = 'auto';
  audio.volume = 0.9;
  return audio;
});
let nextCardSoundIndex = 0;
let cardSoundUnlocked = false;
let lastCardSoundAt = 0;

let tinta = false;
let count = 0;
const PAINTS_PER_DIP = 7;
const FALLBACK_ROSE_TARGETS = 6;

const pincel = document.getElementById('pincel-cursor');
const tintaBarFill = document.getElementById('tinta-bar-fill');
let pendingPaintedRoses = null;
let gardenDocument = document;
let activeRoseTargets = null;
const gardenUrlParams = new URLSearchParams(window.location.search);
const gardenVisibleRightRatio = clampNumber(
  Number(gardenUrlParams.get('visibleRight')),
  0,
  1
) || 1;
const pencilImages = {
  clean: new Image(),
  ink: new Image()
};

pencilImages.clean.src = 'pincel.png';
pencilImages.ink.src = 'pincel_tinta.png';
pincel.draggable = false;
pincel.addEventListener('dragstart', (e) => e.preventDefault());

function syncCursor() {
  pincel.src = tinta ? 'pincel_tinta.png' : 'pincel.png';
}

function syncTintaBar() {
  const remaining = tinta ? Math.max(0, PAINTS_PER_DIP - count) : 0;
  tintaBarFill.style.width = `${(remaining / PAINTS_PER_DIP) * 100}%`;
}

//atualiza cursor e barra de tinta
function syncPaintUi() {
  syncCursor();
  syncTintaBar();
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function playDipBrushSound() {
  const sound = new Audio(DIP_BRUSH_SOUND_URL);
  sound.volume = 0.75;
  sound.play().catch(() => {

  });
}

function playPaintRoseSound() {
  const sound = new Audio(PAINT_ROSE_SOUND_URL);
  sound.volume = 0.75;
  sound.play().catch(() => {

  });
}

//prepara o som das cartas apos gesto do utilizador
function unlockCardTransitionSound() {
  if (cardSoundUnlocked) return;

  cardSoundUnlocked = true;
  const sound = cardSoundPool[0];
  sound.muted = true;
  sound.play().then(() => {
    sound.pause();
    sound.currentTime = 0;
    sound.muted = false;
  }).catch(() => {
    sound.muted = false;
    cardSoundUnlocked = false;
  });
}

//toca o som das cartas com limite de repeticao
function playCardTransitionSound(volume = 1, minIntervalMs = 130) {
  const now = performance.now();
  if (now - lastCardSoundAt < minIntervalMs) return;
  lastCardSoundAt = now;

  const sound = cardSoundPool[nextCardSoundIndex];
  nextCardSoundIndex = (nextCardSoundIndex + 1) % cardSoundPool.length;

  sound.pause();
  sound.currentTime = 0;
  sound.muted = false;
  sound.volume = Math.min(volume, 1);
  sound.play().catch(() => {

  });
}


document.addEventListener('mousemove', (e) => {
  pincel.style.display = 'block';
  pincel.style.left = e.clientX + 'px';
  pincel.style.top = e.clientY + 'px';
});
document.addEventListener('mouseleave', () => {
  pincel.style.display = 'none';
});

//mantem o cursor do pincel sincronizado no documento alvo
function attachPointerTracking(doc) {
  if (!doc || doc === document) return;
  doc.addEventListener('mousemove', (e) => {
    pincel.style.display = 'block';
    pincel.style.left = e.clientX + 'px';
    pincel.style.top = e.clientY + 'px';
  });
  doc.addEventListener('mouseleave', () => {
    pincel.style.display = 'none';
  });
}

function addPrimaryPressListener(target, handler) {
  target.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    unlockCardTransitionSound();
    handler(e);
  });
}

function makeRoseCluster(elements) {
  return {
    elements,
    classList: {
      contains: (className) => elements.some(el => el.classList.contains(className)),
      add: (className) => elements.forEach(el => el.classList.add(className))
    },
    addEventListener: (type, handler) => {
      elements.forEach(el => el.addEventListener(type, handler));
    },
    querySelectorAll: (selector) => elements.flatMap(el => Array.from(el.querySelectorAll(selector)))
  };
}

//cria grupos de rosas quando o svg nao fornece grupos claros
function buildFallbackRoseTargets() {
  const petals = Array.from(gardenDocument.querySelectorAll('.cls-32,.st14'));
  if (petals.length <= FALLBACK_ROSE_TARGETS) return petals;

  const items = petals.map((el) => {
    try {
      const box = el.getBBox();
      return {
        el,
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
      };
    } catch (error) {
      return null;
    }
  }).filter(Boolean);

  if (items.length <= FALLBACK_ROSE_TARGETS) return petals;

  const centers = [items[0]];
  while (centers.length < FALLBACK_ROSE_TARGETS) {
    let farthest = items[0];
    let farthestDistance = -1;
    items.forEach((item) => {
      const nearestDistance = Math.min(...centers.map((center) => {
        const dx = item.x - center.x;
        const dy = item.y - center.y;
        return dx * dx + dy * dy;
      }));
      if (nearestDistance > farthestDistance) {
        farthestDistance = nearestDistance;
        farthest = item;
      }
    });
    centers.push({ x: farthest.x, y: farthest.y });
  }

  let clusters = Array.from({ length: FALLBACK_ROSE_TARGETS }, () => []);
  for (let pass = 0; pass < 8; pass++) {
    clusters = Array.from({ length: FALLBACK_ROSE_TARGETS }, () => []);
    items.forEach((item) => {
      let bestIndex = 0;
      let bestDistance = Infinity;
      centers.forEach((center, index) => {
        const dx = item.x - center.x;
        const dy = item.y - center.y;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      clusters[bestIndex].push(item);
    });

    clusters.forEach((cluster, index) => {
      if (!cluster.length) return;
      centers[index] = {
        x: cluster.reduce((sum, item) => sum + item.x, 0) / cluster.length,
        y: cluster.reduce((sum, item) => sum + item.y, 0) / cluster.length
      };
    });
  }

  return clusters
    .filter(cluster => cluster.length)
    .map(cluster => makeRoseCluster(cluster.map(item => item.el)))
    .sort((a, b) => {
      const aBox = a.elements[0].getBBox();
      const bBox = b.elements[0].getBBox();
      return aBox.x - bBox.x || aBox.y - bBox.y;
    });
}

function getRosaGroups() {
  if (activeRoseTargets) return activeRoseTargets;
  const groupedRoses = gardenDocument.querySelectorAll('#rosas > g');
  return groupedRoses.length ? Array.from(groupedRoses) : buildFallbackRoseTargets();
}

function getRoseTargetBounds(target) {
  const elements = target.elements || [target];
  const boxes = elements.map((el) => {
    try {
      return el.getBBox();
    } catch (error) {
      return null;
    }
  }).filter(Boolean);

  if (!boxes.length) return null;

  const left = Math.min(...boxes.map(box => box.x));
  const top = Math.min(...boxes.map(box => box.y));
  const right = Math.max(...boxes.map(box => box.x + box.width));
  const bottom = Math.max(...boxes.map(box => box.y + box.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

function getRoseTargetClientBounds(target) {
  const elements = target.elements || [target];
  const boxes = elements.map((el) => {
    try {
      return el.getBoundingClientRect();
    } catch (error) {
      return null;
    }
  }).filter(Boolean);

  if (!boxes.length) return null;

  const left = Math.min(...boxes.map(box => box.left));
  const top = Math.min(...boxes.map(box => box.top));
  const right = Math.max(...boxes.map(box => box.right));
  const bottom = Math.max(...boxes.map(box => box.bottom));

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

//cria areas invisiveis maiores para a pintura nao depender dos caminhos brancos exatos
function createRoseHitAreas(rosaGroups, paintHandler) {
  const svg = gardenDocument.querySelector('svg');

  if (!svg) return;

  const existingLayer = gardenDocument.getElementById('rose-hit-areas');
  if (existingLayer) {
    existingLayer.remove();
  }

  const layer = gardenDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
  layer.id = 'rose-hit-areas';
  layer.setAttribute('aria-hidden', 'true');

  Array.from(rosaGroups).forEach((rose) => {
    const box = getRoseTargetBounds(rose);

    if (!box || box.width <= 0 || box.height <= 0) return;

    const padding = clampNumber(Math.max(box.width, box.height) * 0.14, 8, 22);
    const hitArea = gardenDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');

    hitArea.setAttribute('x', box.x - padding);
    hitArea.setAttribute('y', box.y - padding);
    hitArea.setAttribute('width', box.width + padding * 2);
    hitArea.setAttribute('height', box.height + padding * 2);
    hitArea.setAttribute('fill', 'transparent');
    hitArea.setAttribute('pointer-events', 'all');
    hitArea.style.cursor = 'none';
    hitArea.style.touchAction = 'none';

    addPrimaryPressListener(hitArea, () => paintHandler(rose));
    layer.append(hitArea);
  });

  svg.append(layer);
}

//filtra as rosas que estao visiveis na area jogavel
function getVisibleRosaGroups() {
  const rosaGroups = getRosaGroups();
  const visibleRight = window.innerWidth * gardenVisibleRightRatio;
  const visibleBottom = window.innerHeight;
  const visibleGroups = rosaGroups.filter((rose) => {
    const box = getRoseTargetClientBounds(rose);

    if (!box) return true;

    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    return centerX >= 0
      && centerX <= visibleRight
      && centerY >= 0
      && centerY <= visibleBottom;
  });

  return visibleGroups.length ? visibleGroups : rosaGroups;
}

//pinta algumas rosas pequenas no estado inicial
function paintInitialSmallRoses(rosaGroups) {
  const initialPaintCount = Math.ceil(rosaGroups.length / 2);

  rosaGroups
    .map((rose, index) => {
      const box = getRoseTargetBounds(rose);
      return {
        rose,
        index,
        area: box ? box.width * box.height : Number.MAX_SAFE_INTEGER
      };
    })
    .sort((a, b) => a.area - b.area || a.index - b.index)
    .slice(0, initialPaintCount)
    .forEach(({ rose }) => paintRoseTarget(rose));
}

//encontra zonas que recarregam a tinta do pincel
function getBucketTargets() {
  const balde = gardenDocument.querySelector('#balde');
  if (balde) return [balde];

  const redPaintFills = [
    '#8e3233',
    '#b13a35',
    '#932b23',
    '#571e20',
    '#a43c33'
  ];
  const redFillSelector = redPaintFills.map(color => `[fill="${color}"]`).join(',');
  return Array.from(gardenDocument.querySelectorAll(`.st16,${redFillSelector}`));
}

//aplica vermelho a uma rosa ou grupo de petalas
function paintRoseTarget(target) {
  if (target.elements) {
    target.elements.forEach(el => el.classList.add('vermelha'));
    return;
  }
  target.classList.add('vermelha');
  if (target.matches && (target.matches('.cls-32') || target.matches('.st14') || target.matches('.st18') || target.matches('[fill="#fff"]'))) {
    return;
  }
  target.querySelectorAll('.cls-32,.st14,.st18,[fill="#fff"]').forEach(p => p.classList.add('vermelha'));
}

//pinta a rosa decorativa cortada na margem
function paintDecorativeCutLeftRose() {
  const roseGroups = Array.from(gardenDocument.querySelectorAll('#rosas > g'));

  const cutLeftRose = roseGroups
    .map((rose) => {
      const box = getRoseTargetBounds(rose);

      if (!box) return null;

      return {
        rose,
        centerX: box.x + box.width / 2,
        centerY: box.y + box.height / 2
      };
    })
    .filter(Boolean)
    .filter(({ centerX, centerY }) => centerX < 55 && centerY > 195 && centerY < 255)
    .sort((a, b) => a.centerX - b.centerX || a.centerY - b.centerY)[0];

  if (cutLeftRose) {
    paintRoseTarget(cutLeftRose.rose);
  }
}

//injeta estilos interativos dentro do svg
function injectGardenInteractionStyles(doc) {
  const svg = doc && doc.querySelector('svg');
  if (!svg) return;

  if (doc.getElementById('garden-interaction-style')) return;

  const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.id = 'garden-interaction-style';
  style.textContent = `
    #rosas > g,.st14{cursor:none;}
    #rosas > g .st14,#rosas > g .st18,#rosas > g .cls-32,.st14{transition:fill .3s;}
    .vermelha{fill:#b13a35 !important;}
    #rosas > g.vermelha .cls-32,#rosas > g.vermelha .st14,#rosas > g.vermelha .st18{fill:#b13a35 !important;}
    #balde,.st16,[fill="#8e3233"],[fill="#b13a35"],[fill="#932b23"],[fill="#571e20"],[fill="#a43c33"]{cursor:none;}
    #rosas > g,#balde,.st16,[fill="#8e3233"],[fill="#b13a35"],[fill="#932b23"],[fill="#571e20"],[fill="#a43c33"]{touch-action:none;}
    #balde{filter:drop-shadow(0 0 2px rgba(255,230,166,.42));animation:bucketGlowPulse 1.4s ease-in-out infinite alternate;}
    @keyframes bucketGlowPulse{from{filter:drop-shadow(0 0 2px rgba(255,230,166,.42));}to{filter:drop-shadow(0 0 3.5px rgba(255,230,166,.52));}}
    svg{cursor:none;width:100%;height:100%;display:block;}
  `;
  svg.insertBefore(style, svg.firstChild);
}

//envia progresso da pintura para a pagina principal
function notifyParent(type, totalOverride = null) {
  if (window.parent && window.parent !== window) {
    const rosaGroups = getRosaGroups();
    const total = totalOverride || rosaGroups.length;
    const paintedRoses = Array.from(rosaGroups)
      .map((g, i) => g.classList.contains('vermelha') ? String(i + 1) : null)
      .filter(Boolean)
      .slice(0, total);
    window.parent.postMessage({ type, total, painted: Math.min(paintedRoses.length, total), paintedRoses }, '*');
  }
}

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'garden-restore' && Array.isArray(e.data.paintedRoses)) {
    pendingPaintedRoses = e.data.paintedRoses;
  }
});

async function loadGardenSvg() {
  const embeddedSvg = document.getElementById('Camada_1');
  if (embeddedSvg) {
    embeddedSvg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    gardenDocument = document;
    injectGardenInteractionStyles(gardenDocument);
    return;
  }

  const existingObject = document.getElementById('garden-svg-object');
  if (existingObject) {
    if (!existingObject.contentDocument || !existingObject.contentDocument.querySelector('#rosas')) {
      await new Promise((resolve) => {
        const timeoutId = setTimeout(resolve, 700);
        const done = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        existingObject.addEventListener('load', done, { once: true });
        existingObject.addEventListener('error', done, { once: true });
      });
    }

    if (existingObject.contentDocument && existingObject.contentDocument.querySelector('#rosas')) {
      gardenDocument = existingObject.contentDocument;
      injectGardenInteractionStyles(gardenDocument);
      return;
    }
  }

  const svgUrl = 'Jardim.svg';
  try {
    const response = await fetch(svgUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const svgText = await response.text();
    const svgDoc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    if (svgDoc.querySelector('parsererror')) throw new Error('Invalid SVG');

    const externalSvg = document.importNode(svgDoc.documentElement, true);
    externalSvg.id = 'Camada_1';
    externalSvg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const currentSvg = document.getElementById('Camada_1');
    const svgRoot = document.getElementById('garden-svg-root');
    if (currentSvg) {
      currentSvg.replaceWith(externalSvg);
    } else if (svgRoot) {
      svgRoot.replaceChildren(externalSvg);
    } else {
      document.body.prepend(externalSvg);
    }
    gardenDocument = document;
  } catch (error) {
    console.warn('Fetch bloqueado; a carregar Jardim.svg por object:', error);
    const currentSvg = document.getElementById('Camada_1');
    const svgRoot = document.getElementById('garden-svg-root');
    const objectEl = document.createElement('object');
    objectEl.id = 'garden-svg-object';
    objectEl.type = 'image/svg+xml';
    objectEl.data = svgUrl;

    if (currentSvg) {
      currentSvg.style.display = 'none';
      currentSvg.insertAdjacentElement('afterend', objectEl);
    } else if (svgRoot) {
      svgRoot.replaceChildren(objectEl);
    } else {
      document.body.append(objectEl);
    }

    await new Promise((resolve) => {
      const timeoutId = setTimeout(resolve, 700);
      const done = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      objectEl.addEventListener('load', done, { once: true });
      objectEl.addEventListener('error', done, { once: true });
    });

    if (objectEl.contentDocument && objectEl.contentDocument.querySelector('#rosas')) {
      gardenDocument = objectEl.contentDocument;
      injectGardenInteractionStyles(gardenDocument);
    } else {
      gardenDocument = document;
      if (currentSvg) currentSvg.style.display = '';
      console.warn('Nao foi possivel carregar Jardim.svg.');
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadGardenSvg();
  attachPointerTracking(gardenDocument);

  const bucketTargets = getBucketTargets();
  activeRoseTargets = getVisibleRosaGroups();
  paintDecorativeCutLeftRose();

  const rosaGroups = activeRoseTargets;
  const TOTAL = rosaGroups.length;

  //restaura rosas ja pintadas apos novo carregamento
  function restorePaintedRoses(paintedRoses) {
    paintedRoses.forEach(id => {
      const idx = parseInt(id, 10) - 1;
      if (rosaGroups[idx]) {
        paintRoseTarget(rosaGroups[idx]);
      }
    });
  }

  function getPaintedRoseCount() {
    return Math.min(
      Array.from(rosaGroups).filter(rose => rose.classList.contains('vermelha')).length,
      TOTAL
    );
  }

  //atualiza progresso e conclui quando todas as rosas estao pintadas
  function notifyProgressAndCompleteIfReady() {
    const pintadas = getPaintedRoseCount();

    notifyParent('garden-progress', TOTAL);

    if (pintadas >= TOTAL) {
      notifyParent('garden-complete', TOTAL);
      startCardTransition();
    }
  }


  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'garden-restore' && Array.isArray(e.data.paintedRoses)) {
      restorePaintedRoses(e.data.paintedRoses);
      notifyProgressAndCompleteIfReady();
    }
  });

  if (pendingPaintedRoses) {
    restorePaintedRoses(pendingPaintedRoses);
    pendingPaintedRoses = null;
    notifyProgressAndCompleteIfReady();
  } else {
    paintInitialSmallRoses(rosaGroups);
    notifyParent('garden-progress', TOTAL);
  }

  bucketTargets.forEach((bucketTarget) => addPrimaryPressListener(bucketTarget, () => {
    playDipBrushSound();
    tinta = true;
    count = 0;
    syncPaintUi();
  }));

  //trata o clique numa rosa e consome tinta
  function handleRosePaint(g) {
    if (!tinta) return;
    if (g.classList.contains('vermelha')) return;

    paintRoseTarget(g);
    playPaintRoseSound();
    count++;

    if (count >= PAINTS_PER_DIP) {
      tinta = false;
    }
    syncPaintUi();

    notifyProgressAndCompleteIfReady();
  }

  rosaGroups.forEach(g => {
    addPrimaryPressListener(g, () => handleRosePaint(g));
  });
  createRoseHitAreas(rosaGroups, handleRosePaint);

  syncPaintUi();
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

//calcula a grelha de cartas que cobre o ecra
function buildCardLayout() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const cardW = Math.min(Math.max(W * 0.34, 200), 380);
  const cardH = cardW * 1.08;
  const stepX = cardW * 0.54;
  const stepY = cardH * 0.46;
  const jX = cardW * 0.18;
  const jY = cardH * 0.16;
  const cols = Math.ceil((W + cardW * 1.5) / stepX);
  const rows = Math.ceil((H + cardH * 1.35) / stepY);
  const cards = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rowOff = r % 2 === 0 ? 0 : stepX * 0.34;
      const scale = 0.92 + Math.random() * 0.18;
      const w = cardW * scale;
      const h = cardH * scale;
      cards.push({
        src: CARD_ASSETS[Math.floor(Math.random() * CARD_ASSETS.length)],
        left: -cardW * 0.46 + c * stepX + rowOff + (Math.random() - 0.5) * jX,
        top: -cardH * 0.42 + r * stepY + (Math.random() - 0.5) * jY,
        w, h,
        rot: (Math.random() - 0.5) * 64,
        dur: 340 + Math.random() * 140
      });
    }
  }
  return shuffle(cards);
}

//inicia a cobertura por cartas
function startCardTransition() {
  const overlay = document.getElementById('card-reveal');
  const backdrop = document.getElementById('card-backdrop');
  const layer = document.getElementById('card-layer');
  if (overlay.classList.contains('active')) return;

  overlay.classList.add('active');
  layer.innerHTML = '';
  playCardTransitionSound();

  const cards = buildCardLayout();
  let nextIdx = 0;

  const spawnBatch = () => {
    playCardTransitionSound(1);

    for (let i = 0; i < CARDS_PER_BATCH && nextIdx < cards.length; i++, nextIdx++) {
      const cd = cards[nextIdx];
      const el = document.createElement('div');
      el.className = 'cr-card';
      el.style.cssText = `left:${cd.left}px;top:${cd.top}px;width:${cd.w}px;height:${cd.h}px;--r:${cd.rot.toFixed(1)}deg;animation-duration:${cd.dur.toFixed(0)}ms;z-index:${nextIdx+1};`;
      const img = document.createElement('img');
      img.src = cd.src;
      img.alt = '';
      el.appendChild(img);
      layer.appendChild(el);
    }

    const prog = cards.length ? nextIdx / cards.length : 1;
    backdrop.style.opacity = (0.04 + (0.92 - 0.04) * Math.pow(prog, 1/3)).toFixed(3);

    if (nextIdx >= cards.length) {
      clearInterval(spawnId);
      setTimeout(revealCards, COVER_HOLD_MS);
    }
  };

  const spawnId = setInterval(spawnBatch, SPAWN_INTERVAL);
  spawnBatch();
}

//revela as cartas para terminar a transicao
function revealCards() {
  const layer = document.getElementById('card-layer');
  const allCards = shuffle(Array.from(layer.querySelectorAll('.cr-card')));
  let idx = 0;

  playCardTransitionSound(0.95);

  const revealBatch = () => {
    playCardTransitionSound(0.85);

    for (let i = 0; i < REVEAL_BATCH && idx < allCards.length; i++, idx++) {
      allCards[idx].classList.add('revealing');
    }
    if (idx >= allCards.length) {
      clearInterval(revId);
    }
  };
  revealBatch();
  const revId = setInterval(revealBatch, REVEAL_INTERVAL);
}
