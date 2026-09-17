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
console.log('PASS: path bounds, continuous turns, relative drag, release, head retreat');
