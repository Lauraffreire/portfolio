//guarda a configuracao das cenas, catalogos de imagens e templates embebidos
const SCENE_COUNT = 10;
const gardenCardAssets = ["cena7/c1.png", "cena7/c2.png", "cena7/c3.png", "cena7/c4.png"];

const imageCatalog = {
    "cena0/introducao/fundo1.png": {
        width: 3316,
        height: 1644,
        alt: "Moldura ornamental da cena de titulo."
    },
    "cena0/introducao/titulo.svg": {
        width: 1085,
        height: 499,
        alt: "Titulo Alice in Wonderland."
    },
    "cena1/imagens/candeeiro.png": {
        width: 1024,
        height: 1024,
        alt: "Candeeiro ilustrado."
    },
    "cena1/imagens/cena 1.jpg": {
        width: 2392,
        height: 12897,
        alt: "Ilustracao vertical longa da cena de abertura."
    },
    "cena1/imagens/mesa_redonda.png": {
        width: 2706,
        height: 2614,
        alt: "Mesa redonda de madeira."
    },
    "cena1/imagens/vermelho1.png": {
        width: 540,
        height: 540,
        alt: "Livro vermelho fechado."
    },
    "cena1/imagens/verde1.png": {
        width: 590,
        height: 590,
        alt: "Livro verde fechado."
    },
    "cena1/imagens/verde2.png": {
        width: 771,
        height: 386,
        alt: "Livro verde aberto."
    },
    "cena1/imagens/castanho1.png": {
        width: 550,
        height: 550,
        alt: "Livro castanho fechado."
    },
    "cena1/imagens/castanho2.png": {
        width: 796,
        height: 398,
        alt: "Livro castanho aberto."
    },
    "cena1/imagens/prateleira.png": {
        width: 794,
        height: 1016,
        alt: "Estante de madeira inclinada."
    },
    "cena1/imagens/jarro.png": {
        width: 453,
        height: 920,
        alt: "Jarro decorativo."
    },
    "cena1/imagens/jarro1.png": {
        width: 652,
        height: 827,
        alt: "Jarro decorativo."
    },
    "cena1/imagens/planta.png": {
        width: 571,
        height: 713,
        alt: "Planta decorativa."
    },
    "cena1/imagens/relogiog1.png": {
        width: 620,
        height: 1836,
        alt: "Relogio alto de madeira."
    },
    "cena1/imagens/espelho.png": {
        width: 2436,
        height: 1125,
        alt: "Espelho dourado inclinado."
    },
    "cena1/imagens/prateleira_parede.png": {
        width: 805,
        height: 964,
        alt: "Prateleira de parede."
    },
    "cena1/imagens/vela.png": {
        width: 750,
        height: 994,
        alt: "Vela acesa."
    },
    "cena1/imagens/vela1.png": {
        width: 750,
        height: 994,
        alt: "Vela apagada."
    },
    "cena1/imagens/cadeira.png": {
        width: 1679,
        height: 2111,
        alt: "Cadeira decorativa."
    },
    "cena1/imagens/horas.png": {
        width: 455,
        height: 455,
        alt: "Ponteiro das horas."
    },
    "cena1/imagens/minutos.png": {
        width: 427,
        height: 427,
        alt: "Ponteiro dos minutos."
    },
    "cena1/imagens/segundos.png": {
        width: 481,
        height: 481,
        alt: "Ponteiro dos segundos."
    },
    "cena1/imagens/azul1.png": {
        width: 544,
        height: 544,
        alt: "Livro azul fechado."
    },
    "cena1/imagens/azul2.png": {
        width: 823,
        height: 411,
        alt: "Livro azul aberto."
    },
    "cena1/imagens/pedra1.png": {
        width: 272,
        height: 342,
        alt: "Pedra pequena."
    },
    "cena1/imagens/pedra2.png": {
        width: 549,
        height: 379,
        alt: "Pedra achatada."
    },
    "cena1/imagens/pedra3.png": {
        width: 269,
        height: 241,
        alt: "Pedra irregular pequena."
    },
    "cena1/imagens/pedra4.png": {
        width: 258,
        height: 454,
        alt: "Pedra vertical."
    },
    "cena1/imagens/pedra5.png": {
        width: 212,
        height: 294,
        alt: "Pedra pequena arredondada."
    },
    "cena1/imagens/relogio.png": {
        width: 1024,
        height: 1536,
        alt: "Relogio de bolso dourado."
    },
    "cena2/porta1.png": {
        width: 1536,
        height: 1024,
        alt: "Sala com uma porta verde centrada, preparada para a transicao para a cena seguinte."
    },
    "cena2/cena portas-02.png": {
        width: 3509,
        height: 2482,
        alt: "A primeira porta abriu e revelou uma porta azul."
    },
    "cena2/cena portas-03.png": {
        width: 3509,
        height: 2481,
        alt: "A segunda porta abriu e revelou uma porta vermelha."
    },
    "cena2/cena portas-05.png": {
        width: 3509,
        height: 2481,
        alt: "Uma pequena porta amarela apareceu no interior."
    },
    "cena2/cena portas-06.png": {
        width: 3509,
        height: 2482,
        alt: "As portas abriram em cascata e sobra uma porta final."
    },
    "cena3_4/cena floresta.png": {
        width: 8854,
        height: 3054,
        alt: "Clareira ilustrada com plantas e flores."
    },
    "cena7/cena7jardim.svg": {
        width: 893.76,
        height: 603.32,
        alt: "Jardim ilustrado com rosas por pintar."
    },
    "cena7/cena7jardim.png": {
        width: 893,
        height: 603,
        alt: "Jardim ilustrado."
    }
};

