"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const wrap = document.querySelector("#gameWrap");
const scoreEl = document.querySelector("#score");
const damageEl = document.querySelector("#damage");
const fireRateEl = document.querySelector("#fireRate");
const startScreen = document.querySelector("#startScreen");
const upgradeScreen = document.querySelector("#upgradeScreen");
const gameOverScreen = document.querySelector("#gameOverScreen");
const upgradeChoices = document.querySelector("#upgradeChoices");
const finalScore = document.querySelector("#finalScore");

const state = {
  mode: "start",
  score: 0,
  elapsed: 0,
  lastTime: 0,
  fireTimer: 0,
  nextId: 1,
  bullets: [],
  particles: [],
  snake: [],
  trail: [],
  headDistance: 0,
  player: { x: 210, targetX: 210, y: 660, width: 34, height: 36, speed: 750 },
  weapon: { damage: 1, shotsPerSecond: 2.7, bullets: 1, spread: 0, pierce: 0 },
  pointerDown: false
};

const SEGMENT_SPACING = 33;
const SEGMENT_RADIUS = 14;
const UPGRADE_INTERVAL = 5;

function resizeCanvas() {
  const rect = wrap.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  state.width = rect.width;
  state.height = rect.height;
  state.player.y = rect.height - 50;
  state.player.x = Math.min(state.player.x, rect.width - 22);
  state.player.targetX = state.player.x;
}

function resetGame() {
  state.score = 0;
  state.elapsed = 0;
  state.fireTimer = 0;
  state.bullets = [];
  state.particles = [];
  state.trail = [];
  state.headDistance = 0;
  state.player.x = state.width / 2;
  state.player.targetX = state.player.x;
  state.weapon = { damage: 1, shotsPerSecond: 2.7, bullets: 1, spread: 0, pierce: 0 };
  createSnake(26);
  refreshHud();
}

function createSnake(count) {
  state.snake = [];
  for (let i = 0; i < count; i++) {
    const upgrade = i === 1 || (i > 1 && (i - 1) % UPGRADE_INTERVAL === 0);
    state.snake.push({
      id: state.nextId++,
      upgrade,
      hp: upgrade ? 3 : (i === 0 ? 4 : 2),
      maxHp: upgrade ? 3 : (i === 0 ? 4 : 2),
      x: state.width / 2,
      y: -40 - i * SEGMENT_SPACING
    });
  }
}

function startGame() {
  resetGame();
  state.mode = "playing";
  state.lastTime = performance.now();
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function pathPoint(distance) {
  const y = -35 + distance;
  const amplitude = Math.max(55, state.width * .34);
  const center = state.width / 2;
  const x = center + Math.sin(distance / 72) * amplitude;
  return { x, y };
}

function update(dt) {
  state.elapsed += dt;
  const speed = Math.min(35 + state.elapsed * .45, 70);
  state.headDistance += speed * dt;

  for (let i = 0; i < state.snake.length; i++) {
    const p = pathPoint(state.headDistance - i * SEGMENT_SPACING);
    state.snake[i].x = p.x;
    state.snake[i].y = p.y;
  }

  const dx = state.player.targetX - state.player.x;
  const maxStep = state.player.speed * dt;
  state.player.x += Math.sign(dx) * Math.min(Math.abs(dx), maxStep);
  state.player.x = Math.max(20, Math.min(state.width - 20, state.player.x));

  state.fireTimer -= dt;
  if (state.fireTimer <= 0) {
    fireWeapon();
    state.fireTimer += 1 / state.weapon.shotsPerSecond;
  }

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
  }
  handleHits();
  state.bullets = state.bullets.filter(b => b.y > -25 && !b.dead);

  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);

  if (state.snake.length === 0) {
    createSnake(28);
    state.headDistance = 0;
    state.score += 500;
  } else if (state.snake[0].y + SEGMENT_RADIUS >= state.player.y - 22) {
    endGame();
  }
}

function fireWeapon() {
  const count = state.weapon.bullets;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * state.weapon.spread;
    state.bullets.push({ x: state.player.x, y: state.player.y - 25, vx: offset * 3, vy: -510, hitsLeft: state.weapon.pierce + 1, dead: false });
  }
}

function handleHits() {
  outer: for (const bullet of state.bullets) {
    for (let i = 0; i < state.snake.length; i++) {
      const segment = state.snake[i];
      if (Math.hypot(bullet.x - segment.x, bullet.y - segment.y) < SEGMENT_RADIUS + 4) {
        segment.hp -= state.weapon.damage;
        bullet.hitsLeft--;
        burst(segment.x, segment.y, segment.upgrade ? "#ffd35f" : "#63ef98", 5);
        if (bullet.hitsLeft <= 0) bullet.dead = true;
        if (segment.hp <= 0) destroySegment(i);
        if (bullet.dead) continue outer;
      }
    }
  }
}

function destroySegment(index) {
  const [destroyed] = state.snake.splice(index, 1);
  state.score += destroyed.upgrade ? 100 : 25;
  burst(destroyed.x, destroyed.y, destroyed.upgrade ? "#ffe083" : "#75ffac", 16);

  // Das erste noch intakte Segment wird sofort zum neuen Kopf.
  // Alle verbleibenden Segmente rücken in der Pfadfolge lückenlos nach vorn.
  refreshHud();
  if (destroyed.upgrade) openUpgrade();
}

