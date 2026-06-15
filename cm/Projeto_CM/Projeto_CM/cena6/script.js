//controla a mesa de cha, os objetos arrastaveis e o portal da chavena
(function () {
  const canvasArea = document.getElementById("canvas-area");
  const trash      = document.getElementById("trash");
  trash.removeAttribute("title");
  const FOREST_AMBIENT_SOUND_URL = "../som/floresta.mp3";
  const FOREST_AMBIENT_VOLUME = 0.05;
  const TABLE_ITEM_SOUND_URL = "../som/loica.mp3";
  const LOCAL_TEA_PORTAL_TRANSITION_SOUND_URL = "../som/transicaotunel.mp3";
  let forestAmbientAudio = null;
  let portalTransitionStarted = false;

  function playTableItemSound() {
    const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === "function"
      ? window.parent.playPreloadedSound(TABLE_ITEM_SOUND_URL, { volume: 0.75 })
      : new Audio(TABLE_ITEM_SOUND_URL);

    sound.volume = 0.75;
    if (!sound.paused) return;
    sound.play().catch(() => {

      });
  }

  function playLocalTeaPortalTransitionSound() {
    const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === "function"
      ? window.parent.playPreloadedSound(LOCAL_TEA_PORTAL_TRANSITION_SOUND_URL, { volume: 0.8 })
      : new Audio(LOCAL_TEA_PORTAL_TRANSITION_SOUND_URL);

    sound.volume = 0.8;
    if (!sound.paused) return;
    sound.play().catch(() => {

    });
  }

  function getForestAmbientAudio() {
    if (!forestAmbientAudio) {
      forestAmbientAudio = new Audio(FOREST_AMBIENT_SOUND_URL);
      forestAmbientAudio.loop = true;
      forestAmbientAudio.volume = FOREST_AMBIENT_VOLUME;
    }

    return forestAmbientAudio;
  }

  //toca ambiente quando a cena e aberta isoladamente
  function playStandaloneForestAmbient() {
    if (window.self !== window.top) return;

    const audio = getForestAmbientAudio();
    audio.play().catch(() => {

    });
  }

  //tenta desbloquear audio apos o primeiro gesto
  function unlockStandaloneForestAmbient() {
    playStandaloneForestAmbient();
  }

  playStandaloneForestAmbient();

  ["pointerdown", "keydown", "touchstart"].forEach(eventName => {
    window.addEventListener(eventName, unlockStandaloneForestAmbient, { once: true, passive: true });
  });


  const mesaImg = new Image();
  mesaImg.id  = "mesa-img";
  mesaImg.src = "imagens/mesa.png";
  mesaImg.alt = "Mesa";
  canvasArea.appendChild(mesaImg);

  const items = [];
  let cw = 0, ch = 0;

  function getCanvasSize() {
    const r = canvasArea.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  //reposiciona objetos quando a area muda de tamanho
  function repositionAll() {
    const { w, h } = getCanvasSize();
    if (w === cw && h === ch) return;
    cw = w; ch = h;
    items.forEach(it => {
      it.el.style.left = it.rx * w + "px";
      it.el.style.top  = it.ry * h + "px";
    });
  }

  const ro = new ResizeObserver(repositionAll);
  ro.observe(canvasArea);

  //guarda a posicao relativa de um objeto
  function syncRatio(it) {
    const { w, h } = getCanvasSize();
    it.rx = parseFloat(it.el.style.left) / w;
    it.ry = parseFloat(it.el.style.top)  / h;
  }

  //aplica posicao, escala e rotacao a um objeto
  function applyTransform(it) {
    it.el.style.transform = `rotate(${it.rotation}deg)`;
  }

  function getAngleFromCenter(it, cx, cy) {
    const r  = it.el.getBoundingClientRect();
    const ox = r.left + r.width  / 2;
    const oy = r.top  + r.height / 2;
    return Math.atan2(cy - oy, cx - ox) * (180 / Math.PI);
  }


  const CUP_SRCS = ["imagens/cafe1.png"];
  const CUP_COFFEE = {
    "cafe1.png": { l: 0.18, t: 0.38, w: 0.62, h: 0.38 },
  };
  const PORTAL_IMG      = "imagens/portal_reflexo.png";
  const MIN_CUPS_BEFORE = 0;
  const PORTAL_CHANCE   = 1.0;

  let cupsPlaced   = 0;
  let portalExists = false;

  function isCup(src) {
    return CUP_SRCS.some(s => src.endsWith(s.split("/").pop()));
  }

  function getCupKey(src) {
    return src.split("/").pop();
  }

  function shouldBePortal() {
    if (portalExists) return false;
    if (cupsPlaced <= MIN_CUPS_BEFORE) return false;
    return Math.random() < PORTAL_CHANCE;
  }

  //transforma uma chavena no portal para a proxima cena
  function addCoffeePortal(it) {
    const key = getCupKey(it.src);
    const c   = CUP_COFFEE[key];
    if (!c) return;

    const portal = document.createElement("div");
    portal.className = "coffee-portal";
    portal.style.cssText = [
      `left:${c.l * 100}%`,
      `top:${c.t * 100}%`,
      `width:${c.w * 100}%`,
      `height:${c.h * 100}%`,
    ].join(";");

    const img = document.createElement("img");
    img.src = PORTAL_IMG;
    img.draggable = false;
    img.style.opacity = "1";
    img.style.mixBlendMode = "normal";
    portal.appendChild(img);

    it.el.appendChild(portal);
    it.portalEl  = portal;
    it.isPortal  = true;
    it.el.classList.add("portal-cup");
    portalExists = true;
  }

  //faz zoom na chavena e avisa a pagina principal
  function triggerPortalTransition(cupEl) {
    if (portalTransitionStarted) return;
    portalTransitionStarted = true;
    if (window.parent && window.parent !== window && typeof window.parent.playTeaPortalTransitionSound === "function") {
      window.parent.playTeaPortalTransitionSound();
    } else if (typeof window.playTeaPortalTransitionSound === "function") {
      window.playTeaPortalTransitionSound();
    } else {
      playLocalTeaPortalTransitionSound();
    }

    const scene = document.getElementById("scene");
    const rect = cupEl.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const originX = ((cx - sceneRect.left) / Math.max(sceneRect.width, 1)) * 100;
    const originY = ((cy - sceneRect.top) / Math.max(sceneRect.height, 1)) * 100;

    const fade = document.createElement("div");
    fade.style.cssText =
      "position:fixed;inset:0;z-index:8999;background:#000;opacity:0;transition:opacity 0.9s ease;pointer-events:none;";
    document.body.appendChild(fade);

    scene.classList.add("scene-zooming");
    scene.style.transformOrigin = `${originX}% ${originY}%`;
    scene.style.transform = "scale(9)";

    requestAnimationFrame(() => {
      fade.style.opacity = "1";
    });

    setTimeout(() => {
      window.parent.postMessage({ type: "tea-portal" }, "*");
    }, 950);
  }

  //remove a margem opaca dos objetos colocados
  function removePlacedItemMatte(img, src) {
    const source = new Image();

    source.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(source, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 180) {
          pixels[i] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      img.src = canvas.toDataURL("image/png");
    }, { once: true });

    source.src = src;
  }


  //cria um objeto arrastavel dentro da mesa
  function createItem(src, baseW, baseH, px, py) {
    playTableItemSound();

    const { w, h } = getCanvasSize();

    const el = document.createElement("div");
    el.className = "placed-item";
    el.style.width  = baseW + "px";
    el.style.height = baseH + "px";
    el.style.left   = px + "px";
    el.style.top    = py + "px";

    const img = document.createElement("img");
    img.src = src;
    removePlacedItemMatte(img, src);
    el.appendChild(img);


    const rotHandle = document.createElement("div");
    rotHandle.className = "rotate-handle";
    rotHandle.setAttribute("aria-label", "Arrastar para rodar");
    rotHandle.innerHTML = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 2.5 A7 7 0 1 0 13.9 9" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <polygon points="13.5,0 16,4 11,4" fill="white"/>
    </svg>`;
    el.appendChild(rotHandle);

    const it = { el, src, rx: px / w, ry: py / h, rotation: 0, baseW, baseH, isPortal: false, portalEl: null };
    items.push(it);
    applyTransform(it);


    if (isCup(src)) {
      cupsPlaced++;
      if (shouldBePortal()) {
        setTimeout(() => addCoffeePortal(it), 400);
      }
    }


    el.addEventListener("click", (e) => {
      if (it.isPortal && !dragMoved) {
        e.stopPropagation();
        triggerPortalTransition(el);
      }
    });

    el.addEventListener("mousedown", (e) => {
      if (e.target.closest(".rotate-handle")) return;
      startDrag(it, e);
    });

    rotHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation(); e.preventDefault();
      startRotate(it, e);
    });

    el.addEventListener("touchstart", (e) => {
      if (e.target.closest(".rotate-handle")) return;
      startTouchDrag(it, e);
    }, { passive: false });

    canvasArea.appendChild(el);

    el.style.opacity = "0";
    el.style.transition = "opacity 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)";
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      applyTransform(it);
      setTimeout(() => { el.style.transition = ""; }, 300);
    });
  }


  let dragItem  = null, mouseOffX = 0, mouseOffY = 0, dragMoved = false;

  //inicia o arrasto de um objeto colocado
  function startDrag(it, e) {
    e.preventDefault(); e.stopPropagation();
    dragItem  = it;
    dragMoved = false;
    const rect = it.el.getBoundingClientRect();
    mouseOffX = e.clientX - rect.left;
    mouseOffY = e.clientY - rect.top;
    it.el.classList.add("dragging");
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup",   onDragUp);
  }

  //atualiza a posicao durante o arrasto
  function onDragMove(e) {
    if (!dragItem) return;
    dragMoved = true;
    const ar = canvasArea.getBoundingClientRect();
    dragItem.el.style.left = e.clientX - ar.left - mouseOffX + "px";
    dragItem.el.style.top  = e.clientY - ar.top  - mouseOffY + "px";
    checkTrashHover(e.clientX, e.clientY);
  }

  //termina o arrasto e apaga se estiver sobre o lixo
  function onDragUp(e) {
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup",   onDragUp);
    if (!dragItem) return;
    trash.classList.remove("drag-over");
    if (isOverTrash(e.clientX, e.clientY)) {
      removeItem(dragItem);
    } else {
      dragItem.el.classList.remove("dragging");
      syncRatio(dragItem);
    }
    dragItem = null;
  }


  let rotItem = null, rotStartAngle = 0, rotStartRot = 0;

  //inicia a rotacao manual de um objeto
  function startRotate(it, e) {
    rotItem = it;
    rotStartAngle = getAngleFromCenter(it, e.clientX, e.clientY);
    rotStartRot   = it.rotation;
    it.el.classList.add("rotating");
    document.addEventListener("mousemove", onRotateMove);
    document.addEventListener("mouseup",   onRotateUp);
  }

  //atualiza o angulo durante a rotacao
  function onRotateMove(e) {
    if (!rotItem) return;
    const curr  = getAngleFromCenter(rotItem, e.clientX, e.clientY);
    let   delta = curr - rotStartAngle;
    while (delta >  180) delta -= 360;
    while (delta < -180) delta += 360;
    rotItem.rotation = rotStartRot + delta;
    applyTransform(rotItem);
  }

  function onRotateUp() {
    document.removeEventListener("mousemove", onRotateMove);
    document.removeEventListener("mouseup",   onRotateUp);
    if (!rotItem) return;
    rotItem.el.classList.remove("rotating");
    rotItem = null;
  }


  let activeTouchItem = null, tOffX = 0, tOffY = 0;

  //inicia arrasto em ecra tactil
  function startTouchDrag(it, e) {
    e.preventDefault();
    activeTouchItem = it;
    const t = e.touches[0];
    const rect = it.el.getBoundingClientRect();
    tOffX = t.clientX - rect.left;
    tOffY = t.clientY - rect.top;
    it.el.classList.add("dragging");
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend",  onTouchEnd);
  }

  //move o objeto durante toque
  function onTouchMove(e) {
    e.preventDefault();
    if (!activeTouchItem) return;
    const t  = e.touches[0];
    const ar = canvasArea.getBoundingClientRect();
    activeTouchItem.el.style.left = t.clientX - ar.left - tOffX + "px";
    activeTouchItem.el.style.top  = t.clientY - ar.top  - tOffY + "px";
    checkTrashHover(t.clientX, t.clientY);
  }

  //termina o arrasto por toque
  function onTouchEnd(e) {
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend",  onTouchEnd);
    if (!activeTouchItem) return;
    trash.classList.remove("drag-over");
    const t = e.changedTouches[0];
    if (isOverTrash(t.clientX, t.clientY)) {
      removeItem(activeTouchItem);
    } else {
      activeTouchItem.el.classList.remove("dragging");
      syncRatio(activeTouchItem);
    }
    activeTouchItem = null;
  }

  //remove um objeto da mesa e atualiza o portal se necessario
  function removeItem(it) {

    if (it.isPortal) portalExists = false;
    it.el.style.transition = "transform 0.2s, opacity 0.2s";
    it.el.style.opacity    = "0";
    it.el.style.transform += " scale(0)";
    setTimeout(() => it.el.remove(), 220);
    const idx = items.indexOf(it);
    if (idx !== -1) items.splice(idx, 1);
  }

  function isOverTrash(cx, cy) {
    const r = trash.getBoundingClientRect();
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  }
  //ativa o destaque do lixo quando o objeto passa por cima
  function checkTrashHover(cx, cy) {
    trash.classList.toggle("drag-over", isOverTrash(cx, cy));
  }


  let htmlDragData = null, htmlOffX = 0, htmlOffY = 0;

  document.querySelectorAll(".item-slot").forEach(slot => {
    slot.setAttribute("draggable", "true");
    slot.addEventListener("dragstart", e => {
      htmlDragData = { src: slot.dataset.src, w: parseInt(slot.dataset.w), h: parseInt(slot.dataset.h) };
      htmlOffX = htmlDragData.w / 2;
      htmlOffY = htmlDragData.h / 2;
      e.dataTransfer.effectAllowed = "copy";
    });
  });

  canvasArea.addEventListener("dragover",  e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; canvasArea.classList.add("drag-over"); });
  canvasArea.addEventListener("dragleave", () => canvasArea.classList.remove("drag-over"));
  canvasArea.addEventListener("drop", e => {
    e.preventDefault();
    canvasArea.classList.remove("drag-over");
    if (!htmlDragData) return;
    const ar = canvasArea.getBoundingClientRect();
    createItem(htmlDragData.src, htmlDragData.w, htmlDragData.h,
      e.clientX - ar.left - htmlOffX, e.clientY - ar.top - htmlOffY);
    htmlDragData = null;
  });


  let touchSrcData = null, touchGhost = null;

  document.querySelectorAll(".item-slot").forEach(slot => {
    slot.addEventListener("touchstart", e => {
      const t = e.touches[0];
      touchSrcData = { src: slot.dataset.src, w: parseInt(slot.dataset.w), h: parseInt(slot.dataset.h) };
      touchGhost = document.createElement("img");
      touchGhost.src = touchSrcData.src;
      touchGhost.style.cssText =
        `position:fixed;width:${touchSrcData.w}px;height:${touchSrcData.h}px;` +
        `object-fit:contain;pointer-events:none;z-index:999;opacity:0.8;` +
        `left:${t.clientX - touchSrcData.w/2}px;top:${t.clientY - touchSrcData.h/2}px;transition:none;`;
      document.body.appendChild(touchGhost);
    }, { passive: true });

    slot.addEventListener("touchmove", e => {
      e.preventDefault();
      if (!touchGhost) return;
      const t = e.touches[0];
      touchGhost.style.left = t.clientX - touchSrcData.w/2 + "px";
      touchGhost.style.top  = t.clientY - touchSrcData.h/2 + "px";
    }, { passive: false });

    slot.addEventListener("touchend", e => {
      if (!touchGhost || !touchSrcData) return;
      touchGhost.remove(); touchGhost = null;
      const t  = e.changedTouches[0];
      const ar = canvasArea.getBoundingClientRect();
      if (t.clientX >= ar.left && t.clientX <= ar.right && t.clientY >= ar.top && t.clientY <= ar.bottom) {
        createItem(touchSrcData.src, touchSrcData.w, touchSrcData.h,
          t.clientX - ar.left - touchSrcData.w/2, t.clientY - ar.top - touchSrcData.h/2);
      }
      touchSrcData = null;
    });
  });
})();
