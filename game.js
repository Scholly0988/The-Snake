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
const playerSprite = new Image();
playerSprite.src = "player-front.png";
const paladinSprite = new Image();
paladinSprite.src = "paladin-front.png";
const necromancerSprite = new Image();
necromancerSprite.src = "necromancer-platform.png";
const hammerSprite = new Image();
hammerSprite.src = "holy-hammer.png";
// Keep only the 32px centre platform in bounds; side companions may overhang.
const PLAYER_EDGE_MARGIN = 16;
const PLAYER_MUZZLE_Y = -20; // Sprite placement, independent of projectile origin.
const PLATFORM_SHOT_Y = 28; // Centre of the platform below the character.
function clampPlayerX(x) {
  const margin = Math.min(PLAYER_EDGE_MARGIN, state.width / 2);
  return Math.max(margin, Math.min(state.width - margin, x));
}
const progress = SnakeProgress.open({
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value)
});

const state = {
  mode: "start",
  selectedLevel: progress.data.selectedLevel, level: 1,
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
  weapon: { damage: 1, shotsPerSecond: 2.7, bullets: 1, spread: 0, pierce: 0, critChance: 0, critDamage: 150 },
  necromancer: null, souls: [], soulEffects: [], necroDeaths: [], paladin: null, holyEffects: [], pendingUpgrades: 0, upgradeOfferId: 0,
  pointerDown: false
};

const SNAKE_SCALE = .9;
const SEGMENT_SPACING = 33 * SNAKE_SCALE;
const SEGMENT_RADIUS = 14;
const SEGMENT_HIT_RADIUS = 25;
const UPGRADE_INTERVAL = 5;
const SEGMENTS_PER_SNAKE = 100;

const LEVELS=[{first:5,last:5500},{first:15,last:9000},{first:32,last:14500}];
function levelSegmentHp(level,index,count) {
  const {first,last}=LEVELS[level-1];
  if(count<=1)return first;
  return Math.min(last-(count-1-index),Math.max(first+index,Math.round(first*(last/first)**(index/(count-1)))));
}
function difficultyMultiplier(difficulty=progress.data.difficulty) { return difficulty===.20?2:difficulty===.15?1.5:1; }
function renderLevelPicker() {
  const level=state.selectedLevel, config=LEVELS[level-1];
  const multiplier=difficultyMultiplier();
  const key=(level-1)*3+[.10,.15,.20].indexOf(progress.data.difficulty);
  document.querySelector("#rewardInfo").textContent="Münzen: "+level*multiplier+" / "+level*5*multiplier+" pro Segment · Abschluss +"+level*50*multiplier+" · "+(progress.data.firstClears[key]?"Erstbonus erhalten":"Erstbonus +"+level*100*multiplier);
  const locked=level>progress.data.completedLevels+1;
  document.querySelector("#levelName").textContent="Level "+level+(locked?" · Gesperrt":level<=progress.data.completedLevels?" · Abgeschlossen":"");
  document.querySelector("#levelInfo").textContent=locked?"Schließe zuerst Level "+(level-1)+" ab.":Math.round(config.first*multiplier)+"–"+Math.round(config.last*multiplier).toLocaleString("de-DE")+" Leben · 100 Segmente";
  document.querySelector("#previousLevel").disabled=level===1;
  document.querySelector("#nextLevel").disabled=level===3;
  document.querySelector("#startButton").disabled=locked;
}
function changeLevel(delta) {
  if(state.mode!=="start")return;
  state.selectedLevel=Math.max(1,Math.min(3,state.selectedLevel+delta));
  if(state.selectedLevel<=progress.data.completedLevels+1){
    progress.data.selectedLevel=state.selectedLevel;progress.save();
  }
  renderLevelPicker();
}
function completeLevel() {
  if(state.mode!=="playing"||state.snake.length)return;
  releaseDrag();state.mode="victory";state.pendingUpgrades=0;
  state.score+=500;progress.data.best=Math.max(progress.data.best,state.score);
  const multiplier=difficultyMultiplier(state.runDifficulty);
  const key=(state.level-1)*3+[.10,.15,.20].indexOf(state.runDifficulty);
  const completionCoins=state.level*50*multiplier;
  const firstCoins=progress.data.firstClears[key]?0:state.level*100*multiplier;
  progress.completeLevel(state.level,state.runDifficulty);
  state.runCoins+=completionCoins+firstCoins;
  upgradeScreen.classList.add("hidden");
  document.querySelector("#resultEyebrow").textContent="SCHLANGE BESIEGT";
  document.querySelector("#resultTitle").textContent="Level "+state.level+" abgeschlossen!";
  document.querySelector("#runSummary").textContent=Math.floor(state.runCoins)+" Münzen verdient · Abschluss +"+completionCoins+(firstCoins?" · Erstabschluss +"+firstCoins:"")+" · "+(state.level<3?"Level "+(state.level+1)+" freigeschaltet":"Alle drei Level abgeschlossen");
  finalScore.textContent=state.score;
  gameOverScreen.classList.remove("hidden");renderProfile();refreshHud();
}
function resizeCanvas() {
  // CSS owns layout; bitmap resolution must never enlarge the grid or canvas.
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  state.width = rect.width;
  state.height = rect.height;
  state.player.y = rect.height - 50;
  state.player.x = clampPlayerX(state.player.x);
  state.player.targetX = state.player.x;
}

