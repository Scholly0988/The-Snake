const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const handlers = {};
const element = {
  getContext: () => ({setTransform(){}}),
  getBoundingClientRect: () => ({width:390,height:700}),
  style: {}, classList: {add(){},remove(){}},
  addEventListener: (name, cb) => { handlers[name] = cb; },
  setPointerCapture(){}, hasPointerCapture: () => false,
  replaceChildren(){}, append(){}, setAttribute(){}
};
const context = vm.createContext({
  document: {querySelector: () => element, createElement: () => element},
  window: {devicePixelRatio:1,addEventListener(){}},
  Image: class {}, performance:{now:()=>0}, requestAnimationFrame(){}
});
const storage = new Map();
context.window.localStorage = {getItem:k=>storage.get(k) ?? null,setItem:(k,v)=>storage.set(k,v)};
vm.runInContext(fs.readFileSync('skills.js','utf8'),context);
vm.runInContext(fs.readFileSync('levels.js','utf8'),context);
vm.runInContext(fs.readFileSync('halloween-event.js','utf8'),context);
vm.runInContext(fs.readFileSync('progress.js','utf8'), context);
vm.runInContext(fs.readFileSync('secondary.js','utf8'), context);
vm.runInContext(fs.readFileSync('kiko.js','utf8'), context);
vm.runInContext(fs.readFileSync('mirel.js','utf8'), context);
vm.runInContext(fs.readFileSync('paladin.js','utf8'), context);
vm.runInContext(fs.readFileSync('necromancer.js','utf8'), context);
vm.runInContext(fs.readFileSync('alchemist.js','utf8'), context);
vm.runInContext(fs.readFileSync('runemaster.js','utf8'), context);
vm.runInContext(fs.readFileSync('ilyra.js','utf8'), context);
vm.runInContext(fs.readFileSync('seraphine.js','utf8'), context);
vm.runInContext(fs.readFileSync('shooter.js','utf8'), context);
vm.runInContext(fs.readFileSync('halloween-boss.js','utf8'), context);
vm.runInContext(fs.readFileSync('game.js','utf8'), context);
const run = code => vm.runInContext(code, context);

