// =================================================================
// =================== ESTADO GLOBAL E VARIÁVEIS ===================
// =================================================================

let loggedInUsername = null; // Armazena o usuário que fez login

// Variáveis do Jogo
let player1Name = "";
let player2Name = "";
let numRounds = 0;
let currentRound = 0;
let player1Score = 0;
let player2Score = 0;
let currentPlayerTurn = "";
let availableChallenges = [];
let selectedCategoryName = "";

// Variáveis do Temporizador
let timerInterval;
let timeLeft;
const CHALLENGE_TIME = 30;

const DESAFIOS_CATEGORIAS = {
    conexao: [
        "Compartilhe uma memória favorita que vocês têm juntos.",
        "Descreva o que você mais admira no seu parceiro.",
        "Qual o maior sonho um do outro? (Tente adivinhar se for o caso!)",
        "Conte algo que você aprendeu sobre si mesmo através do relacionamento de vocês.",
        "Se pudessem viajar para qualquer lugar do mundo agora, para onde iriam e por quê?",
        "Qual a primeira impressão que você teve do seu parceiro?",
        "Qual o seu passatempo favorito para fazerem juntos?",
        "Se tivessem um dia totalmente livre, como vocês o passariam?",
        "O que o amor significa para você?",
        "Complete a frase: 'Eu te amo porque...' (com algo específico)",
    ],
    amigos: [
        "Conte a história mais engraçada que já aconteceu com vocês ou um amigo em comum.",
        "Qual a coisa mais louca que vocês já fizeram juntos?",
        "Compartilhe um 'mico' seu que seu parceiro presenciou.",
        "Se pudessem ser personagens de um filme, qual seria e quem seriam?",
        "Qual o plano más divertido que vocês já fizeram com amigos?",
        "Quem é o más bagunceiro da casa? (Com bom humor!)",
        "Qual a sua música preferida para dançarem juntos (ou com amigos)?",
        "Imitem um ao outro por 30 segundos, sem falar.",
        "Inventem um 'aperto de mão' secreto só de vocês.",
        "Qual foi a maior aventura que já viveram?",
    ],
    hot: [
        "Dê 3 beijos em qualquer parte do corpo do seu parceiro que ele escolher.",
        "Faça uma massagem sensual nas costas do seu parceiro por 2 minutos.",
        "Descreva em detalhes o que você mais gosta no corpo do seu parceiro.",
        "Vende os olhos do seu parceiro e beije 3 partes diferentes do corpo dele. Ele deve adivinhar quais são.",
        "Dance uma música sexy para o seu parceiro.",
        "Cochiche algo picante no ouvido do seu parceiro.",
        "Qual a fantasia más 'hot' que você tem e gostaria de compartilhar?",
        "Se pudessem estar em qualquer lugar romântico do mundo agora, onde estariam e o que fariam?",
        "Qual o seu ponto más sensível? (Compartilhe e receba carinho!)",
        "Escrevam juntos uma 'lista de desejos' picantes para o futuro.",
    ],
    picante: [
        "Tire uma peça de roupa à sua escolha ou passe a vez.",
        "Faça cócegas no seu parceiro por 30 segundos sem ele rir ou passar a vez.",
        "Descreva o corpo do seu parceiro usando apenas adjetivos positivos por 1 minuto sem repetir palavras.",
        "Responda 3 perguntas íntimas que seu parceiro fizer, sem hesitar.",
        "Dê um apelido carinhoso novo para o seu parceiro e explique o porquê.",
        "O que você faria se tivesse 5 minutos totalmente sozinho com seu parceiro (sem interrupções)?",
        "Qual a última coisa que te deixou com 'borboletas no estômago' no relacionamento de vocês?",
        "Proponha um desafio ousado para seu parceiro cumprir antes da próxima rodada.",
        "Troquem de roupas por uma peça, cada um escolhe a do outro e usem por 5 minutos.",
        "Qual é a sua 'guilty pleasure' (prazer culposo) que você nunca contou?",
    ]
};

// =================================================================
// =================== REFERÊNCIAS AOS ELEMENTOS DOM =================
// =================================================================

const loginScreen = document.getElementById('loginScreen');
const registerScreen = document.getElementById('registerScreen');
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const registerUsernameInput = document.getElementById('registerUsername');
const registerPasswordInput = document.getElementById('registerPassword');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');

const categorySelectionScreen = document.getElementById('categorySelectionScreen');
const configScreen = document.getElementById('configScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');