function resetGame() {
  releaseDrag();
  state.skillUpgrades=[...progress.data.skillUpgrades];
  state.level=state.selectedLevel;
  state.runDifficulty=progress.data.difficulty;
  state.paladin = newPaladin(progress.data.paladinSlot);
  state.necromancer = newNecromancer(progress.data.necromancerSlot);
  state.souls=[]; state.soulEffects=[]; state.necroDeaths=[];
  state.holyEffects = [];
  state.pendingUpgrades = 0;
  state.lastUpgrade=null;
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
  state.weapon = { damage: 1 + progress.data.damageLevel, shotsPerSecond: 2.7 * (1 + progress.data.rateLevel * .10), bullets: 1, spread: 0, pierce: 0, critChance: progress.data.critChanceLevel, critDamage: 150 + 25 * progress.data.critDamageLevel };
  createSnake(SEGMENTS_PER_SNAKE);
  refreshHud();
}

function createSnake(count) {
  state.snake = [];
  for (let i = 0; i < count; i++) {
    const upgrade = i === 1 || (i > 1 && (i - 1) % UPGRADE_INTERVAL === 0);
    const scaledHp = Math.round(levelSegmentHp(state.level,i,count)*difficultyMultiplier(state.runDifficulty??.10));
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
  if(state.selectedLevel>progress.data.completedLevels+1)return;
  progress.data.selectedLevel=state.selectedLevel;
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
  const radius = 26 * SNAKE_SCALE;
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
  if (state.mode !== "playing") return;
  if(!state.snake.length){completeLevel();return;}
  state.elapsed += dt;
  // Die Schlange beginnt langsamer und beschleunigt nur behutsam.
  const speed = Math.min(22 + state.elapsed * .25, 45);
  state.headDistance += speed * dt;

  syncSnakePositions();

  const dx = state.player.targetX - state.player.x;
  const maxStep = state.player.speed * dt;
  state.player.x += Math.sign(dx) * Math.min(Math.abs(dx), maxStep);
  state.player.x = clampPlayerX(state.player.x);

  state.fireTimer -= dt;
  if (state.fireTimer <= 0) {
    fireWeapon();
    state.fireTimer += 1 / state.weapon.shotsPerSecond;
  }

  updatePaladin(dt);
  if (state.mode !== "playing") return;
  updateNecromancer(dt);
  if (state.mode !== "playing") return;
  for (const effect of state.holyEffects) effect.life -= dt;
  state.holyEffects = state.holyEffects.filter(effect => effect.life > 0);
  refreshPaladinHud();
  for (const bullet of state.bullets) {
    bullet.previousX = bullet.x;
    bullet.previousY = bullet.y;
    if(bullet.owner==="paladin" && bullet.hammerPhase)advanceHammer(bullet,dt);
    else if(bullet.owner==="necromancer") {
      const target=state.snake[0];
      if(target)moveHeroProjectile(bullet,target.x,target.y,510*.9,dt);
      else bullet.dead=true;
    } else {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
    }
  }
  handleHits();
  for(const bullet of state.bullets)if(bullet.returnAfterHits){bullet.hammerPhase="return";bullet.returnAfterHits=false;}
  state.bullets = state.bullets.filter(b => b.y > -25 && !b.dead);
  if (state.mode !== "playing") return;

  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);

  if (state.snake.length === 0) {
    completeLevel();
  } else if (snakeHead().y + SEGMENT_RADIUS * SNAKE_SCALE >= state.player.y - 22) {
    endGame();
  }
}