run('state.width=390;state.height=700;resetGame(true,8,true);state.mode="playing"');
assert.equal(run('state.halloweenBoss.phase'),'intro_fall');
assert.equal(run('state.snake.length'),0);
run('update(.5)');
assert.equal(run('state.bullets.length'),0,'Intro must not run hero attacks');
assert.equal(run('state.elapsed'),0,'Hero cooldowns do not advance in intro');
run('update(1.7)');assert.equal(run('state.halloweenBoss.phase'),'intro_pause');
run('update(1)');assert.equal(run('state.halloweenBoss.phase'),'intro_burrow');
assert(run('state.particles.length')>0);
run('update(.65)');assert.equal(run('state.halloweenBoss.phase'),'emerge');
run('update(1)');assert.equal(run('state.halloweenBoss.phase'),'idle_sway');
run('completeLevel()');assert.equal(run('state.mode'),'playing','No invented victory when wave empty');
for(let index=0;index<100;index++){
  const hp=run('getHalloweenBossSegmentHP('+index+')');
  const base=run('HalloweenEvent.segmentHp(8,0)');
  assert.equal(hp,base+.25*(run('HalloweenEvent.segmentHp(8,'+index+')')-base));
  if(index)assert.equal(hp-run('getHalloweenBossSegmentHP('+(index-1)+')'),.25*(run('HalloweenEvent.segmentHp(8,'+index+')')-run('HalloweenEvent.segmentHp(8,'+(index-1)+')')));
}
for(let wave=0;wave<5;wave++){
  run('chooseHalloweenBossAttackPattern()');assert.equal(run('state.halloweenBoss.patternIndex'),wave);
  const lanes=run('state.halloweenBoss.pattern');
  if(wave===4)for(let i=1;i<5;i++)assert.notEqual(lanes[i],lanes[i-1]);
  for(const lane of lanes)run('spawnHalloweenBossAttackSegment('+lane+')');
}
assert.equal(run('state.snake.filter(s=>s.upgrade).length'),5);
assert.equal(run('state.halloweenBoss.spawned'),25);
assert.equal(run('snakeHead(state.snakes[0])'),null,'Attack has no separately damageable head');
assert.equal(run('state.snake.find(s=>s.eventBossAttack).x'),195,'Starts at boss center before lane transition');
run('state.halloweenBoss.spawnTimer=100;updateHalloweenBossAttackSegments(.5)');
assert(run('state.snake.filter(s=>s.eventBossAttack)[1].x')<195&&run('state.snake.filter(s=>s.eventBossAttack)[1].x')>54.6);
const age=run('state.snakes.find(s=>s.bossAttack).age');
run('state.mode="upgrade";update(4)');assert.equal(run('state.snakes.find(s=>s.bossAttack).age'),age,'Upgrade pauses boss and attacks');
run('state.mode="playing";var off=state.snake.find(s=>s.eventBossAttack);off.y=-1;var hpBefore=off.hp;applyDamageBatch(new Map([[off.id,100]]))');
assert.equal(run('off.hp'),run('hpBefore'),'Offscreen enemy cannot take damage');
run('off.y=200;applyDamageBatch(new Map([[off.id,1]]))');assert.equal(run('off.hp'),run('hpBefore-1'));
run('state.halloweenBoss.spawnTimer=100;updateHalloweenBossAttackSegments(20)');
assert.equal(run('state.snakes.filter(s=>s.bossAttack).length'),0);assert.equal(run('state.snake.filter(s=>s.eventBossAttack).length'),0,'Remove fallen attacks from both collections');
assert.equal(run('state.snake[0]===state.halloweenBoss.target'),true,'Cleanup never removes boss body');
run('progress.data.secondarySlots={left:"kiko",center:null,right:null};resetGame(true,8,true);state.mode="playing";updateHalloweenBossIntro(10);for(let i=0;i<5;i++)spawnHalloweenBossAttackSegment(2);var special=state.snake.find(s=>s.upgrade);state.snakes=state.snakes.filter(s=>s.bossBody||s.segments.includes(special));rebuildSnakeView();special.y=200;applyDamageBatch(new Map([[special.id,special.hp+1]]))');
assert.equal(run('state.mode'),'upgrade','Last attack special still opens upgrade');
assert.equal(run('state.pendingUpgrades'),1);
assert.equal(run('chooseUpgrades().length'),4);
assert.equal(run('chooseUpgrades()[3].standardSlot'),true);
assert.equal(run('chooseSecondaryUpgrades().length'),3);
run('finishUpgradeCycle();update(.1)');assert.equal(run('state.mode'),'playing');
run('setAdminOptionsVisible(true);restartCurrentRun()');assert.equal(run('state.halloweenBoss.spawned'),0);assert.equal(run('state.halloweenBoss.phase'),'intro_fall');
run('ctx.ellipse=ctx.rect=ctx.clip=()=>{};for(const key of ["save","restore","beginPath","fill","translate","rotate","drawImage","stroke","moveTo","lineTo"])ctx[key]=()=>{};drawHalloweenBossLevel8();updateHalloweenBossIntro(10);drawHalloweenBossLevel8()');
run('showMenu()');assert.equal(run('state.halloweenBoss'),null);assert.equal(run('state.snake.length'),0);
run('resetGame(true,8);state.mode="playing";endGame()');assert.equal(run('state.halloweenBoss'),null);
run('resetGame(true,7)');assert.equal(run('state.snake.length'),50);assert.equal(run('state.halloweenBoss'),null);
run('resetGame(false)');assert(run('state.snake.length')>0);assert.equal(run('state.halloweenBoss'),null);
console.log('PASS: Level 8 intro, no early combat/victory, curve increments, patterns, global fifth counter, lanes, pause, visibility, cleanup, upgrades and regression starts');
