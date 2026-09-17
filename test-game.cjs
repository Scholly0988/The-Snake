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
    assert.equal(after[i].pathOffset,old.pathOffset+(i<index?33:0));
    if (i>=index) { assert.equal(after[i].x,old.x); assert.equal(after[i].y,old.y); }
    if (i>0) assert.equal(after[i].pathOffset-after[i-1].pathOffset,33);
  }
  assert.equal(after[0].pathOffset,headBefore+33);
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
for (const [rate, expected] of [[0.10,[5,6,6,7,7]], [0.15,[5,6,7,8,9]], [0.20,[5,6,7,9,10]]]) {
  run('state.difficultyRate='+rate+'; createSnake(5)');
  assert.deepEqual(JSON.parse(run('JSON.stringify(state.snake.map(s=>s.hp))')),expected);
}
const healthBefore=run('state.snake[3].hp');
run('destroySegment(2)');
assert.equal(run('state.snake[2].hp'),healthBefore,'Retreat must not recalculate HP');
const labels=[];
context.ctxStub=labels;
run('ctx.save=()=>{}; ctx.restore=()=>{}; ctx.strokeText=()=>{}; ctx.fillText=(text)=>ctxStub.push(text); drawHpLabel({x:100,y:100,hp:7,upgrade:false})');
assert.deepEqual(labels,['7']);
console.log('PASS: compounded HP, upgrade HP, stable HP after collapse, current HP label');