function fireWeapon() {
  const count = state.weapon.bullets;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * state.weapon.spread;
    const spacing = count > 1 ? Math.min(10, (state.width - 12) / (count - 1)) : 0;
    const halfWidth = (count - 1) * spacing / 2;
    const center = Math.max(6 + halfWidth, Math.min(state.width - 6 - halfWidth, state.player.x));
    const x = state.weapon.parallel ? center + (i - (count - 1) / 2) * spacing : state.player.x;
    state.bullets.push({ x, y: state.player.y + PLATFORM_SHOT_Y, vx: state.weapon.parallel ? 0 : offset * 3, vy: -510*(state.weapon.parallel?skillValue("shooter","parallel",1,1.2):1), hitsLeft: state.weapon.pierce + 1, dead: false });
  }
}

function rollHit(random = Math.random, damage = state.weapon.damage) {
  const critical = random() * 100 < (state.weapon.critChance || 0);
  return { critical, damage: damage * (critical ? (state.weapon.critDamage ?? 150) / 100 : 1) };
}

// Swept collision prevents fast hammers from skipping segments between frames.
function projectileHits(bullet, target) {
  const ax = bullet.previousX ?? bullet.x, ay = bullet.previousY ?? bullet.y;
  const dx = bullet.x-ax, dy = bullet.y-ay;
  const t = dx*dx+dy*dy ? Math.max(0,Math.min(1,((target.x-ax)*dx+(target.y-ay)*dy)/(dx*dx+dy*dy))) : 0;
  const radius = SEGMENT_HIT_RADIUS + (bullet.owner === "paladin" ? 2 * (bullet.size || 1.4) : 0);
  return Math.hypot(target.x-ax-t*dx,target.y-ay-t*dy) < radius;
}
function segmentDamageMultiplier(segment) {
  return segment.soulMark ? 1 + (state.necromancer?.curse || 0) : 1;
}
function applyDamageBatch(batch) {
  // All targets are determined before any segment retreats or upgrade pauses.
  for (const segment of state.snake) {
    if (isSegmentVisible(segment) && batch.has(segment.id)) segment.hp = Math.round((segment.hp-batch.get(segment.id)*segmentDamageMultiplier(segment))*1e10)/1e10;
  }
  for (let i=state.snake.length-1;i>=0;i--) if (state.snake[i].hp<=0) destroySegment(i,false);
  resolveNecroDeaths();
  if (state.snake.length && state.pendingUpgrades>0 && state.mode === "playing") openUpgrade();
}
function handleHits(random = Math.random) {
  outer: for (const bullet of state.bullets) {
    if (bullet.dead || bullet.hammerPhase==="return") continue;
    bullet.hitIds ||= new Set();
    // Projectiles enter from below: resolve the nearest crossed target first.
    const targets = state.snake.map((segment,i)=>({segment,head:i===0?snakeHead():null}))
      .filter(({segment,head})=>isSegmentVisible(segment) && (bullet.owner!=="necromancer" || segment===state.snake[0]) && !bullet.hitIds.has(segment.id) && (projectileHits(bullet,segment) || (head && projectileHits(bullet,head))))
      .sort((a,b)=>Math.max(b.segment.y,b.head?.y??-Infinity)-Math.max(a.segment.y,a.head?.y??-Infinity));
    for (const {segment} of targets) {
      if (!state.snake.includes(segment)) continue;
      bullet.hitIds.add(segment.id);
      const isPaladin = bullet.owner === "paladin" && state.paladin;
      const isNecro = bullet.owner === "necromancer" && state.necromancer;
      const hit = isNecro ? necromancerHitRoll(random) : rollHit(random,isPaladin ? paladinDirectDamage(bullet) : state.weapon.damage*skillValue("shooter","attack",1,1.2));
      if (isNecro) prepareNecroHit(segment,hit,random);
      const batch = new Map([[segment.id,hit.damage]]);
      if (isPaladin) paladinHit(batch,segment,hit,random);
      bullet.hitsLeft--;
      if (bullet.hitsLeft<=0 || isNecro) bullet.dead=true;
      burst(segment.x,segment.y,hit.critical?"#ff7954":isPaladin?"#ffe49b":"#63ef98",hit.critical?12:5);
      const oldCount=state.snake.length;
      applyDamageBatch(batch);
      if (state.mode!=="playing") return;
      if (state.snake.length!==oldCount) continue outer;
      if (bullet.dead) continue outer;
    }
  }
}

