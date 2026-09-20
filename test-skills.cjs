const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element {
  constructor(){this.children=[];this.handlers={};this.textContent='';this.style={};this.disabled=false;this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};}
  append(...children){this.children.push(...children)} replaceChildren(...c){this.children=c}
  addEventListener(type,fn){this.handlers[type]=fn} setAttribute(){} setPointerCapture(){} hasPointerCapture(){return false}
  getBoundingClientRect(){return {width:390,height:700}} getContext(){return canvasContext}
  click(){if(!this.disabled)this.handlers.click?.()}
}
const canvasContext=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
const elements=new Map(),get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s)};
const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
const context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:storage,devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){}});
for(const f of ['skills.js','progress.js','paladin.js','necromancer.js','alchemist.js','game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const run=s=>vm.runInContext(s,context),near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(ids=[]){run(`progress.data.damageLevel=0;progress.data.rateLevel=0;progress.data.critChanceLevel=0;progress.data.critDamageLevel=0;progress.data.skillUpgrades=${JSON.stringify(ids)};resetGame();state.mode="playing";state.paladin=newPaladin("left");state.necromancer=newNecromancer("right");state.snake=[{id:1,x:100,y:100,hp:1000,maxHp:1000},{id:2,x:200,y:100,hp:1000,maxHp:1000}];state.headDistance=-1000;`)}
function pcard(id){run(`paladinUpgradePool().find(c=>c.id===${JSON.stringify(id)}).apply()`)}
function ncard(id){run(`necromancerUpgradePool().find(c=>c.id===${JSON.stringify('necro-'+id)}).apply()`)}
function gcard(text){run(`roundUpgradePool().find(c=>c.name===${JSON.stringify(text)}).apply()`)}
// Purchases, old save migration, strict schema, concurrent tab and write rollback.
const api=run('SnakeProgress');let store=new Map(),fail=false;
const io={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v)}};
let p=api.open(io);assert.deepEqual(Array.from(p.data.skillUpgrades),[]);
p.data.coins=200;p.save();assert.equal(p.buySkill('paladin.attack'),false);assert.equal(p.buySkill('unknown'),false);
assert(p.buySkill('shooter.attack'));assert.equal(p.data.coins,150);assert.equal(p.buySkill('shooter.attack'),false);
p=api.open(io);assert(p.data.skillUpgrades.includes('shooter.attack'));
const backup=p.export();p.import(backup);assert(p.data.skillUpgrades.includes('shooter.attack'));
fail=true;assert.equal(p.buySkill('shooter.rate'),false);assert.equal(p.data.coins,150);assert(!p.data.skillUpgrades.includes('shooter.rate'));fail=false;
const other=api.open(io);assert(other.buySkill('shooter.rate'));assert.equal(p.buySkill('shooter.pierce'),false);assert.equal(p.data.coins,150);
const legacy=JSON.parse(backup);delete legacy.skillUpgrades;assert.equal(api.validate(legacy).skillUpgrades.length,0);
for(const bad of [['unknown'],['shooter.attack','shooter.attack'],{},[null]])assert.throws(()=>api.validate({...legacy,skillUpgrades:bad}));
// Actual menu render and purchase wiring for every hero.
run('state.mode="start";progress.data.coins=1000;progress.data.paladinUnlocked=true;progress.data.necromancerUnlocked=true;progress.save()');
for(const hero of ['shooter','paladin','necromancer']){
 get('#skills-'+hero).click();assert(!get('#heroSkills').classes.has('hidden'));assert(get('#heroOverview').classes.has('hidden'));
 const cards=get('#skillsList').children.filter(n=>n.className==='skill-card');assert.equal(cards.length,run(`HERO_SKILLS.filter(s=>s.hero==="${hero}").length`));
 cards[0].children.at(-1).click();assert(run(`progress.data.skillUpgrades.includes("${hero}.attack")`));
 get('#closeSkills').click();assert(get('#heroSkills').classes.has('hidden'));
}
run('progress.data.coins=0;openHeroSkills("paladin")');assert(get('#skillsList').children.filter(n=>n.className==='skill-card').every(n=>n.children.at(-1).disabled));
// Snapshot: permanent purchases only affect subsequent runs.
setup();run('progress.data.skillUpgrades=["paladin.attack"]');near(run('paladinDirectDamage()'),2);
run('resetGame();state.paladin=newPaladin("left")');near(run('paladinDirectDamage()'),2.4);near(run('paladinDamage()'),2);
// Exact agreed Aldric values, no direct damage leaking into explosions.
setup(['paladin.attack','paladin.impact','paladin.judgment','paladin.morning','paladin.revenge','paladin.blade']);
near(run('paladinDirectDamage({fullSweep:true})'),3);
run('state.paladin.hits=3;var b=new Map();paladinHit(b,state.snake[0],{critical:false},()=>1)');near(run('b.get(1)'),1.2);
run('state.paladin.morningChance=1;var b=new Map();paladinExplosion(b,state.snake[0],50,0,null,()=>0)');near(run('b.get(1)'),1.5);
run('state.paladin.morningChance=0;state.paladin.hits=0;state.paladin.revenge=true;var b=new Map();paladinHit(b,state.snake[0],{critical:true},()=>1)');near(run('b.get(1)'),2);
run('state.paladin.ultimate=true;state.paladin.charge=.1;state.paladin.fireTimer=100;updatePaladin(.1)');near(run('state.snake[0].hp'),985);
for(const [skill,id,field,value] of [['consecrated','consecrated','damageMultiplier',1.3],['steel','steel','size',1.75],['flight','flight','speed',1.105],['verdict','verdict','impactEvery',2]]){
 setup(['paladin.'+skill]);pcard(id);near(run('state.paladin.'+field),value);
}
for(const [tier,force,breaker] of [['grey',60,1.2],['green',67.5,1.3],['purple',77.5,1.5]]){
 setup(['paladin.force','paladin.breaker']);pcard('force-'+tier);pcard('breaker-'+tier);near(run('state.paladin.radius'),force);near(run('state.paladin.explosionMultiplier'),breaker);
}
setup(['paladin.ancestors','paladin.wrath']);pcard('blade');pcard('ancestors');near(run('state.paladin.bladeEvery'),3);pcard('wrath-unlock');near(run('state.paladin.cooldown'),18);pcard('wrath-cooldown');near(run('state.paladin.cooldown'),13.5);
// Vaelric attack families and passives.
setup(['necromancer.attack','necromancer.soul','necromancer.harvest','necromancer.elite','necromancer.seal']);
near(run('necromancerDamage()'),1.44);near(run('soulDamage({})'),2.4);near(run('soulDamage({strong:true})'),3.6);near(run('soulDamage({small:true})'),2);near(run('soulDamage({swirl:true})'),3.5);near(run('soulDamage({elite:true})'),2.64);
setup(['necromancer.legion']);ncard('legion');near(run('soulDamage({})'),1.8);
setup(['necromancer.storm']);ncard('storm');run('state.souls=Array.from({length:4},()=>({}))');near(run('soulDamage({})'),2.4);
setup(['necromancer.markChance']);run('prepareNecroHit(state.snake[0],{damage:1,critical:false},()=>1)');near(run('state.necromancer.markCooldown'),.75);
setup(['necromancer.endless']);ncard('endless-grey');run('var resting={phase:"return",x:42,y:668};restSoul(resting,180,0)');near(run('resting.rest'),4);
setup(['necromancer.call']);ncard('call');near(run('state.necromancer.remaining'),20);run('state.necromancer.charge=.1;state.necromancer.fireTimer=100;updateNecromancer(.1)');near(run('state.necromancer.remaining'),20);
setup(['necromancer.explosion']);run('state.necromancer.explosion=.6;state.necroDeaths=[{segment:{x:100,y:100,soulMark:true},neighbors:[]}];resolveNecroDeaths()');near(run('state.snake[0].hp'),998.08);
for(const [skill,field,expected] of [['limit','limit',[5,6,7]],['soulBonus','soulBonus',[.20,.35,.55]],['speedBonus','speedBonus',[.30,.50,.80]],['strongDamage','strongDamage',[5.2,5.5,6]],['choir','choir',[2,3,5]],['curse','curse',[.15,.25,.40]],['siphon','siphon',[.4,.6,.9]],['chain','chain',[.3,.45,.65]]]){
 for(const [i,tier] of ['grey','green','purple'].entries()){setup(['necromancer.'+skill]);run('state.necromancer.ultimate=true');ncard(skill+'-'+tier);near(run('state.necromancer.'+field),expected[i]);}
}
setup(['necromancer.binding']);ncard('binding-grey');run('var soul=spawnSoul({x:100,y:100},{wait:0});updateNecromancer(0);soul.x=200;soul.y=100;soul.targetId=2;updateNecromancer(0)');near(run('state.snake[0].hp'),998);near(run('state.snake[1].hp'),997.6);
// Shooter skills and shared upgrade cards.
setup(['shooter.attack']);run('state.bullets=[{x:100,y:100,hitsLeft:1}];handleHits(()=>1)');near(run('state.snake[0].hp'),998.8);
setup(['shooter.damage','shooter.rate','shooter.pierce','shooter.critChance','shooter.critDamage','shooter.multi','shooter.spread','shooter.parallel']);
gcard('+1.2 Schaden');near(run('state.weapon.damage'),2.2);near(run('state.weapon.soulDamageBonus'),1.2);
gcard('+15 % Feuerrate');near(run('state.weapon.shotsPerSecond'),2.7*1.15);gcard('+2 Durchschlag');near(run('state.weapon.pierce'),2);
gcard('+3,5 % Krit-Chance');near(run('state.weapon.critChance'),3.5);gcard('+25 % Krit-Schaden');near(run('state.weapon.critDamage'),175);
gcard('+2 Mehrfachschuss');near(run('state.weapon.bullets'),3);gcard('Engerer Mehrfachschuss');near(run('state.weapon.spread'),9.6);gcard('Paralleler Mehrfachschuss');
console.log('PASS: all skill families wired, exact agreed damage, isolated direct bonuses, upgrade tiers, purchases, locked heroes, rollback, migration, export and functional menu navigation');
setup();run('state.souls=[];for(let i=0;i<3;i++)spawnSoul({x:100,y:100});for(let i=0;i<5;i++)spawnSoul({x:100,y:100},{small:true})');
assert.equal(run('regularSoulCount()'),3);assert.equal(run('smallSoulCount()'),5);
assert.equal(run('spawnSoul({x:100,y:100})'),null);assert.equal(run('spawnSoul({x:100,y:100},{small:true})'),null);
run('state.souls[0].dead=true');assert(run('!!spawnSoul({x:100,y:100},{strong:true})'));assert.equal(run('spawnSoul({x:100,y:100},{small:true})'),null);
run('state.souls.find(s=>s.small).dead=true');assert(run('!!spawnSoul({x:100,y:100},{small:true})'));
run('state.souls.filter(s=>!s.dead).forEach(s=>s.phase="rest")');assert.equal(run('smallSoulCount()'),5);assert.equal(run('regularSoulCount()'),3);
assert(run('!!spawnSoul({x:100,y:100},{temporary:true})'));assert(run('!!spawnSoul({x:100,y:100},{temporary:true,swirl:true})'));
assert.equal(run('smallSoulCount()'),5);assert.equal(run('regularSoulCount()'),3);
ncard('limit-green');assert.equal(run('state.necromancer.limit'),5);assert.equal(run('smallSoulLimit()'),7);
ncard('legion');assert.equal(run('state.necromancer.limit'),10);assert.equal(run('smallSoulLimit()'),12);
setup(['necromancer.limit']);ncard('limit-purple');assert.equal(run('state.necromancer.limit'),7);assert.equal(run('smallSoulLimit()'),9);
run('state.necromancer.ultimate=true;state.necromancer.siphon=.5;state.necromancer.remaining=10;state.souls=[];for(let i=0;i<9;i++)spawnSoul({x:100,y:100},{small:true});var remainingBefore=state.necromancer.remaining;spawnSoul({x:100,y:100},{small:true})');
assert.equal(run('state.necromancer.remaining'),run('remainingBefore'),'Full small pool does not trigger phantom siphon');
assert.match(run('companionHudContent("right")'),/Seelen 0\/7.*Kleine 9\/9/);
setup();assert.equal(run('smallSoulLimit()'),5);assert.equal(run('state.necromancer.limit'),3);
console.log('PASS: independent 3/5 pools, shared capacity upgrades, dead slot reuse, waiting occupancy, special soul exemption and HUD');
