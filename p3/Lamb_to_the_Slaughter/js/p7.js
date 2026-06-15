const originalStyles = {
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    bodyFont: getComputedStyle(document.body).fontFamily
};

const options = document.querySelectorAll(".option-label");
const optionA = document.querySelector('input[name="q7"][value="2"]');
const optionB = document.querySelector('input[name="q7"][value="10"]').parentElement;
const optionC = document.querySelector('input[name="q7"][value="0"]');
const optionD = document.querySelector('input[name="q7"][value="5"]');

const title = document.querySelector(".title-center");
const question = document.querySelector(".question-text");
const button = document.querySelector(".btn");

const roletaSound = new Audio("../som/roleta.mp3");
roletaSound.loop = true;
roletaSound.volume = 0.6;

function fadeOutAudio(audio, duration = 300) {
    const startVolume = audio.volume;
    const steps = 20;
    const stepTime = duration / steps;
    let currentStep = 0;

    const fade = setInterval(() => {
        currentStep++;
        audio.volume = startVolume * (1 - currentStep / steps);

        if (currentStep >= steps) {
            clearInterval(fade);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = startVolume;
        }
    }, stepTime);
}

/*opção a*/
const offsets = new Map();
options.forEach(opt => offsets.set(opt, 0));

optionA.parentElement.addEventListener("click", () => {
    options.forEach(opt => {
        const containerWidth = document.querySelector('.card').offsetWidth;
        const distance = Math.floor(Math.random() * 81) + 70;
        const direction = Math.random() < 0.5 ? -1 : 1;

        let proposedOffset = offsets.get(opt) + distance * direction;

        const maxLeft = 0;
        let maxRight = (containerWidth/2)-150;

        if (maxRight < 0) maxRight = 0;

        if (proposedOffset < maxLeft) proposedOffset = maxLeft;
        if (proposedOffset > maxRight) proposedOffset = maxRight;

        offsets.set(opt, proposedOffset);
        opt.style.transition = "transform 0.25s ease";
        opt.style.transform = `translateX(${proposedOffset}px)`;
    });
});

/*opção d*/
let currentOpacity = 1;

optionD.parentElement.addEventListener("click", () => {
    currentOpacity *= 0.8;

    options.forEach(opt => opt.style.opacity = currentOpacity);
    title.style.opacity = currentOpacity;
    question.style.opacity = currentOpacity;
    button.style.opacity = currentOpacity;
});

/*opção b*/
const colorThemes = [
    { bodyBg: "#222020", bodyColor: "#8d8664", hover: "#4a4527" },
    { bodyBg: "#1b232f", bodyColor: "#b2c3dd", hover: "#4a6285" },
    { bodyBg: "#2b0f08", bodyColor: "#dec7c1", hover: "#ad8f87" },
    { bodyBg: "#101315", bodyColor: "#2d2b19", hover: "#4f4b2a" },
    { bodyBg: "#222222", bodyColor: "#ffffff", hover: "#444444" },
    { bodyBg: "#ffdca0", bodyColor: "#3d2907", hover: "#615237" },
    { bodyBg: "#240c06", bodyColor: "#6e0f0f", hover: "#9a1b03" },
    { bodyBg: "#222222", bodyColor: "#ffffff", hover: "#888888" },
    { bodyBg: "#0d1117", bodyColor: "#cad0da", hover: "#93a8c6" }
];

/*fontes*/
const fonts = [
    "Cascadia Code",
    "Algerian",
    "Bauhaus 93",
    "Bradley Hand ITC",
    "Broadway",
    "Cooper Black",
    "Copperplate Gothic Bold",
    "Courier New",
    "Caveat",
    "YouMurderer BB"
];

/*tema*/
function applyTheme(theme) {
    document.body.style.backgroundColor = theme.bodyBg;
    document.body.style.color = theme.bodyColor;

    const oldStyle = document.querySelector("#theme-style");
    if (oldStyle) oldStyle.remove();

    const style = document.createElement("style");
    style.id = "theme-style";
    style.innerHTML = `
        .option-label:hover { color: ${theme.hover} !important; }
        .btn:hover { color: ${theme.hover} !important; }
    `;
    document.head.appendChild(style);
}

/*fonte*/
function applyFont(font) {
    document.body.style.fontFamily = font;
    title.style.fontFamily = font;
}

/*flicker e som*/
let _flickerInterval = null;
let _flickerTimeout = null;

function flicker(values, callback, mode) {
    if (_flickerInterval) clearInterval(_flickerInterval);
    if (_flickerTimeout) clearTimeout(_flickerTimeout);

    roletaSound.currentTime = 0;
    roletaSound.play().catch(() => {});

    _flickerInterval = setInterval(() => {
        const random = values[Math.floor(Math.random() * values.length)];

        if (mode === "color") {
            document.body.style.backgroundColor = random.bodyBg;
            document.body.style.color = random.bodyColor;
        } else {
            document.body.style.fontFamily = random;
            title.style.fontFamily = random;
        }
    }, 80);

    const duration = 1200 + Math.random() * 900;

    _flickerTimeout = setTimeout(() => {
        clearInterval(_flickerInterval);
        _flickerInterval = null;
        _flickerTimeout = null;

        fadeOutAudio(roletaSound, 300);
        callback();
    }, duration);
}

/*opção b*/
optionB.addEventListener("click", () => {
    const doColors = Math.random() < 0.5;

    if (doColors) {
        flicker(colorThemes, () => {
            applyTheme(colorThemes[Math.floor(Math.random() * colorThemes.length)]);
        }, "color");
    } else {
        flicker(fonts, () => {
            applyFont(fonts[Math.floor(Math.random() * fonts.length)]);
        }, "font");
    }
});

/*opção c*/
optionC.parentElement.addEventListener("click", () => {

    fadeOutAudio(roletaSound, 200);

    if (_flickerInterval) clearInterval(_flickerInterval);
    if (_flickerTimeout) clearTimeout(_flickerTimeout);

    options.forEach(opt => {
        offsets.set(opt, 0);
        opt.style.transition = "transform 0.25s ease, opacity 0.25s ease";
        opt.style.transform = "translateX(0)";
        opt.style.opacity = 1;
    });

    currentOpacity = 1;

    title.style.opacity = 1;
    question.style.opacity = 1;
    button.style.opacity = 1;

    document.body.style.backgroundColor = originalStyles.bodyBg;
    document.body.style.color = originalStyles.bodyColor;
    document.body.style.fontFamily = originalStyles.bodyFont;
    title.style.fontFamily = originalStyles.bodyFont;

    const oldStyle = document.querySelector("#theme-style");
    if (oldStyle) oldStyle.remove();
});
