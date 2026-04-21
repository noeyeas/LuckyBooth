// ===== 게임 설정 =====
var TOTAL_ROUNDS = 3;
var MIN_WAIT = 1500;
var MAX_WAIT = 5000;

// ===== 게임 상태 =====
var currentRound = 0;
var roundTimes = [];
var waitTimeout = null;
var cloverShownAt = 0;
var state = 'idle';

// ===== 순위 저장 =====
var RANKING_KEY = 'luckyBooth_reaction_ranking';

function loadRanking() {
    try {
        var data = localStorage.getItem(RANKING_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveRanking(ranking) {
    localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
}

// ===== 게임 시작 =====
function startGame() {
    var input = document.getElementById('player-name');
    var name = input.value.trim();
    if (!name) {
        input.focus();
        input.style.borderColor = '#ef4444';
        setTimeout(function() { input.style.borderColor = '#bbf7d0'; }, 1000);
        return;
    }

    document.getElementById('display-name').textContent = name;
    currentRound = 0;
    roundTimes = [];

    document.getElementById('name-input-area').classList.add('hidden');
    document.getElementById('game-result').classList.add('hidden');
    document.getElementById('game-box').classList.remove('hidden');

    updateRoundBadges();
    setIdle();
}

// ===== 다시 도전 =====
function retryGame() {
    document.getElementById('game-result').classList.add('hidden');
    document.getElementById('name-input-area').classList.remove('hidden');
    document.getElementById('player-name').focus();
}

// ===== 상태 전환 =====
function setIdle() {
    state = 'idle';
    var area = document.getElementById('reaction-area');
    area.className = 'reaction-area state-idle';
    document.getElementById('reaction-message').classList.remove('hidden');
    document.getElementById('reaction-clover').classList.add('hidden');
    document.getElementById('reaction-message').textContent = '터치하면 시작합니다';
}

function setWaiting() {
    state = 'waiting';
    currentRound++;
    document.getElementById('round-display').textContent = currentRound;
    updateRoundBadges();

    var area = document.getElementById('reaction-area');
    area.className = 'reaction-area state-waiting';
    document.getElementById('reaction-message').classList.remove('hidden');
    document.getElementById('reaction-clover').classList.add('hidden');
    document.getElementById('reaction-message').textContent = '기다리세요...';

    var delay = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
    waitTimeout = setTimeout(function() {
        setReady();
    }, delay);
}

function setReady() {
    state = 'ready';
    cloverShownAt = performance.now();

    var area = document.getElementById('reaction-area');
    area.className = 'reaction-area state-ready';
    document.getElementById('reaction-message').classList.add('hidden');
    document.getElementById('reaction-clover').classList.remove('hidden');
}

function setEarly() {
    state = 'early';
    clearTimeout(waitTimeout);
    currentRound--;

    var area = document.getElementById('reaction-area');
    area.className = 'reaction-area state-early';
    document.getElementById('reaction-message').classList.remove('hidden');
    document.getElementById('reaction-clover').classList.add('hidden');
    document.getElementById('reaction-message').innerHTML = '너무 빨리 눌렀어요!<br><span style="font-size:16px">터치하면 다시 시도합니다</span>';
}

function setRoundResult(reactionTime) {
    state = 'result';
    roundTimes.push(reactionTime);
    updateRoundBadges();

    var area = document.getElementById('reaction-area');
    area.className = 'reaction-area state-result';
    document.getElementById('reaction-message').classList.remove('hidden');
    document.getElementById('reaction-clover').classList.add('hidden');

    var ms = Math.round(reactionTime);

    if (currentRound < TOTAL_ROUNDS) {
        document.getElementById('reaction-message').innerHTML = '<span style="font-size:48px;font-weight:800">' + ms + 'ms</span><br><span style="font-size:16px">터치하면 다음 라운드</span>';
    } else {
        document.getElementById('reaction-message').innerHTML = '<span style="font-size:48px;font-weight:800">' + ms + 'ms</span><br><span style="font-size:16px">터치하면 결과 확인</span>';
    }
}

// ===== 클릭/터치 처리 =====
function handleReactionClick() {
    if (state === 'idle' || state === 'early') {
        setWaiting();
    } else if (state === 'waiting') {
        setEarly();
    } else if (state === 'ready') {
        var reactionTime = performance.now() - cloverShownAt;
        setRoundResult(reactionTime);
    } else if (state === 'result') {
        if (currentRound >= TOTAL_ROUNDS) {
            showFinalResult();
        } else {
            setWaiting();
        }
    }
}

// ===== 최종 결과 =====
function showFinalResult() {
    var avg = 0;
    for (var i = 0; i < roundTimes.length; i++) avg += roundTimes[i];
    avg = avg / roundTimes.length;
    var avgRounded = Math.round(avg);

    var details = '';
    for (var i = 0; i < roundTimes.length; i++) {
        if (i > 0) details += ' / ';
        details += (i + 1) + '라운드: ' + Math.round(roundTimes[i]) + 'ms';
    }

    document.getElementById('result-detail').textContent = details;
    document.getElementById('result-avg').textContent = avgRounded;

    document.getElementById('game-box').classList.add('hidden');
    document.getElementById('game-result').classList.remove('hidden');

    addToRanking(document.getElementById('display-name').textContent, avgRounded);
}

// ===== 라운드 뱃지 =====
function updateRoundBadges() {
    var html = '';
    for (var i = 1; i <= TOTAL_ROUNDS; i++) {
        if (i < currentRound || (i === currentRound && roundTimes.length >= i)) {
            var ms = Math.round(roundTimes[i - 1]);
            html += '<div class="round-badge done">R' + i + ' ' + ms + 'ms</div>';
        } else if (i === currentRound) {
            html += '<div class="round-badge current">R' + i + '</div>';
        } else {
            html += '<div class="round-badge pending">R' + i + '</div>';
        }
    }
    document.getElementById('round-results').innerHTML = html;
}

// ===== 순위 관리 =====
function addToRanking(name, avgMs) {
    var ranking = loadRanking();
    ranking.push({ name: name, avgMs: avgMs, date: new Date().toISOString() });
    ranking.sort(function(a, b) { return a.avgMs - b.avgMs; });
    if (ranking.length > 50) ranking.length = 50;
    saveRanking(ranking);
    renderRanking(name, avgMs);
}

function renderRanking(highlightName, highlightMs) {
    var ranking = loadRanking();
    var rankingBody = document.getElementById('ranking-body');

    if (ranking.length === 0) {
        rankingBody.innerHTML = '<tr><td colspan="3" class="empty-ranking">아직 기록이 없습니다. 첫 번째 도전자가 되어보세요!</td></tr>';
        return;
    }

    var html = '';
    var displayCount = Math.min(ranking.length, 20);
    var highlighted = false;

    for (var i = 0; i < displayCount; i++) {
        var entry = ranking[i];
        var rankDisplay = getRankDisplay(i + 1);
        var isHighlight = !highlighted && highlightName && entry.name === highlightName && entry.avgMs === highlightMs;
        if (isHighlight) highlighted = true;
        var rowClass = isHighlight ? 'highlight-row' : '';

        html += '<tr class="' + rowClass + '"><td>' + rankDisplay + '</td><td>' + escapeHtml(entry.name) + '</td><td>' + entry.avgMs + 'ms</td></tr>';
    }

    rankingBody.innerHTML = html;
}

function getRankDisplay(rank) {
    if (rank === 1) return '<span class="rank-medal">\uD83E\uDD47</span>';
    if (rank === 2) return '<span class="rank-medal">\uD83E\uDD48</span>';
    if (rank === 3) return '<span class="rank-medal">\uD83E\uDD49</span>';
    return rank;
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== 초기 로딩 =====
renderRanking();
