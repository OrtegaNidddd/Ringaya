// ===== Elementos base =====
const CELLS = Array.from(document.querySelectorAll('.cell'));
const boardEl = document.getElementById('board');
const veilEl = document.getElementById('veil');
const turnEl = document.getElementById('turn');
const turnNameEl = document.getElementById('turnName');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreT = document.getElementById('scoreT');
const nameXEl = document.getElementById('nameX');
const nameOEl = document.getElementById('nameO');
const btnReset = document.getElementById('btnReset');
const btnClear = document.getElementById('btnClear');
const btnChangePlayers = document.getElementById('btnChangePlayers');

// SVG línea ganadora
const winSvg = document.getElementById('winSvg');
const winLine = document.getElementById('winLine');

// ===== Celebración =====
const celebration = document.getElementById('celebration');
const confettiCanvas = document.getElementById('confettiCanvas');
const imgWin = document.getElementById('imgWin');
const imgLose = document.getElementById('imgLose');
const whoWin = document.getElementById('whoWin');
const whoLose = document.getElementById('whoLose');
const btnNextRound = document.getElementById('btnNextRound');
const btnCloseCelebration = document.getElementById('btnCloseCelebration');

// ===== Registro =====
const playersCard = document.getElementById('playersCard');
const playersForm = document.getElementById('playersForm');
const playerXInput = document.getElementById('playerX');
const playerOInput = document.getElementById('playerO');
const playersError = document.getElementById('playersError');

// ===== Estado =====
let board = Array(9).fill('');
let current = 'X';
let lock = false;
let gameReady = false;
let players = {
  X: 'Jugador X',
  O: 'Jugador O'
};
let lastWin = null; // trío ganador para redibujar
let confetti = null; // controlador confeti

const WINS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

// Rutas de imágenes internas (en /public/assets/)
const ASSETS = {
  WIN: './assets/win.png',
  LOSE: './assets/lose.png'
};

// ===== LocalStorage helpers =====
const lsGet = (k, f) => {
  try {
    var _JSON$parse;
    return (_JSON$parse = JSON.parse(localStorage.getItem(k))) !== null && _JSON$parse !== void 0 ? _JSON$parse : f;
  } catch (_unused) {
    return f;
  }
};
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ===== Marcador =====
function loadScore() {
  const s = lsGet('tictactoe-score', {
    X: 0,
    O: 0,
    T: 0
  });
  scoreX.textContent = s.X;
  scoreO.textContent = s.O;
  scoreT.textContent = s.T;
}
function saveScore(delta) {
  const s = {
    X: +scoreX.textContent,
    O: +scoreO.textContent,
    T: +scoreT.textContent
  };
  s[delta] += 1;
  lsSet('tictactoe-score', s);
  loadScore();
}

// ===== Jugadores =====
function applyPlayersToUI() {
  nameXEl.textContent = players.X;
  nameOEl.textContent = players.O;
  nameXEl.title = players.X;
  nameOEl.title = players.O;
  updateTurnUI();
}
function loadPlayers() {
  const saved = lsGet('tictactoe-players', null);
  if (saved !== null && saved !== void 0 && saved.X && saved !== null && saved !== void 0 && saved.O) {
    players = saved;
    gameReady = true;
    playersCard.classList.add('hidden');
    veilEl.classList.add('hidden');
    boardEl.classList.remove('pointer-events-none', 'opacity-60');
    applyPlayersToUI();
  } else {
    gameReady = false;
    playersCard.classList.remove('hidden');
    veilEl.classList.remove('hidden');
    boardEl.classList.add('pointer-events-none', 'opacity-60');
  }
}
function validateNames(x, o) {
  const nx = (x || '').trim(),
    no = (o || '').trim();
  return !!nx && !!no && nx.toLowerCase() !== no.toLowerCase();
}

// ===== UI =====
function showToast(msg) {
  toastMsg.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.classList.add('animate-pop');
  setTimeout(() => toastEl.classList.add('hidden'), 1600);
}
function drawMark(cell, mark) {
  cell.innerHTML = mark === 'X' ? "<svg width=\"84\" height=\"84\" viewBox=\"0 0 100 100\" class=\"drop-shadow\">\n         <path d=\"M20 20 L80 80 M80 20 L20 80\" stroke=\"rgb(244,114,182)\" stroke-width=\"12\" stroke-linecap=\"round\" fill=\"none\"/>\n       </svg>" : "<svg width=\"84\" height=\"84\" viewBox=\"0 0 100 100\" class=\"drop-shadow\">\n         <circle cx=\"50\" cy=\"50\" r=\"32\" stroke=\"rgb(34,211,238)\" stroke-width=\"12\" fill=\"none\"/>\n       </svg>";
  cell.classList.add('animate-pop');
}
function updateTurnUI() {
  turnEl.textContent = current;
  const who = current === 'X' ? players.X : players.O;
  turnNameEl.textContent = "(".concat(who, ")");
  turnNameEl.title = "(".concat(who, ")");
}

// ===== Línea ganadora =====
function clearWinningLine() {
  winSvg.style.opacity = 0;
  winLine.removeAttribute('stroke-dasharray');
  winLine.removeAttribute('stroke-dashoffset');
  lastWin = null;
}
function drawWinningLine(winTriple) {
  const [a,, c] = winTriple;
  const boardRect = boardEl.getBoundingClientRect();
  const rA = CELLS[a].getBoundingClientRect();
  const rC = CELLS[c].getBoundingClientRect();
  const x1 = rA.left - boardRect.left + rA.width / 2;
  const y1 = rA.top - boardRect.top + rA.height / 2;
  const x2 = rC.left - boardRect.left + rC.width / 2;
  const y2 = rC.top - boardRect.top + rC.height / 2;
  const w = Math.round(boardRect.width);
  const h = Math.round(boardRect.height);
  winSvg.setAttribute('viewBox', "0 0 ".concat(w, " ").concat(h));
  winSvg.setAttribute('width', "".concat(w));
  winSvg.setAttribute('height', "".concat(h));
  winLine.setAttribute('x1', x1);
  winLine.setAttribute('y1', y1);
  winLine.setAttribute('x2', x2);
  winLine.setAttribute('y2', y2);
  const length = Math.hypot(x2 - x1, y2 - y1);
  winLine.style.transition = 'none';
  winLine.setAttribute('stroke-dasharray', length);
  winLine.setAttribute('stroke-dashoffset', length);
  void winLine.getBoundingClientRect();
  winSvg.style.opacity = 1;
  winLine.style.transition = 'stroke-dashoffset 480ms ease-out';
  winLine.setAttribute('stroke-dashoffset', 0);
  lastWin = [...winTriple];
}
window.addEventListener('resize', () => {
  if (lock && lastWin) drawWinningLine(lastWin);
});