const porta1Presentation = {
    scale: 1.70,
    translateY: 5,
    shadeFilter: "brightness(0.84)"
};

const propCatalog = {
    "cena3_4/flor1.png": { width: 726, height: 805 },
    "cena3_4/flor2.png": { width: 733, height: 814 },
    "cena3_4/flor3.png": { width: 741, height: 806 },
    "cena3_4/flor4.png": { width: 682, height: 760 },
    "cena3_4/flor5.png": { width: 713, height: 735 },
    "cena3_4/flor6.png": { width: 798, height: 786 },
    "cena3_4/trompete.svg": { width: 205.95, height: 123.9 },
    "cena3_4/lagarto.svg": { width: 492.75, height: 441.04 }
};

const leftForestCast = [
    {
        asset: "cena3_4/flor6.png",
        x: 12.5,
        y: 56.3,
        width: 10.5,
        label: "Flor azul",
        sound: { frequency: 261.63, waveform: "triangle", decay: 0.34, attack: 0.014, bend: 0.9 }
    },
    {
        asset: "cena3_4/flor1.png",
        x: 22.6,
        y: 46.1,
        width: 10.2,
        label: "Flor laranja",
        sound: { frequency: 329.63, waveform: "triangle", decay: 0.32, attack: 0.012, bend: 0.88 }
    },
    {
        asset: "cena3_4/flor3.png",
        x: 32.6,
        y: 45.8,
        width: 10.2,
        label: "Flor rosa",
        sound: { frequency: 392, waveform: "sine", decay: 0.28, attack: 0.012, bend: 0.9 }
    },
    {
        asset: "cena3_4/flor2.png",
        x: 42.7,
        y: 56.1,
        width: 10.0,
        label: "Flor lilas",
        sound: { frequency: 523.25, waveform: "triangle", decay: 0.3, attack: 0.01, bend: 0.92 }
    },
    {
        asset: "cena3_4/flor5.png",
        x: 23.7,
        y: 68.2,
        width: 10.8,
        label: "Flor vermelha",
        sound: { frequency: 293.66, waveform: "square", decay: 0.24, attack: 0.008, bend: 0.84 }
    },
    {
        asset: "cena3_4/flor4.png",
        x: 33.5,
        y: 68.3,
        width: 10.0,
        label: "Flor roxa escura",
        sound: { frequency: 349.23, waveform: "square", decay: 0.22, attack: 0.008, bend: 0.83 }
    },
    {
        asset: "cena3_4/trompete.svg",
        x: 10.2,
        y: 73.2,
        width: 9.4,
        label: "Trompete",
        idleTransform: "scale(0.95)",
        pressedAsset: "cena3_4/trompete2.png",
        pressedTransform: "translateX(8%) scaleX(-1) scale(1.25)",
        soundFile: "../som/trompete.mp3",
        holdPressedUntilSoundEnds: true,
        sound: { frequency: 196, waveform: "sawtooth", decay: 0.42, attack: 0.016, bend: 1.04 }
    }
];

const rightForestCast = [
    ...leftForestCast
];

