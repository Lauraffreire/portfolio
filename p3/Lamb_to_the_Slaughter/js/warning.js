(() => {
    const mq = window.matchMedia("(max-width: 850px)");
    const audios = new Set();

    function applyMute() {
        const mute = mq.matches;

        document.querySelectorAll("audio, video").forEach(el => {
            el.muted = mute;
        });

        audios.forEach(a => {
            a.muted = mute;
        });
    }

    const NativeAudio = window.Audio;
    window.Audio = function (...args) {
        const a = new NativeAudio(...args);
        audios.add(a);

        a.muted = mq.matches;
        return a;
    };
    window.Audio.prototype = NativeAudio.prototype;

    applyMute();
    mq.addEventListener("change", applyMute);
    document.addEventListener("DOMContentLoaded", applyMute);
})();