const categoryButtons = document.querySelectorAll('.category-btn');
const player1NameInput = document.getElementById('player1Name');
const player2NameInput = document.getElementById('player2Name');
const numRoundsInput = document.getElementById('numRounds');
const startGameBtn = document.getElementById('startGameBtn');
const challengeTextP = document.getElementById('challengeText');
const completeChallengeBtn = document.getElementById('completeChallengeBtn');
const passChallengeBtn = document.getElementById('passChallengeBtn');
const timerSecondsSpan = document.getElementById('timerSeconds');
const playerTurnPillSpan = document.getElementById('playerTurnPill');
const progressBarFill = document.getElementById('progressBarFill');
const currentRoundSpan = document.getElementById('currentRound');
const totalRoundsSpan = document.getElementById('totalRounds');
const player1ScoreNameSpan = document.getElementById('player1ScoreName');
const player1ScoreSpan = document.getElementById('player1Score');
const player2ScoreNameSpan = document.getElementById('player2ScoreName');
const player2ScoreSpan = document.getElementById('player2Score');
const finalPlayer1NameSpan = document.getElementById('finalPlayer1Name');
const finalPlayer1ScoreSpan = document.getElementById('finalPlayer1Score');
const finalPlayer2NameSpan = document.getElementById('finalPlayer2Name');
const finalPlayer2ScoreSpan = document.getElementById('finalPlayer2Score');
const winnerMessageP = document.getElementById('winnerMessage');
const playAgainBtn = document.getElementById('playAgainBtn');
const navItemInicio = document.getElementById('navItemInicio');
const navItemPosicoes = document.getElementById('navItemPosicoes');
const navItemPerguntas = document.getElementById('navItemPerguntas');
const navItemDesafios = document.getElementById('navItemDesafios');
const navItemSair = document.getElementById('navItemSair');

// =================================================================
// =================== FUNÇÕES PRINCIPAIS ==========================
// =================================================================

// Esconde todas as telas e mostra apenas a desejada, ATUALIZANDO a navegação
function showScreen(screenId) {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Mostra a tela desejada
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
        activeScreen.classList.add('active');
    }

    // --- LÓGICA PARA ATUALIZAR A BARRA DE NAVEGAÇÃO ---

    // 1. Primeiro, remove a classe 'active' de todos os itens da navegação
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // 2. Depois, adiciona a classe 'active' apenas ao item correto
    switch (screenId) {
        case 'categorySelectionScreen':
            navItemInicio.classList.add('active');
            break;
        case 'configScreen':
        case 'gameScreen':
        case 'resultScreen':
            navItemDesafios.classList.add('active');
            break;
        // Adicione outros casos aqui para futuras telas (Posições, Perguntas, etc.)
        // Por exemplo:
        // case 'posicoesScreen':
        //     navItemPosicoes.classList.add('active');
        //     break;
    }
}

async function handleLogin() {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!username || !password) {
        alert("Por favor, preencha usuário e senha.");
        return;
    }
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok) {
            loggedInUsername = result.username;
            showScreen('categorySelectionScreen');
            updateCategoryButtons();
        } else {
            alert(`Erro: ${result.error}`);
        }
    } catch (error) {
        alert("Não foi possível conectar ao servidor. Verifique se ele está rodando.");
    }
}

async function handleRegister() {
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value.trim();
    if (!username || !password) {
        alert("Por favor, preencha um novo usuário e senha.");
        return;
    }
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok) {
            alert("Conta criada com sucesso! Por favor, faça o login.");
            showScreen('loginScreen');
        } else {
            alert(`Erro: ${result.error}`);
        }
    } catch (error) {
        alert("Não foi possível conectar ao servidor.");
    }
}

async function updateCategoryButtons() {
    if (!loggedInUsername) return;
    try {
        const response = await fetch(`http://localhost:3000/api/access/${loggedInUsername}`);
        if (!response.ok) throw new Error('Usuário não encontrado ou sem permissões.');
        const userAccess = await response.json();
        categoryButtons.forEach(button => {
            const category = button.dataset.category;
            button.classList.remove('locked');
            const existingIcon = button.querySelector('.lock-icon');
            if (existingIcon) existingIcon.remove();
            if (!userAccess[category]) {
                button.classList.add('locked');
                const lockIcon = document.createElement('i');
                lockIcon.className = 'fas fa-lock lock-icon';
                button.appendChild(lockIcon);
            }
        });
    } catch (error) {
        console.error('Falha ao buscar permissões:', error);
        categoryButtons.forEach(button => button.classList.add('locked'));
    }
}

