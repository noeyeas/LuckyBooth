// ===== DOM 요소 =====
const nameInputArea = document.getElementById('name-input-area');
const playerNameInput = document.getElementById('player-name');
const btnStart = document.getElementById('btn-start');
const gameBox = document.getElementById('game-box');
const gameResult = document.getElementById('game-result');
const displayName = document.getElementById('display-name');
const roundDisplay = document.getElementById('round-display');
const reactionArea = document.getElementById('reaction-area');
const reactionMessage = document.getElementById('reaction-message');
const reactionClover = document.getElementById('reaction-clover');
const roundResults = document.getElementById('round-results');
const resultDetail = document.getElementById('result-detail');
const resultAvg = document.getElementById('result-avg');
const btnRetry = document.getElementById('btn-retry');
const rankingBody = document.getElementById('ranking-body');

// ===== 게임 설정 =====
const TOTAL_ROUNDS = 3;
const MIN_WAIT = 1500;  // 최소 대기 시간 (ms)
const MAX_WAIT = 5000;  // 최대 대기 시간 (ms)

// ===== 게임 상태 =====
let currentRound = 0;
let roundTimes = [];
let waitTimeout = null;
let cloverShownAt = 0;
let state = 'idle'; // idle, waiting, ready, result, early

// ===== 순위 저장 =====
const RANKING_KEY = 'luckyBooth_reaction_ranking';

function loadRanking() {
    const data = localStorage.getItem(RANKING_KEY);
    return data ? JSON.parse(data) : [];
}

function saveRanking(ranking) {
    localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
}

// ===== 이벤트 =====
btnStart.addEventListener('click', startGame);
btnRetry.addEventListener('click', retryGame);
reactionArea.addEventListener('click', handleReactionClick);
reactionArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleReactionClick();
});
playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startGame();
});

// ===== 게임 시작 =====
function startGame() {
    const name = playerNameInput.value.trim();
    if (!name) {
        playerNameInput.focus();
        playerNameInput.style.borderColor = '#ef4444';
        setTimeout(() => { playerNameInput.style.borderColor = '#bbf7d0'; }, 1000);
        return;
    }

    displayName.textContent = name;
    currentRound = 0;
    roundTimes = [];

    nameInputArea.classList.add('hidden');
    gameResult.classList.add('hidden');
    gameBox.classList.remove('hidden');

    updateRoundBadges();
    setIdle();
}

// ===== 다시 도전 =====
function retryGame() {
    gameResult.classList.add('hidden');
    nameInputArea.classList.remove('hidden');
    playerNameInput.focus();
}

// ===== 상태 전환 =====
function setIdle() {
    state = 'idle';
    reactionArea.className = 'reaction-area state-idle';
    reactionMessage.classList.remove('hidden');
    reactionClover.classList.add('hidden');
    reactionMessage.textContent = '클릭하면 시작합니다';
}

function setWaiting() {
    state = 'waiting';
    currentRound++;
    roundDisplay.textContent = currentRound;
    updateRoundBadges();

    reactionArea.className = 'reaction-area state-waiting';
    reactionMessage.classList.remove('hidden');
    reactionClover.classList.add('hidden');
    reactionMessage.textContent = '기다리세요...';

    // 랜덤 시간 후 클로버 표시
    const delay = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
    waitTimeout = setTimeout(() => {
        setReady();
    }, delay);
}

function setReady() {
    state = 'ready';
    cloverShownAt = performance.now();

    reactionArea.className = 'reaction-area state-ready';
    reactionMessage.classList.add('hidden');
    reactionClover.classList.remove('hidden');
}

function setEarly() {
    state = 'early';
    clearTimeout(waitTimeout);
    currentRound--; // 이번 라운드 무효

    reactionArea.className = 'reaction-area state-early';
    reactionMessage.classList.remove('hidden');
    reactionClover.classList.add('hidden');
    reactionMessage.innerHTML = '너무 빨리 눌렀어요!<br><span style="font-size:16px">클릭하면 다시 시도합니다</span>';
}