// ===== Confeti =====
function makeConfettiController(canvas) {
  const ctx = canvas.getContext('2d');
  const colors = ['#e879f9', '#22d3ee', '#f472b6', '#60a5fa', '#fbbf24', '#34d399'];
  let W,
    H,
    particles = [],
    running = false,
    rafId = null,
    startAt = 0,
    duration = 2600;
  function size() {
    W = canvas.width = canvas.clientWidth;
    H = canvas.height = canvas.clientHeight;
  }
  function spawn() {
    let n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 180;
    particles.length = 0;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.4,
        r: 4 + Math.random() * 4,
        c: colors[Math.random() * colors.length | 0],
        vx: -1.5 + Math.random() * 3,
        vy: 2 + Math.random() * 2.5,
        rot: Math.random() * Math.PI * 2,
        vr: -0.2 + Math.random() * 0.4,
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        alpha: 0.9
      });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.rot += p.vr;
      if (p.y > H + 40) {
        p.y = -20;
        p.x = Math.random() * W;
        p.vy = 2 + Math.random() * 2.5;
      }
    }
  }
  function loop(ts) {
    if (!running) return;
    if (!startAt) startAt = ts;
    draw();
    if (ts - startAt < duration) {
      rafId = requestAnimationFrame(loop);
    } else {
      stop();
    }
  }
  function start() {
    size();
    spawn();
    running = true;
    startAt = 0;
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, W, H);
  }
  window.addEventListener('resize', () => {
    if (running) {
      size();
    }
  });
  return {
    start,
    stop
  };
}

// ===== Lógica de juego =====
function checkWinner() {
  for (const triple of WINS) {
    const [a, b, c] = triple;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      [a, b, c].forEach(i => CELLS[i].classList.add('winner'));
      return triple;
    }
  }
  if (board.every(v => v)) return 'T';
  return null;
}
function handleClick(e) {
  if (!gameReady) return;
  const cell = e.currentTarget;
  const i = +cell.dataset.i;
  if (lock || board[i]) return;
  board[i] = current;
  drawMark(cell, current);
  const result = checkWinner();
  if (result) {
    lock = true;
    if (result === 'T') {
      clearWinningLine();
      saveScore('T');
      showToast('🤝 ¡Empate!');
    } else {
      // Línea + celebración con imágenes internas
      requestAnimationFrame(() => {
        setTimeout(() => {
          drawWinningLine(result);
          saveScore(current);
          launchCelebration(current);
          showToast("\uD83C\uDF89 \xA1Gana ".concat(current, " \u2014 ").concat(current === 'X' ? players.X : players.O, "!"));
        }, 0);
      });
    }
    return;
  }
  current = current === 'X' ? 'O' : 'X';
  updateTurnUI();
}
function resetBoard() {
  lock = false;
  board = Array(9).fill('');
  current = 'X';
  updateTurnUI();
  CELLS.forEach(c => {
    c.innerHTML = '';
    c.classList.remove('winner');
  });
  clearWinningLine();
}

// ===== Marcador y eventos básicos =====
function clearScore() {
  lsSet('tictactoe-score', {
    X: 0,
    O: 0,
    T: 0
  });
  loadScore();
  showToast('🧹 Marcador limpiado');
}
CELLS.forEach(c => c.addEventListener('click', handleClick));
btnReset.addEventListener('click', () => {
  resetBoard();
  showToast('↻ Nueva ronda');
});
btnClear.addEventListener('click', clearScore);

// Cambiar jugadores
btnChangePlayers.addEventListener('click', () => {
  playerXInput.value = players.X;
  playerOInput.value = players.O;
  playersError.classList.add('hidden');
  playersCard.classList.remove('hidden');
  gameReady = false;
  veilEl.classList.remove('hidden');
  boardEl.classList.add('pointer-events-none', 'opacity-60');
});
playersForm.addEventListener('submit', e => {
  e.preventDefault();
  const x = playerXInput.value,
    o = playerOInput.value;
  if (!validateNames(x, o)) {
    playersError.classList.remove('hidden');
    return;
  }
  playersError.classList.add('hidden');
  players = {
    X: x.trim(),
    O: o.trim()
  };
  lsSet('tictactoe-players', players);
  applyPlayersToUI();
  playersCard.classList.add('hidden');
  veilEl.classList.add('hidden');
  boardEl.classList.remove('pointer-events-none', 'opacity-60');
  gameReady = true;
  resetBoard();
  showToast("\uD83D\uDE4C \xA1A jugar, ".concat(players.X, " (X) y ").concat(players.O, " (O)!"));
});

// ===== Celebración con imágenes internas =====
function launchCelebration(winner) {
  // Ganador y perdedor
  const loser = winner === 'X' ? 'O' : 'X';
  const whoWinName = winner === 'X' ? players.X : players.O;
  const whoLoseName = loser === 'X' ? players.X : players.O;

  // Setear imágenes internas
  imgWin.src = ASSETS.WIN;
  imgLose.src = ASSETS.LOSE;
  whoWin.textContent = "".concat(winner, " \u2014 ").concat(whoWinName);
  whoLose.textContent = "".concat(loser, " \u2014 ").concat(whoLoseName);

  // Mostrar overlay
  celebration.classList.remove('hidden');
  celebration.classList.add('flex');

  // Iniciar confeti
  if (!confetti) confetti = makeConfettiController(confettiCanvas);
  confetti.start();
}
function closeCelebration() {
  celebration.classList.add('hidden');
  celebration.classList.remove('flex');
  if (confetti) confetti.stop();
}
btnCloseCelebration.addEventListener('click', closeCelebration);
btnNextRound.addEventListener('click', () => {
  closeCelebration();
  resetBoard();
});

