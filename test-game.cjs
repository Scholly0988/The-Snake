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
  replaceChildren(){}, append(){}
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
vm.runInContext(fs.readFileSync('progress.js','utf8'), context);
vm.runInContext(fs.readFileSync('paladin.js','utf8'), context);
vm.runInContext(fs.readFileSync('necromancer.js','utf8'), context);
vm.runInContext(fs.readFileSync('alchemist.js','utf8'), context);
vm.runInContext(fs.readFileSync('runemaster.js','utf8'), context);
vm.runInContext(fs.readFileSync('game.js','utf8'), context);
const run = code => vm.runInContext(code, context);
for (const width of [280,320,390,430]) {
  run('state.width = '+width);
  for (let d=0;d<5000;d+=3) {
    const p=run('pathPoint('+d+')');
    assert(p.x >= 22 && p.x <= width-22, 'Sprite must stay inside side edges');
    const q=run('pathPoint('+(d+1)+')');
    assert(Math.hypot(p.x-q.x,p.y-q.y)<=1.001, 'Continuous constant-distance path');
  }
}
run('state.width=390; state.mode="playing"; state.player.x=180; state.player.targetX=180');
handlers.pointerdown({pointerId:1,clientX:320});
assert.equal(run('state.player.targetX'),180,'Touch down must not move player');
handlers.pointermove({pointerId:1,clientX:340});
assert.equal(run('state.player.targetX'),200);
handlers.pointermove({pointerId:1,clientX:310});
assert.equal(run('state.player.targetX'),170);
handlers.pointerup({pointerId:1});
assert.equal(run('state.player.targetX'),180,'Release stops pending motion');
run('createSnake(3); state.headDistance=200');
const offset=run('state.snake[1].pathOffset');
run('destroySegment(0)');
assert.equal(run('state.snake[0].pathOffset'),offset,'Head returns to surviving segment');
for (const index of [0, 2, 4]) {
  run('state.mode="playing"; createSnake(5); state.headDistance=700; syncSnakePositions()');
  const before=JSON.parse(run('JSON.stringify(state.snake)'));
  const headBefore=run('state.snake[0].pathOffset');
  run('destroySegment('+index+')');
  const after=JSON.parse(run('JSON.stringify(state.snake)'));
  for (let i=0;i<after.length;i++) {
    const old=before[i<index?i:i+1];
    assert.equal(after[i].pathOffset,old.pathOffset+(i<index?run("SEGMENT_SPACING"):0));
    if (i>=index) { assert.equal(after[i].x,old.x); assert.equal(after[i].y,old.y); }
    if (i>0) assert(Math.abs(after[i].pathOffset-after[i-1].pathOffset-run("SEGMENT_SPACING"))<1e-9);
  }
  assert.equal(after[0].pathOffset,headBefore+run("SEGMENT_SPACING"));
}
run('state.mode="playing"; createSnake(3); state.headDistance=150; syncSnakePositions(); state.weapon.damage=1; const h=snakeHead(); state.bullets=[{x:h.x,y:h.y,hitsLeft:2,dead:false}]');
const initialHp=run('state.snake[0].hp');
run('handleHits()');
assert.equal(run('state.snake[0].hp'),initialHp-1,'Head redirects damage to first body');
run('state.bullets[0].x=state.snake[0].x; state.bullets[0].y=state.snake[0].y; handleHits()');
assert.equal(run('state.snake[0].hp'),initialHp-1,'Head and body cannot double-hit with same bullet');
run('createSnake(1); destroySegment(0)');
assert.equal(run('snakeHead()'),null,'No independent head remains after last body dies');
console.log('PASS: bounds, drag, front/middle/tail collapse, head damage, no double damage, death');
for (const [level,first,last] of [[1,5,5500],[2,15,9000],[3,32,14500]]) {
  run('state.level='+level+';createSnake(100)');
  const hp=JSON.parse(run('JSON.stringify(state.snake.map(s=>s.hp))'));
  assert.equal(hp[0],first);assert.equal(hp[99],last);
  assert(hp.every((v,i)=>Number.isInteger(v)&&(!i||v>hp[i-1])));
}
run('state.level=1');
const healthBefore=run('state.snake[3].hp');
run('destroySegment(2)');
assert.equal(run('state.snake[2].hp'),healthBefore,'Retreat must not recalculate HP');
const labels=[];
context.ctxStub=labels;
run('ctx.save=()=>{}; ctx.restore=()=>{}; ctx.strokeText=()=>{}; ctx.fillText=(text)=>ctxStub.push(text); drawHpLabel({x:100,y:100,hp:7,upgrade:false})');
assert.deepEqual(labels,['7']);
console.log('PASS: compounded HP, upgrade HP, stable HP after collapse, current HP label');
run('progress.data.coins=100; progress.save(); progress.buy("damageLevel"); resetGame()');
assert.equal(run('state.weapon.damage'),2);
run('state.weapon.damage+=10; resetGame()');
assert.equal(run('state.weapon.damage'),2,'Run upgrades reset; permanent purchases persist');
const coinsBefore=run('progress.data.coins');
run('state.mode="playing"; destroySegment(0); endGame()');
assert.equal(run('progress.data.coins'),coinsBefore+1,'Death keeps earned currency');
assert.equal(run('JSON.parse(window.localStorage.getItem("the-snake.progress.v1")).coins'),coinsBefore+1);
console.log('PASS: permanent starting bonus, temporary upgrade reset, saved rewards after death');
const effects = [
  [2,10,0], [1,11,0], [1,10,1],
  [3,10,0], [1,12,0], [1,10,2],
  [5,10,0], [1,13,0], [1,10,3]
];
assert.equal(run('roundUpgradePool().length'),16);
effects.forEach((expected,index)=>{
  run('state.weapon={damage:1,shotsPerSecond:10,pierce:0}; roundUpgradePool()['+index+'].apply()');
  assert.deepEqual(JSON.parse(run('JSON.stringify([state.weapon.damage,state.weapon.shotsPerSecond,state.weapon.pierce])')),expected);
});
for(let i=0;i<50;i++){
  const picks=JSON.parse(run('JSON.stringify(chooseUpgrades().map(x=>x.rarity+x.name))'));
  assert.equal(new Set(picks).size,3);
}
console.log('PASS: exact upgrade effects and unique weighted offers');