function selectCategory(event) {
    const button = event.target.closest('.category-btn');
    if (!button) return;
    if (button.classList.contains('locked')) {
        alert("Você precisa adquirir este pacote para jogar!");
        return;
    }
    selectedCategoryName = button.dataset.category;
    availableChallenges = [...DESAFIOS_CATEGORIAS[selectedCategoryName]];
    showScreen('configScreen');
}

function logoutAndGoToStart() {
    loggedInUsername = null;
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";
    showScreen('loginScreen');
}

function startGame() {
    player1Name = player1NameInput.value.trim();
    player2Name = player2NameInput.value.trim();
    numRounds = parseInt(numRoundsInput.value);
    if (!player1Name || !player2Name) {
        alert("Por favor, preencha o nome de ambos os jogadores.");
        return;
    }
    if (isNaN(numRounds) || numRounds <= 0) {
        alert("Por favor, digite um número válido de rodadas.");
        return;
    }
    currentRound = 0;
    player1Score = 0;
    player2Score = 0;
    player1ScoreNameSpan.textContent = player1Name;
    player2ScoreNameSpan.textContent = player2Name;
    showScreen('gameScreen');
    startNextRound();
}

function startNextRound() {
    clearInterval(timerInterval);
    currentRound++;
    if (currentRound > numRounds) {
        showResultScreen();
        return;
    }
    currentPlayerTurn = (currentRound % 2 !== 0) ? player1Name : player2Name;
    currentRoundSpan.textContent = currentRound;
    totalRoundsSpan.textContent = numRounds;
    player1ScoreSpan.textContent = player1Score;
    player2ScoreSpan.textContent = player2Score;
    playerTurnPillSpan.textContent = `Vez de: ${currentPlayerTurn}`;
    if (availableChallenges.length === 0) {
        challengeTextP.textContent = "Não há mais desafios disponíveis!";
    } else {
        const randomIndex = Math.floor(Math.random() * availableChallenges.length);
        challengeTextP.textContent = availableChallenges[randomIndex];
        availableChallenges.splice(randomIndex, 1);
    }
    updateProgressBar();
    startTimer();
}

function startTimer() {
    timeLeft = CHALLENGE_TIME;
    timerSecondsSpan.textContent = `${timeLeft}s`;
    timerInterval = setInterval(updateTimer, 1000);
    completeChallengeBtn.disabled = false;
    passChallengeBtn.disabled = false;
}

function updateTimer() {
    timeLeft--;
    timerSecondsSpan.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        startNextRound();
    }
}

function updateProgressBar() {
    const progressPercentage = numRounds > 0 ? (currentRound / numRounds) * 100 : 0;
    progressBarFill.style.width = `${progressPercentage}%`;
}

function handleCompleteChallenge() {
    clearInterval(timerInterval);
    if (currentPlayerTurn === player1Name) player1Score++;
    else player2Score++;
    startNextRound();
}

function handlePassChallenge() {
    clearInterval(timerInterval);
    startNextRound();
}

function showResultScreen() {
    clearInterval(timerInterval);
    showScreen('resultScreen');
    finalPlayer1NameSpan.textContent = player1Name;
    finalPlayer1ScoreSpan.textContent = player1Score;
    finalPlayer2NameSpan.textContent = player2Name;
    finalPlayer2ScoreSpan.textContent = player2Score;
    if (player1Score > player2Score) {
        winnerMessageP.textContent = `Parabéns, ${player1Name}! Você venceu!`;
    } else if (player2Score > player1Score) {
        winnerMessageP.textContent = `Parabéns, ${player2Name}! Você venceu!`;
    } else {
        winnerMessageP.textContent = "O jogo terminou em empate!";
    }
}

// =================================================================
// =================== EVENT LISTENERS =============================
// =================================================================

loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('registerScreen');
});
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('loginScreen');
});

categoryButtons.forEach(button => button.addEventListener('click', selectCategory));
startGameBtn.addEventListener('click', startGame);
completeChallengeBtn.addEventListener('click', handleCompleteChallenge);
passChallengeBtn.addEventListener('click', handlePassChallenge);
playAgainBtn.addEventListener('click', () => {
    showScreen('categorySelectionScreen');
    updateCategoryButtons();
});

navItemInicio.addEventListener('click', logoutAndGoToStart);
navItemPosicoes.addEventListener('click', logoutAndGoToStart);
navItemPerguntas.addEventListener('click', logoutAndGoToStart);
navItemDesafios.addEventListener('click', logoutAndGoToStart);
navItemSair.addEventListener('click', logoutAndGoToStart);

document.addEventListener('DOMContentLoaded', () => {
    showScreen('loginScreen');
});