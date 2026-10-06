const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.children=[];this.textContent='';this.innerHTML='';this.disabled=false;this.style={};this.handlers={};this.classList={add(){},remove(){}}}addEventListener(t,f){this.handlers[t]=f}replaceChildren(...c){this.children=c}append(...c){this.children.push(...c)}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),els=new Map(),get=s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const f of ['skills.js','levels.js','halloween-event.js','progress.js','secondary.js','kiko.js','mirel.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','ilyra.js','seraphine.js','shooter.js','halloween-boss.js','game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const run=s=>vm.runInContext(s,context);

assert(run('progress.data.secondaryUnlocked.includes("mirel")'),'Mirel is free');
assert(run('progress.equipSecondary("mirel","center")'));
run('resetGame();state.mode="playing";state.snakes[0].headDistance=state.snakes[0].segments[0].pathOffset+300;syncSnakePositions()');
assert.equal(run('mirelMember().data.doomTimer'),0);
assert.equal(run('mirelUpgradePool(mirelMember()).length'),43);

run('mirelCastDoom(mirelMember(),()=>0)');
assert.equal(run('mirelMember().data.doomBonus'),.30);
assert.equal(run('mirelIncomingBonus(visibleTargets()[0])'),.30);
run('{const s=visibleTargets()[0],m=mirelMember();mirelApplyCurse(s,"normal",.12,4,m);mirelApplyCurse(s,"wave",.15,5,m)}');
assert.equal(run('mirelIncomingBonus(visibleTargets()[0])'),.30,'Mirel curses use strongest value instead of stacking');
run('visibleTargets()[0].soulMark=true;state.necromancer={curse:.2}');
assert.equal(run('segmentDamageMultiplier(visibleTargets()[0])'),1.5,'different curse types add');

run('{const s=visibleTargets()[0],b=new Map();for(let n=0;n<5;n++)addDamage(b,s,1);mirelPrepareDamageBatch(b);globalThis.mirelFive=b.get(s.id)}');
assert.equal(run('mirelFive'),5.5,'fifth damage event adds one nonrecursive doom impulse');
run('{const s=visibleTargets()[0],m=mirelMember();m.data.criticalBonus=.35;globalThis.mirelCrit=mirelCriticalMultiplier(s,true)}');
assert.equal(run('mirelCrit'),1.35);

run('{const m=mirelMember();for(const id of ["deep-purple","deep-grey"])mirelUpgradePool(m).find(c=>c.id===id).apply();for(const id of ["double-purple","double-grey"])mirelUpgradePool(m).find(c=>c.id===id).apply()}');
assert.equal(run('mirelMember().data.normalBonus'),.22);
assert.equal(run('mirelMember().data.maxNormal'),4,'fixed tiers keep strongest value');

run('{const m=mirelMember(),instance=state.snakes[0],dead=visibleTargets()[0],next=visibleTargets()[1];m.data.curseChain=true;mirelApplyCurse(dead,"normal",.22,4,m,{countEvent:false});globalThis.transferTarget=next.id;resolveMirelDeath(dead,instance,[next],()=>0)}');
assert.equal(run('state.snake.find(s=>s.id===transferTarget).mirelCurses.normal.bonus'),.22);

run('state.skillUpgrades=["mirel.runeSpark","mirel.seal","mirel.wave","mirel.doomImpulse","mirel.deep","mirel.lasting","mirel.quick","mirel.double","mirel.critical","mirel.fragile","mirel.weakening","mirel.waveSize","mirel.wavePower","mirel.waveQuick","mirel.doomLong","mirel.doomPower","mirel.doomJumps","mirel.curseChain","mirel.deathMark","mirel.darkConnection","mirel.masterCurse"];{const d=createMirelState(),m={data:d};const pool=mirelUpgradePool(m);globalThis.permanent=[mirelRuneDamage(),d.normalBonus,d.waveCooldown,pool.find(c=>c.id==="deep-purple").text,pool.find(c=>c.id==="doomJumps-purple").text,mirelSkill("masterCurse",5,4),mirelSkill("deathMark",.2,.25)]}');
assert.equal(run('permanent[0]'),.20);
assert.equal(run('permanent[1]'),.14);
assert.equal(run('permanent[2]'),17);
assert.match(run('permanent[3]'),/23/);
assert.match(run('permanent[4]'),/7/);
assert.equal(run('permanent[5]'),4);
assert.equal(run('permanent[6]'),.25);
console.log('PASS: Mirel free unlock, strongest curses, additive external debuffs, doom impulses, transfers, tiers and permanent skills');
