const lanterna = document.getElementById("lanterna");
const grupo = document.getElementById("grupo-rotacao");
const cone = document.getElementById("cone");

const somLanterna = new Audio("som/clique.mp3");
somLanterna.volume = 1;

let luzAtiva = false;
let ratoSobre = false;

lanterna.addEventListener("click", () => {
    luzAtiva = !luzAtiva;
    cone.style.opacity = luzAtiva ? "0.7" : "0";

    somLanterna.currentTime = 0;
    somLanterna.play();
});

lanterna.addEventListener("mouseenter", () => ratoSobre = true);
lanterna.addEventListener("mouseleave", () => ratoSobre = false);

document.addEventListener("mousemove", (e) => {
    if (!ratoSobre) return;

    const rect = lanterna.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let ang = Math.atan2(e.clientY - cy, e.clientX - cx);
    ang = ang * 180 / Math.PI + 90;

    grupo.style.transform = `rotate(${ang}deg)`;
});