function openUpgrade() {
  state.mode = "upgrade";
  const pool = [
    { name: "+1 Schaden", text: "Jedes Geschoss verursacht mehr Schaden.", apply: () => state.weapon.damage++ },
    { name: "+20 % Feuerrate", text: "Die Pistole schießt deutlich schneller.", apply: () => state.weapon.shotsPerSecond *= 1.2 },
    { name: state.weapon.bullets < 3 ? "+1 Geschoss" : "+1 Durchschlag", text: state.weapon.bullets < 3 ? "Ein zusätzliches Geschoss pro Schuss." : "Geschosse treffen ein weiteres Segment.", apply: () => state.weapon.bullets < 3 ? (state.weapon.bullets++, state.weapon.spread = 24) : state.weapon.pierce++ },
    { name: "+1 Durchschlag", text: "Geschosse können ein weiteres Segment treffen.", apply: () => state.weapon.pierce++ }
  ];
  const choices = shuffle(pool).slice(0, 3);
  upgradeChoices.replaceChildren();
  for (const choice of choices) {
    const button = document.createElement("button");
    button.className = "upgrade-choice";
    button.innerHTML = `${choice.name}<span>${choice.text}</span>`;
    button.addEventListener("click", () => {
      choice.apply();
      refreshHud();
      upgradeScreen.classList.add("hidden");
      state.mode = "playing";
      state.lastTime = performance.now();
    });
    upgradeChoices.append(button);
  }
  upgradeScreen.classList.remove("hidden");
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - .5);
}

function endGame() {
  state.mode = "gameover";
  finalScore.textContent = state.score;
  gameOverScreen.classList.remove("hidden");
}

function refreshHud() {
  scoreEl.textContent = state.score;
  damageEl.textContent = state.weapon.damage;
  fireRateEl.textContent = `${(state.weapon.shotsPerSecond / 2.7).toFixed(1)}×`;
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 90;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .25 + Math.random() * .35, color });
  }
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  drawBackground();
  for (let i = state.snake.length - 1; i >= 0; i--) drawSegment(state.snake[i], i === 0);
  drawBullets();
  drawPlayer();
  drawParticles();
}

function drawBackground() {
  ctx.fillStyle = "#06141d";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.strokeStyle = "rgba(70, 160, 190, .08)";
  ctx.lineWidth = 1;
  for (let y = 20; y < state.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.width, y); ctx.stroke();
  }
  for (let x = 20; x < state.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, state.height); ctx.stroke();
  }
  const danger = state.player.y - 34;
  ctx.strokeStyle = "rgba(255, 80, 80, .3)";
  ctx.setLineDash([8, 9]);
  ctx.beginPath(); ctx.moveTo(0, danger); ctx.lineTo(state.width, danger); ctx.stroke();
  ctx.setLineDash([]);
}

function drawSegment(segment, isHead) {
  if (segment.y < -30 || segment.y > state.height + 30) return;
  ctx.save();
  ctx.translate(segment.x, segment.y);
  if (segment.upgrade) {
    ctx.shadowColor = "#ffd35f"; ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffd35f";
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-11, -11, 22, 22);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "#5b3a05";
    ctx.font = "bold 17px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("+", 0, 0);
  } else {
    const gradient = ctx.createRadialGradient(-4, -5, 2, 0, 0, SEGMENT_RADIUS);
    gradient.addColorStop(0, isHead ? "#b7ffd0" : "#78f4a4");
    gradient.addColorStop(1, isHead ? "#1e9d55" : "#146e3d");
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(0, 0, isHead ? 17 : SEGMENT_RADIUS, 0, Math.PI * 2); ctx.fill();
    if (isHead) {
      ctx.fillStyle = "#06130c";
      ctx.beginPath(); ctx.arc(-6, -4, 2.5, 0, Math.PI * 2); ctx.arc(6, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  const ratio = Math.max(0, segment.hp / segment.maxHp);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(-14, 20, 28, 3);
  ctx.fillStyle = ratio > .5 ? "#68efa0" : "#ff6d64"; ctx.fillRect(-14, 20, 28 * ratio, 3);
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = "#ffda70";
  ctx.shadowColor = "#ffc84a"; ctx.shadowBlur = 10;
  for (const bullet of state.bullets) ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 12);
  ctx.shadowBlur = 0;
}

function drawPlayer() {
  const { x, y } = state.player;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "#4bc5ee";
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(17, 18); ctx.lineTo(7, 14); ctx.lineTo(0, 20); ctx.lineTo(-7, 14); ctx.lineTo(-17, 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#d5f6ff"; ctx.fillRect(-3, -31, 6, 15);
  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function setPointer(clientX) {
  const rect = canvas.getBoundingClientRect();
  state.player.targetX = clientX - rect.left;
}

canvas.addEventListener("pointerdown", event => {
  if (state.mode !== "playing") return;
  state.pointerDown = true;
  canvas.setPointerCapture(event.pointerId);
  setPointer(event.clientX);
});
canvas.addEventListener("pointermove", event => {
  if (state.pointerDown && state.mode === "playing") setPointer(event.clientX);
});
canvas.addEventListener("pointerup", event => {
  state.pointerDown = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener("pointercancel", () => state.pointerDown = false);

document.querySelector("#startButton").addEventListener("click", startGame);
document.querySelector("#restartButton").addEventListener("click", startGame);
window.addEventListener("resize", resizeCanvas);

function loop(time) {
  const dt = Math.min((time - (state.lastTime || time)) / 1000, .033);
  state.lastTime = time;
  if (state.mode === "playing") update(dt);
  draw();
  requestAnimationFrame(loop);
}

resizeCanvas();
createSnake(26);
requestAnimationFrame(loop);
