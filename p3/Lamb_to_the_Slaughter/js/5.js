document.querySelectorAll("input[name='q5']").forEach(opt => {
    opt.addEventListener("change", (e) => {
        playSoundQ5(e);
        handleBackground(e);
    });
});


const sonsQ5 = {
    6: new Audio("som/pensamento.mp3"),
    10: new Audio("som/cortar.mp3"),
    0: new Audio("som/dialogo.mp3"),
    3: new Audio("som/relogio.mp3")
};

sonsQ5[3].loop = true;

// volume geral
Object.values(sonsQ5).forEach(som => {
    som.volume = 0.5;
});

function clampPosition(left, top, sizePx = 150) {
    const margin = (sizePx / window.innerWidth) * 100;
    const clampedLeft = Math.max(margin, Math.min(100 - margin, left));
    const clampedTop  = Math.max(margin, Math.min(100 - margin, top));
    return { left: clampedLeft, top: clampedTop };
}

function handleBackground(e) {
    const value = e.target.value;

    clearBackground();

    let bg = document.querySelector(".background-effects");
    if (!bg) {
        bg = document.createElement("div");
        bg.className = "background-effects";
        document.body.appendChild(bg);
    }

    if (value == 6) createThoughtBubbles(bg);
    if (value == 10) createBlood(bg);
    if (value == 0) createDialogBalloons(bg);
    if (value == 3) createClock(bg);
}

function clearBackground() {
    document.querySelectorAll(".background-effects").forEach(el => el.remove());
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function createSingleBloodDrop(bg) {
    const drop = document.createElement("div");
    drop.className = "blood-drop";

    const size = 10 + Math.random() * 120;
    drop.style.width = size + "px";
    drop.style.height = size + "px";

    const shapeType = Math.random();

    if (shapeType < 0.40) {
        drop.style.borderRadius = "50%";
    }
    else if (shapeType < 0.80) {
        drop.style.borderRadius =
            `${50 + rand(-20,20)}% ${50 + rand(-20,20)}% ` +
            `${50 + rand(-20,20)}% ${50 + rand(-20,20)}%`;
    }
    else {
        drop.style.borderRadius =
            `${rand(30,80)}% ${rand(20,70)}% ${rand(40,90)}% ${rand(10,60)}% / 
             ${rand(30,80)}% ${rand(20,70)}% ${rand(40,90)}% ${rand(10,60)}%`;
    }

    let left = Math.random() * 100;
    let top  = Math.random() * 100;

    let fixed = clampPosition(left, top, size);

    drop.style.left = fixed.left + "%";
    drop.style.top  = fixed.top + "%";

    bg.appendChild(drop);
}

function createBloodCluster(bg, maxClusterSize) {
    const clusterSize = 3 + Math.floor(Math.random() * maxClusterSize);
    const baseX = Math.random() * 90 + 5;
    const baseY = Math.random() * 90 + 5;

    for (let i = 0; i < clusterSize; i++) {
        const drop = document.createElement("div");
        drop.className = "blood-drop";

        const size = 10 + Math.random() * 80;
        drop.style.width = size + "px";
        drop.style.height = size + "px";

        const shapeType = Math.random();

        if (shapeType < 0.40) drop.style.borderRadius = "50%";
        else if (shapeType < 0.80)
            drop.style.borderRadius =
                `${50 + rand(-20,20)}% ${50 + rand(-20,20)}% ` +
                `${50 + rand(-20,20)}% ${50 + rand(-20,20)}%`;
        else
            drop.style.borderRadius =
                `${rand(30,80)}% ${rand(20,70)}% ${rand(40,90)}% ${rand(10,60)}% / 
                 ${rand(30,80)}% ${rand(20,70)}% ${rand(40,90)}% ${rand(10,60)}%`;

        let left = baseX + (Math.random() - 0.5) * 15;
        let top  = baseY + (Math.random() - 0.5) * 15;

        let fixed = clampPosition(left, top, size);

        drop.style.left = fixed.left + "%";
        drop.style.top  = fixed.top + "%";

        bg.appendChild(drop);
    }
}

function createBlood(bg) {
    const singleDrops = 20;
    const clusters = 6;
    const maxClusterSize = 6;

    for (let i = 0; i < singleDrops; i++) createSingleBloodDrop(bg);
    for (let i = 0; i < clusters; i++) createBloodCluster(bg, maxClusterSize);
}


function createThoughtBubbles(bg) {
    const count = 12;
    const cols = 4;
    const rows = 3;
    let index = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            if (index >= count) break;
            index++;

            const img = document.createElement("img");
            img.src = Math.random() < 0.5 ? "img/thought.png" : "img/thought2.png";
            img.className = "thought-bubble";

            const size = 80 + Math.random() * 120;
            img.style.width = size + "px";

            const cellW = 100 / cols;
            const cellH = 100 / rows;

            const jitterX = (Math.random() * 30) - 15;
            const jitterY = (Math.random() * 30) - 15;

            let left = c * cellW + cellW / 2 + jitterX;
            let top  = r * cellH + cellH / 2 + jitterY;

            let fixed = clampPosition(left, top, size);

            img.style.left = fixed.left + "%";
            img.style.top  = fixed.top + "%";

            bg.appendChild(img);
        }
    }
}