for (const [roll,tier] of [[0,'grey'],[.6315,'grey'],[.6316,'green'],[.8947,'green'],[.8948,'purple'],[.999999,'purple']]) {
  assert.equal(run('chooseUpgrades(()=>'+roll+').every(x=>x.rarity==="'+tier+'")'),true);
}
run('resetGame(); roundUpgradePool().find(x=>x.name==="+1 Mehrfachschuss").apply()');
assert.equal(run('state.weapon.bullets'),2);
assert.equal(run('state.weapon.spread'),24);
run('roundUpgradePool().find(x=>x.name==="Engerer Mehrfachschuss").apply(); roundUpgradePool().find(x=>x.name==="+1 Mehrfachschuss").apply()');
assert.equal(run('state.weapon.spread'),12);
run('roundUpgradePool().find(x=>x.name==="Paralleler Mehrfachschuss").apply(); roundUpgradePool().find(x=>x.name==="+1 Mehrfachschuss").apply()');
assert.equal(run('state.weapon.parallel'),true);
assert.equal(run('roundUpgradePool().length'),16);
for (const x of [0,195,390]) {
  run('state.player.x='+x+'; state.bullets=[]; fireWeapon()');
  const shots=JSON.parse(run('JSON.stringify(state.bullets)'));
  assert.equal(shots.length,4);
  assert.equal(new Set(shots.map(s=>s.x)).size,4);
  assert.equal(new Set(shots.map(s=>s.y)).size,1);
  assert(shots.every(s=>s.vx===0 && s.x>=6 && s.x<=384));
}
run('resetGame()');
assert.equal(run('!!state.weapon.parallel'),false);
assert.equal(run('roundUpgradePool().length'),16);
console.log('PASS: rarity boundaries, multishot progression, parallel row and edge bounds, reset');
for (const width of [280,390,430]) {
  run('state.width='+width);
  assert.equal(run('clampPlayerX(-1000)'),16);
  assert.equal(run('clampPlayerX(1000)'),width-16);
}
run('state.width=390; state.player.x=195; state.bullets=[]; fireWeapon()');
assert.equal(run('state.bullets[0].y'),run('state.player.y+28'));
console.log('PASS: centre platform edge bounds and platform shot origin');

assert(run('state.bullets[0].y-8 > state.player.y-34'), 'Entire projectile starts below defence line');
run('state.mode="playing"; createSnake(1); state.snake[0].x=195; state.snake[0].y=state.player.y-34; state.weapon.damage=1; state.bullets[0].previousY=state.bullets[0].y; state.bullets[0].y=state.player.y-34; handleHits()');
assert.equal(run('state.snake[0].hp'),4,'Shot damages body at lower line');
console.log('PASS: projectile below line and damage to low segments');

run('resetGame(); state.weapon.damage=10');
assert.equal(run('rollHit(()=>0).critical'),false);
for (const [tier,chance,bonus] of [['grey',2.5,15],['green',5,30],['purple',7.5,50]]) {
  run('state.weapon.critChance=0; state.weapon.critDamage=150; roundUpgradePool().find(x=>x.rarity==="'+tier+'" && x.name.includes("Krit-Chance")).apply(); roundUpgradePool().find(x=>x.rarity==="'+tier+'" && x.name.includes("Krit-Schaden")).apply()');
  assert.equal(run('state.weapon.critChance'),chance);
  assert.equal(run('state.weapon.critDamage'),150+bonus);
  assert.equal(run('rollHit(()=>0).damage'),10*(150+bonus)/100);
  assert.equal(run('rollHit(()=>'+chance+'/100).critical'),false);
}
run('state.weapon.critChance=99; roundUpgradePool().find(x=>x.name.includes("Krit-Chance")).apply()');
assert.equal(run('state.weapon.critChance'),100);
assert.equal(run('roundUpgradePool().some(x=>x.name.includes("Krit-Chance"))'),false);
assert.equal(run('rollHit(()=>.999999).critical'),true);
run('resetGame(); state.mode="playing"; createSnake(3); state.headDistance=150; syncSnakePositions(); state.weapon.damage=1; state.weapon.critChance=100; state.bullets=[{x:snakeHead().x,y:snakeHead().y,hitsLeft:2,dead:false}]; handleHits(()=>0)');
assert.equal(run('state.snake[0].hp'),3.5,'Head critical redirects 150% damage, retaining fractions');
run('state.bullets[0].x=state.snake[0].x; state.bullets[0].y=state.snake[0].y; handleHits(()=>0)');
assert.equal(run('state.snake[0].hp'),3.5,'Piercing must not double-hit head and body');
run('resetGame()');
assert.equal(run('state.weapon.critChance'),0);
assert.equal(run('state.weapon.critDamage'),150);
console.log('PASS: critical tiers, boundary probabilities, 100% cap, fractional head damage, no double hit, reset');
const menuNodes = new Map();
for (const page of ['Home','Upgrades','Heroes','Options']) {
  for (const prefix of ['menu','nav']) {
    const classes=new Set();
    const attrs={};
    menuNodes.set('#'+prefix+page, {classes,attrs,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},setAttribute:(k,v)=>attrs[k]=v});
  }
}
context.document.querySelector = selector => menuNodes.get(selector) || element;
for (const page of ['Home','Upgrades','Heroes','Options']) {
  run('selectMenuPage("'+page+'")');
  for (const name of ['Home','Upgrades','Heroes','Options']) {
    assert.equal(menuNodes.get('#menu'+name).classes.has('hidden'),name!==page);
    assert.equal(menuNodes.get('#nav'+name).attrs['aria-pressed'],String(name===page));
  }
}
run('showMenu()');
assert.equal(run('state.mode'),'start');
assert.equal(menuNodes.get('#menuHome').classes.has('hidden'),false);
run('startGame()');
assert.equal(run('state.mode'),'playing');
console.log('PASS: four menu pages, active navigation, return home and start round');

context.window.innerWidth=390;context.window.innerHeight=844;context.window.visualViewport={width:390,height:760,scale:1};context.window.screen={width:390,height:844};
assert.match(run('viewportMeasurementText()'),/Spielfeld: 390 × 700 CSS-Pixel/);
assert.match(run('viewportMeasurementText()'),/Sichtbarer Viewport: 390 × 760 CSS-Pixel/);
assert.match(run('viewportMeasurementText()'),/Geräte-Pixelfaktor: 1/);
run('measureGameArea()');
assert.equal(element.disabled,false);
console.log('PASS: options measurement reports field, layout, visual viewport, screen and pixel ratio');

assert.equal(run("Object.values(RARITY_CHANCES).reduce((a,b)=>a+b,0)"),1);