const doorSequence = [
    {
        asset: "cena2/porta1.png",
        instruction: "Clica na porta verde para abrir a primeira passagem.",
        hotspotLabel: "Abrir a porta verde",
        scale: porta1Presentation.scale,
        translateY: porta1Presentation.translateY,
        filter: porta1Presentation.shadeFilter,
        hotspot: {
            left: 40.6,
            top: 18.8,
            width: 19.2,
            height: 58.8,
            radius: "44% 44% 10% 10% / 22% 22% 6% 6%"
        }
    },
    {
        asset: "cena2/cena portas-02.png",
        instruction: "Atravessa a segunda porta clicando na porta azul.",
        hotspotLabel: "Abrir a porta azul",
        hotspot: {
            left: 45.2,
            top: 26.8,
            width: 15.1,
            height: 53.5,
            radius: "46% 46% 8% 8% / 22% 22% 6% 6%"
        }
    },
    {
        asset: "cena2/cena portas-03.png",
        instruction: "Continua na porta vermelha que apareceu ao centro.",
        hotspotLabel: "Abrir a porta vermelha",
        hotspot: {
            left: 47.1,
            top: 35.2,
            width: 10.7,
            height: 40.6,
            radius: "10% 10% 6% 6%"
        }
    },
    {
        asset: "cena2/cena portas-05.png",
        instruction: "Agora a porta certa e a pequena porta amarela.",
        hotspotLabel: "Abrir a porta amarela",
        hotspot: {
            left: 47.2,
            top: 56.2,
            width: 5.8,
            height: 18.1,
            radius: "34% 34% 10% 10% / 22% 22% 8% 8%"
        }
    },
    {
        asset: "cena2/cena portas-06.png",
        backdropSceneId: 5,
        transitionOnScroll: true,
        transitionFocus: {
            x: 49.8,
            y: 68.9
        },
        transitionZoomScale: 8.4,
        transitionScrollDistanceMultiplier: 1.9,
        transitionFadeOutStart: 0.8,
        instruction: "Faz scroll para entrares na ultima porta e seguires para a cena seguinte.",
        hotspotLabel: "Entrar na ultima porta",
        hotspot: {
            left: 50.1,
            top: 56.1,
            width: 4.8,
            height: 17.3,
            radius: "34% 34% 10% 10% / 22% 22% 8% 8%"
        }
    }
];


