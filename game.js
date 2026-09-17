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
const headSprite = new Image();
headSprite.src = "snake-head.png";
const bodySprite = new Image();
bodySprite.src = "snake-body.png";
const progress = SnakeProgress.open({
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value)
});

const state = {
  mode: "start",
  score: 0,
  runCoins: 0,
  elapsed: 0,
  lastTime: 0,
  fireTimer: 0,
  nextId: 1,
  difficultyRate: 0.15,
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
const SEGMENT_HIT_RADIUS = 25;
const UPGRADE_INTERVAL = 5;
const SEGMENTS_PER_SNAKE = 100;

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
  releaseDrag();
  state.score = 0;
  state.runCoins = 0;
  state.elapsed = 0;
  state.fireTimer = 0;
  state.bullets = [];
  state.particles = [];
  state.trail = [];
  state.headDistance = 0;
  state.player.x = state.width / 2;
  state.player.targetX = state.player.x;
  state.weapon = { damage: 1 + progress.data.damageLevel, shotsPerSecond: 2.7 * (1 + progress.data.rateLevel * .10), bullets: 1, spread: 0, pierce: 0 };
  createSnake(SEGMENTS_PER_SNAKE);
  refreshHud();
}

function createSnake(count) {
  state.snake = [];
  for (let i = 0; i < count; i++) {
    const upgrade = i === 1 || (i > 1 && (i - 1) % UPGRADE_INTERVAL === 0);
    // Nur Körperteile speichern HP; Kopftreffer werden an das erste weitergeleitet.
    // Runde erst den Endwert: 5 * 1.1^i ergibt auf Leicht 5, 6, 6, 7 …
    // Upgrade-Teile folgen derselben HP-Kurve.
    const scaledHp = Math.round(5 * (1 + state.difficultyRate) ** i);
    state.snake.push({
      id: state.nextId++,
      pathOffset: (i + 1) * SEGMENT_SPACING,
      upgrade,
      hp: scaledHp,
      maxHp: scaledHp,
      x: state.width / 2,
      y: -40 - i * SEGMENT_SPACING
    });
  }
}

function startGame() {
  const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
  state.difficultyRate = Number(selectedDifficulty?.value || 0.15);
  progress.data.difficulty = state.difficultyRate;
  progress.data.runs = Math.min(1000000000, progress.data.runs + 1);
  progress.save();
  renderProfile();
  resetGame();
  state.mode = "playing";
  state.lastTime = performance.now();
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function pathPoint(distance) {
  const radius = 26;
  const left = 54;
  const right = Math.max(left + 20, state.width - 54);
  const width = right - left;
  if (distance < 0) return { x: left, y: 38 + distance, angle: Math.PI / 2 };
  const length = width + Math.PI * radius;
  const row = Math.floor(distance / length);
  const d = distance - row * length;
  const forward = row % 2 === 0;
  const y = 38 + row * radius * 2;
  if (d <= width) return {
    x: forward ? left + d : right - d, y,
    angle: forward ? 0 : Math.PI
  };
  const t = (d - width) / radius;
  return {
    x: forward ? right + radius * Math.sin(t) : left - radius * Math.sin(t),
    y: y + radius * (1 - Math.cos(t)),
    angle: forward ? t : Math.PI - t
  };
}

function snakeHead() {
  if (!state.snake.length) return null;
  return pathPoint(state.headDistance - state.snake[0].pathOffset + SEGMENT_SPACING);
}

function syncSnakePositions() {
  for (const segment of state.snake) {
    Object.assign(segment, pathPoint(state.headDistance - segment.pathOffset));
  }
}

function update(dt) {
  state.elapsed += dt;
  // Die Schlange beginnt langsamer und beschleunigt nur behutsam.
  const speed = Math.min(22 + state.elapsed * .25, 45);
  state.headDistance += speed * dt;

  syncSnakePositions();

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
  if (state.mode !== "playing") return;

  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);

  if (state.snake.length === 0) {
    state.headDistance = 0;
    createSnake(SEGMENTS_PER_SNAKE);
    syncSnakePositions();
    state.score += 500;
    progress.data.best = Math.max(progress.data.best, state.score);
    progress.save();
    refreshHud();
  } else if (snakeHead().y + SEGMENT_RADIUS >= state.player.y - 22) {
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
    if (bullet.dead) continue;
    bullet.hitIds ||= new Set();
    for (let i = 0; i < state.snake.length; i++) {
      const segment = state.snake[i];
      const head = i === 0 ? snakeHead() : null;
      const hitsHead = head && Math.hypot(bullet.x - head.x, bullet.y - head.y) < SEGMENT_HIT_RADIUS;
      if (!bullet.hitIds.has(segment.id) && (hitsHead || Math.hypot(bullet.x - segment.x, bullet.y - segment.y) < SEGMENT_HIT_RADIUS)) {
        bullet.hitIds.add(segment.id);
        segment.hp -= state.weapon.damage;
        bullet.hitsLeft--;
        burst(segment.x, segment.y, segment.upgrade ? "#ffd35f" : "#63ef98", 5);
        if (bullet.hitsLeft <= 0) bullet.dead = true;
        const destroyed = segment.hp <= 0;
        if (destroyed) destroySegment(i);
        if (state.mode !== "playing") return;
        // Ein Zurückrücken darf nicht dasselbe Geschoss auf weitere Teile
        // teleportieren. Durchschlag läuft im nächsten Simulationsschritt weiter.
        if (destroyed) continue outer;
        if (bullet.dead) continue outer;
      }
    }
  }
}