// Paladin combat and upgrade regression cases.
run('progress.data.damageLevel=0; progress.data.paladinUnlocked=true; progress.data.paladinSlot="left"; resetGame(); state.mode="playing"');
assert.equal(run('paladinDamage()'),2);
assert.equal(run('paladinX()'),run('state.player.x-36'));
run('state.paladin.slot="right"');
assert.equal(run('paladinX()'),run('state.player.x+36'));
run('state.bullets=[]; updatePaladin(.01)');
assert.equal(run('state.bullets[0].owner'),'paladin');
assert.equal(run('state.bullets[0].vy'),-433.5);
assert.equal(run('state.bullets[0].size'),1.4);
assert(Math.abs(run('state.paladin.fireTimer')-(1/(2.7*.65)-.01))<1e-10);
assert.equal(run('projectileHits({owner:"paladin",previousX:50,previousY:200,x:50,y:0,size:1.4},{x:50,y:100})'),true);
run('state.snake=[{id:501,x:100,y:100,hp:100},{id:502,x:133,y:100,hp:100},{id:503,x:166,y:100,hp:100}]; state.paladin.hits=0');
for(let i=0;i<4;i++) {
  const batch=JSON.parse(run('JSON.stringify([...(()=>{const damage=new Map();paladinHit(damage,state.snake[0],{critical:false},()=>.99);return damage;})()])'));
  assert.deepEqual(batch,i===3?[[501,1],[502,1],[503,1]]:[]);
}
for(const [id,field,expected] of [['consecrated','damageMultiplier',1.2],['steel','size',1.61],['flight','speed',1.02],['force-grey','radius',57.5],['force-green','radius',65],['force-purple','radius',75],['breaker-grey','explosionMultiplier',1.1],['breaker-green','explosionMultiplier',1.2],['breaker-purple','explosionMultiplier',1.4]]) {
  run('state.paladin=newPaladin("left");paladinUpgradePool().find(c=>c.id==="'+id+'").apply()');
  assert(Math.abs(run('state.paladin.'+field)-expected)<1e-10,id);
}
run('state.paladin=newPaladin("left");paladinUpgradePool().find(c=>c.id==="verdict").apply()');
assert.equal(run('state.paladin.impactEvery'),3);
assert.equal(run('paladinUpgradePool().some(c=>c.id==="verdict")'),false);
run('paladinUpgradePool().find(c=>c.id==="morning-green").apply();paladinUpgradePool().find(c=>c.id==="morning-purple").apply()');
assert.equal(run('state.paladin.morningChance'),.7);
assert.equal(run('paladinUpgradePool().some(c=>c.id.startsWith("morning"))'),false);
run('state.holyEffects=[]');
assert.equal(run('(()=>{const b=new Map();paladinExplosion(b,state.snake[0],40,1,501,()=>0);return b.get(502);})()'),2,'Morgenlicht adds one second strike');
assert.equal(run('state.holyEffects.length'),3,'Second strike does not recurse');
run('state.paladin=newPaladin("left");paladinUpgradePool().find(c=>c.id==="revenge").apply()');
assert.equal(run('(()=>{const b=new Map();paladinHit(b,state.snake[0],{critical:true},()=>1);return b.get(501);})()'),1);
assert.equal(run('paladinUpgradePool().some(c=>c.id==="revenge")'),false);
assert.equal(run('paladinUpgradePool().some(c=>c.id==="wrath-cooldown")'),false);
// Both orange unlocks remain unique choices.
assert.equal(run('chooseUpgrades(()=>.9999).filter(c=>c.rarity==="orange").length'),2);
run('paladinUpgradePool().find(c=>c.id==="wrath-unlock").apply()');
assert.equal(run('state.paladin.ultimate'),true);
assert.equal(run('paladinUpgradePool().some(c=>c.id==="wrath-unlock")'),false);
run('paladinUpgradePool().find(c=>c.id==="wrath-cooldown").apply()');
assert.equal(run('state.paladin.cooldown'),16);
assert.equal(run('state.paladin.remaining'),16);
run('state.paladin=newPaladin("left");state.paladin.ultimate=true;state.paladin.remaining=0;state.snake=[{id:601,x:100,y:100,hp:100,pathOffset:33},{id:602,x:133,y:100,hp:100,pathOffset:66}];updatePaladin(.1)');
assert.equal(run('state.paladin.charge'),.45);
run('updatePaladin(.45)');
assert.equal(run('state.snake[0].hp'),90);
assert.equal(run('state.snake[1].hp'),90);
assert.equal(run('state.paladin.remaining'),20);
// Multiple upgrade bodies killed in one batch: resolve both, queue both menus.
run('state.snake=[{id:701,x:100,y:100,hp:1,pathOffset:33,upgrade:true},{id:702,x:133,y:100,hp:1,pathOffset:66,upgrade:true},{id:703,x:166,y:100,hp:100,pathOffset:99,upgrade:false}];state.pendingUpgrades=0;state.mode="playing";applyDamageBatch(new Map([[701,2],[702,2]]))');
assert.equal(run('state.snake.length'),1);
assert.equal(run('state.pendingUpgrades'),2);
assert.equal(run('state.mode'),'upgrade');
const frozen=run('JSON.stringify([state.paladin,state.bullets,state.holyEffects,state.elapsed])');
run('update(1)');
assert.equal(run('JSON.stringify([state.paladin,state.bullets,state.holyEffects,state.elapsed])'),frozen);
const firstOffer=handlers.click;
firstOffer();
assert.equal(run('state.pendingUpgrades'),1);
firstOffer();
assert.equal(run('state.pendingUpgrades'),1,'Old offer cannot be applied twice');
handlers.click();
assert.equal(run('state.pendingUpgrades'),0);
assert.equal(run('state.mode'),'playing');
run('resetGame()');
assert.equal(run('state.paladin.ultimate'),false);
assert.equal(run('state.paladin.morningChance'),0);
run('progress.data.paladinSlot=null;resetGame()');
assert.equal(run('state.paladin'),null);
assert.equal(run('roundUpgradePool().some(c=>c.id==="consecrated")'),false);
console.log('PASS: Paladin base stats, both docks, swept hits, fourth hit, all upgrade tiers, one-shot upgrades, additive Morgenlicht, terminal effects, ultimate, queued pauses, stale clicks and reset');

