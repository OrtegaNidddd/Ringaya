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
let players = { X: 'Jugador X', O: 'Jugador O' };
let lastWin = null; // trío ganador para redibujar
let confetti = null; // controlador confeti

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// Rutas de imágenes internas (en /public/assets/)
const ASSETS = {
  WIN:  '/assets/win.png',
  LOSE: '/assets/lose.png'
};

// ===== LocalStorage helpers =====
const lsGet = (k,f)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? f; }catch{ return f; } };
const lsSet = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

// ===== Marcador =====
function loadScore(){
  const s = lsGet('tictactoe-score', {X:0,O:0,T:0});
  scoreX.textContent = s.X; scoreO.textContent = s.O; scoreT.textContent = s.T;
}
function saveScore(delta){
  const s = { X:+scoreX.textContent, O:+scoreO.textContent, T:+scoreT.textContent };
  s[delta] += 1; lsSet('tictactoe-score', s); loadScore();
}

// ===== Jugadores =====
function applyPlayersToUI(){
  nameXEl.textContent = players.X;
  nameOEl.textContent = players.O;
  nameXEl.title = players.X;
  nameOEl.title = players.O;
  updateTurnUI();
}
function loadPlayers(){
  const saved = lsGet('tictactoe-players', null);
  if (saved?.X && saved?.O){
    players = saved;
    gameReady = true;
    playersCard.classList.add('hidden');
    veilEl.classList.add('hidden');
    boardEl.classList.remove('pointer-events-none','opacity-60');
    applyPlayersToUI();
  } else {
    gameReady = false;
    playersCard.classList.remove('hidden');
    veilEl.classList.remove('hidden');
    boardEl.classList.add('pointer-events-none','opacity-60');
  }
}
function validateNames(x, o){
  const nx = (x||'').trim(), no = (o||'').trim();
  return !!nx && !!no && nx.toLowerCase() !== no.toLowerCase();
}

// ===== UI =====
function showToast(msg){
  toastMsg.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.classList.add('animate-pop');
  setTimeout(() => toastEl.classList.add('hidden'), 1600);
}
function drawMark(cell, mark){
  cell.innerHTML = mark === 'X'
    ? `<svg width="84" height="84" viewBox="0 0 100 100" class="drop-shadow">
         <path d="M20 20 L80 80 M80 20 L20 80" stroke="rgb(244,114,182)" stroke-width="12" stroke-linecap="round" fill="none"/>
       </svg>`
    : `<svg width="84" height="84" viewBox="0 0 100 100" class="drop-shadow">
         <circle cx="50" cy="50" r="32" stroke="rgb(34,211,238)" stroke-width="12" fill="none"/>
       </svg>`;
  cell.classList.add('animate-pop');
}
function updateTurnUI(){
  turnEl.textContent = current;
  const who = current === 'X' ? players.X : players.O;
  turnNameEl.textContent = `(${who})`;
  turnNameEl.title = `(${who})`;
}

