const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.textContent='';this.disabled=false;this.style={};this.classList={add(){},remove(){}}}addEventListener(){}replaceChildren(){}append(){}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),elements=new Map();
const get=key=>{if(!elements.has(key))elements.set(key,new Element());return elements.get(key)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const file of ['skills.js','levels.js','halloween-event.js','progress.js','secondary.js','kiko.js','mirel.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','ilyra.js','seraphine.js','shooter.js','halloween-boss.js','game.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const run=source=>vm.runInContext(source,context),near=(a,b,message='')=>assert(Math.abs(a-b)<1e-8,`${message} ${a} != ${b}`);
function setup(skills=[]){run(`state.skillUpgrades=${JSON.stringify(skills)};state.mode="playing";state.width=390;state.height=700;state.player={x:195,y:650,targetX:195};state.weapon={damage:10,shotsPerSecond:2.7,bullets:1,spread:0,pierce:0,critChance:0,critDamage:150};state.shooter=newShooter();state.snake=[{id:1,x:195,y:200,hp:1000,maxHp:1000},{id:2,x:230,y:180,hp:1000,maxHp:1000}];state.bullets=[];state.particles=[];state.pendingUpgrades=0;`)}
function card(id){run(`shooterUpgradePool().find(c=>c.id===${JSON.stringify('shooter-'+id)}).apply()`)}

setup();
assert.equal(run('shooterUpgradePool().filter(c=>c.name==="Präzisionsschuss").length'),3);
card('precision-grey');card('precision-grey');near(run('state.shooter.precisionDamage'),.10,'precision may be selected repeatedly');
card('speed-grey');assert(!run('shooterUpgradePool().some(c=>c.id==="shooter-speed-grey")'));
assert(!run('shooterUpgradePool().some(c=>c.id==="shooter-salvoMaster")'));
run('state.weapon.bullets=2');assert(run('shooterUpgradePool().some(c=>c.id==="shooter-salvoMaster")'));
console.log('PASS: tiers are single-pick, precision is unlimited, Salvenmeister is multishot-gated');

setup();run('state.shooter.triple=true;state.shooter.shotSequences=7;fireShooterWeapon(()=>1)');assert.equal(run('state.bullets.length'),4);assert(run('state.bullets.every(b=>b.salvo)'));
setup();run('state.weapon.bullets=2;state.weapon.spread=24;state.shooter.salvoMaster=true;fireShooterWeapon(()=>1)');assert.equal(run('state.bullets.length'),2);assert(run('state.bullets.every(b=>b.damageMultiplier===1.3)'));
setup();run('state.shooter.overload=true;state.shooter.overloadShots=15;fireShooterWeapon(()=>1)');near(run('state.bullets[0].size'),2);near(run('state.bullets[0].damageMultiplier'),2);
console.log('PASS: triple volley, +30 % Salvenmeister and sixteenth-shot overload combine correctly');

setup();run('state.shooter.rain=true;for(let i=0;i<20;i++)spawnShooterBullet()');assert.equal(run('state.bullets.filter(b=>b.rain).length'),3);assert(run('state.bullets.filter(b=>b.rain).every(b=>b.damageMultiplier===3&&b.shooterHoming)'));
setup();run('state.shooter.doubleChance=1;state.shooter.rain=true;state.shooter.rainProjectiles=18;fireShooterWeapon(()=>0)');assert.equal(run('state.bullets.filter(b=>b.rain).length'),3,'Doppelschlag is an actually fired projectile');
console.log('PASS: Geschossregen triggers after actual projectiles and deals 300 % base damage');

setup();run('state.shooter.bulletStorm=true;updateShooter(25,false)');near(run('state.shooter.stormActive'),5);run('fireShooterWeapon(()=>1)');assert.equal(run('state.bullets.length'),2);assert(run('state.bullets.every(b=>b.hitsLeft===2)'));near(run('shooterRateMultiplier()'),1.5);
setup();run('state.shooter.precisionMode=true;updateShooter(2,false)');assert(run('state.shooter.precisionActive'));near(run('shooterDamageMultiplier()'),1.25);near(run('shooterCritChance()'),10);run('updateShooter(.01,true)');assert(!run('state.shooter.precisionActive'));
console.log('PASS: Kugelhagel and stationary precision mode activate and reset as specified');

setup();run('state.shooter.perfect=true;state.shooter.perfectHits=9;var hit=shooterHitRoll(state.snake[0],{x:195,y:200,hitsDone:0,hitsLeft:1},()=>1)');assert(run('hit.critical&&hit.perfect'));near(run('hit.damage'),15);
setup();run('state.shooter.marksman=true;state.snake[0].shooterMarksmanHits=4;var hit=shooterHitRoll(state.snake[0],{x:195,y:200,hitsDone:0,hitsLeft:1},()=>1)');assert(run('hit.critical&&hit.marksman'));near(run('hit.damage'),30);
setup();run('state.shooter.focusDamage=.2;state.snake[0].shooterFocusHits=3;var hit=shooterHitRoll(state.snake[0],{x:195,y:200,hitsDone:0,hitsLeft:1},()=>1)');near(run('hit.damage'),12);
setup();run('state.shooter.armorDamage=.35;state.shooter.unstoppable=true;state.shooter.lastPierceDamage=.7;var hit=shooterHitRoll(state.snake[0],{x:195,y:200,hitsDone:2,hitsLeft:1},()=>1)');near(run('hit.damage'),10*1.35*1.5*1.7);
console.log('PASS: perfect/marksman crits, target focus and penetration bonuses use the agreed counters');

setup(['shooter.triple','shooter.rain','shooter.perfect','shooter.unstoppable','shooter.overload','shooter.salvoMaster','shooter.precisionMode','shooter.bulletStorm','shooter.marksman']);
assert.equal(run('state.shooter.stormRemaining'),22);run('state.shooter.precisionMode=true;updateShooter(1.5,false)');assert(run('state.shooter.precisionActive'));near(run('shooterDamageMultiplier()'),1.3);near(run('shooterCritChance()'),12);
run('state.shooter.triple=true;state.shooter.shotSequences=6;state.weapon.bullets=2;state.shooter.salvoMaster=true;fireShooterWeapon(()=>1)');assert.equal(run('state.bullets.length'),5);assert(run('state.bullets.every(b=>b.damageMultiplier===1.4)'));
run('state.bullets=[];state.shooter.overload=true;state.shooter.overloadShots=12;fireShooterWeapon(()=>1)');assert(run('state.bullets.every(b=>b.damageMultiplier>=2.25)'));
console.log('PASS: every permanent standard-shooter enhancement changes its runtime values');