// Check the first offer's actual tier distribution with all four tiers present.
run('progress.data.paladinSlot="left";resetGame()');
const tierCounts=JSON.parse(run(`JSON.stringify((()=>{
  const counts={grey:0,green:0,purple:0,orange:0};
  for(let i=0;i<10000;i++) {let calls=0;counts[chooseUpgrades(()=>calls++===0?(i+.5)/10000:.5)[0].rarity]++;}
  return counts;
})())`));
assert.deepEqual(tierCounts,{grey:6000,green:2500,purple:1000,orange:500});
// Execute the complete drawing path with finite-number checks (not a visual test).
context.checkCanvasNumbers=(...args)=>{for(const arg of args)if(typeof arg==='number')assert(Number.isFinite(arg),'Non-finite canvas coordinate');};
run(`for(const name of ['arc','beginPath','clearRect','drawImage','fill','fillRect','fillText','lineTo','moveTo','restore','rotate','scale','save','setLineDash','setTransform','stroke','strokeText','translate'])ctx[name]=checkCanvasNumbers;
ctx.createLinearGradient=ctx.createRadialGradient=(...args)=>{checkCanvasNumbers(...args);return {addColorStop(){}}};`);
for(const ready of [false,true]) {
  run('for(const image of [headSprite,bodySprite,playerSprite,paladinSprite,hammerSprite]){image.complete='+ready+';image.naturalWidth='+ (ready?1254:0)+';}');
  for(const side of ['left','right']) {
    run('state.paladin.slot="'+side+'";state.paladin.charge=.3;state.paladin.swing=.1;state.bullets=[{owner:"paladin",x:100,y:120,size:1.4,charged:true},{x:120,y:130}];state.holyEffects=[{x:100,y:100,radius:40,life:.3,maxLife:.5,kind:"ring"},{x:100,y:100,radius:40,life:.3,maxLife:.5,kind:"light"},{x:100,y:100,radius:40,life:.3,maxLife:.5,kind:"judgment"}];syncSnakePositions();draw()');
  }
}
console.log('PASS: exact 60/25/10/5 first-offer distribution, both docking draw paths, loaded/fallback assets and holy effects');
run('progress.data.critChanceLevel=1;progress.data.critDamageLevel=1;resetGame()');
assert.equal(run('state.weapon.critChance'),1);
assert.equal(run('state.weapon.critDamage'),175);
assert.equal(run('rollHit(()=>0,paladinDamage()).damage'),3.5);
run('state.weapon.critChance+=20;state.weapon.critDamage+=50;resetGame()');
assert.equal(run('state.weapon.critChance'),1);
assert.equal(run('state.weapon.critDamage'),175);
console.log('PASS: permanent crit starting values, Paladin inheritance and run reset');

// Both heroes' shots travel from platform centres through the lower defence area.
for(const owner of ['shooter','left','right']) {
  run('state.weapon={damage:1,shotsPerSecond:2.7,bullets:1,spread:0,pierce:0,critChance:0,critDamage:150};state.player.x=195;state.paladin=newPaladin("'+(owner==='shooter'?'left':owner)+'");state.mode="playing";state.pendingUpgrades=0;state.bullets=[]');
  if(owner==='shooter')run('fireWeapon()');else run('updatePaladin(.001)');
  assert.equal(run('state.bullets[0].y'),run('state.player.y+28'));
  assert.equal(run('state.bullets[0].x'),run(owner==='shooter'?'state.player.x':'paladinX()'));
  run('state.snake=[{id:9991,x:state.bullets[0].x,y:state.player.y-37,hp:10,maxHp:10,pathOffset:33,upgrade:false}];state.headDistance=0');
  for(let frame=0;frame<15;frame++)run('for(const b of state.bullets){b.previousX=b.x;b.previousY=b.y;b.y+=b.vy/60;}handleHits(()=>.99)');
  assert.equal(run('state.snake[0].hp'),owner==='shooter'?9:8,'Low segment damaged by '+owner);
}
console.log('PASS: centre-platform origin and low-segment damage for shooter, left Paladin, right Paladin');

