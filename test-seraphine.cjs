const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.textContent='';this.innerHTML='';this.disabled=false;this.style={};this.handlers={};this.classList={add(){},remove(){}}}addEventListener(t,f){this.handlers[t]=f}replaceChildren(){}append(){}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),els=new Map(),get=s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const f of ['skills.js','levels.js','progress.js','secondary.js','kiko.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','ilyra.js','seraphine.js','shooter.js','game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const run=s=>vm.runInContext(s,context),near=(a,b,m='')=>assert(Math.abs(a-b)<1e-8,`${m} ${a} != ${b}`);
function setup(skills=[]){run(`progress.data.skillUpgrades=${JSON.stringify(skills)};state.skillUpgrades=[...progress.data.skillUpgrades];state.mode="playing";state.width=390;state.height=700;state.player={x:195,y:650};state.weapon={damage:1,shotsPerSecond:2.7,critChance:0,critDamage:150};state.seraphine=newSeraphine("left");state.paladin=null;state.necromancer=null;state.alchemist=null;state.runemaster=null;state.ilyra=null;state.snakes=[];state.snake=[{id:1,x:100,y:100,hp:100,maxHp:100,pathOffset:33},{id:2,x:135,y:100,hp:100,maxHp:100,pathOffset:66},{id:3,x:300,y:100,hp:100,maxHp:100,pathOffset:99}];state.bullets=[];state.particles=[];state.seraphineDeaths=[];state.resolvingSeraphineDeaths=false;state.pendingUpgrades=0;state.runUpgradeHistory={shooter:[],paladin:[],necromancer:[],alchemist:[],runemaster:[],ilyra:[],seraphine:[]};`)}
function card(id){run(`seraphineUpgradePool().find(c=>c.id===${JSON.stringify('seraphine-'+id)}).apply()`)}

setup();near(run('seraphineDirectDamage()'),1);near(run('seraphineRateMultiplier()'),.85);near(run('state.seraphine.projectileSpeed'),.95);near(run('state.seraphine.projectileSize'),1.1);near(run('state.seraphine.explosionRadius'),35);near(run('state.seraphine.transferChance'),.50);
run('var b=new Map();addBurn(b,state.snake[0],3,{},()=>1)');assert.equal(run('state.snake[0].burnStacks'),3);assert.equal(run('state.snake[0].overheated'),true);near(run('state.snake[0].burnTime'),4);
run('var b=new Map();addBurn(b,state.snake[0],1,{},()=>1);applyDamageBatch(b)');near(run('state.snake[0].hp'),98.5);near(run('state.snake[1].hp'),99.5);assert.equal(run('state.snake[1].burnStacks'),1);
console.log('PASS: Seraphine base values, shared burn timer and next-contact Overheat');

setup();run('state.snake[0].burnStacks=2;state.snake[0].burnTime=1;state.snake[1].burnStacks=3;state.snake[1].overheated=true');assert.equal(run('seraphineTarget().id'),2);
run('state.snake[1].y=-10');assert.equal(run('seraphineTarget().id'),1);run('updateSeraphine(1,()=>1)');assert.equal(run('state.snake[0].burnStacks'),0);assert.equal(run('state.snake[0].overheated'),false);
console.log('PASS: target priority, visibility and expiring Overheat state');

setup();run('state.weapon.critChance=100;triggerFireWave(state.snake[0],{},()=>0)');near(run('state.snake[0].hp'),97.3);near(run('state.snake[1].hp'),99.1);assert.equal(run('state.snake[0].burnStacks'),1);assert.equal(run('state.snake[1].burnStacks'),1);assert.equal(run('state.snake[2].burnStacks||0'),0);
console.log('PASS: 100px Fire Wave combines main damage and rolls each target independently');

setup();run('state.seraphine.infernoRemaining=0;updateSeraphine(0,()=>1)');near(run('state.seraphine.infernoActive'),6);near(run('state.seraphine.infernoRemaining'),30);run('var b=new Map();addBurn(b,state.snake[0],2,{},()=>1)');assert.equal(run('state.snake[0].overheated'),false,'two stacks only overheat at base threshold three');card('sunCore');assert.equal(run('seraphineThreshold()'),2);run('state.snake[1].burnStacks=0;state.snake[1].overheated=false;var b=new Map();addBurn(b,state.snake[1],2,{},()=>1)');assert.equal(run('state.snake[1].overheated'),true,'exact Sonnenkern threshold does not explode immediately');
console.log('PASS: Inferno cooldown begins at activation and Sonnenkern preserves exact-threshold rule');

setup();run('state.snake[0].burnStacks=3;state.snake[0].burnTime=4;updateSeraphine(.5,()=>1)');near(run('state.snake[0].hp'),99.7);card('hellEmber');run('updateSeraphine(.5,()=>1)');near(run('state.snake[0].hp'),99.25);
console.log('PASS: burn ticks twice per second and Hell Ember adds a separate per-stack tick');

setup();card('criticalFlame-purple');card('criticalFlame-grey');near(run('state.seraphine.criticalBurnChance'),1.25);assert.equal(run('seraphineProcCount(state.seraphine.criticalBurnChance,()=>.1)'),2);assert.equal(run('seraphineProcCount(state.seraphine.criticalBurnChance,()=>.9)'),1);
card('fuel-purple');assert.equal(run('state.seraphine.maxBurn'),6);card('quickOverheat-green');assert.equal(run('seraphineThreshold()'),5);
console.log('PASS: over-100 chances and current-maximum Overheat threshold');

setup(['seraphine.criticalFlame']);card('criticalFlame-grey');card('criticalFlame-green');card('criticalFlame-purple');near(run('state.seraphine.criticalBurnChance'),2.05);assert.equal(run('seraphineProcCount(state.seraphine.criticalBurnChance,()=>0)'),2,'overflow chance is capped at a second proc');
run('state.weapon.critChance=100;state.seraphine.firestorm=true;triggerFireWave(state.snake[0],{small:true},()=>0)');assert.equal(run('state.snake[0].burnStacks'),1,'small Firestorm wave always adds exactly one stack');
console.log('PASS: chance overflow stops after the second proc and Firestorm ignores extra-stack skills');

setup(['seraphine.attack','seraphine.burn','seraphine.overheat','seraphine.wave','seraphine.inferno','seraphine.hellEmber']);near(run('seraphineDirectDamage()'),1.2);near(run('state.seraphine.burnDuration'),4);near(run('state.seraphine.burnDps'),.25);card('hellEmber');run('state.snake[0].burnStacks=2;state.snake[0].burnTime=4;updateSeraphine(.5,()=>1)');near(run('state.snake[0].hp'),99.62);
console.log('PASS: permanent 50-coin upgrades affect staff, burn and Hell Ember');

setup();run('state.renderStats.seraphineEffectLimit=12;for(let n=0;n<100;n++)seraphineEffect("explosion",{x:n,y:100},35,"#ff5b24")');assert.equal(run('state.seraphine.effects.length'),12);run('seraphineEffect("burn",{x:200,y:200},12,"#ff9d3f");seraphineEffect("burn",{x:200,y:200},12,"#ff9d3f")');assert(run('state.seraphine.effects.length<=12'));assert.deepEqual([...run('seraphineTargetsInArea(state.snake[0],35,seraphineReaction()).map(s=>s.id)')],[1,2]);
console.log('PASS: adaptive effect cap, merged burn effects and reaction target grid');

setup();assert(run('roundUpgradePool(false).every(c=>!c.text.startsWith("Seraphine ·"))'));assert(run('roundUpgradePool(true).some(c=>c.text.startsWith("Seraphine ·"))'));
run('state.mode="start";progress.data.coins=0;progress.data.seraphineUnlocked=true;progress.data.seraphineSlot=null;progress.save()');assert(run('progress.equipHero("seraphine","right")'));assert.equal(run('progress.data.seraphineSlot'),'right');assert.equal(run('progress.data.coins'),0);
console.log('PASS: Seraphine stays out of slot four and equips for zero coins');
