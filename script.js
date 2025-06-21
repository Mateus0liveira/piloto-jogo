// =================================================================
// =================== ESTADO GLOBAL E VARIÁVEIS ===================
// =================================================================

console.log("script.js carregado!"); // Adicionado para depuração

let loggedInUsername = null; // Armazena o usuário que fez login
let registeredEmailForVerification = null; // REMOVIDO: Não necessário nesta versão

// Variáveis do Jogo
let player1Name = "";
let player2Name = "";
let numRounds = 0;
let currentRound = 0;
let player1Score = 0;
let player2Score = 0;
let currentPlayerTurn = "";
let availableChallenges = []; // Mantenha aqui uma cópia profunda para não esgotar os desafios originais
let selectedCategoryName = "";
let activeCategoryFilter = null; // Armazena a categoria(s) a ser(em) filtrada(s) na tela de seleção.
let currentScreenId = 'loginScreen'; // Variável para armazenar a tela atual
let previousScreenId = 'loginScreen'; // Armazena a tela anterior para "voltar"

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
        "Qual a coisa más louca que vocês já fizeram juntos?",
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
        "Descreva em detalhes o que você más gosta no corpo do seu parceiro.",
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
const confirmLogoutScreen = document.getElementById('confirmLogoutScreen');

// REMOVIDAS as referências para a tela de verificação
// const verifyAccountScreen = document.getElementById('verifyAccountScreen');
// const verificationEmailDisplay = document.getElementById('verificationEmailDisplay');
// const verificationCodeInput = document.getElementById('verificationCode');
// const submitVerificationCodeBtn = document.getElementById('submitVerificationCodeBtn');
// const resendVerificationCodeLink = document.getElementById('resendVerificationCodeLink');
// const backToLoginFromVerify = document.getElementById('backToLoginFromVerify');


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

// Referências aos IDs dos botões da barra de navegação
const navItemInicio = document.getElementById('navItemInicio');
const navItemAmigos = document.getElementById('navItemAmigos');
const navItemCasal = document.getElementById('navItemCasal');
const navItemPicanteHot = document.getElementById('navItemPicanteHot');
const navItemSair = document.getElementById('navItemSair');

// Referências aos botões da tela de confirmação
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

// NOVO: URL base do seu backend (ajuste para a sua URL real no Render)
const BACKEND_BASE_URL = 'https://piloto-jogo-backend.onrender.com';

// =================================================================
// =================== FUNÇÕES PRINCIPAIS ==========================
// =================================================================

// Esconde todas as telas e mostra apenas a desejada, ATUALIZANDO a navegação
function showScreen(screenId) {
    // Salva a tela anterior antes de mudar para a nova
    if (currentScreenId !== screenId) { // Só atualiza se realmente for mudar de tela
        previousScreenId = currentScreenId;
    }
    currentScreenId = screenId; // Atualiza a tela atual no estado global

    // Definir quais telas não exigem login
    const publicScreens = ['loginScreen', 'registerScreen', 'confirmLogoutScreen']; // 'verifyAccountScreen' REMOVIDA

    // Se o usuário não está logado e a tela não é pública, redirecionar para o login
    if (!loggedInUsername && !publicScreens.includes(screenId)) {
        console.warn(`Tentativa de acesso à tela '${screenId}' sem login. Redirecionando para loginScreen.`);
        screenId = 'loginScreen'; // Redireciona para a tela de login
    }

    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Mostra a tela desejada
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
        activeScreen.classList.add('active');
    }

    // --- LÓGICA PARA ATUALIZAR A BARRA DE NAVEGAÇÃO ---
    // Somente atualiza a barra de navegação se o usuário estiver logado E não estiver em telas públicas (incluindo confirmação)
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (loggedInUsername && !publicScreens.includes(screenId)) {
        switch (screenId) {
            case 'categorySelectionScreen':
                navItemInicio.classList.add('active');
                break;
            case 'configScreen':
            case 'gameScreen':
            case 'resultScreen':
                // Ativa o botão da categoria correspondente ao jogo ativo, se aplicável
                if (selectedCategoryName === 'amigos') {
                    navItemAmigos.classList.add('active');
                } else if (selectedCategoryName === 'conexao') {
                    navItemCasal.classList.add('active');
                } else if (selectedCategoryName === 'hot' || selectedCategoryName === 'picante') {
                    navItemPicanteHot.classList.add('active');
                }
                break;
        }
    }

    // --- LÓGICA PARA FILTRAR BOTÕES DE CATEGORIA ---
    if (screenId === 'categorySelectionScreen') {
        applyCategoryFilter();
    } else {
        // Limpa o filtro quando sai da tela de seleção de categoria
        activeCategoryFilter = null;
        categoryButtons.forEach(button => button.classList.remove('hidden'));
    }

    // REMOVIDO: Lógica para atualizar o e-mail na tela de verificação, pois a tela foi removida.
}