function destroySegment(index, offerUpgrade = true) {
  const [destroyed] = state.snake.splice(index, 1);
  if (state.necromancer) state.necroDeaths.push({segment:destroyed,neighbors:[state.snake[index-1],state.snake[index]].filter(Boolean)});
  state.score += destroyed.upgrade ? 100 : 25;
  const coins = (destroyed.upgrade ? 5 : 1) * state.level * difficultyMultiplier(state.runDifficulty??.10);
  state.runCoins += coins;
  progress.reward(coins, state.score);
  document.querySelector("#saveStatus").textContent = progress.message;
  burst(destroyed.x, destroyed.y, destroyed.upgrade ? "#ffe083" : "#75ffac", 16);

  // Nur der Abschnitt vor der Lücke (Richtung Kopf) fällt zurück.
  // Größere Pfad-Offsets bedeuten weiter hinten auf derselben Bahn.
  for (let i = 0; i < index; i++) state.snake[i].pathOffset += SEGMENT_SPACING;
  syncSnakePositions();
  refreshHud();
  if (destroyed.upgrade) {
    state.pendingUpgrades++;
    if (offerUpgrade && state.snake.length) openUpgrade();
  }
}

function roundUpgradePool() {
  const pool = [
    { rarity: "grey", label: "Grau", damage: 1, rate: 10, pierce: 1 },
    { rarity: "green", label: "Grün", damage: 2, rate: 20, pierce: 2 },
    { rarity: "purple", label: "Lila", damage: 4, rate: 30, pierce: 3 }
  ].map(tier=>({...tier,damage:tier.damage*skillValue("shooter","damage",1,1.2),rate:tier.rate+skillValue("shooter","rate",0,5),pierce:tier.pierce+skillValue("shooter","pierce",0,1)})).flatMap(tier => [
    { rarity: tier.rarity, label: tier.label, name: "+" + tier.damage + " Schaden",
      text: "Zusätzlicher Schaden pro Geschoss.",
      apply: () => { state.weapon.damage += tier.damage; state.weapon.soulDamageBonus = (state.weapon.soulDamageBonus || 0) + tier.damage; } },
    { rarity: tier.rarity, label: tier.label, name: "+" + tier.rate + " % Feuerrate",
      text: "Erhöht deine aktuelle Feuerrate um " + tier.rate + " %.",
      apply: () => state.weapon.shotsPerSecond *= 1 + tier.rate / 100 },
    { rarity: tier.rarity, label: tier.label, name: "+" + tier.pierce + " Durchschlag",
      text: "Durchdringt " + tier.pierce + " zusätzliche Körperteile.",
      apply: () => state.weapon.pierce += tier.pierce }
  ]);
  for (const tier of [
    { rarity: "grey", chance: 2.5, damage: 15 },
    { rarity: "green", chance: 5, damage: 30 },
    { rarity: "purple", chance: 7.5, damage: 50 }
  ]) {
    tier.chance+=skillValue("shooter","critChance",0,1);
    tier.damage+=skillValue("shooter","critDamage",0,10);
    if ((state.weapon.critChance || 0) < 100) pool.push({
      rarity: tier.rarity, name: "+" + String(tier.chance).replace(".", ",") + " % Krit-Chance",
      text: "Erhöht die kritische Trefferchance um " + String(tier.chance).replace(".", ",") + " Prozentpunkte (maximal 100 %).",
      apply: () => state.weapon.critChance = Math.min(100, (state.weapon.critChance || 0) + tier.chance)
    });
    pool.push({
      rarity: tier.rarity, name: "+" + tier.damage + " % Krit-Schaden",
      text: "Erhöht den Krit-Schaden um " + tier.damage + " Prozentpunkte des normalen Schadens.",
      apply: () => state.weapon.critDamage = (state.weapon.critDamage ?? 150) + tier.damage
    });
  }
  pool.push({
    rarity: "grey", name: "+"+skillValue("shooter","multi",1,2)+" Mehrfachschuss", text: "Zusätzliche Geschosse bei jedem Schuss.",
    apply: () => {
      if (state.weapon.bullets === 1 && !state.weapon.parallel) state.weapon.spread = 24;
      state.weapon.bullets+=skillValue("shooter","multi",1,2);
    }
  });
  if (state.weapon.bullets > 1 && !state.weapon.parallel) {
    pool.push({
      rarity: "green", name: "Engerer Mehrfachschuss", text: "Verringert die Streuung um "+skillValue("shooter","spread",50,60)+" %.",
      apply: () => state.weapon.spread *= skillValue("shooter","spread",.5,.4)
    }, {
      rarity: "purple", name: "Paralleler Mehrfachschuss",
      text: "Geschosse starten nebeneinander und fliegen ohne Streuung geradeaus.",
      apply: () => { state.weapon.parallel = true; state.weapon.spread = 0; }
    });
  }
  return pool.concat(paladinUpgradePool(),necromancerUpgradePool());
}

