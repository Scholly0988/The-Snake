const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.textContent='';this.disabled=false;this.style={};this.classList={add(){},remove(){}}}addEventListener(){}replaceChildren(){}append(){}setAttribute(){}setPointerCapture(){}hasPointerCapture(){return false}getBoundingClientRect(){return{width:390,height:700}}getContext(){return ctx}}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),elements=new Map();
const get=key=>{if(!elements.has(key))elements.set(key,new Element());return elements.get(key)};
const store=new Map(),context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},window:{localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},devicePixelRatio:1,addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame(){},Math});
for(const file of ['skills.js','levels.js','progress.js','paladin.js','necromancer.js','alchemist.js','runemaster.js','game.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const run=source=>vm.runInContext(source,context);

// 1: Level 1 remains the original, single-snake path.
assert.equal(run('levelDefinition(1).snakes[0].path.type'),'level1');
assert.equal(run('levelDefinition(1).snakes.length'),1);
run('state.width=390;state.height=700;state.player.y=650');
for(const distance of [-20,0,100,500,1500]){
  const actual=JSON.parse(run(`JSON.stringify(pathPoint(${distance}))`));
  const expected=(()=>{const radius=26*.9,left=54,right=336,width=282;if(distance<0)return{x:left,y:38+distance,angle:Math.PI/2};const length=width+Math.PI*radius,row=Math.floor(distance/length),d=distance-row*length,forward=row%2===0,y=38+row*radius*2;if(d<=width)return{x:forward?left+d:right-d,y,angle:forward?0:Math.PI};const t=(d-width)/radius;return{x:forward?right+radius*Math.sin(t):left-radius*Math.sin(t),y:y+radius*(1-Math.cos(t)),angle:forward?t:Math.PI-t}})();
  assert(Math.hypot(actual.x-expected.x,actual.y-expected.y)<1e-8);
}

// 2: Every path from Level 2 through 10 is at least as long as Level 1.
for(const [width,height] of [[280,700],[358,630],[390,700],[430,700]]){
  const minimum=run(`level1ReferenceLength(${width},${height},${height-50})`);
  for(let level=2;level<=10;level++)for(let snake=0;snake<run(`levelDefinition(${level}).snakes.length`);snake++){
    const length=run(`samplePath(levelDefinition(${level}).snakes[${snake}].path,${width},${height}).length`);
    assert(length>=minimum,`Level ${level} snake ${snake} path ${length} < ${minimum}`);
  }
}

// 3-6: The requested levels spawn two independent snakes.
for(const level of [3,5,8,10]){
  run(`state.level=${level};state.runDifficulty=.10;createLevelSnakes(${level},100)`);
  assert.equal(run('state.snakes.length'),2,`Level ${level}`);
  assert.equal(run('state.snakes[0].segments.length+state.snakes[1].segments.length'),100);
}

function installTargetScene(){
  run(`state.mode="playing";state.width=390;state.height=700;state.player.y=650;state.nextId=100;
    var a={id:"A",headDistance:0,path:{level1:false,points:[{x:70,y:120},{x:70,y:121}],distances:[0,1],length:1},segments:[{id:1,snakeId:"A",x:70,y:120,hp:10,maxHp:10,pathOffset:33}]};
    var b={id:"B",headDistance:0,path:{level1:false,points:[{x:320,y:120},{x:320,y:121}],distances:[0,1],length:1},segments:[{id:2,snakeId:"B",x:320,y:120,hp:10,maxHp:10,pathOffset:33}]};
    state.snakes=[a,b];rebuildSnakeView();state.runemaster=newRunemaster("left");state.bullets=[];`);
}

// 7-8: Every newly fired automatic attack recalculates the nearest snake.
installTargetScene();run('state.player.x=106;fireRuneProjectile()');assert.equal(run('state.bullets.at(-1).targetId'),1);
run('state.player.x=356;fireRuneProjectile()');assert.equal(run('state.bullets.at(-1).targetId'),2);

// 9: An invisible nearest snake is skipped in favour of a valid visible target.
installTargetScene();run('state.snakes[0].segments[0].y=-5;state.player.x=106');
assert.equal(run('nearestSnakeTarget(state.player.x,state.player.y).id'),2);

// 10: Damage helpers never damage an invisible segment.
installTargetScene();run('state.snakes[0].segments[0].y=-5;var hp=state.snakes[0].segments[0].hp;var batch=new Map();addDamage(batch,state.snakes[0].segments[0],99);applyDamageBatch(batch)');
assert.equal(run('state.snakes[0].segments[0].hp'),10);

// 11: Segment lists, HP and movement state stay isolated between snakes.
run('state.level=3;state.runDifficulty=.10;createLevelSnakes(3,100)');
const beforeB=JSON.parse(run('JSON.stringify({count:state.snakes[1].segments.length,hp:state.snakes[1].segments[0].hp,distance:state.snakes[1].headDistance})'));
run('state.snakes[0].segments[0].hp=0;destroySegment(0,false);state.snakes[0].headDistance+=77');
assert.deepEqual(JSON.parse(run('JSON.stringify({count:state.snakes[1].segments.length,hp:state.snakes[1].segments[0].hp,distance:state.snakes[1].headDistance})')),beforeB);

console.log('PASS: Level 1 reference, Level 2-10 lengths, dual snakes, dynamic nearest targeting, visibility and isolation');