function setRoundResult(reactionTime) {
    state = 'result';
    roundTimes.push(reactionTime);
    updateRoundBadges();

    reactionArea.className = 'reaction-area state-result';
    reactionMessage.classList.remove('hidden');
    reactionClover.classList.add('hidden');

    const ms = Math.round(reactionTime);

    if (currentRound < TOTAL_ROUNDS) {
        reactionMessage.innerHTML = `<span style="font-size:48px;font-weight:800">${ms}ms</span><br><span style="font-size:16px">클릭하면 다음 라운드</span>`;
    } else {
        reactionMessage.innerHTML = `<span style="font-size:48px;font-weight:800">${ms}ms</span><br><span style="font-size:16px">클릭하면 결과 확인</span>`;
    }
}

// ===== 클릭 처리 =====
function handleReactionClick() {
    switch (state) {
        case 'idle':
        case 'early':
            setWaiting();
            break;

        case 'waiting':
            setEarly();
            break;

        case 'ready':
            const reactionTime = performance.now() - cloverShownAt;
            setRoundResult(reactionTime);
            break;

        case 'result':
            if (currentRound >= TOTAL_ROUNDS) {
                showFinalResult();
            } else {
                setWaiting();
            }
            break;
    }
}

// ===== 최종 결과 =====
function showFinalResult() {
    const avg = roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length;
    const avgRounded = Math.round(avg);

    const details = roundTimes.map((t, i) => `${i + 1}라운드: ${Math.round(t)}ms`).join(' / ');

    resultDetail.textContent = details;
    resultAvg.textContent = avgRounded;

    gameBox.classList.add('hidden');
    gameResult.classList.remove('hidden');

    addToRanking(displayName.textContent, avgRounded);
}

// ===== 라운드 뱃지 =====
function updateRoundBadges() {
    let html = '';
    for (let i = 1; i <= TOTAL_ROUNDS; i++) {
        if (i < currentRound || (i === currentRound && roundTimes.length >= i)) {
            const ms = Math.round(roundTimes[i - 1]);
            html += `<div class="round-badge done">R${i} ${ms}ms</div>`;
        } else if (i === currentRound) {
            html += `<div class="round-badge current">R${i}</div>`;
        } else {
            html += `<div class="round-badge pending">R${i}</div>`;
        }
    }
    roundResults.innerHTML = html;
}

// ===== 순위 관리 =====
function addToRanking(name, avgMs) {
    const ranking = loadRanking();
    ranking.push({ name, avgMs, date: new Date().toISOString() });
    ranking.sort((a, b) => a.avgMs - b.avgMs);
    if (ranking.length > 50) ranking.length = 50;
    saveRanking(ranking);
    renderRanking(name, avgMs);
}

function renderRanking(highlightName, highlightMs) {
    const ranking = loadRanking();

    if (ranking.length === 0) {
        rankingBody.innerHTML = '<tr><td colspan="3" class="empty-ranking">아직 기록이 없습니다. 첫 번째 도전자가 되어보세요!</td></tr>';
        return;
    }

    let html = '';
    const displayCount = Math.min(ranking.length, 20);
    let highlighted = false;

    for (let i = 0; i < displayCount; i++) {
        const entry = ranking[i];
        const rankDisplay = getRankDisplay(i + 1);
        const isHighlight = !highlighted && highlightName && entry.name === highlightName && entry.avgMs === highlightMs;
        if (isHighlight) highlighted = true;
        const rowClass = isHighlight ? 'highlight-row' : '';

        html += `<tr class="${rowClass}">
            <td>${rankDisplay}</td>
            <td>${escapeHtml(entry.name)}</td>
            <td>${entry.avgMs}ms</td>
        </tr>`;
    }

    rankingBody.innerHTML = html;

    if (highlightName) {
        const row = rankingBody.querySelector('.highlight-row');
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function getRankDisplay(rank) {
    switch (rank) {
        case 1: return '<span class="rank-medal">\uD83E\uDD47</span>';
        case 2: return '<span class="rank-medal">\uD83E\uDD48</span>';
        case 3: return '<span class="rank-medal">\uD83E\uDD49</span>';
        default: return rank;
    }
}

function resetRanking() {
    if (confirm('순위를 초기화하시겠습니까?')) {
        localStorage.removeItem(RANKING_KEY);
        renderRanking();
    }
}

// ===== 유틸리티 =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== 초기 로딩 =====
renderRanking();
