const container = document.getElementById("eyes-container");

const NUM_EYES = 20;
const EYE_WIDTH = 120;
const EYE_HEIGHT = 60;
const MIN_DISTANCE = 170;
const MIN_DISTANCE_IMAGES = 20;

const eyes = [];
const imageEyes = Array.from(document.querySelectorAll(".image-eye"));
const pupilColors = ["#2f2c1b", "#4a6285", "#324561", "#666", "#240c06", "#3d2907", "#615237", "#8d8664"];

const blinkSounds = [
    new Audio("../som/piscar1.mp4"),
];

function collidesWithEyes(x, y) {
    return eyes.some(e => {
        const dx = e.x - x;
        const dy = e.y - y;
        return Math.sqrt(dx*dx + dy*dy) < MIN_DISTANCE;
    });
}

function collidesWithImages(x, y) {
    return imageEyes.some(img => {
        const rect = img.getBoundingClientRect();
        return !(
            x + EYE_WIDTH + MIN_DISTANCE_IMAGES < rect.left ||
            x > rect.right + MIN_DISTANCE_IMAGES ||
            y + EYE_HEIGHT + MIN_DISTANCE_IMAGES < rect.top ||
            y > rect.bottom + MIN_DISTANCE_IMAGES
        );
    });
}

function createEye() {
    const eye = document.createElement("div");
    eye.classList.add("eye");
    eye.innerHTML = `<i></i>`;

    const pupil = eye.querySelector("i");
    const innerPupil = document.createElement("div");
    innerPupil.classList.add("pupil");
    pupil.appendChild(innerPupil);

    pupil.style.background = pupilColors[Math.floor(Math.random() * pupilColors.length)];

    let x, y, tries = 0;
    let placed = false;

    while (!placed && tries < 1000) {
        x = Math.random() * (window.innerWidth - EYE_WIDTH);
        y = Math.random() * (window.innerHeight - EYE_HEIGHT);

        if (!collidesWithEyes(x, y) && !collidesWithImages(x, y)) {
            placed = true;
        }
        tries++;
    }

    if (!placed) {
        x = Math.random() * (window.innerWidth - EYE_WIDTH);
        y = Math.random() * (window.innerHeight - EYE_HEIGHT);
    }

    eye.style.left = x + "px";
    eye.style.top = y + "px";
    container.appendChild(eye);

    const eyeObj = {
        eye,
        pupil,
        blinkProgress: 0,
        closing: false,
        nextBlink: performance.now() + Math.random()*4000 + 1000,
        speed: 0.004 + Math.random()*0.01,
        hovering: false,
        x, y
    };

    eye.addEventListener("mouseenter", () => {
        eyeObj.hovering = true;
        eyeObj.closing = true;
    });
    eye.addEventListener("mouseleave", () => {
        eyeObj.hovering = false;
    });

    eyes.push(eyeObj);
}

for (let i = 0; i < NUM_EYES; i++) createEye();

document.addEventListener("mousemove", (e)=>{
    eyes.forEach(({pupil, eye})=>{
        const rect = eye.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const distance = 15;
        const angle = Math.atan2(dy, dx);

        pupil.style.transform = `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px)`;
    });
});

function animate() {
    const now = performance.now();

    eyes.forEach(eyeObj => {
        if (!eyeObj.hovering && !eyeObj.closing && now >= eyeObj.nextBlink) {
            eyeObj.closing = true;
        }

        if (eyeObj.closing) {
            eyeObj.blinkProgress += eyeObj.speed;
            if (eyeObj.blinkProgress >= 1) {
                eyeObj.blinkProgress = 1;
                eyeObj.closing = false;
                eyeObj.nextBlink = now + Math.random()*4000 + 1000;
            }
        } else if (!eyeObj.hovering && eyeObj.blinkProgress > 0) {
            eyeObj.blinkProgress -= eyeObj.speed;
            if (eyeObj.blinkProgress < 0) eyeObj.blinkProgress = 0;
        }

        if (eyeObj.hovering && eyeObj.blinkProgress < 1) {
            eyeObj.blinkProgress += eyeObj.speed*2;
            if (eyeObj.blinkProgress > 1) eyeObj.blinkProgress = 1;
        }

        const val = -47 * eyeObj.blinkProgress;
        eyeObj.eye.style.setProperty("--eyelid", `${val}%`);
        eyeObj.eye.style.setProperty("--eyelid2", `${-val}%`);
    });

    requestAnimationFrame(animate);
}

animate();

const imageEyeObjs = [];

imageEyes.forEach(eye => {
    const obj = {
        eye,
        blinkProgress: 0,
        closing: false,
        hovering: false,
        selected: false,
        nextBlink: performance.now() + Math.random()*4000 + 1000,
        speed: 0.008
    };

    eye.addEventListener("mouseenter", () => {
        obj.hovering = true;
        obj.closing = true;
    });
    eye.addEventListener("mouseleave", () => {
        obj.hovering = false;
    });

    const radio = eye.closest("label").querySelector("input");

    radio.addEventListener("change", () => {
        imageEyeObjs.forEach(o => {
            o.selected = (o === obj) && radio.checked;
        });
        obj.closing = true;
    });

    imageEyeObjs.push(obj);
});

function animateImageEyes() {
    const now = performance.now();

    imageEyeObjs.forEach(obj => {
        let justBlinked = false;

        if (!obj.selected && !obj.closing && now >= obj.nextBlink) {
            obj.closing = true;
        }

        if (obj.selected) {
            obj.blinkProgress = 1;
            obj.closing = false;
            return;
        } else if (obj.closing) {
            obj.blinkProgress += obj.hovering ? obj.speed*2 : obj.speed;
            if (obj.blinkProgress >= 1) {
                obj.blinkProgress = 1;
                obj.closing = false;
                obj.nextBlink = now + Math.random()*4000 + 1000;
                justBlinked = true; // acabou de piscar
            }
        } else if (!obj.hovering && obj.blinkProgress > 0) {
            obj.blinkProgress -= obj.speed;
            if (obj.blinkProgress < 0) obj.blinkProgress = 0;
        }

        const val = -50 * obj.blinkProgress;
        obj.eye.style.setProperty("--eyelid", `${val}%`);
        obj.eye.style.setProperty("--eyelid2", `${-val}%`);

        if (justBlinked) {
            const sound = blinkSounds[Math.floor(Math.random() * blinkSounds.length)];
            sound.currentTime = 0;
            sound.play();
        }
    });

    requestAnimationFrame(animateImageEyes);
}

animateImageEyes();
