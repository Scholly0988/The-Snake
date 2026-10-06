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


const start=()=>run('state.width=390;state.height=700;resetGame(true,8,true);state.mode="playing";updateHalloweenBossIntro(10);state.halloweenBoss.spawnTimer=100;state.halloweenBoss.pumpkinTimer=100');
start();
assert.equal(run('getHalloweenBossMaxHP()'),run('HalloweenEvent.segmentHp(7,49)*1.25'));
assert.equal(run('state.halloweenBoss.target.hp'),run('state.halloweenBoss.maxHp'));
run('var boss=state.halloweenBoss;boss.target.hp=boss.maxHp*.7;updateHalloweenBossPhase()');assert.equal(run('boss.battlePhase'),1);
run('boss.target.hp=boss.maxHp*.699;updateHalloweenBossPhase()');assert.equal(run('boss.battlePhase'),2);
run('boss.target.hp=boss.maxHp*.35;updateHalloweenBossPhase()');assert.equal(run('boss.battlePhase'),2);
run('boss.target.hp=boss.maxHp*.349;updateHalloweenBossPhase()');assert.equal(run('boss.battlePhase'),3);
run('var before=boss.target.hp;healHalloweenBoss();updateHalloweenBossPhase()');
assert(Math.abs(run('boss.target.hp-before')-run('boss.maxHp*.05'))<1e-8);assert.equal(run('boss.battlePhase'),3);
run('boss.target.hp=boss.maxHp-1;healHalloweenBoss()');assert.equal(run('boss.target.hp'),run('boss.maxHp'));
start();
run('var attack=spawnHalloweenBossAttackSegment(0);attack.x=54;attack.y=150;attack.hp=800;var pumpkin=spawnHalloweenBossPumpkin(()=>.85)');
assert(run('!!pumpkin'),'Safe visible candidate should spawn');assert.equal(run('pumpkin.hp'),400);
run('attack.hp=20');assert.equal(run('pumpkin.hp'),400,'Pumpkin HP fixed at spawn');
assert.equal(run('isHalloweenBossPumpkinPositionFree(state.width/2,halloweenBossAnchor().y)'),false);
assert.equal(run('isHalloweenBossPumpkinPositionFree(attack.x,attack.y)'),false);
assert.equal(run('isHalloweenBossPumpkinPositionFree(100,state.player.y)'),false);
assert.equal(run('isHalloweenBossPumpkinPositionFree(100,50)'),false);
assert.equal(run('isHalloweenBossPumpkinPositionFree(pumpkin.x,pumpkin.y)'),false);
run('growHalloweenBossPumpkin(pumpkin,2.99)');assert.equal(run('pumpkin.stage'),1);
run('growHalloweenBossPumpkin(pumpkin,.01)');assert.equal(run('pumpkin.stage'),2);
run('growHalloweenBossPumpkin(pumpkin,3)');assert.equal(run('pumpkin.stage'),3);
// Same projectile crossing a pumpkin, with each disallowed ownership.
for(const owner of ['paladin','necromancer','alchemist','runemaster','ilyra','seraphine','kiko','mirel']){
  run('state.bullets=[{owner:'+JSON.stringify(owner)+',x:pumpkin.x,y:pumpkin.y,previousX:pumpkin.x,previousY:pumpkin.y+1,hitsLeft:1,hitIds:new Set()}];handleHits(()=>.9)');
  assert.equal(run('pumpkin.hp'),400,owner+' cannot damage growing pumpkin');
}
run('state.bullets=[{owner:"shooter",x:pumpkin.x,y:pumpkin.y,previousX:pumpkin.x,previousY:pumpkin.y+1,hitsLeft:1,hitIds:new Set()}];handleHits(()=>.9)');assert(run('pumpkin.hp')<400);
run('var ph=pumpkin.hp;applyDamageBatch(new Map([[pumpkin.id,100]]))');assert.equal(run('pumpkin.hp'),run('ph'),'AoE/DOT batches exclude pumpkin collection');
run('boss=state.halloweenBoss;boss.target.hp=boss.maxHp*.5;var p2=createEventPumpkin(65,460,800,{bossPumpkin:true,age:6,stage:3,matureAt:1,radius:24});pumpkin.matureAt=0;startHalloweenBossEatAnimation(queueHalloweenBossPumpkinEat());var eatId=boss.eat.pumpkinId;var targetBefore={...boss.target};var spawnedBefore=boss.spawned;var ageBefore=state.snakes.find(s=>s.bossAttack).age;boss.spawnTimer=0;updateHalloweenBossAttackSegments(.3)');
assert.equal(run('eatId'),run('pumpkin.id'),'Oldest mature pumpkin first');
assert(run('state.snakes.find(s=>s.bossAttack).age')>run('ageBefore'),'Existing attacks continue during eating');
assert.equal(run('boss.spawned'),run('spawnedBefore'),'New attacks pause');
assert.notEqual(run('boss.target.x'),run('targetBefore.x'),'Head visibly travels to pumpkin');
run('var hpBeforeEat=boss.target.hp;updateHalloweenBossAttackSegments(.3)');
assert.equal(run('state.eventPumpkins.includes(pumpkin)'),false);
assert(Math.abs(run('boss.target.hp-hpBeforeEat')-run('boss.maxHp*.05'))<1e-8);
assert.equal(run('state.eventPumpkins.includes(p2)'),true,'Only one pumpkin consumed');
run('updateHalloweenBossAttackSegments(.65)');assert.equal(run('boss.eat'),null);
assert(run('boss.spawned')>run('spawnedBefore'),'Attacks resume after return');
run('updateHalloweenBossAttackSegments(.5)');assert.equal(run('boss.eat'),null,'Pause between eating actions');
run('updateHalloweenBossAttackSegments(.5)');assert.equal(run('boss.eat.pumpkinId'),run('p2.id'));
run('var hpBeforeCancel=boss.target.hp;destroyHalloweenBossPumpkin(p2);updateHalloweenBossAttackSegments(.6)');assert.equal(run('boss.target.hp'),run('hpBeforeCancel'),'Destroyed feeding target cannot heal');
// Force burst rolls: first attack wave in phase 2 -> double; phase 3 -> triple.
for(const [phase,roll,count] of [[1,.01,1],[2,.1,2],[3,.01,3]]){
  start();run('boss=state.halloweenBoss;boss.battlePhase='+phase+';boss.spawnTimer=0;var savedRandom=Math.random;Math.random=()=>'+roll+';updateHalloweenBossAttackSegments(.01);Math.random=savedRandom');
  assert.equal(run('boss.spawned'),count);assert.equal(run('new Set(state.snakes.filter(s=>s.bossAttack).map(s=>s.lane)).size'),count);
}
start();run('boss=state.halloweenBoss;var hitHp=boss.target.hp;applyDamageBatch(new Map([[boss.target.id,10]]))');assert.equal(run('boss.target.hp'),run('hitHp-10'));assert(run('boss.hitFlash')>0);
run('mirelCriticalMultiplier(boss.target,true)');assert.equal(run('boss.hitFlash'),.25);
run('boss.target.y=-1;var hiddenHp=boss.target.hp;applyDamageBatch(new Map([[boss.target.id,100]]))');assert.equal(run('boss.target.hp'),run('hiddenHp'));
run('syncHalloweenBossTarget();state.mode="upgrade";var timeBefore=boss.time;update(2)');assert.equal(run('boss.time'),run('timeBefore'));
run('state.mode="playing";spawnHalloweenBossAttackSegment(2);createEventPumpkin(65,460,400,{bossPumpkin:true,age:6,stage:3,matureAt:1,radius:24});applyDamageBatch(new Map([[boss.target.id,boss.maxHp+1]]))');
assert.equal(run('boss.phase'),'dying');assert.equal(run('state.snake.length'),0);assert.equal(run('state.eventPumpkins.length'),0);assert.equal(run('healHalloweenBoss()'),0);assert.equal(run('spawnHalloweenBossAttackSegment(2)'),null);assert.equal(run('spawnHalloweenBossPumpkin()'),null);
run('update(.7)');assert.equal(run('state.mode'),'playing');run('update(.7)');assert.equal(run('state.mode'),'victory');assert.equal(run('state.eventProgress.completed'),0,'Admin victory saves no progression');
// Production completion goes through the normal event rewards, once only.
run('state.eventProgress.completed=7;resetGame(true,8,false);state.mode="playing";updateHalloweenBossIntro(10);boss=state.halloweenBoss;applyDamageBatch(new Map([[boss.target.id,boss.maxHp+1]]));update(1.5);var coinsAfter=state.eventProgress.coins;completeLevel()');assert.equal(run('state.eventProgress.completed'),8);assert.equal(run('state.eventProgress.coins'),run('coinsAfter'));assert(run('coinsAfter')>0);
run('resetGame(true,8);state.mode="playing";updateHalloweenBossIntro(10);boss=state.halloweenBoss;createEventPumpkin(65,460,400,{bossPumpkin:true,age:6,stage:3,matureAt:1,radius:24});startHalloweenBossEatAnimation(queueHalloweenBossPumpkinEat());restartCurrentRun()');assert.equal(run('state.eventPumpkins.length'),0);assert.equal(run('state.halloweenBoss.battlePhase'),1);assert.equal(run('state.halloweenBoss.eat'),null);
run('showMenu()');assert.equal(run('state.halloweenBoss'),null);assert.equal(run('state.eventPumpkins.length'),0);
// Long fight: no lingering enemies, no unbounded pumpkin population.
start();run('boss=state.halloweenBoss;boss.battlePhase=3;boss.spawnTimer=0;boss.pumpkinTimer=0;var maxAttacks=0,maxPumpkins=0;for(let i=0;i<18000;i++){updateHalloweenBossAttackSegments(1/60);maxAttacks=Math.max(maxAttacks,state.snakes.filter(s=>s.bossAttack).length);maxPumpkins=Math.max(maxPumpkins,state.eventPumpkins.length)}');
assert(run('maxAttacks')<40);assert(run('maxPumpkins')<=3);
// Every render phase accepts loaded and fallback assets and finite coordinates.
context.checkCanvas=(...args)=>{for(const arg of args)if(typeof arg==='number')assert(Number.isFinite(arg),'Finite Canvas coordinate')};
run('for(const key of ["save","restore","beginPath","fill","translate","rotate","drawImage","stroke","moveTo","lineTo","ellipse","arc","rect","clip","fillRect","fillText","strokeText"])ctx[key]=checkCanvas;drawHalloweenBossLevel8();drawHalloweenBossHp();drawEventPumpkins();halloweenEventHeadSprite.complete=true;halloweenEventHeadSprite.naturalWidth=256;halloweenEventBodySprite.complete=true;halloweenEventBodySprite.naturalWidth=256;drawHalloweenBossLevel8();drawEventPumpkins();startHalloweenBossEatAnimation(state.eventPumpkins[0]||createEventPumpkin(70,450,100,{bossPumpkin:true,stage:3,age:6,matureAt:0}));updateHalloweenBossEatAnimation(.3);drawHalloweenBossLevel8();beginHalloweenBossDeath();updateHalloweenBossDeath(.5);drawHalloweenBossLevel8();drawHalloweenBossHp()');
console.log('PASS: boss HP, phase boundaries/no regression, healing/cap, growth/reference/safe spawn, owners and AoE exclusions, eating queue/motion/pause/cancellation, double/triple lanes, damage/visibility, death and rewards/reset');
