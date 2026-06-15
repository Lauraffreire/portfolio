
function startQuiz() {
    localStorage.setItem("maryScore", "0");
    window.location.href = "pergunta1.html";
}

function nextQuestion(questionName, nextPage) {

    const selected = document.querySelector(
        `input[name="${questionName}"]:checked`
    );

    if (!selected) {
        alert("Escolhe uma opção antes de continuar.");
        return;
    }

    const value = parseInt(selected.value, 10) || 0;
    const current = parseInt(
        localStorage.getItem("maryScore") || "0",
        10
    );

    const updated = current + value;
    localStorage.setItem("maryScore", updated.toString());

    window.location.href = nextPage;
}
