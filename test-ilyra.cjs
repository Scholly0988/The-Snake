const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.textContent='';this.innerHTML='';this.disabled=false;this.style={};this.handlers={};this.classList={add(){},remove(){}}}addEventListener(t,f){this.handlers[t]=f}replaceChildren(){}append(){}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),els=new Map(),get=s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const f of ['skills.js','levels.js','progress.js','secondary.js','kiko.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','ilyra.js','seraphine.js','shooter.js','game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const run=s=>vm.runInContext(s,context),near=(a,b,m='')=>assert(Math.abs(a-b)<1e-8,`${m} ${a} != ${b}`);
function setup(skills=[]){run(`progress.data.skillUpgrades=${JSON.stringify(skills)};state.skillUpgrades=[...progress.data.skillUpgrades];state.mode="playing";state.width=390;state.height=700;state.player={x:195,y:650};state.weapon={damage:1,shotsPerSecond:2.7,critChance:0,critDamage:150};state.ilyra=newIlyra("left");state.paladin=null;state.necromancer=null;state.alchemist=null;state.runemaster=null;state.snakes=[];state.snake=[{id:1,x:100,y:100,hp:100,maxHp:100,pathOffset:33},{id:2,x:135,y:100,hp:100,maxHp:100,pathOffset:66},{id:3,x:300,y:100,hp:100,maxHp:100,pathOffset:99}];state.bullets=[];state.particles=[];state.ilyraDeaths=[];state.pendingUpgrades=0;state.runUpgradeHistory={shooter:[],paladin:[],necromancer:[],alchemist:[],runemaster:[],ilyra:[]};`)}
function card(id){run(`ilyraUpgradePool().find(c=>c.id===${JSON.stringify('ilyra-'+id)}).apply()`)}

setup();near(run('ilyraDirectDamage()'),.9);near(run('ilyraRateMultiplier()'),.8);near(run('state.ilyra.projectileSpeed'),.95);near(run('state.ilyra.projectileSize'),1.1);
run('state.snake[0].frostStacks=2;state.snake[0].frostTime=1;var b=new Map();addFrost(b,state.snake[0],1)');assert.equal(run('state.snake[0].frostStacks'),3);near(run('state.snake[0].frostTime'),4);
run('var b=new Map();addFrost(b,state.snake[0],2,{},()=>1);applyDamageBatch(b)');assert.equal(run('state.snake[0].frostStacks'),0);near(run('state.snake[0].hp'),98.5);
console.log('PASS: Ilyra base values, shared frost timer and five-stack Icebreak');

setup();run('state.snake[0].frostStacks=2;state.snake[1].frostStacks=4');assert.equal(run('ilyraTarget().id'),2,'most-frozen segment in nearest snake');
run('state.snake[1].y=-10');assert.equal(run('ilyraTarget().id'),1,'invisible high-frost segment cannot be targeted');
run('state.snake[0].frostTime=4;state.snake[0].frostStacks=5;state.snake[0].y=-10;updateIlyra(.5,()=>1)');assert.equal(run('state.snake[0].frostStacks'),5);near(run('state.snake[0].frostTime'),3.5);
console.log('PASS: preferred targeting obeys visibility while offscreen Frost remains active');

setup();run('state.snake[0].frostStacks=15;state.snake[0].frostTime=4');near(run('ilyraSnakeSlow(null)'),.15);card('deepCold-grey');near(run('ilyraSnakeSlow(null)'),.15,'normal Frost slow remains capped');
run('state.snake[0].frostStacks=1');near(run('ilyraSnakeSlow(null)'),.0225,'additive Deep Cold');
run('state.ilyra.nullPoint=true;state.ilyra.winterActive=2;state.snake[0].frostStacks=20');near(run('ilyraSnakeSlow(null)'),.45,'different slow sources add');
console.log('PASS: per-stack, additive and total Ilyra slow rules');

setup();card('crystalCrit-purple');card('crystalCrit-grey');near(run('state.ilyra.criticalFrostChance'),1.25);assert.equal(run('ilyraProcCount(state.ilyra.criticalFrostChance,()=>.1)'),2);assert.equal(run('ilyraProcCount(state.ilyra.criticalFrostChance,()=>.9)'),1);
card('chain-purple');card('chain-green');near(run('state.ilyra.chainChance'),1.1);assert.equal(run('ilyraProcCount(state.ilyra.chainChance,()=>.05)'),2);
console.log('PASS: chances over 100 percent guarantee one proc and roll overflow for a second');

setup();run('state.weapon.critChance=100;triggerFrostNova(state.snake[0],{},()=>0)');near(run('state.snake[0].hp'),98.5);near(run('state.snake[1].hp'),99.25);assert.equal(run('state.snake[0].frostStacks'),1);assert.equal(run('state.snake[1].frostStacks'),1);assert.equal(run('state.snake[2].frostStacks||0'),0);
console.log('PASS: 100px Frostnova rolls critical damage independently inside its visible radius');

setup();card('nullPoint');near(run('state.ilyra.winterRemaining'),30);run('state.snake[2].y=-10;state.ilyra.winterRemaining=0;updateIlyra(0,()=>1)');assert.equal(run('state.ilyra.winterActive'),6);assert.equal(run('ilyraFrostGoal()'),3);assert.equal(run('state.snake[0].frostStacks'),1);
run('state.snake[2].y=100;updateIlyra(.1,()=>1)');assert.equal(run('state.snake[2].frostStacks'),1,'later visible segment receives Frost once');
run('state.ilyra.winterActive=.1;updateIlyra(.1,()=>1)');near(run('state.ilyra.winterRemaining'),30,'cooldown begins after duration');
console.log('PASS: Nullpunkt unlock timing, three-stack rule, later-visible Frost and post-duration cooldown');

setup(['ilyra.attack','ilyra.frost','ilyra.icebreak','ilyra.nova','ilyra.nullPoint','ilyra.absoluteCold','ilyra.blackIce']);near(run('ilyraDirectDamage()'),1.08);near(run('state.ilyra.frostDuration'),5);card('absoluteCold');card('blackIce');card('nullPoint');
run('state.ilyra.winterRemaining=0;updateIlyra(0,()=>1)');assert.equal(run('state.snake[0].frostStacks'),2);run('state.snake[0].frostStacks=2;state.snake[0].frostTime=5;state.ilyra.blackIce=true;updateIlyra(.5,()=>1)');near(run('state.snake[0].hp'),99.935);
console.log('PASS: permanent 50-coin upgrades affect Frostzepter, duration, Nullpunkt and Black Ice');

setup();assert(run('roundUpgradePool(false).every(c=>!c.text.startsWith("Ilyra ·"))'));assert(run('roundUpgradePool(true).some(c=>c.text.startsWith("Ilyra ·"))'));
run('state.mode="start";progress.data.coins=0;progress.data.ilyraUnlocked=true;progress.data.ilyraSlot=null;progress.save()');assert(run('progress.equipHero("ilyra","right")'));assert.equal(run('progress.data.ilyraSlot'),'right');assert.equal(run('progress.data.coins'),0);
console.log('PASS: Ilyra stays out of slot four and equips for zero coins');