const RARITY_CHANCES = Object.freeze({grey:.60,green:.25,purple:.10,orange:.05});
function chooseUpgrades(random = Math.random) {
  const remaining = roundUpgradePool(), choices=[];
  for (let i=0;i<3 && remaining.length;i++) {
    // Only eligible rarities participate; missing/exhausted tiers redistribute
    // proportionally. Orange unlock can appear once, without duplicate cards.
    const available=Object.keys(RARITY_CHANCES).filter(r=>remaining.some(c=>c.rarity===r));
    const total=available.reduce((sum,r)=>sum+RARITY_CHANCES[r],0);
    let roll=random()*total;
    const rarity=available.find(r=>(roll-=RARITY_CHANCES[r])<0) || available[available.length-1];
    const candidates=remaining.filter(c=>c.rarity===rarity);
    const choice=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
    choices.push(choice);remaining.splice(remaining.indexOf(choice),1);
  }
  return choices;
}

function openUpgrade() {
  const offerId = ++state.upgradeOfferId;
  state.mode = "upgrade";
  releaseDrag();
  const choices = chooseUpgrades();
  upgradeChoices.replaceChildren();
  for (const choice of choices) {
    const button = document.createElement("button");
    button.className = "upgrade-choice rarity-" + choice.rarity;
    button.innerHTML = `${choice.name}<span>${choice.text}</span>`;
    button.addEventListener("click", () => {
      if (state.mode !== "upgrade" || state.upgradeOfferId !== offerId) return;
      state.upgradeOfferId++;
      state.lastUpgrade=choice.name+" ("+choice.rarity+")";
      choice.apply();
      refreshHud();
      state.pendingUpgrades = Math.max(0,state.pendingUpgrades-1);
      if (state.pendingUpgrades>0) { openUpgrade(); return; }
      upgradeScreen.classList.add("hidden");
      state.mode = "playing";
      state.lastTime = performance.now();
    });
    upgradeChoices.append(button);
  }
  upgradeScreen.classList.remove("hidden");
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function endGame() {
  if (state.mode === "gameover") return;
  releaseDrag();
  state.mode = "gameover";
  document.querySelector("#resultEyebrow").textContent="DIE SCHLANGE WAR SCHNELLER";
  document.querySelector("#resultTitle").textContent="Game Over";
  progress.data.best = Math.max(progress.data.best, state.score);
  progress.save();
  renderProfile();
  document.querySelector("#runSummary").textContent = Math.floor(state.runCoins) + " Münzen verdient · bleiben erhalten";
  finalScore.textContent = state.score;
  gameOverScreen.classList.remove("hidden");
}

function refreshHud() {
  refreshPaladinHud();
  document.querySelector("#critChance").textContent = hudNumber(state.weapon.critChance || 0) + " %";
  document.querySelector("#critDamage").textContent = hudNumber(state.weapon.critDamage ?? 150) + " %";
  scoreEl.textContent = state.score;
  damageEl.textContent = state.weapon.damage;
  fireRateEl.textContent = `${(state.weapon.shotsPerSecond / 2.7).toFixed(1)}×`;
}

function renderProfile() {
  const p = progress.data;
  renderHeroSkills();
  renderLevelPicker();
  renderPaladinProfile();
  renderNecromancerProfile();
  document.querySelector("#menuCoins").textContent = p.coins.toLocaleString("de-DE");
  document.querySelector("#profileStats").textContent =
    p.coins + " Münzen · Rekord " + p.best + " · " + p.defeated + " Teile besiegt · " + p.runs + " Runden";
  for (const [id, key, title] of [
    ["buyDamage", "damageLevel", "+1 Startschaden"],
    ["buyRate", "rateLevel", "+10 % Basisfeuerrate"],
    ["buyCritChance", "critChanceLevel", "+1 % Krit-Chance"],
    ["buyCritDamage", "critDamageLevel", "+25 % Krit-Schaden"]
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
  closeHeroSkills();
  selectMenuPage("Home");
  renderProfile();
}

function selectMenuPage(page) {
  for (const name of ["Home", "Upgrades", "Heroes", "Options"]) {
    const active = name === page;
    const panel = document.querySelector("#menu" + name);
    const button = document.querySelector("#nav" + name);
    panel.classList[active ? "remove" : "add"]("hidden");
    button.classList[active ? "add" : "remove"]("selected");
    button.setAttribute("aria-pressed", String(active));
  }
}
for (const page of ["Home", "Upgrades", "Heroes", "Options"]) {
  document.querySelector("#nav" + page).addEventListener("click", () => {
    if (state.mode === "start") selectMenuPage(page);
  });
}

for (const value of [.10,.15,.20]) {
  document.querySelector('input[name="difficulty"][value="'+value.toFixed(2)+'"]').addEventListener("change",()=>{
    if(state.mode!=="start")return;
    progress.data.difficulty=value;progress.save();renderLevelPicker();
  });
}
function restoreDifficulty() {
  const radio = document.querySelector('input[name="difficulty"][value="' + progress.data.difficulty.toFixed(2) + '"]');
  if (radio) radio.checked = true;
}

document.querySelector("#unlockPaladin").addEventListener("click",()=>{
  if(state.mode!=="start")return;
  const success=progress.unlockPaladin();
  document.querySelector("#heroStatus").textContent=success?"Aldric ist freigeschaltet. Wähle links oder rechts.":progress.message;
  renderProfile();
});
for(const slot of ["left","right",null]) {
  document.querySelector(slot?"#equipPaladin"+slot:"#unequipPaladin").addEventListener("click",()=>{
    if(state.mode!=="start")return;
    const success=progress.equipPaladin(slot);
    document.querySelector("#heroStatus").textContent=success?(slot?"Aldric kämpft ab der nächsten Runde "+(slot==="left"?"links":"rechts")+".":"Aldric wurde aus dem Team genommen."):progress.message;
    renderProfile();
  });
}

document.querySelector("#menuButton").addEventListener("click", showMenu);
for (const [id, key] of [["buyDamage", "damageLevel"], ["buyRate", "rateLevel"], ["buyCritChance", "critChanceLevel"], ["buyCritDamage", "critDamageLevel"]]) {
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
    state.selectedLevel=progress.data.selectedLevel;
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
  drawPaladin();
  drawHolyEffects();
  drawNecromancer();
  drawParticles();
}

function drawBackground() {
  const field = ctx.createLinearGradient(0, 0, state.width, state.height);
  field.addColorStop(0, "#142e48");
  field.addColorStop(.5, "#0c2036");
  field.addColorStop(1, "#142c43");
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.strokeStyle = "rgba(88, 154, 192, .18)";
  ctx.lineWidth = 1;
  for (let y = 20; y < state.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.width, y); ctx.stroke();
  }
  for (let x = 20; x < state.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, state.height); ctx.stroke();
  }
  const danger = state.player.y - 34;
  ctx.strokeStyle = "rgba(245, 115, 105, .75)";
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
  ctx.strokeText(label, segment.x, segment.y - 23 * SNAKE_SCALE, 31 * SNAKE_SCALE);
  ctx.fillText(label, segment.x, segment.y - 23 * SNAKE_SCALE, 31 * SNAKE_SCALE);
  ctx.restore();
}

function drawSegment(segment, isHead) {
  if (segment.y < -30 || segment.y > state.height + 30) return;
  ctx.save();
  ctx.translate(segment.x, segment.y);
  ctx.scale(SNAKE_SCALE, SNAKE_SCALE);
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
  for (const bullet of state.bullets) {
    if (bullet.owner === "necromancer") {
      drawSoulOrb(bullet.x,bullet.y,4,false);
    } else if (bullet.owner === "paladin") {
      const size=12*(bullet.size||1.4);
      ctx.shadowColor = bullet.charged ? "#fff5c2" : "#ffc84a";
      ctx.shadowBlur = bullet.charged ? 20 : 10;
      if (hammerSprite.complete && hammerSprite.naturalWidth) ctx.drawImage(hammerSprite,180,140,880,1000,bullet.x-size/2,bullet.y-size/2,size,size);
      else { ctx.fillRect(bullet.x-size/2,bullet.y-size/2,size,size*.4);ctx.fillRect(bullet.x-2,bullet.y,4,size*.5); }
    } else {
      ctx.shadowColor = "#ffc84a"; ctx.shadowBlur = 10;
      ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 12);
    }
  }
  ctx.shadowBlur = 0;
}