// Vaelric integration: real combat helpers, upgrade eligibility and full pause.
run('resetGame(); state.necromancer=newNecromancer("left"); state.mode="playing"; state.weapon.critChance=0; state.weapon.damage=1');
assert.equal(run('necromancerHitRoll(()=>.04).critical'),true);
assert.equal(run('necromancerHitRoll(()=>.05).critical'),false);
assert.equal(run('necromancerHitRoll(()=>1).damage'),1.2);
run('updateNecromancer(0)');
assert.equal(run('state.bullets.at(-1).y'),run('state.player.y+PLATFORM_SHOT_Y'));
assert.equal(run('state.bullets.at(-1).vy'),-459);
const pick = id => run('necromancerUpgradePool().find(c=>c.id==="necro-'+id+'").apply()');
const available = id => run('necromancerUpgradePool().some(c=>c.id==="necro-'+id+'")');
for(const tier of ['grey','green','purple'])pick('markChance-'+tier);
assert(Math.abs(run('state.necromancer.markChance')-.35)<1e-9);
assert(!available('markChance-grey'));
for(const tier of ['grey','green','purple'])pick('endless-'+tier);
assert(Math.abs(run('state.necromancer.endless')-6)<1e-9);
for(const tier of ['grey','green','purple'])pick('harvest-'+tier);
assert(Math.abs(run('state.necromancer.harvest')-.35)<1e-9);
pick('binding-green');assert(!available('binding-grey'));pick('binding-purple');
assert.equal(run('state.necromancer.binding'),3);
pick('chain-purple');assert(!available('chain-green'));
assert(!available('siphon-grey'));assert(!available('choir-grey'));
pick('call');pick('siphon-grey');pick('siphon-purple');
assert.equal(run('state.necromancer.siphon'),.8);assert(!available('siphon-green'));
pick('strongDamage-grey');pick('strongDamage-grey');
assert(Math.abs(run('state.necromancer.strongDamage')-6.4)<1e-9);
pick('legion');assert.equal(run('state.necromancer.limit'),8);assert(!available('legion'));
pick('storm');assert(!available('storm'));
for(let i=0;i<3;i++)pick('elite');
assert.equal(run('state.necromancer.elite'),3);assert(!available('elite'));
assert(Math.abs(run('soulDamage({elite:true})')-3.52)<1e-9);
pick('curse-grey');
run('state.souls=[];createSnake(3);state.snake.forEach(s=>{s.upgrade=false;s.y=100});state.snake[0].soulMark=true;state.snake[0].necroTouched=true;applyDamageBatch(new Map([[state.snake[0].id,999]]))');
assert.equal(run('state.souls.length'),1);assert(run('state.souls[0].elite'));
run('state.necromancer=newNecromancer("right");state.souls=[];for(let i=0;i<8;i++)spawnSoul({x:100,y:100})');
assert.equal(run('state.souls.length'),3,'Normal limit enforced');
pick('seal');
run('state.souls=[];createSnake(5);state.snake.forEach(s=>{s.soulMark=true;s.upgrade=false;s.x=100;s.y=100});applyDamageBatch(new Map(state.snake.map(s=>[s.id,1e9])))');
assert.equal(run('state.souls.filter(s=>s.swirl).length'),50);
assert(Math.abs(run('soulDamage({swirl:true})')-(2+run('state.weapon.damage')))<1e-9);
assert(!available('explosion-grey'));
run('state.mode="upgrade"');
const paused=run('JSON.stringify([state.souls,state.necromancer])');
run('update(.03)');
assert.equal(run('JSON.stringify([state.souls,state.necromancer])'),paused);
run('state.mode="playing";state.necromancer=newNecromancer("left");state.souls=[];createSnake(4);state.snake.forEach(s=>{s.x=100;s.y=100;s.hp=100;s.upgrade=false});spawnSoul({x:100,y:100},{swirl:true,temporary:true,wait:0});updateNecromancer(0)');
assert.equal(run('state.snake.filter(s=>s.hp<100).length'),3,'Vortex soul exactly three distinct targets');
assert.equal(run('state.souls.length'),0);
run('state.necromancer=newNecromancer("left");state.souls=[];createSnake(3);state.headDistance=180;syncSnakePositions();state.snake.forEach(s=>{s.hp=.1;s.upgrade=false;s.soulMark=true});state.necromancer.explosion=1;applyDamageBatch(new Map([[state.snake[0].id,1]]))');
assert.equal(run('state.snake.length'),0,'Explosive death chain resolves without recursion');
run('state.necromancer=newNecromancer("left");state.souls=[];createSnake(2);state.snake.forEach(s=>{s.x=100;s.y=100;s.hp=100});state.necromancer.ultimate=true;state.necromancer.remaining=0;updateNecromancer(.01)');
assert.equal(run('state.necromancer.charge'),.5);
run('updateNecromancer(.5)');
assert.equal(run('state.souls.filter(s=>s.temporary).length'),2);
run('state.necromancer=newNecromancer("left");draw();state.necromancer.slot="right";draw();resetGame()');
assert.equal(run('state.necromancer'),null);
console.log('PASS: Vaelric stats, projectiles, additive/maximum/limited upgrades, elite souls, limits, 50-soul vortex/3 hits, chained explosions, full pause, Totenruf, both dock draws and reset');
run('state.paladin=newPaladin("right");state.necromancer=newNecromancer("left");state.weapon.critChance=7.5;state.weapon.critDamage=175;state.souls=[]');
assert.match(run('companionHudContent("left")'),/LINKS · Vaelric/);
assert.match(run('companionHudContent("left")'),/Krit 12,5 %/);
assert.match(run('companionHudContent("right")'),/RECHTS · Aldric/);
assert.match(run('companionHudContent("right")'),/Einschlag 0\/4/);
run('state.paladin.slot="left";state.necromancer.slot="right";state.paladin.hits=3');
assert.match(run('companionHudContent("left")'),/Einschlag 3\/4/);
assert.match(run('companionHudContent("right")'),/RECHTS · Vaelric/);
run('state.paladin=null');
assert.match(run('companionHudContent("left")'),/Kein Held ausgerüstet/);
console.log('PASS: compact HUD companion sides, critical values, counters and empty slot');
run('resetGame();state.mode="playing";state.necromancer=newNecromancer("left");state.souls=[];createSnake(1);state.snake[0].x=100;state.snake[0].y=100;state.snake[0].hp=100;spawnSoul({x:100,y:100},{strong:true});updateNecromancer(.1625)');
assert(Math.abs(run('state.souls[0].x')-114)<1e-8);
assert(Math.abs(run('state.souls[0].y')-114)<1e-8);
assert.equal(run('state.snake[0].hp'),100);
run('state.mode="upgrade"');
const circlePaused=run('JSON.stringify(state.souls[0])');
run('update(.1)');
assert.equal(run('JSON.stringify(state.souls[0])'),circlePaused);
run('state.mode="playing";updateNecromancer(.4875)');
assert(Math.abs(run('state.souls[0].x')-100)<1e-8);
assert.equal(run('state.snake[0].hp'),100);
run('updateNecromancer(.01)');
assert.equal(run('state.snake[0].hp'),97);
console.log('PASS: marked soul completes 0.65s circle, no early damage, full pause, then attacks');