// Função para aplicar o filtro visual nos botões de categoria
function applyCategoryFilter() {
    categoryButtons.forEach(button => {
        const category = button.dataset.category;

        // Se houver um filtro ativo e o botão não corresponder, esconda-o
        if (activeCategoryFilter && !activeCategoryFilter.includes(category)) {
            button.classList.add('hidden');
        } else {
            button.classList.remove('hidden');
        }
    });
}


async function handleLogin() {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!username || !password) {
        alert("Por favor, preencha usuário e senha.");
        return;
    }
    try {
        // Usa a constante BACKEND_BASE_URL
        const response = await fetch(`${BACKEND_BASE_URL}api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok) {
            loggedInUsername = result.username;
            localStorage.setItem('loggedInUsername', loggedInUsername); // Salva no localStorage
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
        // Usa a constante BACKEND_BASE_URL
        const response = await fetch(`${BACKEND_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok) {
            alert("Conta criada com sucesso! Você já pode fazer login."); // Mensagem revertida
            showScreen('loginScreen'); // Redireciona para login
        } else {
            // Se o backend retornou erros de validação
            if (result.errors && Array.isArray(result.errors)) {
                const errorMessages = result.errors.map(err => err.msg).join('\n');
                alert(`Erros de validação:\n${errorMessages}`);
            } else if (result.error) { // Garante que a mensagem de erro geral seja exibida
                alert(`Erro: ${result.error}`);
            } else {
                alert("Ocorreu um erro desconhecido ao registrar o usuário.");
            }
        }
    } catch (error) {
        alert("Não foi possível conectar ao servidor.");
    }
}

// REMOVIDA: Funções handleSubmitVerificationCode e handleResendVerificationCode
// REMOVIDO: Event listeners para a tela de verificação