function destroySegment(index) {
  const [destroyed] = state.snake.splice(index, 1);
  state.score += destroyed.upgrade ? 100 : 25;
  const coins = destroyed.upgrade ? 5 : 1;
  state.runCoins += coins;
  progress.reward(coins, state.score);
  document.querySelector("#saveStatus").textContent = progress.message;
  burst(destroyed.x, destroyed.y, destroyed.upgrade ? "#ffe083" : "#75ffac", 16);

  // Nur der Abschnitt vor der Lücke (Richtung Kopf) fällt zurück.
  // Größere Pfad-Offsets bedeuten weiter hinten auf derselben Bahn.
  for (let i = 0; i < index; i++) state.snake[i].pathOffset += SEGMENT_SPACING;
  syncSnakePositions();
  refreshHud();
  if (destroyed.upgrade) openUpgrade();
}

function openUpgrade() {
  state.mode = "upgrade";
  releaseDrag();
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
  if (state.mode === "gameover") return;
  releaseDrag();
  state.mode = "gameover";
  progress.data.best = Math.max(progress.data.best, state.score);
  progress.save();
  renderProfile();
  document.querySelector("#runSummary").textContent = state.runCoins + " Münzen verdient · bleiben erhalten";
  finalScore.textContent = state.score;
  gameOverScreen.classList.remove("hidden");
}

function refreshHud() {
  scoreEl.textContent = state.score;
  damageEl.textContent = state.weapon.damage;
  fireRateEl.textContent = `${(state.weapon.shotsPerSecond / 2.7).toFixed(1)}×`;
}

function renderProfile() {
  const p = progress.data;
  document.querySelector("#profileStats").textContent =
    p.coins + " Münzen · Rekord " + p.best + " · " + p.defeated + " Teile besiegt · " + p.runs + " Runden";
  for (const [id, key, title] of [
    ["buyDamage", "damageLevel", "+1 Startschaden"],
    ["buyRate", "rateLevel", "+10 % Basisfeuerrate"]
  ]) {
    const button = document.querySelector("#" + id);
    button.textContent = title + " · Stufe " + p[key] + "/30 · " +
      (p[key] >= 30 ? "Maximum" : progress.cost(key) + " Münzen");
    button.disabled = p[key] >= 30 || p.coins < progress.cost(key);
  }
  document.querySelector("#saveStatus").textContent = progress.message;
}

function showMenu() {
  releaseDrag();
  state.mode = "start";
  gameOverScreen.classList.add("hidden");
  upgradeScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  renderProfile();
}

function restoreDifficulty() {
  const radio = document.querySelector('input[name="difficulty"][value="' + progress.data.difficulty.toFixed(2) + '"]');
  if (radio) radio.checked = true;
}