const scenes = [
    {
        id: 1,
        kind: "title-screen",
        badge: "Titulo",
        title: "Titulo",
        summary: "A cena de titulo abre em fullscreen, aproxima-se com o scroll e liga diretamente ao tunel.",
        palette: {
            accent: "#d7b45f",
            accentSoft: "#4d2933",
            glow: "rgba(215, 180, 95, 0.24)"
        },
        screenTag: "Cena 0",
        screenTitle: "Alice in Wonderland",
        frameAsset: "cena0/introducao/fundo1.png",
        titleAsset: "cena0/introducao/titulo.svg",
        backgroundColor: "#2c1446",
        fadeOutStartTotal: 0.55,
        fadeOutEndTotal: 0.80,
        autoAdvanceZoomProgress: 0.92,
        instruction: "Faz scroll para aproximar o titulo.",
        transitionInstruction: "Continua a fazer scroll para fundires o titulo com o tunel.",
        titleLayout: {
            anchorViewportWidthRatio: 0.8,
            anchorMaxWidth: 820,
            frameScale: 1.28,
            titleWidthRatio: 0.7,
            titleTopPercent: 50,
            titleLeftPercent: 50,
            titleTranslateXPercent: -50,
            titleTranslateYPercent: -54
        },
        zoom: {
            scrollDistanceMultiplier: 3,
            focusX: 0.29,
            focusY: 0.68,
            maxScale: 94
        },
        transition: {
            nextSceneId: 2,
            scrollDistanceMultiplier: 1.2,
            fadeOutStart: 0,
            fadeOutEnd: 0.28,
            fadeInStart: 0,
            fadeInEnd: 0.72,
            veilStart: 0.0,
            veilPeak: 0.28,
            veilEnd: 1.0,
            maxVeilOpacity: 1
        }
    },
    {
        id: 2,
        kind: "canvas-tunnel",
        badge: "Túnel",
        title: "Túnel",
        summary: "Túnel animado em canvas. Scroll para avançar. Fade a preto e transição para a imagem do túnel.",
        palette: {
            accent: "#bc9af0",
            accentSoft: "#090016",
            glow: "rgba(188, 154, 240, 0.24)"
        },
        instruction: "Faz scroll para avançares pelo túnel.",
        tunnelScript: "tunel/tunel.js",
        fadeInDuration: 200,
        nextSceneId: 3
    },
    {
        id: 3,
        kind: "vertical-scroll",
        badge: "Tunel",
        title: "Tunel",
        summary: "A imagem do tunel desce com o scroll e termina numa porta invertida que roda para te deixar na entrada das portas.",
        palette: {
            accent: "#d47d58",
            accentSoft: "#2b140f",
            glow: "rgba(212, 125, 88, 0.28)"
        },
        asset: "cena1/imagens/cena 1.jpg",
        transitionAsset: "cena2/porta1.png",
        transitionBackdropAsset: null,
        transitionInstruction: "Primeiro a porta invertida ocupa o ecra todo; continua a fazer scroll para so depois ela rodar.",
        transitionRevealDistanceMultiplier: 1,
        transitionRotationDistanceMultiplier: 1.15,
        transitionZoomStart: porta1Presentation.scale,
        transitionZoomEnd: porta1Presentation.scale,
        transitionTranslateYStart: porta1Presentation.translateY,
        transitionTranslateYEnd: porta1Presentation.translateY,
        transitionFilter: porta1Presentation.shadeFilter,
        transitionSeamShadeStart: 0.05,
        transitionSeamShadePeak: 0.22,
        transitionSeamShadeEnd: 0.44,
        transitionSeamShadeHeightMultiplier: 0.26,
        tunnelAmbientSound: {
            maxVolume: 0.58,
            fadeOutStart: 0,
            fadeOutEnd: 0.3
        },
        clockTickSound: {
            itemId: "relogio-alto",
            maxVolume: 0.46,
            fadeInStartViewportY: 1.38,
            fullVolumeViewportY: 0.94,
            fadeOutEndViewportY: -0.18
        },
        pocketClockSound: {
            itemId: "relogio-bolso",
            maxVolume: 0.5,
            fadeInStartViewportY: 1.3,
            fullVolumeViewportY: 0.9,
            fadeOutEndViewportY: -0.18
        },
        instruction: "Faz scroll para desceres pelo tunel. No fim, a sala da cena 3 entra invertida e so depois comeca a rodar.",
        floatingItems: [
            {
                id: "pedra-topo-1",
                asset: "cena1/imagens/pedra1.png",
                left: 4.2,
                top: 4.8,
                width: 6.8,
                rotation: -12,
                zIndex: 1,
                parallaxFactor: 0.24
            },
            {
                id: "pedra-topo-2",
                asset: "cena1/imagens/pedra2.png",
                left: 16.8,
                top: 24.2,
                width: 8.7,
                rotation: 14,
                zIndex: 1,
                parallaxFactor: 0.46
            },
            {
                id: "pedra-topo-3",
                asset: "cena1/imagens/pedra3.png",
                left: 31.2,
                top: 9.4,
                width: 5.4,
                rotation: 7,
                zIndex: 1,
                parallaxFactor: 0.28
            },
            {
                id: "pedra-topo-4",
                asset: "cena1/imagens/pedra3.png",
                left: 59.4,
                top: 28.8,
                width: 6.1,
                rotation: -8,
                zIndex: 1,
                parallaxFactor: 0.62
            },
            {
                id: "pedra-topo-5",
                asset: "cena1/imagens/pedra4.png",
                left: 77.6,
                top: 5.1,
                width: 6.9,
                rotation: 11,
                zIndex: 1,
                parallaxFactor: 0.36
            },
            {
                id: "pedra-topo-6",
                asset: "cena1/imagens/pedra5.png",
                left: 11.2,
                top: 12.1,
                width: 5.2,
                rotation: -22,
                zIndex: 1,
                parallaxFactor: 0.76
            },
            {
                id: "pedra-topo-7",
                asset: "cena1/imagens/pedra2.png",
                left: 69.8,
                top: 34.4,
                width: 7.9,
                rotation: -16,
                zIndex: 1,
                parallaxFactor: 0.3
            },
            {
                id: "pedra-topo-8",
                asset: "cena1/imagens/pedra5.png",
                left: 85.6,
                top: 14.4,
                width: 5.0,
                rotation: 18,
                zIndex: 4,
                parallaxFactor: 0.9
            },
            {
                id: "pedra-topo-9",
                asset: "cena1/imagens/pedra1.png",
                left: 24.6,
                top: 4.2,
                width: 6.3,
                rotation: 21,
                zIndex: 1,
                parallaxFactor: 0.26
            },
            {
                id: "pedra-topo-10",
                asset: "cena1/imagens/pedra4.png",
                left: 41.9,
                top: 31.0,
                width: 6.8,
                rotation: -17,
                zIndex: 1,
                parallaxFactor: 0.56
            },
            {
                id: "pedra-topo-11",
                asset: "cena1/imagens/pedra5.png",
                left: 50.8,
                top: 42.1,
                width: 5.5,
                rotation: 13,
                zIndex: 1,
                parallaxFactor: 0.4
            },
            {
                id: "pedra-topo-12",
                asset: "cena1/imagens/pedra3.png",
                left: 90.7,
                top: 7.8,
                width: 5.6,
                rotation: -24,
                zIndex: 4,
                parallaxFactor: 0.86
            },
            {
                id: "pedra-topo-13",
                asset: "cena1/imagens/pedra2.png",
                left: 2.1,
                top: 13.6,
                width: 8.4,
                rotation: 9,
                zIndex: 1,
                parallaxFactor: 0.34
            },
            {
                id: "pedra-topo-14",
                asset: "cena1/imagens/pedra1.png",
                left: 34.7,
                top: 38.0,
                width: 5.8,
                rotation: -11,
                zIndex: 1,
                parallaxFactor: 0.7
            },
            {
                id: "pedra-topo-15",
                asset: "cena1/imagens/pedra4.png",
                left: 56.9,
                top: 3.9,
                width: 7.1,
                rotation: 15,
                zIndex: 1,
                parallaxFactor: 0.24
            },
            {
                id: "pedra-topo-16",
                asset: "cena1/imagens/pedra5.png",
                left: 79.8,
                top: 48.7,
                width: 5.3,
                rotation: -9,
                zIndex: 4,
                parallaxFactor: 0.84
            },
            {
                id: "pedra-topo-17",
                asset: "cena1/imagens/pedra3.png",
                left: 63.1,
                top: 15.8,
                width: 5.7,
                rotation: 26,
                zIndex: 4,
                parallaxFactor: 0.5
            },
            {
                id: "pedra-topo-18",
                asset: "cena1/imagens/pedra2.png",
                left: 44.5,
                top: 20.8,
                width: 9.2,
                rotation: -6,
                zIndex: 1,
                parallaxFactor: 0.78
            },
            {
                id: "mesa-topo",
                asset: "cena1/imagens/mesa_redonda.png",
                left: 9.5,
                top: 8.8,
                width: 34.8,
                rotation: -4,
                zIndex: 1,
                parallaxFactor: 0.94
            },
            {
                id: "candeeiro",
                asset: "cena1/imagens/candeeiro.png",
                anchorToItemId: "mesa-topo",
                anchorX: 0.47,
                anchorY: 0.09,
                selfAnchorX: 0.5,
                selfAnchorY: 1,
                widthRatioToItem: 0.45,
                rotation: -4,
                zIndex: 3,
                interactiveLabel: "Acender o candeeiro",
                activeInteractiveLabel: "Apagar o candeeiro"
            },
            {
                id: "livro-topo",
                asset: "cena1/imagens/verde1.png",
                closedAsset: "cena1/imagens/verde1.png",
                openAsset: "cena1/imagens/verde2.png",
                left: 75.6,
                top: 26.2,
                width: 14.6,
                openScale: 1.38,
                openLeftOffset: -1,
                openTopOffset: 0.45,
                rotation: 16,
                zIndex: 2,
                parallaxFactor: 1.04,
                interactiveLabel: "Abrir o livro verde",
                activeInteractiveLabel: "Fechar o livro verde"
            },
            {
                id: "estante-inclinada",
                asset: "cena1/imagens/prateleira.png",
                left: 60.8,
                top: 34.4,
                width: 24.8,
                rotation: -13,
                zIndex: 2,
                parallaxFactor: 0.98
            },
            {
                id: "planta-estante",
                asset: "cena1/imagens/planta.png",
                anchorToItemId: "estante-inclinada",
                anchorX: 0.56,
                anchorY: 0.385,
                selfAnchorX: 0.5,
                selfAnchorY: 0.74,
                widthRatioToItem: 0.17,
                rotation: -13,
                zIndex: 3
            },
            {
                id: "livro-aberto",
                asset: "cena1/imagens/castanho2.png",
                closedAsset: "cena1/imagens/castanho1.png",
                openAsset: "cena1/imagens/castanho2.png",
                startsOpen: true,
                left: 2.6,
                top: 36.8,
                width: 19.2,
                closedScale: 0.74,
                closedTopOffset: -1,
                openScale: 1.22,
                rotation: -18,
                zIndex: 2,
                parallaxFactor: 1.08,
                interactiveLabel: "Abrir o livro castanho",
                activeInteractiveLabel: "Fechar o livro castanho"
            },
            {
                id: "relogio-alto",
                asset: "cena1/imagens/relogiog1.png",
                alternateAssets: ["cena1/imagens/relogiog1.png", "cena1/imagens/relogiog2.png"],
                alternateIntervalMs: 1000,
                left: 10.4,
                top: 38.6,
                width: 18.8,
                rotation: 2,
                zIndex: 2,
                parallaxFactor: 0.92
            },
            {
                id: "espelho",
                asset: "cena1/imagens/espelho.png",
                left: 60.8,
                top: 50.5,
                width: 32.0,
                rotation: 9,
                zIndex: 2,
                parallaxFactor: 1.02
            },
            {
                id: "prateleira-baixa",
                asset: "cena1/imagens/prateleira_parede.png",
                left: 48.2,
                top: 65.8,
                width: 34.8,
                rotation: 6,
                zIndex: 1,
                parallaxFactor: 0.96
            },
            {
                id: "jarro-prateleira",
                asset: "cena1/imagens/jarro.png",
                anchorToItemId: "prateleira-baixa",
                anchorX: 0.24,
                anchorY: 0.82,
                selfAnchorX: 0.5,
                selfAnchorY: 1,
                widthRatioToItem: 0.14,
                rotation: 15,
                zIndex: 2
            },
            {
                id: "jarro1-prateleira",
                asset: "cena1/imagens/jarro1.png",
                anchorToItemId: "prateleira-baixa",
                anchorX: 0.43,
                anchorY: 0.84,
                selfAnchorX: 0.5,
                selfAnchorY: 1,
                widthRatioToItem: 0.17,
                offsetY: 4,
                rotation: 15,
                zIndex: 2
            },
            {
                id: "livro-prateleira",
                asset: "cena1/imagens/azul1.png",
                closedAsset: "cena1/imagens/azul1.png",
                openAsset: "cena1/imagens/azul2.png",
                left: 62.2,
                top: 88.6,
                width: 11.7,
                openScale: 1.52,
                openTopOffset: 0.55,
                rotation: 16,
                zIndex: 3,
                parallaxFactor: 1.1,
                interactiveLabel: "Abrir o livro azul",
                activeInteractiveLabel: "Fechar o livro azul"
            },
            {
                id: "relogio-bolso",
                asset: "cena1/imagens/relogio.png",
                left: 63.4,
                top: 65.2,
                width: 17.9,
                rotation: 8,
                rewindOnClick: true,
                rewindVelocity: -190,
                rewindDamping: 0.982,
                speedsHandsOnHover: true,
                hoverAudioPlaybackRate: 2.4,
                hoverGlow: true,
                zIndex: 2,
                parallaxFactor: 1.06
            },
            {
                id: "relogio-bolso-horas",
                asset: "cena1/imagens/horas.png",
                anchorToItemId: "relogio-bolso",
                anchorX: 0.398,
                anchorY: 0.563,
                spinOriginX: 1,
                spinOriginY: 1,
                widthRatioToItem: 0.15,
                rotation: 8,
                spinDurationMs: 21000,
                hoverSpinDurationMs: 7000,
                zIndex: 3
            },
            {
                id: "relogio-bolso-minutos",
                asset: "cena1/imagens/minutos.png",
                anchorToItemId: "relogio-bolso",
                anchorX: 0.398,
                anchorY: 0.563,
                spinOriginX: 0,
                spinOriginY: 1,
                widthRatioToItem: 0.15,
                rotation: 8,
                spinDurationMs: 9000,
                hoverSpinDurationMs: 3000,
                zIndex: 4
            },
            {
                id: "relogio-bolso-segundos",
                asset: "cena1/imagens/segundos.png",
                anchorToItemId: "relogio-bolso",
                anchorX: 0.398,
                anchorY: 0.563,
                spinOriginX: 1,
                spinOriginY: 0,
                widthRatioToItem: 0.15,
                rotation: 8,
                spinDurationMs: 3000,
                hoverSpinDurationMs: 1000,
                zIndex: 5
            },
            {
                id: "vela-baixa",
                asset: "cena1/imagens/vela.png",
                left: 35.8,
                top: 100.4,
                width: 9.2,
                rotation: -7,
                glow: {
                    anchorX: 0.53,
                    anchorY: 0.22,
                    radius: 1.55,
                    opacity: 0.46
                },
                extinguishGlowOnHover: true,
                extinguishedAsset: "cena1/imagens/vela1.png",
                relightDelayMs: 2000,
                zIndex: 3,
                parallaxFactor: 1.12
            },
            {
                id: "cadeira-fundo",
                asset: "cena1/imagens/cadeira.png",
                left: 75.8,
                top: 97.5,
                width: 24.5,
                rotation: 8,
                flipX: true,
                swingOnHover: true,
                hoverSound: "chair-ranger",
                hoverGlow: {
                    size: "0.55rem",
                    color: "rgba(255, 230, 166, 0.30)"
                },
                zIndex: 2,
                parallaxFactor: 1.08
            }
        ],
        lighting: {
            triggerItemId: "candeeiro",
            sceneFilterOff: "brightness(0.36) saturate(0.72) contrast(1.04)",
            sceneFilterOn: "",
            itemFilterOff: "brightness(0.28) saturate(0.62)",
            triggerItemFilterOff: "brightness(0.78) saturate(0.9)",
            itemFilterOn: "",
            glowAnchorX: 0.5,
            glowAnchorY: 0.24,
            glowOffsetX: 0,
            glowOffsetY: 0,
            glowCenterX: 20,
            glowCenterY: 23,
            glowRadius: 32,
            glowOpacity: 0.72,
            ambientOpacity: 0.24
        }
    },
    {
        id: 4,
        kind: "doors",
        badge: "Interativa",
        title: "Portas",
        summary: "Sequencia ja funcional: cada clique abre a proxima porta ate transitar para a cena seguinte.",
        palette: {
            accent: "#d7a13d",
            accentSoft: "#2b1d0b",
            glow: "rgba(215, 161, 61, 0.32)"
        }
    },
    {
        id: 5,
        kind: "forest-scroll",
        badge: "Floresta",
        title: "Floresta",
        summary: "A floresta entra em fullscreen e comeca pela metade esquerda da imagem.",
        palette: {
            accent: "#79ab60",
            accentSoft: "#111f13",
            glow: "rgba(121, 171, 96, 0.28)"
        },
        asset: "cena3_4/cena floresta.png",
        displayScale: 1,
        panStart: 0,
        panEnd: 0.5,
        instruction: "Faz scroll para o lado para a imagem deslizar para a direita.",
        horizontalScrollArrow: true,
        horizontalScrollArrowDelayMs: 4000,
        props: leftForestCast
    },
    {
        id: 6,
        kind: "forest-scroll",
        badge: "Floresta",
        title: "Floresta",
        summary: "Na zona do lagarto, o cursor solta fumo e a cena avanca passado alguns segundos.",
        palette: {
            accent: "#68b8b0",
            accentSoft: "#102021",
            glow: "rgba(104, 184, 176, 0.28)"
        },
        asset: "cena3_4/cena floresta.png",
        displayScale: 1,
        panStart: 0.5,
        panEnd: 1,
        instruction: "Faz scroll ate ao lado direito. Depois o fumo cobre a tela passados alguns segundos.",
        props: rightForestCast,
        smokeTransition: {
            nextSceneId: 7,
            activationProgress: 0.98,
            timedTransitionDelayMs: 3000,
            disableIdleCoverageTransition: true,
            idleDelayMs: 450,
            fillDurationMs: 2600,
            holdDurationMs: 200,
            emitIntervalMs: 110,
            idleCoverageGain: 0.018,
            movingCoverageGain: 0.0012,
            passiveCoverageCap: 1,
            maxPuffs: 42,
            revealDelayMs: 650,
            revealDurationMs: 900
        }
    },
    {
        id: 7,
        kind: "cheshire-scene",
        badge: "Floresta",
        title: "Gato de Cheshire",
        summary: "Clica nas placas para seguires o caminho do Gato de Cheshire.",
        palette: {
            accent: "#7ecba1",
            accentSoft: "#0d2a23",
            glow: "rgba(126, 203, 161, 0.24)"
        },
        forestAmbientVolume: 0.05,
        instruction: "Clica nas placas para avançar.",
        nextSceneId: 8
    },
    {
        id: 8,
        kind: "tea-table",
        badge: "Interativa",
        title: "Mesa de Cha",
        summary: "Arrasta objetos para a mesa. Coloca chavenas para abrir um portal para a proxima cena.",
        palette: {
            accent: "#c9a96e",
            accentSoft: "#2a1a0d",
            glow: "rgba(201, 169, 110, 0.28)"
        },
        forestAmbientVolume: 0.05
    },
    {
        id: 9,
        kind: "garden-paint",
        badge: "Jardim",
        title: "Jardim",
        summary: "Clica nas rosas para as pintar de vermelho.",
        palette: {
            accent: "#d64646",
            accentSoft: "#142013",
            glow: "rgba(214, 70, 70, 0.28)"
        },
        asset: "cena7/cena7jardim.svg",
        instruction: "Clica nas rosas. Quando todas estiverem vermelhas, surgem as cartas.",
        birdsAmbientVolume: 0.08,
        cardTransition: {
            assets: gardenCardAssets,
            nextSceneId: 10,
            spawnIntervalMs: 64,
            cardsPerBatch: 4,
            coverHoldDurationMs: 1800,
            revealIntervalMs: 56,
            revealBatchSize: 2,
            revealDurationMs: 360,
            backdropMaxOpacity: 0,
            cardWidthRatio: 0.34,
            cardMinWidth: 200,
            cardMaxWidth: 380,
            cardHeightRatio: 1.08,
            cardStepXRatio: 0.54,
            cardStepYRatio: 0.46,
            cardJitterXRatio: 0.18,
            cardJitterYRatio: 0.16
        }
    },
    {
        id: 10,
        kind: "memory-game",
        badge: "Jogo",
        title: "Jogo da Memoria",
        summary: "Encontra os pares de cartas. Tens 3 vidas.",
        palette: {
            accent: "#c04040",
            accentSoft: "#1a0808",
            glow: "rgba(192, 64, 64, 0.28)"
        }
    }
];

