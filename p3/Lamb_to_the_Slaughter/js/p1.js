/*terminal*/
const terminal = document.getElementById("terminal");

const textLines = `
Pergunta 1 / 10

Descobres que o teu marido quer acabar tudo.
Qual é a tua primeira reação?


(para selecionar digite A)
Fico estranhamente calma… como se a notícia não me afetasse nada.

(para selecionar digite B)
Volto à minha rotina como se nada fosse.

(para selecionar digite C)
Tento compreender o que levou a isso.

(para selecionar digite D)
Afasto-me um momento para respirar.


> (pressione Enter para continuar)
`;

let index = 0;
let selectedValue = null;

// som de escrita
const typingSound = new Audio("som/typing.mp3");
typingSound.loop = true;
typingSound.volume = 0.6;

// cursor
const cursor = document.createElement("span");
cursor.classList.add("cursor");
cursor.textContent = " ";
terminal.appendChild(cursor);

// função de escrita
function typeText() {
    if (index === 0) {
        typingSound.play().catch(() => {});
    }

    if (index < textLines.length) {
        cursor.insertAdjacentText("beforebegin", textLines[index]);
        index++;
        setTimeout(typeText, 18);
    } else {
        typingSound.pause();
        typingSound.currentTime = 0;
    }
}

// inicia a escrita
typeText();

/*grágico*/
const canvas = document.getElementById("ecg");
const ctx = canvas.getContext("2d");

// som heartbeat contínuo
const heartbeat = new Audio("som/heartbeat.mp4");
heartbeat.loop = true;
heartbeat.volume = 0.8;

// toca automaticamente se a página foi carregada
heartbeat.play().catch(() => {});

// resize canvas
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ECG pattern
const beatPatternBase = [
    0,0,0,0,0,0,
    20,-20,
    -50,-70,
    35,180,220,
    0,-110,-220,-180,-140,-100,
    -50,0,50,-50,0,0,0,0,0
];

let beatPattern = [...beatPatternBase];
let xPos = 0;
let points = [];
let fps = 58;
const speed = 5;
let baseline = canvas.height / 2;
let lastFrame = 0;

// ajustar picos conforme opção
function updateECG(option) {
    switch (option) {
        case 0: beatPattern = beatPatternBase.map(v => v * 0.4); break;
        case 1: beatPattern = beatPatternBase.map(v => v * 0.7); break;
        case 5: beatPattern = beatPatternBase.map(v => v * 1.2); break;
        case 10: beatPattern = beatPatternBase.map(v => v * 1.5); break;
        default: beatPattern = [...beatPatternBase];
    }
}

// grid
function drawGrid() {
    const step = 20;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(47,44,27,0.7)';
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// animação
function animate(time) {
    const interval = 1000 / fps;
    if (time - lastFrame < interval) {
        requestAnimationFrame(animate);
        return;
    }
    lastFrame = time;

    if (xPos >= canvas.width) {
        xPos = 0;
        points = [];
        baseline = canvas.height / 2;
    }

    drawGrid();

    const i = points.length % beatPattern.length;
    const y = baseline + beatPattern[i];
    points.push({ x: xPos, y });

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let p = 1; p < points.length; p++) {
        ctx.lineTo(points[p].x, points[p].y);
    }
    ctx.strokeStyle = '#8d8664';
    ctx.lineWidth = 3;
    ctx.stroke();

    xPos += speed;
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

/*script*/
document.addEventListener("keydown", function (e) {
    const key = e.key.toLowerCase();

    if (key === "a") { selectedValue = 5; updateECG(5); }
    if (key === "b") { selectedValue = 10; updateECG(10); }
    if (key === "c") { selectedValue = 0; updateECG(0); }
    if (key === "d") { selectedValue = 1; updateECG(1); }

    if (e.key === "Enter") {
        if (selectedValue === null) {
            alert("Escolhe A, B, C ou D antes de continuar.");
            return;
        }

        localStorage.setItem("q1", selectedValue);
        const mary = parseInt(localStorage.getItem("maryScore") || "0");
        localStorage.setItem("maryScore", mary + selectedValue);

        window.location.href = "pergunta2.html";
    }
});

/*restart do aúdio*/

window.addEventListener("pageshow", () => {
    // heartbeat
    if (heartbeat.paused) heartbeat.play().catch(() => {});
    // typing sound
    if (index < textLines.length && typingSound.paused) typingSound.play().catch(() => {});
    // reinicia a escrita se ainda não acabou
    if (index < textLines.length) typeText();
});