document.querySelector("#menuButton").addEventListener("click", showMenu);
for (const [id, key] of [["buyDamage", "damageLevel"], ["buyRate", "rateLevel"]]) {
  document.querySelector("#" + id).addEventListener("click", () => {
    if (state.mode !== "start") return;
    progress.buy(key);
    renderProfile();
  });
}
document.querySelector("#exportSave").addEventListener("click", () => {
  const text = progress.export();
  document.querySelector("#saveText").value = text;
  const url = URL.createObjectURL(new Blob([text], {type: "application/json"}));
  const link = document.createElement("a");
  link.href = url; link.download = "The-Snake-Spielstand.json";
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  document.querySelector("#transferStatus").textContent = "Sicherung bereit. Alternativ den Text kopieren.";
});
document.querySelector("#saveFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 20000) throw new Error("Datei ist zu groß.");
    document.querySelector("#saveText").value = await file.text();
    document.querySelector("#transferStatus").textContent = "Datei geladen. Zum Import auf „Sicherung übernehmen“ tippen.";
  } catch {
    document.querySelector("#transferStatus").textContent = "Datei konnte nicht gelesen werden.";
  }
});
document.querySelector("#importSave").addEventListener("click", () => {
  if (state.mode !== "start") return;
  const text = document.querySelector("#saveText").value;
  try {
    if (text.length > 20000) throw new Error("Sicherung ist zu groß.");
    SnakeProgress.validate(JSON.parse(text));
    if (!window.confirm("Den lokalen Fortschritt durch diese Sicherung ersetzen? Vorher bei Bedarf exportieren.")) return;
    progress.import(text);
    restoreDifficulty();
    renderProfile();
    document.querySelector("#transferStatus").textContent = "Spielstand übernommen.";
  } catch {
    document.querySelector("#transferStatus").textContent = "Import fehlgeschlagen: ungültige Sicherung oder Speicher nicht verfügbar. Fortschritt wurde nicht ersetzt.";
  }
});

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
  for (let i = state.snake.length - 1; i >= 0; i--) drawSegment(state.snake[i], false);
  const head = snakeHead();
  if (head) drawSegment(head, true);
  // Nach allen Sprites zeichnen, damit Nachbarteile die Zahlen nicht verdecken.
  for (const segment of state.snake) drawHpLabel(segment);
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

function drawHpLabel(segment) {
  if (segment.y < 0 || segment.y > state.height + 30) return;
  const label = String(Math.max(0, Math.ceil(segment.hp)));
  ctx.save();
  ctx.font = "bold 11px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#031019";
  ctx.fillStyle = segment.upgrade ? "#ffe083" : "#ffffff";
  ctx.strokeText(label, segment.x, segment.y - 23, 31);
  ctx.fillText(label, segment.x, segment.y - 23, 31);
  ctx.restore();
}

function drawSegment(segment, isHead) {
  if (segment.y < -30 || segment.y > state.height + 30) return;
  ctx.save();
  ctx.translate(segment.x, segment.y);
  const sprite = isHead ? headSprite : bodySprite;
  if (sprite.complete && sprite.naturalWidth) {
    ctx.save();
    ctx.rotate(segment.angle || 0);
    const size = isHead ? 44 : 38;
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
    if (segment.upgrade) {
      ctx.strokeStyle = "#ffd35f"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#ffd35f"; ctx.font = "bold 16px system-ui";
      ctx.textAlign = "center"; ctx.fillText("+", 0, 6);
    }
    if (!isHead) {
      ctx.fillStyle = "#142d24"; ctx.fillRect(-14, 22, 28, 3);
      ctx.fillStyle = "#77efa0"; ctx.fillRect(-14, 22, 28 * Math.max(0, segment.hp / segment.maxHp), 3);
    }
    ctx.restore();
    return;
  }
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
  // Nur Körperteile haben HP-Anzeigen; der separat gezeichnete Kopf hat keine.
  if (!isHead) {
    const ratio = Math.max(0, segment.hp / segment.maxHp);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(-14, 20, 28, 3);
    ctx.fillStyle = ratio > .5 ? "#68efa0" : "#ff6d64"; ctx.fillRect(-14, 20, 28 * ratio, 3);
  }
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
  const delta = clientX - state.lastPointerX;
  state.lastPointerX = clientX;
  state.player.targetX = Math.max(20, Math.min(state.width - 20, state.player.targetX + delta));
}

function releaseDrag() {
  const id = state.pointerId;
  state.pointerDown = false;
  state.pointerId = null;
  state.player.targetX = state.player.x;
  if (id != null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
}

canvas.addEventListener("pointerdown", event => {
  if (state.mode !== "playing" || state.pointerDown) return;
  state.pointerDown = true;
  state.pointerId = event.pointerId;
  state.lastPointerX = event.clientX;
  state.player.targetX = state.player.x;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (state.pointerDown && event.pointerId === state.pointerId && state.mode === "playing") setPointer(event.clientX);
});
canvas.addEventListener("pointerup", event => {
  if (event.pointerId === state.pointerId) releaseDrag();
});
canvas.addEventListener("pointercancel", releaseDrag);
canvas.addEventListener("lostpointercapture", releaseDrag);
window.addEventListener("blur", releaseDrag);

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
createSnake(SEGMENTS_PER_SNAKE);
restoreDifficulty();
renderProfile();
requestAnimationFrame(loop);