// ===== Init =====
loadScore();
loadPlayers();
updateTurnUI();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwibmFtZXMiOlsiQ0VMTFMiLCJBcnJheSIsImZyb20iLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJib2FyZEVsIiwiZ2V0RWxlbWVudEJ5SWQiLCJ2ZWlsRWwiLCJ0dXJuRWwiLCJ0dXJuTmFtZUVsIiwidG9hc3RFbCIsInRvYXN0TXNnIiwic2NvcmVYIiwic2NvcmVPIiwic2NvcmVUIiwibmFtZVhFbCIsIm5hbWVPRWwiLCJidG5SZXNldCIsImJ0bkNsZWFyIiwiYnRuQ2hhbmdlUGxheWVycyIsIndpblN2ZyIsIndpbkxpbmUiLCJjZWxlYnJhdGlvbiIsImNvbmZldHRpQ2FudmFzIiwiaW1nV2luIiwiaW1nTG9zZSIsIndob1dpbiIsIndob0xvc2UiLCJidG5OZXh0Um91bmQiLCJidG5DbG9zZUNlbGVicmF0aW9uIiwicGxheWVyc0NhcmQiLCJwbGF5ZXJzRm9ybSIsInBsYXllclhJbnB1dCIsInBsYXllck9JbnB1dCIsInBsYXllcnNFcnJvciIsImJvYXJkIiwiZmlsbCIsImN1cnJlbnQiLCJsb2NrIiwiZ2FtZVJlYWR5IiwicGxheWVycyIsIlgiLCJPIiwibGFzdFdpbiIsImNvbmZldHRpIiwiV0lOUyIsIkFTU0VUUyIsIldJTiIsIkxPU0UiLCJsc0dldCIsImsiLCJmIiwiX0pTT04kcGFyc2UiLCJKU09OIiwicGFyc2UiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwiX3VudXNlZCIsImxzU2V0IiwidiIsInNldEl0ZW0iLCJzdHJpbmdpZnkiLCJsb2FkU2NvcmUiLCJzIiwiVCIsInRleHRDb250ZW50Iiwic2F2ZVNjb3JlIiwiZGVsdGEiLCJhcHBseVBsYXllcnNUb1VJIiwidGl0bGUiLCJ1cGRhdGVUdXJuVUkiLCJsb2FkUGxheWVycyIsInNhdmVkIiwiY2xhc3NMaXN0IiwiYWRkIiwicmVtb3ZlIiwidmFsaWRhdGVOYW1lcyIsIngiLCJvIiwibngiLCJ0cmltIiwibm8iLCJ0b0xvd2VyQ2FzZSIsInNob3dUb2FzdCIsIm1zZyIsInNldFRpbWVvdXQiLCJkcmF3TWFyayIsImNlbGwiLCJtYXJrIiwiaW5uZXJIVE1MIiwid2hvIiwiY29uY2F0IiwiY2xlYXJXaW5uaW5nTGluZSIsInN0eWxlIiwib3BhY2l0eSIsInJlbW92ZUF0dHJpYnV0ZSIsImRyYXdXaW5uaW5nTGluZSIsIndpblRyaXBsZSIsImEiLCJjIiwiYm9hcmRSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwickEiLCJyQyIsIngxIiwibGVmdCIsIndpZHRoIiwieTEiLCJ0b3AiLCJoZWlnaHQiLCJ4MiIsInkyIiwidyIsIk1hdGgiLCJyb3VuZCIsImgiLCJzZXRBdHRyaWJ1dGUiLCJsZW5ndGgiLCJoeXBvdCIsInRyYW5zaXRpb24iLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwibWFrZUNvbmZldHRpQ29udHJvbGxlciIsImNhbnZhcyIsImN0eCIsImdldENvbnRleHQiLCJjb2xvcnMiLCJXIiwiSCIsInBhcnRpY2xlcyIsInJ1bm5pbmciLCJyYWZJZCIsInN0YXJ0QXQiLCJkdXJhdGlvbiIsInNpemUiLCJjbGllbnRXaWR0aCIsImNsaWVudEhlaWdodCIsInNwYXduIiwibiIsImFyZ3VtZW50cyIsInVuZGVmaW5lZCIsImkiLCJwdXNoIiwicmFuZG9tIiwieSIsInIiLCJ2eCIsInZ5Iiwicm90IiwiUEkiLCJ2ciIsInNoYXBlIiwiYWxwaGEiLCJkcmF3IiwiY2xlYXJSZWN0IiwicCIsInNhdmUiLCJnbG9iYWxBbHBoYSIsInRyYW5zbGF0ZSIsInJvdGF0ZSIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiYmVnaW5QYXRoIiwiYXJjIiwicmVzdG9yZSIsImxvb3AiLCJ0cyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInN0b3AiLCJzdGFydCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiY2hlY2tXaW5uZXIiLCJ0cmlwbGUiLCJiIiwiZm9yRWFjaCIsImV2ZXJ5IiwiaGFuZGxlQ2xpY2siLCJlIiwiY3VycmVudFRhcmdldCIsImRhdGFzZXQiLCJyZXN1bHQiLCJsYXVuY2hDZWxlYnJhdGlvbiIsInJlc2V0Qm9hcmQiLCJjbGVhclNjb3JlIiwidmFsdWUiLCJwcmV2ZW50RGVmYXVsdCIsIndpbm5lciIsImxvc2VyIiwid2hvV2luTmFtZSIsIndob0xvc2VOYW1lIiwic3JjIiwiY2xvc2VDZWxlYnJhdGlvbiJdLCJzb3VyY2VzIjpbIi4uL3B1YmxpYy9hcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gPT09PT0gRWxlbWVudG9zIGJhc2UgPT09PT1cclxuY29uc3QgQ0VMTFMgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5jZWxsJykpO1xyXG5jb25zdCBib2FyZEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JvYXJkJyk7XHJcbmNvbnN0IHZlaWxFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2ZWlsJyk7XHJcblxyXG5jb25zdCB0dXJuRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHVybicpO1xyXG5jb25zdCB0dXJuTmFtZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3R1cm5OYW1lJyk7XHJcbmNvbnN0IHRvYXN0RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3QnKTtcclxuY29uc3QgdG9hc3RNc2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9hc3RNc2cnKTtcclxuXHJcbmNvbnN0IHNjb3JlWCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY29yZVgnKTtcclxuY29uc3Qgc2NvcmVPID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlTycpO1xyXG5jb25zdCBzY29yZVQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NvcmVUJyk7XHJcbmNvbnN0IG5hbWVYRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmFtZVgnKTtcclxuY29uc3QgbmFtZU9FbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYW1lTycpO1xyXG5cclxuY29uc3QgYnRuUmVzZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuUmVzZXQnKTtcclxuY29uc3QgYnRuQ2xlYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuQ2xlYXInKTtcclxuY29uc3QgYnRuQ2hhbmdlUGxheWVycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5DaGFuZ2VQbGF5ZXJzJyk7XHJcblxyXG4vLyBTVkcgbMOtbmVhIGdhbmFkb3JhXHJcbmNvbnN0IHdpblN2ZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3aW5TdmcnKTtcclxuY29uc3Qgd2luTGluZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3aW5MaW5lJyk7XHJcblxyXG4vLyA9PT09PSBDZWxlYnJhY2nDs24gPT09PT1cclxuY29uc3QgY2VsZWJyYXRpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2VsZWJyYXRpb24nKTtcclxuY29uc3QgY29uZmV0dGlDYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uZmV0dGlDYW52YXMnKTtcclxuY29uc3QgaW1nV2luID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltZ1dpbicpO1xyXG5jb25zdCBpbWdMb3NlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltZ0xvc2UnKTtcclxuY29uc3Qgd2hvV2luID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dob1dpbicpO1xyXG5jb25zdCB3aG9Mb3NlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dob0xvc2UnKTtcclxuY29uc3QgYnRuTmV4dFJvdW5kID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bk5leHRSb3VuZCcpO1xyXG5jb25zdCBidG5DbG9zZUNlbGVicmF0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkNsb3NlQ2VsZWJyYXRpb24nKTtcclxuXHJcbi8vID09PT09IFJlZ2lzdHJvID09PT09XHJcbmNvbnN0IHBsYXllcnNDYXJkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXllcnNDYXJkJyk7XHJcbmNvbnN0IHBsYXllcnNGb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXllcnNGb3JtJyk7XHJcbmNvbnN0IHBsYXllclhJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5ZXJYJyk7XHJcbmNvbnN0IHBsYXllck9JbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5ZXJPJyk7XHJcbmNvbnN0IHBsYXllcnNFcnJvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5ZXJzRXJyb3InKTtcclxuXHJcbi8vID09PT09IEVzdGFkbyA9PT09PVxyXG5sZXQgYm9hcmQgPSBBcnJheSg5KS5maWxsKCcnKTtcclxubGV0IGN1cnJlbnQgPSAnWCc7XHJcbmxldCBsb2NrID0gZmFsc2U7XHJcbmxldCBnYW1lUmVhZHkgPSBmYWxzZTtcclxubGV0IHBsYXllcnMgPSB7IFg6ICdKdWdhZG9yIFgnLCBPOiAnSnVnYWRvciBPJyB9O1xyXG5sZXQgbGFzdFdpbiA9IG51bGw7IC8vIHRyw61vIGdhbmFkb3IgcGFyYSByZWRpYnVqYXJcclxubGV0IGNvbmZldHRpID0gbnVsbDsgLy8gY29udHJvbGFkb3IgY29uZmV0aVxyXG5cclxuY29uc3QgV0lOUyA9IFtcclxuICBbMCwxLDJdLFszLDQsNV0sWzYsNyw4XSxcclxuICBbMCwzLDZdLFsxLDQsN10sWzIsNSw4XSxcclxuICBbMCw0LDhdLFsyLDQsNl1cclxuXTtcclxuXHJcbi8vIFJ1dGFzIGRlIGltw6FnZW5lcyBpbnRlcm5hcyAoZW4gL3B1YmxpYy9hc3NldHMvKVxyXG5jb25zdCBBU1NFVFMgPSB7XHJcbiAgV0lOOiAgJy4vYXNzZXRzL3dpbi5wbmcnLFxyXG4gIExPU0U6ICcuL2Fzc2V0cy9sb3NlLnBuZydcclxufTtcclxuXHJcbi8vID09PT09IExvY2FsU3RvcmFnZSBoZWxwZXJzID09PT09XHJcbmNvbnN0IGxzR2V0ID0gKGssZik9PnsgdHJ5eyByZXR1cm4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrKSkgPz8gZjsgfWNhdGNoeyByZXR1cm4gZjsgfSB9O1xyXG5jb25zdCBsc1NldCA9IChrLHYpPT4gbG9jYWxTdG9yYWdlLnNldEl0ZW0oaywgSlNPTi5zdHJpbmdpZnkodikpO1xyXG5cclxuLy8gPT09PT0gTWFyY2Fkb3IgPT09PT1cclxuZnVuY3Rpb24gbG9hZFNjb3JlKCl7XHJcbiAgY29uc3QgcyA9IGxzR2V0KCd0aWN0YWN0b2Utc2NvcmUnLCB7WDowLE86MCxUOjB9KTtcclxuICBzY29yZVgudGV4dENvbnRlbnQgPSBzLlg7IHNjb3JlTy50ZXh0Q29udGVudCA9IHMuTzsgc2NvcmVULnRleHRDb250ZW50ID0gcy5UO1xyXG59XHJcbmZ1bmN0aW9uIHNhdmVTY29yZShkZWx0YSl7XHJcbiAgY29uc3QgcyA9IHsgWDorc2NvcmVYLnRleHRDb250ZW50LCBPOitzY29yZU8udGV4dENvbnRlbnQsIFQ6K3Njb3JlVC50ZXh0Q29udGVudCB9O1xyXG4gIHNbZGVsdGFdICs9IDE7IGxzU2V0KCd0aWN0YWN0b2Utc2NvcmUnLCBzKTsgbG9hZFNjb3JlKCk7XHJcbn1cclxuXHJcbi8vID09PT09IEp1Z2Fkb3JlcyA9PT09PVxyXG5mdW5jdGlvbiBhcHBseVBsYXllcnNUb1VJKCl7XHJcbiAgbmFtZVhFbC50ZXh0Q29udGVudCA9IHBsYXllcnMuWDtcclxuICBuYW1lT0VsLnRleHRDb250ZW50ID0gcGxheWVycy5PO1xyXG4gIG5hbWVYRWwudGl0bGUgPSBwbGF5ZXJzLlg7XHJcbiAgbmFtZU9FbC50aXRsZSA9IHBsYXllcnMuTztcclxuICB1cGRhdGVUdXJuVUkoKTtcclxufVxyXG5mdW5jdGlvbiBsb2FkUGxheWVycygpe1xyXG4gIGNvbnN0IHNhdmVkID0gbHNHZXQoJ3RpY3RhY3RvZS1wbGF5ZXJzJywgbnVsbCk7XHJcbiAgaWYgKHNhdmVkPy5YICYmIHNhdmVkPy5PKXtcclxuICAgIHBsYXllcnMgPSBzYXZlZDtcclxuICAgIGdhbWVSZWFkeSA9IHRydWU7XHJcbiAgICBwbGF5ZXJzQ2FyZC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcclxuICAgIHZlaWxFbC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcclxuICAgIGJvYXJkRWwuY2xhc3NMaXN0LnJlbW92ZSgncG9pbnRlci1ldmVudHMtbm9uZScsJ29wYWNpdHktNjAnKTtcclxuICAgIGFwcGx5UGxheWVyc1RvVUkoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgZ2FtZVJlYWR5ID0gZmFsc2U7XHJcbiAgICBwbGF5ZXJzQ2FyZC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcclxuICAgIHZlaWxFbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcclxuICAgIGJvYXJkRWwuY2xhc3NMaXN0LmFkZCgncG9pbnRlci1ldmVudHMtbm9uZScsJ29wYWNpdHktNjAnKTtcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gdmFsaWRhdGVOYW1lcyh4LCBvKXtcclxuICBjb25zdCBueCA9ICh4fHwnJykudHJpbSgpLCBubyA9IChvfHwnJykudHJpbSgpO1xyXG4gIHJldHVybiAhIW54ICYmICEhbm8gJiYgbngudG9Mb3dlckNhc2UoKSAhPT0gbm8udG9Mb3dlckNhc2UoKTtcclxufVxyXG5cclxuLy8gPT09PT0gVUkgPT09PT1cclxuZnVuY3Rpb24gc2hvd1RvYXN0KG1zZyl7XHJcbiAgdG9hc3RNc2cudGV4dENvbnRlbnQgPSBtc2c7XHJcbiAgdG9hc3RFbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcclxuICB0b2FzdEVsLmNsYXNzTGlzdC5hZGQoJ2FuaW1hdGUtcG9wJyk7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB0b2FzdEVsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpLCAxNjAwKTtcclxufVxyXG5mdW5jdGlvbiBkcmF3TWFyayhjZWxsLCBtYXJrKXtcclxuICBjZWxsLmlubmVySFRNTCA9IG1hcmsgPT09ICdYJ1xyXG4gICAgPyBgPHN2ZyB3aWR0aD1cIjg0XCIgaGVpZ2h0PVwiODRcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBjbGFzcz1cImRyb3Atc2hhZG93XCI+XHJcbiAgICAgICAgIDxwYXRoIGQ9XCJNMjAgMjAgTDgwIDgwIE04MCAyMCBMMjAgODBcIiBzdHJva2U9XCJyZ2IoMjQ0LDExNCwxODIpXCIgc3Ryb2tlLXdpZHRoPVwiMTJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgZmlsbD1cIm5vbmVcIi8+XHJcbiAgICAgICA8L3N2Zz5gXHJcbiAgICA6IGA8c3ZnIHdpZHRoPVwiODRcIiBoZWlnaHQ9XCI4NFwiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGNsYXNzPVwiZHJvcC1zaGFkb3dcIj5cclxuICAgICAgICAgPGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCIzMlwiIHN0cm9rZT1cInJnYigzNCwyMTEsMjM4KVwiIHN0cm9rZS13aWR0aD1cIjEyXCIgZmlsbD1cIm5vbmVcIi8+XHJcbiAgICAgICA8L3N2Zz5gO1xyXG4gIGNlbGwuY2xhc3NMaXN0LmFkZCgnYW5pbWF0ZS1wb3AnKTtcclxufVxyXG5mdW5jdGlvbiB1cGRhdGVUdXJuVUkoKXtcclxuICB0dXJuRWwudGV4dENvbnRlbnQgPSBjdXJyZW50O1xyXG4gIGNvbnN0IHdobyA9IGN1cnJlbnQgPT09ICdYJyA/IHBsYXllcnMuWCA6IHBsYXllcnMuTztcclxuICB0dXJuTmFtZUVsLnRleHRDb250ZW50ID0gYCgke3dob30pYDtcclxuICB0dXJuTmFtZUVsLnRpdGxlID0gYCgke3dob30pYDtcclxufVxyXG5cclxuLy8gPT09PT0gTMOtbmVhIGdhbmFkb3JhID09PT09XHJcbmZ1bmN0aW9uIGNsZWFyV2lubmluZ0xpbmUoKXtcclxuICB3aW5Tdmcuc3R5bGUub3BhY2l0eSA9IDA7XHJcbiAgd2luTGluZS5yZW1vdmVBdHRyaWJ1dGUoJ3N0cm9rZS1kYXNoYXJyYXknKTtcclxuICB3aW5MaW5lLnJlbW92ZUF0dHJpYnV0ZSgnc3Ryb2tlLWRhc2hvZmZzZXQnKTtcclxuICBsYXN0V2luID0gbnVsbDtcclxufVxyXG5mdW5jdGlvbiBkcmF3V2lubmluZ0xpbmUod2luVHJpcGxlKXtcclxuICBjb25zdCBbYSwsY10gPSB3aW5UcmlwbGU7XHJcbiAgY29uc3QgYm9hcmRSZWN0ID0gYm9hcmRFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICBjb25zdCByQSA9IENFTExTW2FdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gIGNvbnN0IHJDID0gQ0VMTFNbY10uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gIGNvbnN0IHgxID0gKHJBLmxlZnQgLSBib2FyZFJlY3QubGVmdCkgKyByQS53aWR0aCAgLyAyO1xyXG4gIGNvbnN0IHkxID0gKHJBLnRvcCAgLSBib2FyZFJlY3QudG9wICkgKyByQS5oZWlnaHQgLyAyO1xyXG4gIGNvbnN0IHgyID0gKHJDLmxlZnQgLSBib2FyZFJlY3QubGVmdCkgKyByQy53aWR0aCAgLyAyO1xyXG4gIGNvbnN0IHkyID0gKHJDLnRvcCAgLSBib2FyZFJlY3QudG9wICkgKyByQy5oZWlnaHQgLyAyO1xyXG5cclxuICBjb25zdCB3ID0gTWF0aC5yb3VuZChib2FyZFJlY3Qud2lkdGgpO1xyXG4gIGNvbnN0IGggPSBNYXRoLnJvdW5kKGJvYXJkUmVjdC5oZWlnaHQpO1xyXG4gIHdpblN2Zy5zZXRBdHRyaWJ1dGUoJ3ZpZXdCb3gnLCBgMCAwICR7d30gJHtofWApO1xyXG4gIHdpblN2Zy5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgIGAke3d9YCk7XHJcbiAgd2luU3ZnLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgYCR7aH1gKTtcclxuXHJcbiAgd2luTGluZS5zZXRBdHRyaWJ1dGUoJ3gxJywgeDEpO1xyXG4gIHdpbkxpbmUuc2V0QXR0cmlidXRlKCd5MScsIHkxKTtcclxuICB3aW5MaW5lLnNldEF0dHJpYnV0ZSgneDInLCB4Mik7XHJcbiAgd2luTGluZS5zZXRBdHRyaWJ1dGUoJ3kyJywgeTIpO1xyXG5cclxuICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KHgyIC0geDEsIHkyIC0geTEpO1xyXG4gIHdpbkxpbmUuc3R5bGUudHJhbnNpdGlvbiA9ICdub25lJztcclxuICB3aW5MaW5lLnNldEF0dHJpYnV0ZSgnc3Ryb2tlLWRhc2hhcnJheScsIGxlbmd0aCk7XHJcbiAgd2luTGluZS5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS1kYXNob2Zmc2V0JywgbGVuZ3RoKTtcclxuXHJcbiAgdm9pZCB3aW5MaW5lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gIHdpblN2Zy5zdHlsZS5vcGFjaXR5ID0gMTtcclxuICB3aW5MaW5lLnN0eWxlLnRyYW5zaXRpb24gPSAnc3Ryb2tlLWRhc2hvZmZzZXQgNDgwbXMgZWFzZS1vdXQnO1xyXG4gIHdpbkxpbmUuc2V0QXR0cmlidXRlKCdzdHJva2UtZGFzaG9mZnNldCcsIDApO1xyXG5cclxuICBsYXN0V2luID0gWy4uLndpblRyaXBsZV07XHJcbn1cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHsgaWYgKGxvY2sgJiYgbGFzdFdpbikgZHJhd1dpbm5pbmdMaW5lKGxhc3RXaW4pOyB9KTtcclxuXHJcbi8vID09PT09IENvbmZldGkgPT09PT1cclxuZnVuY3Rpb24gbWFrZUNvbmZldHRpQ29udHJvbGxlcihjYW52YXMpe1xyXG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gIGNvbnN0IGNvbG9ycyA9IFsnI2U4NzlmOScsJyMyMmQzZWUnLCcjZjQ3MmI2JywnIzYwYTVmYScsJyNmYmJmMjQnLCcjMzRkMzk5J107XHJcbiAgbGV0IFcsIEgsIHBhcnRpY2xlcyA9IFtdLCBydW5uaW5nID0gZmFsc2UsIHJhZklkID0gbnVsbCwgc3RhcnRBdCA9IDAsIGR1cmF0aW9uID0gMjYwMDtcclxuXHJcbiAgZnVuY3Rpb24gc2l6ZSgpe1xyXG4gICAgVyA9IGNhbnZhcy53aWR0aCAgPSBjYW52YXMuY2xpZW50V2lkdGg7XHJcbiAgICBIID0gY2FudmFzLmhlaWdodCA9IGNhbnZhcy5jbGllbnRIZWlnaHQ7XHJcbiAgfVxyXG4gIGZ1bmN0aW9uIHNwYXduKG49MTgwKXtcclxuICAgIHBhcnRpY2xlcy5sZW5ndGggPSAwO1xyXG4gICAgZm9yKGxldCBpPTA7aTxuO2krKyl7XHJcbiAgICAgIHBhcnRpY2xlcy5wdXNoKHtcclxuICAgICAgICB4OiBNYXRoLnJhbmRvbSgpKlcsXHJcbiAgICAgICAgeTogLTIwIC0gTWF0aC5yYW5kb20oKSpIKjAuNCxcclxuICAgICAgICByOiA0ICsgTWF0aC5yYW5kb20oKSo0LFxyXG4gICAgICAgIGM6IGNvbG9yc1soTWF0aC5yYW5kb20oKSpjb2xvcnMubGVuZ3RoKXwwXSxcclxuICAgICAgICB2eDogLTEuNSArIE1hdGgucmFuZG9tKCkqMyxcclxuICAgICAgICB2eTogMiArIE1hdGgucmFuZG9tKCkqMi41LFxyXG4gICAgICAgIHJvdDogTWF0aC5yYW5kb20oKSpNYXRoLlBJKjIsXHJcbiAgICAgICAgdnI6IC0wLjIgKyBNYXRoLnJhbmRvbSgpKjAuNCxcclxuICAgICAgICBzaGFwZTogTWF0aC5yYW5kb20oKTwwLjUgPyAncmVjdCcgOiAnY2lyY2xlJyxcclxuICAgICAgICBhbHBoYTogMC45XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBmdW5jdGlvbiBkcmF3KCl7XHJcbiAgICBjdHguY2xlYXJSZWN0KDAsMCxXLEgpO1xyXG4gICAgZm9yKGNvbnN0IHAgb2YgcGFydGljbGVzKXtcclxuICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgY3R4Lmdsb2JhbEFscGhhID0gcC5hbHBoYTtcclxuICAgICAgY3R4LnRyYW5zbGF0ZShwLngsIHAueSk7XHJcbiAgICAgIGN0eC5yb3RhdGUocC5yb3QpO1xyXG4gICAgICBjdHguZmlsbFN0eWxlID0gcC5jO1xyXG4gICAgICBpZihwLnNoYXBlPT09J3JlY3QnKXtcclxuICAgICAgICBjdHguZmlsbFJlY3QoLXAuciwgLXAuciwgcC5yKjIsIHAucioyKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5hcmMoMCwwLHAuciwwLE1hdGguUEkqMik7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgfVxyXG4gICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgcC54ICs9IHAudng7XHJcbiAgICAgIHAueSArPSBwLnZ5O1xyXG4gICAgICBwLnZ5ICs9IDAuMDM7XHJcbiAgICAgIHAucm90ICs9IHAudnI7XHJcblxyXG4gICAgICBpZihwLnkgPiBIICsgNDApIHsgcC55ID0gLTIwOyBwLnggPSBNYXRoLnJhbmRvbSgpKlc7IHAudnkgPSAyICsgTWF0aC5yYW5kb20oKSoyLjU7IH1cclxuICAgIH1cclxuICB9XHJcbiAgZnVuY3Rpb24gbG9vcCh0cyl7XHJcbiAgICBpZighcnVubmluZykgcmV0dXJuO1xyXG4gICAgaWYoIXN0YXJ0QXQpIHN0YXJ0QXQgPSB0cztcclxuICAgIGRyYXcoKTtcclxuICAgIGlmKHRzIC0gc3RhcnRBdCA8IGR1cmF0aW9uKXsgcmFmSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7IH1cclxuICAgIGVsc2UgeyBzdG9wKCk7IH1cclxuICB9XHJcbiAgZnVuY3Rpb24gc3RhcnQoKXsgc2l6ZSgpOyBzcGF3bigpOyBydW5uaW5nID0gdHJ1ZTsgc3RhcnRBdCA9IDA7IHJhZklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApOyB9XHJcbiAgZnVuY3Rpb24gc3RvcCgpeyBydW5uaW5nID0gZmFsc2U7IGlmKHJhZklkKSBjYW5jZWxBbmltYXRpb25GcmFtZShyYWZJZCk7IGN0eC5jbGVhclJlY3QoMCwwLFcsSCk7IH1cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4geyBpZihydW5uaW5nKXsgc2l6ZSgpOyB9IH0pO1xyXG4gIHJldHVybiB7IHN0YXJ0LCBzdG9wIH07XHJcbn1cclxuXHJcbi8vID09PT09IEzDs2dpY2EgZGUganVlZ28gPT09PT1cclxuZnVuY3Rpb24gY2hlY2tXaW5uZXIoKSB7XHJcbiAgZm9yIChjb25zdCB0cmlwbGUgb2YgV0lOUyl7XHJcbiAgICBjb25zdCBbYSxiLGNdID0gdHJpcGxlO1xyXG4gICAgaWYgKGJvYXJkW2FdICYmIGJvYXJkW2FdID09PSBib2FyZFtiXSAmJiBib2FyZFthXSA9PT0gYm9hcmRbY10pe1xyXG4gICAgICBbYSxiLGNdLmZvckVhY2goaSA9PiBDRUxMU1tpXS5jbGFzc0xpc3QuYWRkKCd3aW5uZXInKSk7XHJcbiAgICAgIHJldHVybiB0cmlwbGU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChib2FyZC5ldmVyeSh2ID0+IHYpKSByZXR1cm4gJ1QnO1xyXG4gIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVDbGljayhlKXtcclxuICBpZiAoIWdhbWVSZWFkeSkgcmV0dXJuO1xyXG4gIGNvbnN0IGNlbGwgPSBlLmN1cnJlbnRUYXJnZXQ7XHJcbiAgY29uc3QgaSA9ICtjZWxsLmRhdGFzZXQuaTtcclxuICBpZiAobG9jayB8fCBib2FyZFtpXSkgcmV0dXJuO1xyXG5cclxuICBib2FyZFtpXSA9IGN1cnJlbnQ7XHJcbiAgZHJhd01hcmsoY2VsbCwgY3VycmVudCk7XHJcblxyXG4gIGNvbnN0IHJlc3VsdCA9IGNoZWNrV2lubmVyKCk7XHJcbiAgaWYgKHJlc3VsdCl7XHJcbiAgICBsb2NrID0gdHJ1ZTtcclxuICAgIGlmIChyZXN1bHQgPT09ICdUJyl7XHJcbiAgICAgIGNsZWFyV2lubmluZ0xpbmUoKTtcclxuICAgICAgc2F2ZVNjb3JlKCdUJyk7XHJcbiAgICAgIHNob3dUb2FzdCgn8J+knSDCoUVtcGF0ZSEnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEzDrW5lYSArIGNlbGVicmFjacOzbiBjb24gaW3DoWdlbmVzIGludGVybmFzXHJcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICBkcmF3V2lubmluZ0xpbmUocmVzdWx0KTtcclxuICAgICAgICAgIHNhdmVTY29yZShjdXJyZW50KTtcclxuICAgICAgICAgIGxhdW5jaENlbGVicmF0aW9uKGN1cnJlbnQpO1xyXG4gICAgICAgICAgc2hvd1RvYXN0KGDwn46JIMKhR2FuYSAke2N1cnJlbnR9IOKAlCAke2N1cnJlbnQgPT09ICdYJyA/IHBsYXllcnMuWCA6IHBsYXllcnMuT30hYCk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY3VycmVudCA9IGN1cnJlbnQgPT09ICdYJyA/ICdPJyA6ICdYJztcclxuICB1cGRhdGVUdXJuVUkoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVzZXRCb2FyZCgpe1xyXG4gIGxvY2sgPSBmYWxzZTtcclxuICBib2FyZCA9IEFycmF5KDkpLmZpbGwoJycpO1xyXG4gIGN1cnJlbnQgPSAnWCc7XHJcbiAgdXBkYXRlVHVyblVJKCk7XHJcbiAgQ0VMTFMuZm9yRWFjaChjID0+IHsgYy5pbm5lckhUTUw9Jyc7IGMuY2xhc3NMaXN0LnJlbW92ZSgnd2lubmVyJyk7IH0pO1xyXG4gIGNsZWFyV2lubmluZ0xpbmUoKTtcclxufVxyXG5cclxuLy8gPT09PT0gTWFyY2Fkb3IgeSBldmVudG9zIGLDoXNpY29zID09PT09XHJcbmZ1bmN0aW9uIGNsZWFyU2NvcmUoKXtcclxuICBsc1NldCgndGljdGFjdG9lLXNjb3JlJywge1g6MCxPOjAsVDowfSk7XHJcbiAgbG9hZFNjb3JlKCk7XHJcbiAgc2hvd1RvYXN0KCfwn6e5IE1hcmNhZG9yIGxpbXBpYWRvJyk7XHJcbn1cclxuQ0VMTFMuZm9yRWFjaChjID0+IGMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVDbGljaykpO1xyXG5idG5SZXNldC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsgcmVzZXRCb2FyZCgpOyBzaG93VG9hc3QoJ+KGuyBOdWV2YSByb25kYScpOyB9KTtcclxuYnRuQ2xlYXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGVhclNjb3JlKTtcclxuXHJcbi8vIENhbWJpYXIganVnYWRvcmVzXHJcbmJ0bkNoYW5nZVBsYXllcnMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgcGxheWVyWElucHV0LnZhbHVlID0gcGxheWVycy5YOyBwbGF5ZXJPSW5wdXQudmFsdWUgPSBwbGF5ZXJzLk87XHJcbiAgcGxheWVyc0Vycm9yLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG4gIHBsYXllcnNDYXJkLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xyXG5cclxuICBnYW1lUmVhZHkgPSBmYWxzZTtcclxuICB2ZWlsRWwuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcbiAgYm9hcmRFbC5jbGFzc0xpc3QuYWRkKCdwb2ludGVyLWV2ZW50cy1ub25lJywnb3BhY2l0eS02MCcpO1xyXG59KTtcclxucGxheWVyc0Zvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGUpID0+IHtcclxuICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgY29uc3QgeCA9IHBsYXllclhJbnB1dC52YWx1ZSwgbyA9IHBsYXllck9JbnB1dC52YWx1ZTtcclxuICBpZiAoIXZhbGlkYXRlTmFtZXMoeCxvKSl7IHBsYXllcnNFcnJvci5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsgcmV0dXJuOyB9XHJcbiAgcGxheWVyc0Vycm9yLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG5cclxuICBwbGF5ZXJzID0geyBYOiB4LnRyaW0oKSwgTzogby50cmltKCkgfTtcclxuICBsc1NldCgndGljdGFjdG9lLXBsYXllcnMnLCBwbGF5ZXJzKTtcclxuICBhcHBseVBsYXllcnNUb1VJKCk7XHJcblxyXG4gIHBsYXllcnNDYXJkLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG4gIHZlaWxFbC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcclxuICBib2FyZEVsLmNsYXNzTGlzdC5yZW1vdmUoJ3BvaW50ZXItZXZlbnRzLW5vbmUnLCdvcGFjaXR5LTYwJyk7XHJcbiAgZ2FtZVJlYWR5ID0gdHJ1ZTtcclxuXHJcbiAgcmVzZXRCb2FyZCgpO1xyXG4gIHNob3dUb2FzdChg8J+ZjCDCoUEganVnYXIsICR7cGxheWVycy5YfSAoWCkgeSAke3BsYXllcnMuT30gKE8pIWApO1xyXG59KTtcclxuXHJcbi8vID09PT09IENlbGVicmFjacOzbiBjb24gaW3DoWdlbmVzIGludGVybmFzID09PT09XHJcbmZ1bmN0aW9uIGxhdW5jaENlbGVicmF0aW9uKHdpbm5lcil7XHJcbiAgLy8gR2FuYWRvciB5IHBlcmRlZG9yXHJcbiAgY29uc3QgbG9zZXIgPSB3aW5uZXIgPT09ICdYJyA/ICdPJyA6ICdYJztcclxuICBjb25zdCB3aG9XaW5OYW1lID0gd2lubmVyID09PSAnWCcgPyBwbGF5ZXJzLlggOiBwbGF5ZXJzLk87XHJcbiAgY29uc3Qgd2hvTG9zZU5hbWUgPSBsb3NlciAgPT09ICdYJyA/IHBsYXllcnMuWCA6IHBsYXllcnMuTztcclxuXHJcbiAgLy8gU2V0ZWFyIGltw6FnZW5lcyBpbnRlcm5hc1xyXG4gIGltZ1dpbi5zcmMgID0gQVNTRVRTLldJTjtcclxuICBpbWdMb3NlLnNyYyA9IEFTU0VUUy5MT1NFO1xyXG4gIHdob1dpbi50ZXh0Q29udGVudCAgPSBgJHt3aW5uZXJ9IOKAlCAke3dob1dpbk5hbWV9YDtcclxuICB3aG9Mb3NlLnRleHRDb250ZW50ID0gYCR7bG9zZXJ9IOKAlCAke3dob0xvc2VOYW1lfWA7XHJcblxyXG4gIC8vIE1vc3RyYXIgb3ZlcmxheVxyXG4gIGNlbGVicmF0aW9uLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xyXG4gIGNlbGVicmF0aW9uLmNsYXNzTGlzdC5hZGQoJ2ZsZXgnKTtcclxuXHJcbiAgLy8gSW5pY2lhciBjb25mZXRpXHJcbiAgaWYoIWNvbmZldHRpKSBjb25mZXR0aSA9IG1ha2VDb25mZXR0aUNvbnRyb2xsZXIoY29uZmV0dGlDYW52YXMpO1xyXG4gIGNvbmZldHRpLnN0YXJ0KCk7XHJcbn1cclxuZnVuY3Rpb24gY2xvc2VDZWxlYnJhdGlvbigpe1xyXG4gIGNlbGVicmF0aW9uLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG4gIGNlbGVicmF0aW9uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZsZXgnKTtcclxuICBpZihjb25mZXR0aSkgY29uZmV0dGkuc3RvcCgpO1xyXG59XHJcbmJ0bkNsb3NlQ2VsZWJyYXRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbG9zZUNlbGVicmF0aW9uKTtcclxuYnRuTmV4dFJvdW5kLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCk9PntcclxuICBjbG9zZUNlbGVicmF0aW9uKCk7XHJcbiAgcmVzZXRCb2FyZCgpO1xyXG59KTtcclxuXHJcbi8vID09PT09IEluaXQgPT09PT1cclxubG9hZFNjb3JlKCk7XHJcbmxvYWRQbGF5ZXJzKCk7XHJcbnVwZGF0ZVR1cm5VSSgpO1xyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0EsTUFBTUEsS0FBSyxHQUFHQyxLQUFLLENBQUNDLElBQUksQ0FBQ0MsUUFBUSxDQUFDQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1RCxNQUFNQyxPQUFPLEdBQUdGLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLE9BQU8sQ0FBQztBQUNoRCxNQUFNQyxNQUFNLEdBQUdKLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLE1BQU0sQ0FBQztBQUU5QyxNQUFNRSxNQUFNLEdBQUdMLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLE1BQU0sQ0FBQztBQUM5QyxNQUFNRyxVQUFVLEdBQUdOLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLFVBQVUsQ0FBQztBQUN0RCxNQUFNSSxPQUFPLEdBQUdQLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLE9BQU8sQ0FBQztBQUNoRCxNQUFNSyxRQUFRLEdBQUdSLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLFVBQVUsQ0FBQztBQUVwRCxNQUFNTSxN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