run('state.necromancer=newNecromancer("left");state.souls=[]');
assert.equal(run('soulDamage({})'),2);
assert.equal(run('soulDamage({strong:true})'),3);
assert.equal(run('soulDamage({small:true})'),1.5);
assert.equal(run('soulDamage({swirl:true})'),2+run('state.weapon.damage'));
for (const [level,damage] of [[1,2.2],[2,3.3],[3,4.4]]) {
  run('state.necromancer.elite='+level);
  assert.equal(run('soulDamage({elite:true})'),damage);
}
run('state.necromancer.soulBonus=.5');
assert.equal(run('soulDamage({})'),3);
assert.equal(run('soulDamage({strong:true})'),4.5);
console.log('PASS: revised soul base damage, fixed elite tiers and upgrade scaling');
run('state.necromancer=newNecromancer("left");state.souls=[];state.mode="playing";createSnake(6);state.headDistance=-500;state.snake.forEach((s,i)=>{s.x=[300,100,250,150,350,200][i];s.y=300;s.hp=100;s.upgrade=false});');
run('var vortex=spawnSoul({x:50,y:300},{swirl:true,temporary:true,wait:0});vortex.previousX=50;vortex.previousY=300;vortex.x=220;hitVortexSoul(vortex)');
assert.equal(run('vortex.hits'),3);
assert.equal(run('vortex.dead'),true);
assert.equal(run('JSON.stringify(state.snake.map(s=>s.hp))'),'[100,97,100,97,100,97]');
run('vortex.previousX=220;vortex.x=390;hitVortexSoul(vortex)');
assert.equal(run('state.snake[0].hp'),100);
run('state.souls=[];var second=spawnSoul({x:250,y:300},{swirl:true,temporary:true,wait:0});hitVortexSoul(second);hitVortexSoul(second)');
assert.equal(run('second.hits'),1);
assert.equal(run('state.snake[2].hp'),97);
run('second.previousX=250;second.previousY=300;second.x=300;hitVortexSoul(second)');
assert.equal(run('second.hits'),2);
assert.equal(run('state.snake[0].hp'),97);
console.log('PASS: vortex flight hits nonadjacent segments in contact order, no duplicate damage, independent souls and lifetime three-hit limit');
run('resetGame();state.mode="playing";state.necromancer=newNecromancer("left");state.souls=[];createSnake(3);state.snake.forEach((s,i)=>{s.x=100+i*80;s.y=100;s.hp=100;s.upgrade=false;s.soulMark=i>0});var seeker=spawnSoul({x:100,y:100},{wait:0});');
assert.equal(run('chooseSoulTarget(seeker,()=>0).id'),run('state.snake[1].id'));
assert.equal(run('chooseSoulTarget(seeker,()=>.99).id'),run('state.snake[2].id'));
run('state.snake.forEach(s=>s.soulMark=false)');
assert.equal(run('chooseSoulTarget(seeker).id'),run('state.snake[0].id'));
run('createSnake(1);state.snake[0].x=100;state.snake[0].y=100;state.snake[0].hp=100;state.snake[0].upgrade=false;');
for(let attack=1;attack<=3;attack++){
  run('seeker.x=100;seeker.y=100;updateNecromancer(0)');
  assert.equal(run('seeker.attacks'),attack);
  assert.equal(run('state.snake[0].hp'),100-2*attack);
  if(attack<3){
    assert.equal(run('seeker.phase'),'return');
    run('updateNecromancer(5)');
    assert.equal(run('seeker.phase'),'rest');
    assert.equal(run('seeker.rest'),5);
    run('updateNecromancer(4.99)');
    assert.equal(run('seeker.phase'),'rest');
    run('state.mode="upgrade"');
    const frozen=run('JSON.stringify(seeker)');
    run('update(.03)');
    assert.equal(run('JSON.stringify(seeker)'),frozen);
    run('state.mode="playing";updateNecromancer(.02)');
    assert.equal(run('seeker.phase'),'attack');
  }
}
assert.equal(run('seeker.dead'),true);
run('state.souls=[];state.necromancer.endless=6;var extended=spawnSoul({x:100,y:100},{temporary:true,wait:0})');
for(let i=0;i<8;i++)run('finishSoulAttack(extended)');
assert.equal(run('extended.dead'),false);
run('finishSoulAttack(extended)');
assert.equal(run('extended.dead'),true);
console.log('PASS: random marked priority, nearest fallback, three attacks, five-second rests, pause, same-target reuse and nine-attack maximum');
run('resetGame();state.necromancer=newNecromancer("left");state.souls=[]');
for(const bonus of [1,2,4]) run('roundUpgradePool().find(c=>c.name==="+'+bonus+' Schaden").apply()');
assert.equal(run('state.weapon.soulDamageBonus'),7);
for(const [soul,base] of [[{},2],[{strong:true},3],[{small:true},1.5],[{swirl:true},2],[{elite:true},2.2]]){
  assert.equal(run('soulDamage('+JSON.stringify(soul)+')'),base+(soul.swirl?run('state.weapon.damage'):7));
}
run('state.necromancer.soulBonus=.5');
assert.equal(run('soulDamage({})'),13.5);
run('resetGame()');
assert.equal(run('state.weapon.soulDamageBonus||0'),0);
console.log('PASS: all general damage cards add to every soul type before percentage bonuses and reset each run');

run('resetGame();state.mode="playing";state.necromancer=newNecromancer("left");state.souls=[];state.weapon.soulDamageBonus=0;createSnake(8);state.snake.forEach((s,i)=>{s.x=60+i*35;s.y=100;s.hp=100;s.upgrade=false});state.snake[6].x=299;state.snake[7].x=301;var jumper=spawnSoul({x:60,y:100},{wait:0});');
pick('binding-orange');
assert.equal(run('state.necromancer.binding'),5);
assert(!available('binding-purple'));
for(let i=0;i<6;i++) {
  run('jumper.x=state.snake['+i+'].x;jumper.y=100;jumper.targetId=state.snake['+i+'].id;updateNecromancer(0)');
  assert.equal(run('jumper.jumps'),i);
  if(i<5)assert.equal(run('jumper.phase'),'attack');
}
assert.equal(run('jumper.phase'),'return');
assert.equal(run('jumper.attacks'),1);
assert.equal(run('state.snake[5].hp'),92,'Direct 2 plus explosion 6');
assert.equal(run('state.snake[6].hp'),94,'64px inside enlarged explosion');
assert.equal(run('state.snake[7].hp'),94,'66px inside enlarged explosion');
run('restSoul(jumper,1000,1);restSoul(jumper,1000,5)');
assert.equal(run('jumper.jumps'),0);
assert.equal(run('jumper.hitIds.size'),0);
assert.equal(run('jumper.phase'),'attack');
console.log('PASS: guaranteed five jumps, fifth-jump 200% explosion radius 80, return and per-cycle reset');
run('showMenu();progress.data.completedLevels=0;state.selectedLevel=1;changeLevel(1)');
assert.equal(run('state.selectedLevel'),2);
run('startGame()');assert.equal(run('state.mode'),'start','Locked level cannot start');
run('changeLevel(-1);startGame()');
assert.equal(run('state.level'),1);
assert.equal(run('state.snake.length'),100);
run('completeLevel()');
assert.equal(run('progress.data.completedLevels'),0,'Living segments prevent completion');
run('state.snake=[];state.pendingUpgrades=1;update(0)');
assert.equal(run('state.mode'),'victory');
assert.equal(run('progress.data.completedLevels'),1);
assert.equal(run('state.snake.length'),0,'No endless replacement snake');
const winScore=run('state.score');
run('completeLevel()');assert.equal(run('state.score'),winScore,'No repeated win bonus');
run('showMenu();changeLevel(1);startGame()');
assert.equal(run('state.snake[0].hp'),15);
assert.equal(run('state.snake[99].hp'),9000);
run('endGame()');
assert.equal(run('progress.data.completedLevels'),1,'Loss never unlocks');
run('startGame();state.snake=[];update(0);showMenu();changeLevel(1);startGame()');
assert.equal(run('state.snake[0].hp'),32);
assert.equal(run('state.snake[99].hp'),14500);
run('state.snake=[];update(0)');
assert.equal(run('progress.data.completedLevels'),3);
console.log('PASS: level arrows, locked start, full completion, replay, loss, final level and exact HP endpoints');
run('state.mode="playing";state.lastUpgrade="Todessiegel (orange)";var realUpdate=update;update=()=>{throw new Error("Testfehler")};loop(100)');
assert.equal(run('state.mode'),'error');
assert.match(run('state.lastError'),/Todessiegel/);
assert.match(run('state.lastError'),/Testfehler/);
run('update=realUpdate;resumeAfterError()');
assert.equal(run('state.mode'),'playing');
console.log('PASS: frame error captured with upgrade context and resumable state');
run('var savedUpdate=update;var capturedDt=-1;update=dt=>capturedDt=dt;state.mode="playing";state.lastTime=1000;loop(997.5)');
assert.equal(run('capturedDt'),0,'An earlier RAF timestamp must not reverse time after upgrade selection');
run('update=savedUpdate;state.necromancer=newNecromancer("right");state.paladin=newPaladin("left");state.soulEffects=[{x:100,y:100,radius:15,life:.4025}];var savedArc=ctx.arc;ctx.arc=(x,y,r)=>{if(r<0)throw new Error("negative radius")};drawNecromancer();ctx.arc=savedArc');
console.log('PASS: post-upgrade RAF time cannot be negative; soul effects with excess lifetime render safely');
run('state.selectedLevel=1;resetGame();state.mode="playing";state.paladin=newPaladin("left");state.weapon.critChance=0;state.weapon.damage=1;state.snake=[{id:90001,x:100,y:100,hp:100,pathOffset:33},{id:90002,x:130,y:100,hp:100,pathOffset:66}];state.headDistance=-100;state.bullets=[{owner:"paladin",hammerPhase:"sweep",x:140,y:100,previousX:70,previousY:100,hitsLeft:Infinity,size:1.4}];handleHits(()=>1)');
assert.equal(run('state.snake[0].hp'),98);
assert.equal(run('state.snake[1].hp'),98);
run('handleHits(()=>1)');
assert.equal(run('state.snake[0].hp'),98);
run('state.bullets[0].hammerPhase="return";state.bullets[0].hitIds.clear();handleHits(()=>1)');
assert.equal(run('state.snake[0].hp'),98);
run('state.player.x=250;state.bullets[0].x=50;state.bullets[0].y=100;advanceHammer(state.bullets[0],10)');
assert.equal(run('state.bullets[0].dead'),true);
assert.equal(run('state.bullets[0].x'),run('paladinX()'));
run('state.necromancer=newNecromancer("right");state.paladin=null;state.weapon.critChance=0;state.snake[0].x=200;state.snake[1].x=100;state.bullets=[{owner:"necromancer",x:100,y:100,hitsLeft:1}];handleHits(()=>1)');
assert.equal(run('state.snake[1].hp'),98,'Homing shot ignores a body other than the first');
run('state.snake.shift();handleHits(()=>1)');
assert.equal(run('state.snake[0].hp'),96.8,'Shot hits newly foremost segment');
console.log('PASS: hammer multiple contacts only once, harmless moving return, homing target switches and ignores intervening bodies');
run('resetGame();state.necromancer=newNecromancer("left");state.width=390;state.height=700;createSnake(4);state.snake.forEach((s,i)=>{s.x=100;s.y=i===3?-20:100+i*50});var markRolls=[.04,.99];prepareNecroHit(state.snake[0],{damage:1,critical:false},()=>markRolls.shift())');
assert.equal(run('!!state.snake[0].soulMark'),false);
assert.equal(run('state.snake[2].soulMark'),true);
assert.equal(run('!!state.snake[3].soulMark'),false);
run('prepareNecroHit(state.snake[0],{damage:1,critical:false},()=>.20)');
assert.equal(run('state.snake.filter(s=>s.soulMark).length'),1);
run('prepareNecroHit(state.snake[1],{damage:1,critical:false},()=>0)');
assert.equal(run('state.snake.filter(s=>s.soulMark).length'),1);
for(const tier of ['grey','green','purple'])pick('markChance-'+tier);
assert(Math.abs(run('state.necromancer.markChance')-.35)<1e-9);
assert(!available('markChance-grey'));
console.log('PASS: first-segment hit rolls mark chance, random visible unmarked target, boundary and once-per-tier additive upgrades');