async function updateCategoryButtons() {
    if (!loggedInUsername) return;
    try {
        // Usa a constante BACKEND_BASE_URL
        const response = await fetch(`${BACKEND_BASE_URL}/api/access/${loggedInUsername}`);
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
        // Aplica o filtro após atualizar os botões
        applyCategoryFilter();
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
    localStorage.removeItem('loggedInUsername'); // Remove do localStorage
    localStorage.removeItem('gameState'); // Remove o estado do jogo ao deslogar
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";
    showScreen('loginScreen');
}

function saveGameState() {
    const gameState = {
        player1Name,
        player2Name,
        numRounds,
        currentRound,
        player1Score,
        player2Score,
        currentPlayerTurn,
        availableChallenges,
        selectedCategoryName,
        timeLeft,
        currentScreenId, // Salva a tela atual
        challengeText: challengeTextP.textContent // Salva o texto do desafio atual
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);

        // Recupera as variáveis do estado
        player1Name = gameState.player1Name;
        player2Name = gameState.player2Name;
        numRounds = gameState.numRounds;
        currentRound = gameState.currentRound;
        player1Score = gameState.player1Score;
        player2Score = gameState.player2Score;
        currentPlayerTurn = gameState.currentPlayerTurn;
        availableChallenges = gameState.availableChallenges;
        selectedCategoryName = gameState.selectedCategoryName;
        timeLeft = gameState.timeLeft;
        currentScreenId = gameState.currentScreenId;

        // Atualiza a UI com os dados recuperados
        player1NameInput.value = player1Name;
        player2NameInput.value = player2Name;
        numRoundsInput.value = numRounds;
        player1ScoreNameSpan.textContent = player1Name;
        player2ScoreNameSpan.textContent = player2Name;
        player1ScoreSpan.textContent = player1Score;
        player2ScoreSpan.textContent = player2Score;
        currentRoundSpan.textContent = currentRound;
        totalRoundsSpan.textContent = numRounds;
        playerTurnPillSpan.textContent = `Vez de: ${currentPlayerTurn}`;
        challengeTextP.textContent = gameState.challengeText || "Recuperando desafio..."; // Recupera o desafio atual

        updateProgressBar();

        // Volta para a tela correta e reinicia o timer se estava no jogo
        if (currentScreenId === 'gameScreen') {
            showScreen('gameScreen');
            startTimer(); // Reinicia o timer da rodada
        } else if (loggedInUsername) {
            // Se estava em outra tela logada (config, result, categorySelection)
            showScreen(currentScreenId);
            updateCategoryButtons(); // Garante botões de categoria corretos
        } else {
            // Caso o loggedInUsername não esteja setado (mesmo com gameState salvo)
            showScreen('loginScreen');
        }
        return true; // Indica que um estado foi carregado
    }
    return false; // Indica que nenhum estado foi carregado
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
    saveGameState(); // Salva o estado inicial do jogo
}

function startNextRound() {
    clearInterval(timerInterval);
    currentRound++;
    if (currentRound > numRounds) {
        showResultScreen();
        // Ao final do jogo, o estado salvo pode ser limpo
        localStorage.removeItem('gameState');
        return;
    }
    currentPlayerTurn = (currentRound % 2 !== 0) ? player1Name : player2Name;
    currentRoundSpan.textContent = currentRound;
    totalRoundsSpan.textContent = numRounds;
    player1ScoreSpan.textContent = player1Score;
    player2ScoreSpan.textContent = player2Score;
    playerTurnPillSpan.textContent = `Vez de: ${currentPlayerTurn}`;

    // Certifique-se de que availableChallenges seja sempre uma cópia fresca da categoria selecionada
    // Se o jogo está começando do zero, reinicia a lista completa de desafios da categoria
    if (currentRound === 1 || !availableChallenges || availableChallenges.length === 0) {
        availableChallenges = [...DESAFIOS_CATEGORIAS[selectedCategoryName]]; // Recarrega se for a primeira rodada ou se a lista esgotou
    }

    if (availableChallenges.length === 0) {
        challengeTextP.textContent = "Não há mais desafios disponíveis para esta categoria!";
        // Caso todos os desafios tenham sido usados, termina o jogo ou redireciona
        showResultScreen();
        return;
    } else {
        const randomIndex = Math.floor(Math.random() * availableChallenges.length);
        challengeTextP.textContent = availableChallenges[randomIndex];
        availableChallenges.splice(randomIndex, 1);
    }
    updateProgressBar();
    startTimer();
    saveGameState(); // Salva o estado após cada nova rodada
}

function startTimer() {
    // Garante que qualquer temporizador anterior seja limpo antes de iniciar um novo
    clearInterval(timerInterval);

    // Se estiver carregando de um estado salvo, timeLeft já terá o valor correto.
    // Caso contrário (se o jogo acabou de começar ou foi resetado), reinicia para CHALLENGE_TIME.
    if (currentScreenId !== 'gameScreen' || typeof timeLeft === 'undefined' || timeLeft === null || timeLeft <= 0) {
        timeLeft = CHALLENGE_TIME;
    }
    timerSecondsSpan.textContent = `${timeLeft}s`; // Atualiza a exibição imediatamente

    timerInterval = setInterval(updateTimer, 1000);
    completeChallengeBtn.disabled = false;
    passChallengeBtn.disabled = false;
}