const CHESHIRE_SCENE_BODY = `
  <main class="scene-page">
    <div class="scene-stage" id="scene">
      <img class="scene-bg" src="images/cena5.png" alt="Floresta colorida com caminho ao centro.">
      <div class="cat-tree" id="cat-tree">
        <img src="images/gato3.png" alt="Gato de Cheshire no tronco" id="cat-tree-img">
      </div>
      <div class="cat-eyes" id="cat-eyes">
        <img src="olhos1.png" alt="Olhos do Gato de Cheshire" id="cat-eyes-img">
      </div>
      <div class="cat-floor" id="cat-floor">
        <img src="images/gato1.png" alt="Gato de Cheshire no chao" id="cat-floor-img">
      </div>
      <button class="sign sign-down" data-message="Down" aria-label="Placa Down"><img src="images/placa8.png" alt=""></button>
      <button class="sign sign-thisway" data-message="This Way" aria-label="Placa This Way"><img src="images/placa1.png" alt=""></button>
      <button class="sign sign-up" data-message="Up" aria-label="Placa Up"><img src="images/placa9.png" alt=""></button>
      <button class="sign sign-thatway" data-message="That Way" aria-label="Placa That Way"><img src="images/placa5.png" alt=""></button>
      <button class="sign sign-goback" data-message="Go Back" aria-label="Placa Go Back"><img src="images/placa2.png" alt=""></button>
      <button class="sign sign-yonder" data-message="Yonder" aria-label="Placa Yonder"><img src="images/placa3.png" alt=""></button>
    </div>
  </main>
`;