// ===== Línea ganadora =====
function clearWinningLine(){
  winSvg.style.opacity = 0;
  winLine.removeAttribute('stroke-dasharray');
  winLine.removeAttribute('stroke-dashoffset');
  lastWin = null;
}
function drawWinningLine(winTriple){
  const [a,,c] = winTriple;
  const boardRect = boardEl.getBoundingClientRect();
  const rA = CELLS[a].getBoundingClientRect();
  const rC = CELLS[c].getBoundingClientRect();

  const x1 = (rA.left - boardRect.left) + rA.width  / 2;
  const y1 = (rA.top  - boardRect.top ) + rA.height / 2;
  const x2 = (rC.left - boardRect.left) + rC.width  / 2;
  const y2 = (rC.top  - boardRect.top ) + rC.height / 2;

  const w = Math.round(boardRect.width);
  const h = Math.round(boardRect.height);
  winSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  winSvg.setAttribute('width',  `${w}`);
  winSvg.setAttribute('height', `${h}`);

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
window.addEventListener('resize', () => { if (lock && lastWin) drawWinningLine(lastWin); });

// ===== Confeti =====
function makeConfettiController(canvas){
  const ctx = canvas.getContext('2d');
  const colors = ['#e879f9','#22d3ee','#f472b6','#60a5fa','#fbbf24','#34d399'];
  let W, H, particles = [], running = false, rafId = null, startAt = 0, duration = 2600;

  function size(){
    W = canvas.width  = canvas.clientWidth;
    H = canvas.height = canvas.clientHeight;
  }
  function spawn(n=180){
    particles.length = 0;
    for(let i=0;i<n;i++){
      particles.push({
        x: Math.random()*W,
        y: -20 - Math.random()*H*0.4,
        r: 4 + Math.random()*4,
        c: colors[(Math.random()*colors.length)|0],
        vx: -1.5 + Math.random()*3,
        vy: 2 + Math.random()*2.5,
        rot: Math.random()*Math.PI*2,
        vr: -0.2 + Math.random()*0.4,
        shape: Math.random()<0.5 ? 'rect' : 'circle',
        alpha: 0.9
      });
    }
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(const p of particles){
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if(p.shape==='rect'){
        ctx.fillRect(-p.r, -p.r, p.r*2, p.r*2);
      }else{
        ctx.beginPath();
        ctx.arc(0,0,p.r,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.rot += p.vr;

      if(p.y > H + 40) { p.y = -20; p.x = Math.random()*W; p.vy = 2 + Math.random()*2.5; }
    }
  }
  function loop(ts){
    if(!running) return;
    if(!startAt) startAt = ts;
    draw();
    if(ts - startAt < duration){ rafId = requestAnimationFrame(loop); }
    else { stop(); }
  }
  function start(){ size(); spawn(); running = true; startAt = 0; rafId = requestAnimationFrame(loop); }
  function stop(){ running = false; if(rafId) cancelAnimationFrame(rafId); ctx.clearRect(0,0,W,H); }
  window.addEventListener('resize', () => { if(running){ size(); } });
  return { start, stop };
}

// ===== Lógica de juego =====
function checkWinner() {
  for (const triple of WINS){
    const [a,b,c] = triple;
    if (board[a] && board[a] === board[b] && board[a] === board[c]){
      [a,b,c].forEach(i => CELLS[i].classList.add('winner'));
      return triple;
    }
  }
  if (board.every(v => v)) return 'T';
  return null;
}

function handleClick(e){
  if (!gameReady) return;
  const cell = e.currentTarget;
  const i = +cell.dataset.i;
  if (lock || board[i]) return;

  board[i] = current;
  drawMark(cell, current);

  const result = checkWinner();
  if (result){
    lock = true;
    if (result === 'T'){
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
          showToast(`🎉 ¡Gana ${current} — ${current === 'X' ? players.X : players.O}!`);
        }, 0);
      });
    }
    return;
  }

  current = current === 'X' ? 'O' : 'X';
  updateTurnUI();
}

function resetBoard(){
  lock = false;
  board = Array(9).fill('');
  current = 'X';
  updateTurnUI();
  CELLS.forEach(c => { c.innerHTML=''; c.classList.remove('winner'); });
  clearWinningLine();
}

// ===== Marcador y eventos básicos =====
function clearScore(){
  lsSet('tictactoe-score', {X:0,O:0,T:0});
  loadScore();
  showToast('🧹 Marcador limpiado');
}
CELLS.forEach(c => c.addEventListener('click', handleClick));
btnReset.addEventListener('click', () => { resetBoard(); showToast('↻ Nueva ronda'); });
btnClear.addEventListener('click', clearScore);

// Cambiar jugadores
btnChangePlayers.addEventListener('click', () => {
  playerXInput.value = players.X; playerOInput.value = players.O;
  playersError.classList.add('hidden');
  playersCard.classList.remove('hidden');

  gameReady = false;
  veilEl.classList.remove('hidden');
  boardEl.classList.add('pointer-events-none','opacity-60');
});
playersForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const x = playerXInput.value, o = playerOInput.value;
  if (!validateNames(x,o)){ playersError.classList.remove('hidden'); return; }
  playersError.classList.add('hidden');

  players = { X: x.trim(), O: o.trim() };
  lsSet('tictactoe-players', players);
  applyPlayersToUI();

  playersCard.classList.add('hidden');
  veilEl.classList.add('hidden');
  boardEl.classList.remove('pointer-events-none','opacity-60');
  gameReady = true;

  resetBoard();
  showToast(`🙌 ¡A jugar, ${players.X} (X) y ${players.O} (O)!`);
});

// ===== Celebración con imágenes internas =====
function launchCelebration(winner){
  // Ganador y perdedor
  const loser = winner === 'X' ? 'O' : 'X';
  const whoWinName = winner === 'X' ? players.X : players.O;
  const whoLoseName = loser  === 'X' ? players.X : players.O;

  // Setear imágenes internas
  imgWin.src  = ASSETS.WIN;
  imgLose.src = ASSETS.LOSE;
  whoWin.textContent  = `${winner} — ${whoWinName}`;
  whoLose.textContent = `${loser} — ${whoLoseName}`;

  // Mostrar overlay
  celebration.classList.remove('hidden');
  celebration.classList.add('flex');

  // Iniciar confeti
  if(!confetti) confetti = makeConfettiController(confettiCanvas);
  confetti.start();
}
function closeCelebration(){
  celebration.classList.add('hidden');
  celebration.classList.remove('flex');
  if(confetti) confetti.stop();
}
btnCloseCelebration.addEventListener('click', closeCelebration);
btnNextRound.addEventListener('click', ()=>{
  closeCelebration();
  resetBoard();
});

// ===== Init =====
loadScore();
loadPlayers();
updateTurnUI();
