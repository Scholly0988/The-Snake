const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.children=[];this.textContent='';this.innerHTML='';this.disabled=false;this.style={};this.handlers={};this.classList={add(){},remove(){}}}addEventListener(t,f){this.handlers[t]=f}replaceChildren(...c){this.children=c}append(...c){this.children.push(...c)}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),els=new Map(),get=s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const f of ['skills.js','levels.js','progress.js','secondary.js','kiko.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','ilyra.js','seraphine.js','shooter.js','game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const run=s=>vm.runInContext(s,context);

assert(run('progress.data.secondaryUnlocked.includes("kiko")'),'Kiko is free on new and migrated saves');
assert(run('progress.equipSecondary("kiko","center")'));
run('resetGame();state.mode="playing";state.snakes[0].headDistance=state.snakes[0].segments[0].pathOffset+220;syncSnakePositions()');
assert.equal(run('activeSecondaries()[0].id'),'kiko');
assert.equal(run('activeSecondaries()[0].data.normalTimer'),1);
assert.equal(run('kikoUpgradePool(activeSecondaries()[0]).length'),39);
assert.equal(run('kikoUpgradePool(activeSecondaries()[0]).filter(c=>c.rarity==="orange").length'),1);

run('{const m=activeSecondaries()[0];kikoUpgradePool(m).find(c=>c.id==="smooth-grey").apply();kikoUpgradePool(m).find(c=>c.id==="smooth-green").apply();kikoUpgradePool(m).find(c=>c.id==="smooth-purple").apply()}');
assert(Math.abs(run('activeSecondaries()[0].data.bananaSlowBonus')-.24)<1e-9);
run('{const m=activeSecondaries()[0];kikoUpgradePool(m).find(c=>c.id==="more-purple").apply();kikoUpgradePool(m).find(c=>c.id==="more-grey").apply()}');
assert.equal(run('activeSecondaries()[0].data.maxActive'),6,'fixed tiers keep the highest value');

assert(run('kikoStartThrow(activeSecondaries()[0],"banana",1.5,()=>.9,false)'));
assert.equal(run('activeSecondaries()[0].data.throws.length'),1);
run('kikoLandThrows(activeSecondaries()[0].data,.45)');
assert.equal(run('activeSecondaries()[0].data.traps.length'),1);

run('{const m=activeSecondaries()[0],s=state.snakes[0].segments.find(isSegmentVisible);s.hp=10;m.data.traps=[{id:900,kind:"banana",x:s.x,y:s.y,life:10,radius:18,damage:.4,slow:.12,slowDuration:2.5,golden:false,chainBoost:false,hitIds:new Set()}];m.data.slicks=[];kikoResolveFields(m,()=>.9)}');
assert.equal(run('activeSecondaries()[0].data.traps.length'),0);
assert.equal(run('activeSecondaries()[0].data.slicks.length'),1);
assert.equal(run('state.snakes[0].segments.find(isSegmentVisible).hp'),9.6);
assert.equal(run('state.snakes[0].kikoSlows.banana.amount'),.12);

run('{const m=activeSecondaries()[0];m.data.goldenChosen=true;const t=kikoTrapSpec(m.data,"banana",()=>0);globalThis.kikoGoldenTest=[t.golden,t.damage,t.slowDuration]}');
assert.deepEqual(JSON.parse(run('JSON.stringify(kikoGoldenTest)')),[true,.8,5]);

run('{const m=activeSecondaries()[0];m.data.chaosExtra=2;kikoActivateChaos(m,()=>.9)}');
assert.equal(run('activeSecondaries()[0].data.chaosRemaining'),6);
assert.equal(run('activeSecondaries()[0].data.throws.length'),5);
assert.equal(run('new Set(activeSecondaries()[0].data.throws.map(f=>f.toX+":"+f.toY)).size'),5,'chaos targets distinct predicted path points');

run('state.skillUpgrades=["kiko.banana","kiko.slick","kiko.pile","kiko.chaos","kiko.golden","kiko.chain","kiko.instinct"];{const d=createKikoState();globalThis.kikoPermanent=[kikoNormalBaseDamage(),kikoSkill("slick",.15,.20),d.pileCooldown,d.chaosCooldown,kikoSkill("golden",.20,.25),kikoSkill("chain",.35,.45),kikoSkill("instinct",1,.7)]}');
assert.deepEqual(JSON.parse(run('JSON.stringify(kikoPermanent)')),[.5,.2,16,27,.25,.45,.7]);
console.log('PASS: Kiko unlock, upgrades, predicted throws, traps, slow, golden banana, chaos and permanent skills');