run('resetGame();state.mode="playing";state.width=390;state.height=700;state.necromancer=newNecromancer("left");state.snake=[{id:1,x:100,y:-1,hp:100},{id:2,x:-1,y:100,hp:100},{id:3,x:391,y:100,hp:100},{id:4,x:100,y:701,hp:100},{id:5,x:100,y:0,hp:100}];applyDamageBatch(new Map(state.snake.map(s=>[s.id,10])))');
assert.deepEqual(Array.from(run('state.snake.map(s=>s.hp)')),[100,100,100,100,90]);
run('var areaBatch=new Map();necroArea(areaBatch,{x:100,y:0},1000,10);holyArea(areaBatch,{x:100,y:0},1000,10);applyDamageBatch(areaBatch)');
assert.deepEqual(Array.from(run('state.snake.map(s=>s.hp)')),[100,100,100,100,70]);
assert.equal(run('!!state.snake[0].necroTouched'),false);
run('state.bullets=[{x:100,y:-1,hitsLeft:1}];state.snake[4].x=300;handleHits(()=>1)');
assert.equal(run('state.snake[0].hp'),100);
assert.equal(run('state.bullets[0].hitsLeft'),1);
run('state.souls=[];var edgeSoul=spawnSoul({x:100,y:-1},{swirl:true,temporary:true});hitVortexSoul(edgeSoul)');
assert.equal(run('edgeSoul.hits'),0);
run('state.snake[0].y=0;applyDamageBatch(new Map([[1,10]]))');
assert.equal(run('state.snake[0].hp'),90);
console.log('PASS: all four offscreen edges protected, visible entry allows damage, explosions and vortex/projectile hits ignore invisible bodies');
run('resetGame();state.mode="playing";state.width=390;state.height=700;state.necromancer=newNecromancer("left");state.weapon.damage=8;state.weapon.soulDamageBonus=2;state.necromancer.explosion=.6;state.snake=[{id:81,x:100,y:100,hp:100},{id:82,x:177.5,y:100,hp:100},{id:83,x:177.51,y:100,hp:100},{id:84,x:100,y:-1,hp:100}];state.necroDeaths=[{segment:{x:100,y:100,soulMark:true},neighbors:[]}];resolveNecroDeaths()');
assert.deepEqual(Array.from(run('state.snake.map(s=>s.hp)')),[91.4,91.4,100,100]);
assert.equal(run('soulDamage({swirl:true})'),10,'Full weapon value, no duplicate run bonus');
assert.equal(run('soulDamage({},true)*2'),20,'Jump explosion scales full weapon before 200%');
assert.equal(run('soulDamage({})'),4,'Normal soul direct damage preserved');
run('state.necromancer.soulBonus=.5;state.necromancer.legion=true');
assert.equal(run('soulDamage({swirl:true})'),12,'Percentage modifiers follow base plus weapon');
run('state.paladin=newPaladin("right");state.paladin.hits=3;var holyBatch=new Map();paladinHit(holyBatch,state.snake[0],{critical:false},()=>1)');
assert.equal(run('holyBatch.get(81)'),4.5,'Paladin weapon already included exactly once before 50%');
assert.equal(run('holyBatch.has(82)'),false,'Outside radius plus hitbox is untouched');
console.log('PASS: exact AoE tangency, all visible area targets, full permanent/run weapon scaling once and modifiers after addition');
run('resetGame();state.mode="playing";state.width=390;state.height=700;state.necromancer=newNecromancer("left");state.snake=[{id:901,x:100,y:100,hp:100,soulMark:true},{id:902,x:200,y:100,hp:100}];state.necromancer.curse=.2;applyDamageBatch(new Map([[901,10],[902,10]]))');
assert.equal(run('state.snake[0].hp'),88);
assert.equal(run('state.snake[1].hp'),90);
run('var curseBatch=new Map();necroArea(curseBatch,{x:100,y:100},10,10);applyDamageBatch(curseBatch)');
assert.equal(run('state.snake[0].hp'),76,'Curse is applied once to necromancer AoE');
run('state.necromancer.markCooldown=0;prepareNecroHit(state.snake[0],{damage:1,critical:false},()=>1);var attempts=0;prepareNecroHit(state.snake[0],{damage:1,critical:false},()=>{attempts++;return 0})');
assert.equal(run('attempts'),0,'Failed mark roll also starts cooldown');
run('state.necromancer.fireTimer=100;updateNecromancer(.5)');
assert.equal(run('state.necromancer.markCooldown'),.5);
run('state.mode="upgrade";update(.5)');
assert.equal(run('state.necromancer.markCooldown'),.5,'Pause freezes mark timer');
run('state.mode="playing";updateNecromancer(.5);prepareNecroHit(state.snake[0],{damage:1,critical:false},()=>0)');
assert.equal(run('state.snake[1].soulMark'),true);
run('state.necromancer=newNecromancer("left");state.necromancer.legion=true;state.necromancer.explosion=.6;state.weapon.damage=8;state.snake=[{id:911,x:100,y:100,hp:100}];state.necroDeaths=[{segment:{x:100,y:100,soulMark:true},neighbors:[]}];resolveNecroDeaths()');
assert.equal(run('state.snake[0].hp'),91.4,'Legion does not reduce death explosion');
run('state.necromancer.chain=1;state.snake=[{id:921,x:100,y:-100,hp:100},{id:922,x:300,y:300,hp:100}];state.necroDeaths=[{segment:{x:100,y:100,soulMark:true},neighbors:[state.snake[0]]}];resolveNecroDeaths()');
assert.equal(run('!!state.snake[0].soulMark'),false);
assert.equal(run('state.snake[1].soulMark'),true,'Chain can mark a distant visible non-neighbor');
run('state.necromancer=null;state.paladin=newPaladin("right");state.weapon.damage=1;state.weapon.critChance=0;state.snake=[{id:931,x:100,y:100,hp:100},{id:932,x:220,y:200,hp:100},{id:933,x:100,y:-100,hp:100}];state.bullets=[];state.headDistance=-1000');
assert.equal(run('paladinUpgradePool().some(c=>c.id==="ancestors")'),false);
run('paladinUpgradePool().find(c=>c.id==="blade").apply();for(let i=0;i<5;i++){state.paladin.fireTimer=0;updatePaladin(0)}');
assert.deepEqual(Array.from(run('state.bullets.map(b=>b.fullSweep)')),[false,false,false,false,true]);
run('state.paladin.impactEvery=9999;state.bullets=[state.bullets[4]];for(let i=0;i<1000&&!state.bullets[0].dead;i++){const b=state.bullets[0];b.previousX=b.x;b.previousY=b.y;advanceHammer(b,.016);handleHits(()=>1)}');
assert.deepEqual(Array.from(run('state.snake.map(s=>s.hp)')),[98,98,100]);
assert.equal(run('state.bullets[0].dead'),true,'Special hammer returns after one hit per visible segment');
run('paladinUpgradePool().find(c=>c.id==="ancestors").apply();state.bullets=[];for(let i=0;i<4;i++){state.paladin.fireTimer=0;updatePaladin(0)}');
assert.deepEqual(Array.from(run('state.bullets.map(b=>b.fullSweep)')),[false,false,false,true]);
assert.equal(run('paladinUpgradePool().some(c=>c.id==="ancestors")'),false);
console.log('PASS: shared curse once, mark cooldown and pause, legion exception, random visible chain and fifth/fourth full-snake hammer with harmless return');
run('progress.data.completedLevels=3;progress.data.difficulty=.15;state.selectedLevel=2;resetGame();state.mode="playing";state.snake[0].upgrade=false;var coinsBefore=progress.data.coins;destroySegment(0,false)');
assert.equal(run('progress.data.coins-coinsBefore'),3);
assert.equal(run('state.snake[98].maxHp'),13500);
run('state.snake=[];var victoryBefore=progress.data.coins;progress.data.firstClears[4]=false;completeLevel()');
assert.equal(run('progress.data.coins-victoryBefore'),450);
run('completeLevel()');
assert.equal(run('progress.data.coins-victoryBefore'),450,'Duplicate victory callback is guarded');
console.log('PASS: level/difficulty HP and segment rewards, completion bonus and duplicate victory guard');

