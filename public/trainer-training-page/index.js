const questionP = document.querySelector('.question');
const answerInput = document.querySelector('.answer');
let currentAnswer = null;
let storedtype = null;
let time = 0;

setInterval(() => {
    time++;
}, 1000);

function generateQuestion(type, level) {
    const a = Math.floor(Math.random() * level) + 1;
    const b = Math.floor(Math.random() * level) + 1;

    switch (type) {
        case 'addition':
            storedtype = 'addition';
            return { question: `${a} + ${b}`, answer: a + b };
        case 'subtraction':
            storedtype = 'subtraction';
            return { question: `${a} - ${b}`, answer: a - b };
        case 'multiplication':
            storedtype = 'multiplication';
            return { question: `${a} × ${b}`, answer: a * b };
        case 'division':
            storedtype = 'division';
            const result = a * b;
            return { question: `${result} ÷ ${a}`, answer: b };
        default:
            return { question: `Неизвестный тип: ${type}`, answer: null };
    }
}
let currentquestion;
function start() {
    fetch('/questions')
        .then(response => response.json())
        .then(data => {
            const sorted = Object.entries(data).sort((a, b) => a[1] - b[1]);
            const [weakestType] = sorted[0];

            const { question, answer } = generateQuestion(weakestType, data[weakestType]);
            currentquestion = question;

            questionP.textContent = question;
            currentAnswer = answer;
        })
        .catch(error => console.error('Ошибка получения данных:', error));
}

answerInput.addEventListener('input', () => {
    const userAnswer = parseFloat(answerInput.value);
    if (userAnswer === currentAnswer) {
        correct_audio.play(); // Play correct answer sound
        
        console.log('Sending feedback with time:', time);

        fetch('/questions-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: storedtype,
                time: time,
                question: currentquestion
            })
        })
        .then(res => res.text())
        .then(text => console.log(text))
        .catch(err => console.error(err));

        answerInput.value = '';
        start();
        time = 0;

        answerInput.style.border = '5px solid limegreen';
        setTimeout(() => {
            answerInput.style.border = '';
        }, 500);
    }
});

start();
