const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const storage=new Map();
const context=vm.createContext({window:{localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}}});
vm.runInContext(fs.readFileSync('levels.js','utf8'),context);
vm.runInContext(fs.readFileSync('halloween-event.js','utf8'),context);
const run=code=>vm.runInContext(code,context);

assert.equal(run('HalloweenEvent.dialogue.length'),11);
assert.equal(run('HalloweenEvent.dialogue[0].speaker'),'Morgana');
assert.equal(run('HalloweenEvent.dialogue[8].side'),'right');
assert.equal(run('HalloweenEvent.dialogue[8].keepMorgana'),true);
assert.equal(run('HalloweenEvent.segmentHp(1,0)'),44);
assert.equal(run('HalloweenEvent.segmentHp(1,49)'),7800);
assert(run('HalloweenEvent.segmentHp(1,50)')>7800,'grown tail segments continue the HP curve');
for(let level=1;level<=7;level++){
  const hp=JSON.parse(run(`JSON.stringify(Array.from({length:54},(_,i)=>HalloweenEvent.segmentHp(${level},i)))`));
  assert(hp.every((value,index)=>!index||value>hp[index-1]),'event HP must increase at every position');
}
assert.equal(run('HalloweenEvent.pumpkinHp(600)'),300);
assert.equal(run('HalloweenEvent.bonusSegmentHp(800,0,1)'),400);
assert(run('HalloweenEvent.bonusSegmentHp(800,4,1)')>400);
assert.equal(run('HalloweenEvent.backgroundForLevel(1)'),'halloween-event-levels-1-8.webp');
assert.equal(run('HalloweenEvent.backgroundForLevel(8)'),'halloween-event-levels-1-8.webp');
assert.equal(run('HalloweenEvent.backgroundForLevel(9)'),'halloween-event-levels-9-23.webp');
assert.equal(run('HalloweenEvent.backgroundForLevel(23)'),'halloween-event-levels-9-23.webp');
assert.equal(run('HalloweenEvent.backgroundForLevel(24)'),'halloween-event-level-24.webp');
run('HalloweenEvent.save({completed:3,selected:4,introSeen:true})');
assert.deepEqual(JSON.parse(run('JSON.stringify(HalloweenEvent.load())')),{completed:3,selected:4,introSeen:true});
console.log('PASS: Halloween dialogue, HP curve, pumpkin values, level backgrounds and separate progress');