// Desktop/tablet companion sheets and keyboard movement.
run('progress.data.paladinUnlocked=true;progress.data.paladinSlot="left";progress.data.necromancerSlot=null;progress.data.alchemistSlot=null;progress.data.skillUpgrades=["paladin.attack"];state.mode="playing";resetGame();state.mode="playing"');
run('var desktopCard=paladinUpgradePool().find(c=>c.id==="consecrated");desktopCard.apply();recordRunUpgrade(desktopCard)');
const desktopHud=run('companionHudContent("left")');
assert.match(desktopHud,/desktop-hero-details/);
assert.match(desktopHud,/Aktuelle Werte/);
assert.match(desktopHud,/Geweihter Hammer/);
assert.match(desktopHud,/Hammer des Morgenlichts/);
assert.match(desktopHud,/×1/);
run('state.player.x=195;state.player.targetX=195;setKeyboardKey("ArrowRight",true);update(.1)');
assert(run('state.player.x')>195,'Right arrow moves the whole platform right');
const movedRight=run('state.player.x');
run('setKeyboardKey("ArrowRight",false);setKeyboardKey("KeyA",true);update(.1)');
assert(run('state.player.x')<movedRight,'A key moves the whole platform left');
run('setKeyboardKey("KeyA",false)');
const css=fs.readFileSync('style.css','utf8');
assert.match(css,/@media \(min-width:760px\)/);
assert.match(css,/\.desktop-hero-details \{ display:block/);
console.log('PASS: responsive side sheets show current/run/permanent details and arrow/A-D keyboard movement');