function drawPlayer() {
  const { x, y } = state.player;
  ctx.save(); ctx.translate(x, y);
  // Unoccupied docking connectors; future companions use x +/- 36.
  ctx.fillStyle = "#8ca9b9";
  ctx.fillRect(-20, 28, 6, 5);
  ctx.fillRect(14, 28, 6, 5);
  if (playerSprite.complete && playerSprite.naturalWidth) {
    // Front portrait includes the entire character and docking platform.
    ctx.drawImage(playerSprite, -20, -15, 40, 56);
  } else {
    ctx.fillStyle = "#344c62";
    ctx.fillRect(-14, 25, 28, 16);
    ctx.fillStyle = "#4bc5ee";
    ctx.fillRect(-6, 3, 12, 25);
    ctx.fillStyle = "#d5f6ff";
    ctx.fillRect(-2, PLAYER_MUZZLE_Y, 4, 26);
  }
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
  state.player.targetX = clampPlayerX(state.player.targetX + delta);
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
if (typeof ResizeObserver !== "undefined") new ResizeObserver(resizeCanvas).observe(wrap);

function reportGameError(error) {
  if(state.mode==="error")return;
  state.errorResumeMode=state.mode;
  state.mode="error";
  state.pointerDown=false;state.pointerId=null;
  const details="Version 17.1 · Level "+state.level+" · Upgrade: "+(state.lastUpgrade||"keines")+
    "\n"+String(error?.message||error)+"\n"+String(error?.stack||"").slice(0,2500);
  state.lastError=details;
  document.querySelector("#gameErrorDetails").textContent=details;
  document.querySelector("#gameErrorScreen").classList.remove("hidden");
  try {window.localStorage.setItem("the-snake.last-error",details);}catch{}
}
function resumeAfterError() {
  if(state.mode!=="error")return;
  document.querySelector("#gameErrorScreen").classList.add("hidden");
  state.mode=state.errorResumeMode||"playing";
  state.lastTime=performance.now();
  resizeCanvas(); // Reset canvas state if drawing was interrupted.
}
document.querySelector("#resumeAfterError").addEventListener("click",resumeAfterError);
document.querySelector("#menuAfterError").addEventListener("click",()=>{
  document.querySelector("#gameErrorScreen").classList.add("hidden");
  showMenu();
});
window.addEventListener("error",event=>reportGameError(event.error||event.message));
function loop(time) {
  try {
    if(state.mode==="error")return;
    const dt = Math.max(0, Math.min((time - (state.lastTime || time)) / 1000, .033));
    state.lastTime = time;
    if (state.mode === "playing") update(dt);
    draw();
  } catch(error) {
    reportGameError(error);
  } finally {
    // A runtime exception must never silently cancel all future frames.
    requestAnimationFrame(loop);
  }
}

document.querySelector("#previousLevel").addEventListener("click",()=>changeLevel(-1));
document.querySelector("#nextLevel").addEventListener("click",()=>changeLevel(1));
bindNecromancerMenu();
bindSkillsMenu();
resizeCanvas();
createSnake(SEGMENTS_PER_SNAKE);
restoreDifficulty();
renderProfile();
requestAnimationFrame(loop);
