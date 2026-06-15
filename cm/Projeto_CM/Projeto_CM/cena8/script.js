//controla o jogo da memoria, vidas, vitoria e derrota
"use strict";

const CARDS = [
  'images/carta1.png','images/carta2.png','images/carta3.png',
  'images/carta4.png','images/carta5.png','images/carta6.png',
];


const BACK_PATTERN = [
  'images/cartafrente.png',
  'images/cartafrente2.png',
  'images/cartafrente.png',
  'images/cartafrente2.png',
  'images/cartafrente2.png',
  'images/cartafrente.png',
  'images/cartafrente2.png',
  'images/cartafrente.png',
  'images/cartafrente.png',
  'images/cartafrente2.png',
  'images/cartafrente.png',
  'images/cartafrente2.png',
];

const MAX_LIVES  = 3;
const FLIP_DELAY = 950;
const CARD_FLIP_SOUND_URL = new URL(
  '../som/memoria_carta.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;
const SPLASH_SOUND_URL = new URL(
  '../som/splash.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;
const TENSION_SOUND_URL = new URL(
  '../som/tensao.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;
const QUEEN_SCREAM_SOUND_URL = new URL(
  '../som/gritar.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;
const ERROR_SOUND_URL = new URL(
  '../som/error.mp3',
  document.currentScript ? document.currentScript.src : window.location.href
).href;

let lives = MAX_LIVES, pairs = 0, flipped = [], locked = false, dead = false;
let returningToTitle = false;

const board       = document.getElementById('board');
const winScreen   = document.getElementById('win-screen');
const deathScreen = document.getElementById('death-screen');
const dOverlay    = document.getElementById('death-overlay');
const dQueen      = document.getElementById('death-queen');
const dText       = document.getElementById('death-text');
const dSplash     = document.getElementById('death-splash');
const hearts      = [
  document.getElementById('h0'),
  document.getElementById('h1'),
  document.getElementById('h2'),
];

buildBoard();

function playCardFlipSound() {
  const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === 'function'
    ? window.parent.playPreloadedSound(CARD_FLIP_SOUND_URL, { volume: 1 })
    : new Audio(CARD_FLIP_SOUND_URL);

  sound.volume = 1;
  if (!sound.paused) return;
  sound.play().catch(() => {

  });
}

function playSplashSound() {
  const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === 'function'
    ? window.parent.playPreloadedSound(SPLASH_SOUND_URL, { volume: 0.8 })
    : new Audio(SPLASH_SOUND_URL);

  sound.volume = 0.8;
  if (!sound.paused) return;
  sound.play().catch(() => {

  });
}

function playTensionSound() {
  const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === 'function'
    ? window.parent.playPreloadedSound(TENSION_SOUND_URL, { volume: 0.85 })
    : new Audio(TENSION_SOUND_URL);

  sound.volume = 0.85;
  if (!sound.paused) return;
  sound.play().catch(() => {

  });
}

function playQueenScreamSound() {
  const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === 'function'
    ? window.parent.playPreloadedSound(QUEEN_SCREAM_SOUND_URL, { volume: 0.9 })
    : new Audio(QUEEN_SCREAM_SOUND_URL);

  sound.volume = 0.9;
  if (!sound.paused) return;
  sound.play().catch(() => {

  });
}

function playErrorSound() {
  const sound = window.parent && window.parent !== window && typeof window.parent.playPreloadedSound === 'function'
    ? window.parent.playPreloadedSound(ERROR_SOUND_URL, { volume: 0.8 })
    : new Audio(ERROR_SOUND_URL);

  sound.volume = 0.8;
  if (!sound.paused) return;
  sound.play().catch(() => {

  });
}

//constroi o tabuleiro do jogo da memoria
function buildBoard() {
  board.innerHTML = '';
  shuffle([...CARDS, ...CARDS]).forEach((src, i) => {
    board.appendChild(makeCard(src, BACK_PATTERN[i]));
  });
}

//cria uma carta com frente e verso
function makeCard(front, back) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.img = front;
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back"><img src="${back}" draggable="false"></div>
      <div class="card-face card-front"><img src="${front}" draggable="false"></div>
    </div>`;
  card.addEventListener('click', () => onClick(card));
  return card;
}

//gere a selecao de cartas pelo jogador
function onClick(card) {
  if (locked || dead) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');
  playCardFlipSound();
  flipped.push(card);
  if (flipped.length === 2) { locked = true; setTimeout(check, FLIP_DELAY); }
}

//verifica se as duas cartas viradas formam par
function check() {
  const [a, b] = flipped;
  if (a.dataset.img === b.dataset.img) {
    a.classList.add('matched');
    b.classList.add('matched');
    pairs++;
    flipped = []; locked = false;
    if (pairs === CARDS.length) setTimeout(() => winScreen.classList.add('active'), 500);
  } else {
    a.classList.add('shake'); b.classList.add('shake');
    playErrorSound();
    setTimeout(() => {
      a.classList.remove('flipped','shake');
      b.classList.remove('flipped','shake');
      flipped = []; locked = false;
      loseLife();
    }, 620);
  }
}

//remove uma vida e dispara derrota se chegar a zero
function loseLife() {
  lives--;
  if (hearts[lives]) hearts[lives].classList.add('lost');
  if (lives <= 0) {
    dead = true;
    playTensionSound();
    setTimeout(triggerDeath, 350);
  }
}

//mostra a sequencia de derrota
function triggerDeath() {

  document.querySelectorAll('.card').forEach(c => {
    c.classList.remove('flipped','matched','shake');
  });

  deathScreen.classList.add('active');


  setTimeout(() => {
    playQueenScreamSound();
    dOverlay.classList.add('show');
    dQueen.classList.add('show');
    dText.classList.add('show');
  }, 80);


  setTimeout(() => {
    playSplashSound();
    dSplash.classList.add('show');
    dSplash.addEventListener('animationend', returnToTunnelFromSplash, { once: true });
    setTimeout(returnToTunnelFromSplash, 2300);
  }, 1900);
}

//avisa a pagina principal para regressar ao tunel
function returnToTunnelFromSplash() {
  if (returningToTitle) return;
  returningToTitle = true;
  window.parent.postMessage({ type: 'memory-return-tunnel' }, '*');
}

//reinicia o jogo da memoria
function restart() {
  lives = MAX_LIVES; pairs = 0; flipped = []; locked = false; dead = false;
  returningToTitle = false;
  hearts.forEach(h => h.classList.remove('lost'));
  winScreen.classList.remove('active');
  deathScreen.classList.remove('active');
  dOverlay.classList.remove('show');
  dQueen.classList.remove('show');
  dText.classList.remove('show');
  dSplash.classList.remove('show');


  buildBoard();
}

function shuffle(a) {
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
