"use strict";

// The boss owns a single damage target in the existing enemy pipeline.
// Its body, HP, phases and animations stay distinct from spawned attack enemies.
const HALLOWEEN_BOSS_CONFIG = Object.freeze({
  fallDuration:2.2, pauseDuration:1, burrowDuration:.65, emergeDuration:1,
  attackSpeed:92, laneTransition:1.15,
  attackSway:5, hpIncreaseFactor:.25, attackRadius:24,
  hpMultiplier:1.25, healFraction:.05, phase2Threshold:.70, phase3Threshold:.35,
  growthStageDuration:3, pumpkinSpawnMin:8, pumpkinSpawnMax:12,
  phase3PumpkinSpawnMin:6, phase3PumpkinSpawnMax:9, pumpkinCaps:Object.freeze([2,3,3]),
  eatTravelDuration:.6, eatReturnDuration:.65, eatPause:1, deathDuration:1.4,
  phaseIntervals:Object.freeze([.85,.70,.55]), phaseWavePauses:Object.freeze([2,1.7,1.4]),
  doubleSpawnChances:Object.freeze([0,.20,.35]), tripleSpawnChances:Object.freeze([0,0,.15]),
  phaseSway:Object.freeze([18,22,25])
});
const HALLOWEEN_BOSS_PATTERNS = Object.freeze([
  [2,1,3,0,4], [0,4,1,3,2], [2,1,3,0,4], [0,4,0,4,2], null
]);
function isHalloweenBossLevel8(){return state.eventRun&&state.eventLevel===8;}
function initHalloweenBossLevel8(){
  state.snakes=[];state.snake=[];
  state.halloweenBoss={phase:"intro_fall",phaseTime:0,time:0,spawnTimer:.8,
    spawned:0,patternIndex:-1,pattern:[],patternStep:0,lastLane:-1,
    maxHp:getHalloweenBossMaxHP(),battlePhase:1,target:null,instance:null,
    pumpkinTimer:10,eat:null,eatCooldown:0,hitFlash:0,phaseFlash:0,healFlash:0,deathTime:0,burstCount:1};
}
function cleanupHalloweenBossLevel8(){
  if(state.halloweenBoss)state.eventPumpkins=[];
  state.halloweenBoss=null;
  if(state.particles)state.particles=state.particles.filter(particle=>!particle.halloweenBossDust);
  if(state.snakes){state.snakes=state.snakes.filter(instance=>!instance.bossAttack&&!instance.bossBody);rebuildSnakeView();}
}
function halloweenBossAnchor(){return {x:state.width/2,y:state.height*.46};}
function halloweenBossDust(){
  const p=halloweenBossAnchor(),start=state.particles.length;burst(p.x,p.y,"#ac7946",18);
  for(let i=start;i<state.particles.length;i++)state.particles[i].halloweenBossDust=true;
}
function updateHalloweenBossIntro(dt){
  const boss=state.halloweenBoss,c=HALLOWEEN_BOSS_CONFIG;
  if(!boss||boss.phase==="idle_sway")return;
  boss.phaseTime+=dt;
  const durations={intro_fall:c.fallDuration,intro_pause:c.pauseDuration,intro_burrow:c.burrowDuration,emerge:c.emergeDuration};
  const next={intro_fall:"intro_pause",intro_pause:"intro_burrow",intro_burrow:"emerge",emerge:"idle_sway"};
  // Carry overshoot through phases, including slower device frames.
  while(boss.phase!=="idle_sway"&&boss.phaseTime>=durations[boss.phase]){
    boss.phaseTime-=durations[boss.phase];boss.phase=next[boss.phase];
    if(boss.phase==="intro_burrow"||boss.phase==="emerge")halloweenBossDust();
  }
  if(boss.phase==="idle_sway"&&!boss.target)activateHalloweenBossTarget();
}
function chooseHalloweenBossAttackPattern(){
  const boss=state.halloweenBoss;
  if(boss.battlePhase===1)boss.patternIndex=(boss.patternIndex+1)%HALLOWEEN_BOSS_PATTERNS.length;
  else{
    const weighted=[0,1,3,3,4,4].filter(index=>index!==boss.patternIndex);
    boss.patternIndex=weighted[Math.floor(Math.random()*weighted.length)];
  }
  const phase=boss.battlePhase-1,roll=Math.random();
  boss.burstCount=roll<HALLOWEEN_BOSS_CONFIG.tripleSpawnChances[phase]?3:
    roll<HALLOWEEN_BOSS_CONFIG.tripleSpawnChances[phase]+HALLOWEEN_BOSS_CONFIG.doubleSpawnChances[phase]?2:1;
  const fixed=HALLOWEEN_BOSS_PATTERNS[boss.patternIndex];
  let previous=boss.lastLane;
  boss.pattern=fixed?[...fixed]:Array.from({length:5},()=>{
    const options=[0,1,2,3,4].filter(lane=>lane!==previous);
    previous=options[Math.floor(Math.random()*options.length)];return previous;
  });
  boss.patternStep=0;
}
function getHalloweenBossSegmentHP(index){
  const base=HalloweenEvent.segmentHp(8,0),normal=HalloweenEvent.segmentHp(8,index);
  // Telescoping sum of 25% of each existing curve increment; base unchanged.
  return Math.min(Number.MAX_SAFE_INTEGER,base+(normal-base)*HALLOWEEN_BOSS_CONFIG.hpIncreaseFactor);
}
function spawnHalloweenBossAttackSegment(lane){
  const boss=state.halloweenBoss;if(!boss||boss.phase!=="idle_sway")return null;
  const anchor=halloweenBossAnchor(),hp=getHalloweenBossSegmentHP(boss.spawned++);
  const instance={id:"halloween-boss-attack-"+state.nextId++,bossAttack:true,segments:[],headDistance:0,definition:{},age:0,lane,
    startX:halloweenBossPose().x,startY:anchor.y-32};
  const segment={id:state.nextId++,snakeId:instance.id,pathOffset:0,x:instance.startX,y:instance.startY,angle:Math.PI/2,
    hp,maxHp:hp,upgrade:boss.spawned%5===0,eventBossAttack:true};
  instance.segments.push(segment);state.snakes.push(instance);rebuildSnakeView();boss.lastLane=lane;
  return segment;
}
function updateHalloweenBossAttackSegments(dt){
  const boss=state.halloweenBoss,c=HALLOWEEN_BOSS_CONFIG;if(!boss)return;
  boss.time+=dt;
  updateHalloweenBossFeedback(dt);
  updateHalloweenBossPhase();
  updateHalloweenBossPumpkins(dt);
  updateHalloweenBossEatAnimation(dt);
  syncHalloweenBossTarget();
  for(const instance of state.snakes){
    if(!instance.bossAttack)continue;
    const slow=Math.min(.6,alchemistSlow()+ilyraSnakeSlow(instance)+kikoSnakeSlow(instance)+mirelSnakeSlow(instance));
    instance.age+=dt*(1-slow);
    const t=Math.min(1,instance.age/c.laneTransition),ease=t*t*(3-2*t);
    const laneX=state.width*(.14+instance.lane*.18);
    for(const segment of instance.segments){
      segment.x=instance.startX+(laneX-instance.startX)*ease+Math.sin(instance.age*3)*c.attackSway*ease;
      segment.y=instance.startY+instance.age*c.attackSpeed;
    }
  }
  state.snakes=state.snakes.filter(instance=>!instance.bossAttack||instance.segments.some(s=>s.hp>0&&s.y-c.attackRadius<=state.height));
  rebuildSnakeView();
  if(boss.eat)return;
  boss.spawnTimer-=dt;
  // One spawn per frame avoids a burst after a long suspension.
  if(boss.spawnTimer<=0){
    if(boss.patternStep>=boss.pattern.length)chooseHalloweenBossAttackPattern();
    const first=boss.patternStep===0,lane=boss.pattern[boss.patternStep++];
    spawnHalloweenBossAttackSegment(lane);
    if(first)for(let extra=1;extra<boss.burstCount;extra++)spawnHalloweenBossAttackSegment((lane+extra*2)%5);
    const phase=boss.battlePhase-1;
    boss.spawnTimer=boss.patternStep===boss.pattern.length?c.phaseWavePauses[phase]:c.phaseIntervals[phase];
  }
}
function getHalloweenBossMaxHP(){
  return HalloweenEvent.segmentHp(7,HalloweenEvent.BASE_SEGMENTS-1)*HALLOWEEN_BOSS_CONFIG.hpMultiplier;
}
function activateHalloweenBossTarget(){
  const boss=state.halloweenBoss,pose=halloweenBossPose();
  const instance={id:"HALLOWEEN-BOSS",bossBody:true,segments:[],headDistance:0,definition:{}};
  boss.target={id:state.nextId++,snakeId:instance.id,bossBody:true,eventMain:true,pathOffset:0,
    x:pose.x,y:pose.y,hp:boss.maxHp,maxHp:boss.maxHp,upgrade:false};
  instance.segments.push(boss.target);boss.instance=instance;state.snakes.unshift(instance);rebuildSnakeView();
}
function halloweenBossPose(){
  const boss=state.halloweenBoss,p=halloweenBossAnchor(),c=HALLOWEEN_BOSS_CONFIG;
  const speed=boss.battlePhase===3?2.4:1.4;
  const origin={x:p.x+Math.sin(boss.time*speed)*c.phaseSway[boss.battlePhase-1],y:p.y-84+Math.sin(boss.time*2)*3};
  if(!boss.eat)return origin;
  const eat=boss.eat,duration=eat.returning?c.eatReturnDuration:c.eatTravelDuration;
  const t=Math.min(1,eat.time/duration),ease=t*t*(3-2*t);
  const from=eat.returning?eat.destination:eat.origin,to=eat.returning?origin:eat.destination;
  return {x:from.x+(to.x-from.x)*ease,y:from.y+(to.y-from.y)*ease};
}
function syncHalloweenBossTarget(){
  const boss=state.halloweenBoss;if(boss?.target&&boss.phase==="idle_sway")Object.assign(boss.target,halloweenBossPose());
}
function updateHalloweenBossPhase(){
  const boss=state.halloweenBoss;if(!boss?.target||boss.target.hp<=0)return;
  const ratio=boss.target.hp/boss.maxHp,c=HALLOWEEN_BOSS_CONFIG;
  const phase=ratio<c.phase3Threshold?3:ratio<c.phase2Threshold?2:1;
  if(phase>boss.battlePhase){boss.battlePhase=phase;boss.phaseFlash=.6;halloweenBossDust();syncHalloweenBossTarget();}
}
function halloweenBossDamageReaction(segment,critical=false){
  if(!segment?.bossBody||!state.halloweenBoss||!isSegmentVisible(segment))return;
  state.halloweenBoss.hitFlash=Math.max(state.halloweenBoss.hitFlash,critical?.25:.12);
}
function updateHalloweenBossFeedback(dt){
  const boss=state.halloweenBoss;
  for(const key of ["hitFlash","phaseFlash","healFlash"])boss[key]=Math.max(0,boss[key]-dt);
}
function lastVisibleHalloweenBossAttackSegment(){
  return state.snake.filter(segment=>segment.eventBossAttack&&segment.hp>0&&isSegmentVisible(segment)).at(-1)||null;
}
function isHalloweenBossPumpkinPositionFree(x,y){
  const pose=halloweenBossPose(),anchor=halloweenBossAnchor();
  if(y<105||y>state.player.y-100||x<38||x>state.width-38)return false;
  if(Math.hypot(x-pose.x,y-pose.y)<118||Math.hypot(x-anchor.x,y-anchor.y)<100)return false;
  if(state.snake.some(s=>s.hp>0&&Math.hypot(x-s.x,y-s.y)<60))return false;
  if(state.eventPumpkins.some(p=>Math.hypot(x-p.x,y-p.y)<65))return false;
  // All main and secondary docks are below this reserved playfield band.
  return true;
}
function spawnHalloweenBossPumpkin(random=Math.random){
  const boss=state.halloweenBoss,c=HALLOWEEN_BOSS_CONFIG;
  if(!boss||boss.phase!=="idle_sway"||boss.target.hp<=0||state.eventPumpkins.length>=c.pumpkinCaps[boss.battlePhase-1])return null;
  const reference=lastVisibleHalloweenBossAttackSegment();if(!reference)return null;
  for(let attempt=0;attempt<30;attempt++){
    const x=38+random()*Math.max(1,state.width-76),y=105+random()*Math.max(1,state.player.y-205);
    if(!isHalloweenBossPumpkinPositionFree(x,y))continue;
    return createEventPumpkin(x,y,reference.hp,{bossPumpkin:true,age:0,stage:1,matureAt:null,radius:14});
  }
  return null;
}
function growHalloweenBossPumpkin(pumpkin,dt){
  pumpkin.age+=dt;
  pumpkin.stage=Math.min(3,1+Math.floor(pumpkin.age/HALLOWEEN_BOSS_CONFIG.growthStageDuration));
  pumpkin.radius=[14,19,24][pumpkin.stage-1];
  if(pumpkin.stage===3&&pumpkin.matureAt===null) pumpkin.matureAt=state.halloweenBoss.time-(pumpkin.age-2*HALLOWEEN_BOSS_CONFIG.growthStageDuration);
}
function updateHalloweenBossPumpkins(dt){
  const boss=state.halloweenBoss,c=HALLOWEEN_BOSS_CONFIG;
  for(const pumpkin of state.eventPumpkins)growHalloweenBossPumpkin(pumpkin,dt);
  boss.pumpkinTimer-=dt;
  if(boss.pumpkinTimer<=0){
    const spawned=spawnHalloweenBossPumpkin();
    const min=boss.battlePhase===3?c.phase3PumpkinSpawnMin:c.pumpkinSpawnMin;
    const max=boss.battlePhase===3?c.phase3PumpkinSpawnMax:c.pumpkinSpawnMax;
    boss.pumpkinTimer=spawned?min+Math.random()*(max-min):1;
  }
}
function destroyHalloweenBossPumpkin(pumpkin){
  state.eventPumpkins=state.eventPumpkins.filter(item=>item!==pumpkin);
  burst(pumpkin.x,pumpkin.y,"#ff9b38",8);
}
function queueHalloweenBossPumpkinEat(){
  return state.eventPumpkins.filter(p=>p.stage===3&&p.hp>0).sort((a,b)=>a.matureAt-b.matureAt||a.id-b.id)[0]||null;
}
function startHalloweenBossEatAnimation(pumpkin){
  const boss=state.halloweenBoss;
  if(!boss||boss.eat||boss.phase!=="idle_sway"||boss.target.hp<=0)return;
  boss.eat={pumpkinId:pumpkin.id,origin:halloweenBossPose(),destination:{x:pumpkin.x,y:pumpkin.y},time:0,returning:false};
}
function healHalloweenBoss(){
  const boss=state.halloweenBoss;
  if(!boss?.target||boss.target.hp<=0||boss.phase!=="idle_sway")return 0;
  const before=boss.target.hp;
  boss.target.hp=Math.min(boss.maxHp,before+boss.maxHp*HALLOWEEN_BOSS_CONFIG.healFraction);
  boss.healFlash=.8;burst(boss.target.x,boss.target.y,"#a3ff70",10);
  return boss.target.hp-before;
}
function finishHalloweenBossEatAnimation(){
  const boss=state.halloweenBoss,eat=boss.eat;
  const pumpkin=state.eventPumpkins.find(p=>p.id===eat.pumpkinId&&p.stage===3&&p.hp>0);
  if(pumpkin){state.eventPumpkins=state.eventPumpkins.filter(p=>p!==pumpkin);healHalloweenBoss();}
  eat.returning=true;eat.time=0;
}
function updateHalloweenBossEatAnimation(dt){
  const boss=state.halloweenBoss,c=HALLOWEEN_BOSS_CONFIG;
  boss.eatCooldown=Math.max(0,boss.eatCooldown-dt);
  if(!boss.eat){const next=queueHalloweenBossPumpkinEat();if(next&&boss.eatCooldown===0)startHalloweenBossEatAnimation(next);return;}
  boss.eat.time+=dt;
  if(!boss.eat.returning&&boss.eat.time>=c.eatTravelDuration){
    syncHalloweenBossTarget();finishHalloweenBossEatAnimation();
  }else if(boss.eat.returning&&boss.eat.time>=c.eatReturnDuration){boss.eat=null;boss.eatCooldown=c.eatPause;}
}
function beginHalloweenBossDeath(){
  const boss=state.halloweenBoss;if(!boss||boss.phase!=="idle_sway")return;
  boss.target.hp=0;boss.deathPose=halloweenBossPose();boss.phase="dying";boss.deathTime=0;boss.eat=null;
  state.eventPumpkins=[];state.pendingUpgrades=0;state.upgradeOfferId++;upgradeScreen.classList.add("hidden");releaseDrag();
  state.bullets=[];state.snakes=state.snakes.filter(s=>!s.bossAttack&&!s.bossBody);rebuildSnakeView();
  burst(boss.deathPose.x,boss.deathPose.y,"#ff973b",22);
}
function updateHalloweenBossDeath(dt){
  const boss=state.halloweenBoss;if(!boss||boss.phase!=="dying")return;
  boss.deathTime+=dt;updateGameParticles(dt);
  if(boss.deathTime>=HALLOWEEN_BOSS_CONFIG.deathDuration){boss.phase="defeated";completeLevel();}
}
function drawHalloweenBossHp(){
  const boss=state.halloweenBoss;if(!boss||boss.phase==="defeated")return;
  const width=Math.max(100,state.width-48),left=(state.width-width)/2;
  ctx.save();ctx.fillStyle="#190e23";ctx.fillRect(left-6,12,width+12,53);
  ctx.fillStyle="#fff0c7";ctx.font="bold 12px system-ui";ctx.textAlign="center";
  ctx.fillText("Kürbis-Schlange · Phase "+boss.battlePhase,state.width/2,29);
  ctx.fillStyle="#42222b";ctx.fillRect(left,35,width,12);
  ctx.fillStyle=boss.healFlash>0?"#a3ed6d":"#ed8537";
  const hp=Math.max(0,boss.target?.hp??boss.maxHp);ctx.fillRect(left,35,width*Math.min(1,hp/boss.maxHp),12);
  ctx.font="10px system-ui";ctx.fillStyle="#fff0c7";ctx.fillText(Math.ceil(hp).toLocaleString("de-DE")+" / "+Math.ceil(boss.maxHp).toLocaleString("de-DE")+" HP",state.width/2,59);ctx.restore();
}
function drawHalloweenBossLevel8(){
  const boss=state.halloweenBoss;if(!boss||!isHalloweenBossLevel8()||boss.phase==="defeated")return;
  const c=HALLOWEEN_BOSS_CONFIG,p=halloweenBossAnchor(),smooth=t=>t*t*(3-2*t);
  const idle=boss.phase==="idle_sway",emerging=boss.phase==="emerge",dying=boss.phase==="dying";
  let {x,y}=idle?halloweenBossPose():{x:p.x,y:p.y-84};
  if(boss.phase==="intro_fall"){
    const t=Math.min(1,boss.phaseTime/c.fallDuration);y=-130+(p.y-84+130)*smooth(t);x+=Math.sin(t*6)*12;
  }else if(boss.phase==="intro_burrow")y+=180*smooth(Math.min(1,boss.phaseTime/c.burrowDuration));
  else if(emerging)y+=180*(1-smooth(Math.min(1,boss.phaseTime/c.emergeDuration)));
  else if(dying){x=boss.deathPose.x+Math.sin(boss.deathTime*48)*4;y=boss.deathPose.y+180*smooth(Math.min(1,boss.deathTime/c.deathDuration));}
  const sprite=(image,sx,sy,w,h)=>{
    if(image.complete&&image.naturalWidth)ctx.drawImage(image,sx-w/2,sy-h/2,w,h);
    else{ctx.fillStyle="#ff8b29";ctx.beginPath();ctx.ellipse(sx,sy,w/2,h/2,0,0,Math.PI*2);ctx.fill();}
  };
  ctx.save();
  if(boss.phase==="intro_burrow"||emerging||idle||dying){
    ctx.fillStyle="#342117";ctx.beginPath();ctx.ellipse(p.x,p.y,76,14,0,0,Math.PI*2);ctx.fill();
  }
  ctx.save();ctx.beginPath();ctx.rect(0,0,state.width,p.y);ctx.clip();
  if(emerging||idle){
    // Stretch the same body sprites toward the eating head without new assets.
    for(let i=0;i<3;i++){const t=i/3;sprite(halloweenEventBodySprite,p.x+(x-p.x)*t,p.y+(y-p.y)*t,100-i*4,100-i*4);}
  }
  ctx.restore();
  if(boss.phase==="intro_burrow"||emerging||dying){ctx.beginPath();ctx.rect(0,0,state.width,dying?Math.max(p.y,boss.deathPose.y+84):p.y);ctx.clip();}
  ctx.translate(x,y);
  const eatAngle=boss.eat?Math.atan2(y-(p.y-84),x-p.x)*.15:0;
  ctx.rotate(idle?eatAngle+Math.sin(boss.time*1.2)*.035:0);
  sprite(halloweenEventHeadSprite,0,0,154,154);
  const glow=boss.healFlash>0?"#a3ff70":"#ffb33c";
  if(boss.hitFlash>0||boss.phaseFlash>0||boss.healFlash>0||boss.battlePhase===3||dying){
    ctx.strokeStyle=glow;ctx.globalAlpha=dying?.8:boss.phaseFlash>0?.85:boss.hitFlash>0?.6:.35;
    ctx.lineWidth=boss.phaseFlash>0?5:3;ctx.beginPath();ctx.ellipse(0,0,65,60,0,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-40,-30);ctx.lineTo(-28,-17);ctx.lineTo(-35,-5);ctx.lineTo(-22,10);
    ctx.moveTo(30,-42);ctx.lineTo(19,-27);ctx.lineTo(25,-14);ctx.stroke();
  }
  ctx.restore();
  if(boss.healFlash>0){ctx.save();ctx.fillStyle="#b6ff80";ctx.font="bold 13px system-ui";ctx.textAlign="center";ctx.fillText("+ Heilung",x,y-85);ctx.restore();}
}