const TEA_TABLE_SCENE_BODY = `
  <div id="bg"><img src="imagens/fundo.jpg" alt=""></div>
  <div id="scene">
    <div id="sidebar">
      <div class="sidebar-label">Itens</div>
      <div class="item-slot" data-src="imagens/prato1.png" data-w="95" data-h="99"><img src="imagens/prato1.png" alt="Prato"><span>Prato</span></div>
      <div class="item-slot" data-src="imagens/prato2.png" data-w="95" data-h="99"><img src="imagens/prato2.png" alt="Pires"><span>Pires</span></div>
      <div class="item-slot" data-src="imagens/cafe2.png" data-w="95" data-h="77"><img src="imagens/cafe2.png" alt="Caneca"><span>Caneca</span></div>
      <div class="item-slot" data-src="imagens/cafe1.png" data-w="104" data-h="109"><img src="imagens/cafe1.png" alt="Chavena"><span>Chavena</span></div>
      <div class="item-slot" data-src="imagens/bule.png" data-w="108" data-h="95"><img src="imagens/bule.png" alt="Bule"><span>Bule</span></div>
      <div class="item-slot" data-src="imagens/fruta.png" data-w="88" data-h="110"><img src="imagens/fruta.png" alt="Fruta"><span>Fruta</span></div>
      <div class="item-slot" data-src="imagens/garfo.png" data-w="13" data-h="82"><img src="imagens/garfo.png" alt="Garfo"><span>Garfo</span></div>
      <div class="item-slot" data-src="imagens/faca.png" data-w="9" data-h="82"><img src="imagens/faca.png" alt="Faca"><span>Faca</span></div>
      <div class="item-slot" data-src="imagens/colher.png" data-w="18" data-h="82"><img src="imagens/colher.png" alt="Colher"><span>Colher</span></div>
    </div>
    <div id="canvas-area"></div>
  </div>
  <div id="portal-transition">
    <div id="portal-zoom">
      <img src="imagens/cena7jardim.svg" alt="Proxima cena">
    </div>
  </div>
  <div id="trash">X</div>
`;

const MEMORY_GAME_SCENE_BODY = `
  <div id="game-screen">
    <div id="board"></div>
  </div>
  <div id="hud">
    <span class="life-heart" id="h0"><img src="images/vida.png" alt="vida"></span>
    <span class="life-heart" id="h1"><img src="images/vida.png" alt="vida"></span>
    <span class="life-heart" id="h2"><img src="images/vida.png" alt="vida"></span>
  </div>
  <div id="win-screen">
    <h2>Vitoria!</h2>
    <button class="btn-restart" onclick="restart()">Jogar de Novo</button>
  </div>
  <div id="death-screen">
    <div id="death-overlay"></div>
    <img id="death-queen" src="images/rainha.png" alt="">
    <img id="death-text" src="images/letrabranca.png" alt="">
    <img id="death-splash" src="images/splash.png" alt="">
  </div>
`;
