const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.textContent='';this.innerHTML='';this.disabled=false;this.style={};this.handlers={};this.classList={add(){},remove(){}}}addEventListener(t,f){this.handlers[t]=f}replaceChildren(){}append(){}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),els=new Map(),get=s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const f of ['skills.js','levels.js','progress.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const run=s=>vm.runInContext(s,context),near=(a,b,m='')=>assert(Math.abs(a-b)<1e-8,`${m} ${a} != ${b}`);
function setup(skills=[]){run(`progress.data.skillUpgrades=${JSON.stringify(skills)};state.skillUpgrades=[...progress.data.skillUpgrades];state.mode="playing";state.width=390;state.height=700;state.player={x:195,y:650};state.weapon={damage:1,shotsPerSecond:2.7,critChance:0,critDamage:150};state.runemaster=newRunemaster("left");state.paladin=null;state.necromancer=null;state.alchemist=null;state.snake=[{id:1,x:100,y:100,hp:100,maxHp:100,pathOffset:33},{id:2,x:140,y:100,hp:100,maxHp:100,pathOffset:66},{id:3,x:300,y:100,hp:100,maxHp:100,pathOffset:99}];state.bullets=[];state.particles=[];state.pendingUpgrades=0;state.runUpgradeHistory={paladin:[],necromancer:[],alchemist:[],runemaster:[]};`)}
function card(id){run(`runemasterUpgradePool().find(c=>c.id===${JSON.stringify('runemaster-'+id)}).apply()`)}

setup();near(run('runemasterDamage()'),1);near(run('runemasterRateMultiplier()'),.95);
for(let i=0;i<4;i++)run('runemasterHit(state.snake[0],{damage:1,critical:false},{},()=>1)');
assert.equal(run('state.snake[0].runeCharges'),4);near(run('state.snake[0].hp'),96);
run('runemasterHit(state.snake[0],{damage:1,critical:false},{},()=>1)');
assert.equal(run('state.snake[0].runeCharges'),0);near(run('state.snake[0].hp'),93);near(run('state.snake[1].hp'),99.25);near(run('state.snake[2].hp'),100);
console.log('PASS: Kaelvar base damage/rate, five-charge Runenbruch and visible AoE');

setup();card('power-grey');card('power-green');near(run('state.runemaster.breakBonus'),.45);card('wave-purple');near(run('state.runemaster.neighborDamage'),1.6);card('rest-green');near(run('state.runemaster.restChance'),.7);card('rest-purple');near(run('state.runemaster.restChance'),1);
console.log('PASS: additive rune power and highest fixed tiers');

setup();card('endless');run('state.snake[0].runeCharges=4;var b=new Map();addRuneCharges(b,state.snake[0],1,{},()=>1)');assert.equal(run('state.snake[0].runeCharges'),1);
setup();card('mirror');run('state.snake[0].runeCharges=4;var b=new Map();addRuneCharges(b,state.snake[0],1,{},()=>0)');assert.equal(run('state.snake[1].runeCharges'),0);assert(run('b.has(2)'),'mirrored target breaks without recursion');
setup();card('perfect');run('state.runemaster.shots=9;state.runemaster.strikeRemaining=5;fireRuneProjectile()');assert(run('state.bullets[0].perfect'));
console.log('PASS: endless, non-recursive mirror and every-tenth perfect rune');

setup();card('storm');run('state.runemaster.breakCount=4;state.snake[0].runeCharges=4;var b=new Map();addRuneCharges(b,state.snake[0],1,{},()=>0)');assert(run('b.size>=2'));
setup();card('ultimate');run('state.snake[0].runeCharges=3;activateRuneCircle(()=>1)');assert.equal(run('state.snake[0].runeCharges'),0);assert(run('state.runemaster.rateBuff>0'));
console.log('PASS: Runensturm and Großer Runenkreis activate safely');

setup();run('state.mode="start";progress.data.coins=1000;progress.data.runemasterUnlocked=false;progress.data.runemasterSlot=null;progress.save()');assert(run('progress.unlockHero("runemaster")'));assert(run('progress.equipHero("runemaster","right")'));assert.equal(run('progress.data.runemasterSlot'),'right');
console.log('PASS: Kaelvar purchase, browser save and platform equipment');