function createDialogBalloons(bg) {
    const count = 12;
    const cols = 4;
    const rows = 3;
    let index = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            if (index >= count) break;
            index++;

            const img = document.createElement("img");
            img.src = Math.random() < 0.5 ? "img/dialog.png" : "img/dialog2.png";
            img.className = "dialog-balloon";

            const size = 100 + Math.random() * 100;
            img.style.width = size + "px";

            const cellW = 100 / cols;
            const cellH = 100 / rows;

            const jitterX = (Math.random() * 20) - 10;
            const jitterY = (Math.random() * 20) - 10;

            let left = c * cellW + cellW / 2 + jitterX;
            let top  = r * cellH + cellH / 2 + jitterY;

            let fixed = clampPosition(left, top, size);

            img.style.left = fixed.left + "%";
            img.style.top  = fixed.top + "%";

            bg.appendChild(img);
        }
    }
}


function createClock(bg) {
    createClocks(bg);
}

function createClocks(bg) {

    const count = 12;
    const cols = 4;
    const rows = 3;
    let index = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            if (index >= count) break;
            index++;

            const wrapper = document.createElement("div");
            wrapper.className = "clock-bubble";

            const size = 140 + Math.random() * 80;
            wrapper.style.width = size + "px";
            wrapper.style.height = size + "px";

            const cellW = 100 / cols;
            const cellH = 100 / rows;

            const jitterX = (Math.random() * 20) - 10;
            const jitterY = (Math.random() * 20) - 10;

            let left = c * cellW + cellW / 2 + jitterX;
            let top  = r * cellH + cellH / 2 + jitterY;

            let fixed = clampPosition(left, top, size);

            wrapper.style.left = fixed.left + "%";
            wrapper.style.top  = fixed.top + "%";

            const face = document.createElement("img");
            face.src = "img/clock-face.png";
            face.style.width = "100%";
            wrapper.appendChild(face);

            const hour = document.createElement("img");
            hour.src = "img/hour.png";
            hour.className = "clock-hand-mini clock-hour";
            wrapper.appendChild(hour);

            const minute = document.createElement("img");
            minute.src = "img/minute.png";
            minute.className = "clock-hand-mini clock-minute";
            wrapper.appendChild(minute);

            animateMiniClock(hour, minute, wrapper);

            bg.appendChild(wrapper);
        }
    }
}

function animateMiniClock(hourHand, minuteHand, wrapper) {

    let minuteRotation = 0;
    let hourRotation = 0;

    let minuteSpeed = 2;
    let hourSpeed = 0.8;

    function tick() {

        minuteRotation = (minuteRotation + minuteSpeed) % 360;
        hourRotation = (hourRotation + hourSpeed) % 360;

        minuteHand.style.transform =
            `translate(-50%, -90%) rotate(${minuteRotation}deg)`;

        hourHand.style.transform =
            `translate(-50%, -90%) rotate(${hourRotation}deg)`;

        requestAnimationFrame(tick);
    }

    tick();

    wrapper.addEventListener("mouseenter", () => {
        minuteSpeed = -2;
        hourSpeed = -0.8;
    });

    wrapper.addEventListener("mouseleave", () => {
        minuteSpeed = 2;
        hourSpeed = 0.8;
    });
}

function playSoundQ5(e) {
    const value = e.target.value;
    const som = sonsQ5[value];

    if (!som) return;

    // para qualquer som que esteja a tocar
    stopAllSoundsQ5();

    // toca apenas o som da opção atual
    som.play();
}


function stopAllSoundsQ5() {
    Object.values(sonsQ5).forEach(som => {
        som.pause();
        som.currentTime = 0;
    });
}

