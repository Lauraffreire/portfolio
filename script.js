document.querySelectorAll(".work-card video").forEach((video) => {
  const card = video.closest(".work-card");

  card.addEventListener("mouseenter", () => {
    video.play().catch(() => {});
  });

  card.addEventListener("mouseleave", () => {
    video.pause();
    video.currentTime = 0;
  });
});

const updateHeaderState = () => {
  document.body.classList.toggle("header-scrolled", window.scrollY > 48);
};

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

function setupHalftoneBackground() {
  const canvas = document.querySelector(".halftone-background");

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spacing = 12;
  const base = { r: 184, g: 53, b: 86 };
  const light = { r: 220, g: 151, b: 165 };
  const mouse = { x: -9999, y: -9999 };
  const smoothMouse = { x: -9999, y: -9999 };
  const floaters = [
    { x: 0.12, y: 0.18, vx: 0.00012, vy: 0.00008, s: 0.48, r: 0.36, ph: 0 },
    { x: 0.78, y: 0.12, vx: -0.00008, vy: 0.00011, s: 0.38, r: 0.3, ph: 1.2 },
    { x: 0.55, y: 0.62, vx: 0.00006, vy: -0.00012, s: 0.44, r: 0.38, ph: 2.5 },
    { x: 0.22, y: 0.82, vx: 0.00008, vy: -0.00007, s: 0.36, r: 0.34, ph: 5.1 }
  ];
  let width = 0;
  let height = 0;
  let offsets = [];
  let tick = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const cols = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;
    offsets = new Float32Array(cols * rows);
    for (let i = 0; i < offsets.length; i += 1) {
      offsets[i] = Math.random();
    }
  };

  const getOffset = (col, row) => {
    const cols = Math.ceil(width / spacing) + 2;
    return offsets[row * cols + col] ?? 0.5;
  };

  const mixColor = (a, b, amount) => ({
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount)
  });

  const getInfluence = (px, py) => {
    let total = 0;

    floaters.forEach((floater) => {
      const dx = px - floater.x * width;
      const dy = py - floater.y * height;
      const distance = Math.hypot(dx, dy);
      const radius = floater.r * Math.min(width, height);
      const strength = Math.max(0, 1 - distance / radius);
      total += floater.s * strength * strength * strength;
    });

    if (mouse.x > -999) {
      const dx = px - smoothMouse.x;
      const dy = py - smoothMouse.y;
      const distance = Math.hypot(dx, dy);
      const radius = Math.min(width, height) * 0.22;
      const strength = Math.max(0, 1 - distance / radius);
      total += 0.55 * strength * strength * strength;
    }

    return Math.min(1, total);
  };

  const draw = () => {
    tick += reducedMotion ? 0 : 0.01;

    if (mouse.x > -999) {
      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
    }

    if (!reducedMotion) {
      floaters.forEach((floater) => {
        floater.x += floater.vx + Math.sin(tick * 0.7 + floater.ph) * 0.00012;
        floater.y += floater.vy + Math.cos(tick * 0.5 + floater.ph) * 0.00009;
        if (floater.x < -0.1) floater.x = 1.1;
        if (floater.x > 1.1) floater.x = -0.1;
        if (floater.y < -0.1) floater.y = 1.1;
        if (floater.y > 1.1) floater.y = -0.1;
      });
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const offset = (row % 2) * (spacing / 2);
        const px = col * spacing + offset;
        const py = row * spacing;
        const influence = getInfluence(px, py);
        const random = getOffset(col, row);
        const maxRadius = 0.65 + random * 1.25;
        const radius = Math.max(0, maxRadius - influence * maxRadius * 1.25);

        if (radius < 0.05) continue;

        const color = mixColor(base, light, influence);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.42)`;
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  };

  document.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  document.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  document.addEventListener("touchmove", (event) => {
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  resize();
  window.addEventListener("resize", resize);
  draw();
}

setupHalftoneBackground();
