const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.children=[];this.textContent='';this.innerHTML='';this.disabled=false;this.style={};this.handlers={};this.classList={add(){},remove(){}}}addEventListener(t,f){this.handlers[t]=f}replaceChildren(...c){this.children=c}append(...c){this.children.push(...c)}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),els=new Map(),get=s=>{if(!els.has(s))els.set(s,new Element());return els.get(s)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const f of ['skills.js','levels.js','progress.js','secondary.js','kiko.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','ilyra.js','seraphine.js','shooter.js','game.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const run=s=>vm.runInContext(s,context);

const legacy=run('SnakeProgress.fresh()');delete legacy.secondaryUnlocked;delete legacy.secondarySlots;
const migrated=run('SnakeProgress.validate('+JSON.stringify(legacy)+')');
assert.deepEqual(Array.from(migrated.secondaryUnlocked),['kiko']);
assert.deepEqual(JSON.parse(JSON.stringify(migrated.secondarySlots)),{left:null,center:null,right:null});

run(`registerSecondary({id:"snare",name:"Fallensteller",kind:"trap",createState:()=>({ticks:0,events:0,draws:0,power:0}),update:m=>m.data.ticks++,draw:m=>m.data.draws++,modify:(m,stat,value)=>stat==="attack"?value*1.2:value,onEvent:m=>m.data.events++,upgradePool:()=>[0,1,2,3].map(n=>({id:"trap-"+n,rarity:n===3?"purple":"grey",name:"Falle "+n,text:"Fallenstärke erhöhen.",apply:m=>m.data.power++}))});
registerSecondary({id:"aura",name:"Puffer",kind:"buffer"});
registerSecondary({id:"spirit",name:"Wesenheit",kind:"control"});`);
assert(run('progress.unlockSecondary("snare")'));assert(run('progress.unlockSecondary("aura")'));assert(run('progress.unlockSecondary("spirit")'));
assert(run('progress.equipSecondary("snare","left")'));assert(run('progress.equipSecondary("aura","center")'));assert(run('progress.equipSecondary("spirit","right")'));
run('resetGame();state.mode="playing"');
assert.equal(run('activeSecondaries().length'),3);
assert.deepEqual(JSON.parse(run('JSON.stringify(secondaryAnchor("left"))')),{slot:'left',x:159,y:632,scale:.8});
run('updateSecondaryTeam(.1);drawSecondaryTeam();emitSecondaryEvent("segment-destroyed",{})');
assert.equal(run('state.secondaryTeam.slots.left.data.ticks'),1);assert.equal(run('state.secondaryTeam.slots.left.data.draws'),1);assert.equal(run('state.secondaryTeam.slots.left.data.events'),1);
assert.equal(run('secondaryModify("left","attack",10)'),12);assert.equal(run('secondaryModify("center","attack",10)'),10);
run('for(let n=0;n<30;n++)addSecondaryEffect({life:1,x:n,y:0})');assert.equal(run('state.secondaryTeam.effects.length'),24);
run('state.pendingUpgrades=1;openUpgrade()');assert.equal(get('#upgradeChoices').children.length,4);get('#upgradeChoices').children[0].handlers.click();assert.equal(run('state.mode'),'upgrade');assert.equal(get('#upgradeTitle').textContent,'Sekundär-Upgrade wählen');assert.equal(get('#upgradeChoices').children.length,3);assert.equal(run('state.pendingUpgrades'),1);get('#upgradeChoices').children[0].handlers.click();assert.equal(run('state.pendingUpgrades'),0);assert.equal(run('state.mode'),'playing');assert.equal(run('state.secondaryTeam.slots.left.data.power'),1);assert.equal(run('state.secondaryTeam.slots.left.upgrades.length'),1);
assert(run('progress.equipSecondary("snare","center")'));assert.equal(run('progress.data.secondarySlots.center'),'snare');assert.equal(run('progress.data.secondarySlots.left'),'aura');
assert.throws(()=>run('SnakeProgress.validate({...SnakeProgress.fresh(),secondaryUnlocked:["snare"],secondarySlots:{left:"snare",center:"snare",right:null}})'));
console.log('PASS: three persistent 80-percent secondary slots, lifecycle hooks, buffs, events, effects and legacy migration');