function updateTimer() {
    timeLeft--;
    timerSecondsSpan.textContent = `${timeLeft}s`;
    saveGameState(); // Salva o estado do timer a cada segundo
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        // Automaticamente passa para a próxima rodada se o tempo acabar
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
    saveGameState(); // Salva o estado antes de passar para a próxima rodada
    startNextRound();
}

function handlePassChallenge() {
    clearInterval(timerInterval);
    saveGameState(); // Salva o estado antes de passar para a próxima rodada
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
    // Ao final do jogo, o estado salvo pode ser limpo
    localStorage.removeItem('gameState');
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
    activeCategoryFilter = null; // Limpa o filtro ao jogar novamente
    showScreen('categorySelectionScreen');
    updateCategoryButtons();
});

// --- FUNCIONALIDADES ATUALIZADAS PARA A BARRA DE NAVEGAÇÃO INFERIOR ---

navItemInicio.addEventListener('click', () => {
    activeCategoryFilter = null; // Limpa qualquer filtro ativo
    showScreen('categorySelectionScreen');
    if (loggedInUsername) { // Adicionado: só atualiza botões se logado
        updateCategoryButtons();
    }
});

navItemAmigos.addEventListener('click', () => {
    if (!loggedInUsername) { // Verifica se está logado
        showScreen('loginScreen'); // Redireciona para login se não estiver
        return;
    }
    // Define o filtro para a tela de seleção de categoria
    activeCategoryFilter = ['amigos'];
    showScreen('categorySelectionScreen'); // Vai para a tela de seleção de categoria
    updateCategoryButtons(); // Atualiza botões e aplica filtro
});

navItemCasal.addEventListener('click', () => {
    if (!loggedInUsername) { // Verifica se está logado
        showScreen('loginScreen'); // Redireciona para login se não estiver
        return;
    }
    // Define o filtro para a tela de seleção de categoria
    activeCategoryFilter = ['conexao']; // 'conexao' é a categoria para 'Casal'
    showScreen('categorySelectionScreen'); // Vai para a tela de seleção de categoria
    updateCategoryButtons(); // Atualiza botões e aplica filtro
});

navItemPicanteHot.addEventListener('click', () => {
    if (!loggedInUsername) { // Verifica se está logado
        showScreen('loginScreen'); // Redireciona para login se não estiver
        return;
    }
    // Define o filtro para a tela de seleção de categoria (pode ser 'hot' ou 'picante')
    activeCategoryFilter = ['hot', 'picante'];
    showScreen('categorySelectionScreen'); // Vai para a tela de seleção de categoria
    updateCategoryButtons(); // Atualiza botões e aplica filtro
});


navItemSair.addEventListener('click', () => {
    // Para o cronômetro se estiver rodando
    clearInterval(timerInterval);
    showScreen('confirmLogoutScreen'); // Mostra a tela de confirmação
});

confirmLogoutBtn.addEventListener('click', logoutAndGoToStart); // Confirma a saída
cancelLogoutBtn.addEventListener('click', () => {
    showScreen(previousScreenId); // Volta para a tela anterior
    // Se a tela anterior era gameScreen, reinicia o timer com o tempo salvo
    if (previousScreenId === 'gameScreen') {
        startTimer();
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // Primeiro tenta carregar o usuário logado
    loggedInUsername = localStorage.getItem('loggedInUsername');

    // Se o usuário está logado, tenta carregar o estado do jogo
    if (loggedInUsername) {
        const loaded = loadGameState(); // Tenta carregar o estado do jogo
        if (!loaded) {
            // Se não houver estado de jogo salvo, mas o usuário está logado,
            // vai para a tela de seleção de categoria como padrão
            showScreen('categorySelectionScreen');
            updateCategoryButtons(); // Atualiza o estado dos botões de categoria e aplica o filtro
        }
    } else {
        // Se não houver usuário logado, vai para a tela de login
        showScreen('loginScreen');
    }
});