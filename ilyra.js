"use strict";

function newIlyra(slot) {
  return slot ? {
    slot, fireTimer:0, pulse:0,
    frostDuration:skillValue("ilyra","frost",4,5), frostGoal:5, frostSlow:.01,
    icebreakDamage:1.5, icebreakBonus:0, precision:0, criticalFrostChance:0,
    chainChance:0, splitterCount:0, splitterDamage:0,
    explosionDamage:.35, explosionRadius:55, explosionRadiusBonus:0,
    projectileSize:1.10, projectileSpeed:.95, pierce:0,
    novaRadius:100, novaRadiusBonus:0, novaMainDamage:1, novaAreaDamage:.5,
    novaExtraChance:0, novaSlow:.15, novaSlowDuration:2,
    novaCooldown:18, novaRemaining:18,
    triggerHitBonus:0, winterIcebreakBonus:0,
    absoluteCold:false, frostPlague:false, glacierHeart:false,
    iceAge:false, blackIce:false, nullPoint:false,
    icebreakCount:0, blackIceTick:0,
    winterActive:0, winterDuration:6, winterCooldown:30,
    winterRemaining:0, winterSeen:new Set(),
    taken:{}, tiers:{}, effects:[]
  } : null;
}

function ilyraX() { return state.player.x+(state.ilyra.slot==="left"?-36:36); }
function ilyraFlatDamage() { return .9+Math.max(0,(state.weapon.damage||1)-1); }
function ilyraGeneralDamageFactor() { return ilyraFlatDamage()/.9; }
function ilyraDirectDamage(segment=null) {
  const i=state.ilyra;
  let damage=ilyraFlatDamage()*skillValue("ilyra","attack",1,1.2);
  if(segment&&(segment.frostStacks||0)>0)damage*=1+i.precision;
  const instance=segment&&snakeInstanceForSegment(segment);
  if(segment&&i.glacierHeart&&ilyraSnakeSlow(instance)>=.20)damage*=skillValue("ilyra","glacierHeart",1.30,1.40);
  return damage;
}
function ilyraRateMultiplier() { return state.ilyra?.slot?.length ? .80 : 0; }
function frostStacks(segment) { return segment.frostStacks||0; }
function ilyraFrostGoal() { const i=state.ilyra;return i?.nullPoint&&i.winterActive>0?3:(i?.frostGoal||5); }
function ilyraCriticalDamage(base,random=Math.random) {
  const critical=random()*100<(state.weapon.critChance||0);
  return {critical,damage:base*(critical?(state.weapon.critDamage||150)/100:1)};
}
function ilyraProcCount(chance,random=Math.random) {
  const guaranteed=Math.floor(Math.max(0,chance));
  return guaranteed+(random()<chance-guaranteed?1:0);
}
function ilyraInstanceSegments(instance) { return instance?.segments||state.snake; }
function ilyraTarget() {
  const x=ilyraX(),y=state.player.y+PLATFORM_SHOT_Y,candidates=[];
  for(const instance of livingSnakeInstances()){
    const visible=ilyraInstanceSegments(instance).filter(s=>s.hp>0&&isSegmentVisible(s));
    if(!visible.length)continue;
    const reference=snakeHead(instance),distance=Math.hypot((reference&&isSegmentVisible(reference)?reference.x:visible[0].x)-x,(reference&&isSegmentVisible(reference)?reference.y:visible[0].y)-y);
    visible.sort((a,b)=>frostStacks(b)-frostStacks(a)||ilyraInstanceSegments(instance).indexOf(a)-ilyraInstanceSegments(instance).indexOf(b));
    candidates.push({target:visible[0],distance});
  }
  return candidates.sort((a,b)=>a.distance-b.distance)[0]?.target||null;
}
function nearestIlyraVisibleSegment() {
  const x=ilyraX(),y=state.player.y+PLATFORM_SHOT_Y;
  return visibleTargets().reduce((best,segment)=>!best||Math.hypot(segment.x-x,segment.y-y)<Math.hypot(best.x-x,best.y-y)?segment:best,null);
}
function ilyraSnakeFrostSlow(instance) {
  const i=state.ilyra;if(!i)return 0;
  const stacks=ilyraInstanceSegments(instance).reduce((sum,s)=>sum+frostStacks(s),0);
  return Math.min(.15,stacks*i.frostSlow);
}
function ilyraSnakeSlow(instance) {
  const i=state.ilyra;if(!i)return 0;
  let slow=ilyraSnakeFrostSlow(instance);
  if((instance?.ilyraBreakSlow||0)>0)slow+=.10;
  if((instance?.ilyraNovaSlow||0)>0)slow+=i.novaSlow;
  if(i.winterActive>0&&ilyraInstanceSegments(instance).some(isSegmentVisible))slow+=.30+(skillValue("ilyra","winterControl",0,.05));
  return Math.min(.60,slow);
}
function ilyraNeighbors(segment) {
  const list=ilyraInstanceSegments(snakeInstanceForSegment(segment)),index=list.indexOf(segment);
  return [list[index-1],list[index+1]].filter(s=>s&&s.hp>0&&isSegmentVisible(s));
}
function ilyraEffect(kind,center,radius=18,color="#9beaff") {
  state.ilyra?.effects.push({kind,x:center.x,y:center.y,radius,color,life:.6,maxLife:.6});
}
function ilyraBaseDamage(base) { return base*ilyraGeneralDamageFactor(); }
function ilyraAddCriticalDamage(batch,segment,base,random=Math.random) {
  const hit=ilyraCriticalDamage(ilyraBaseDamage(base),random);addDamage(batch,segment,hit.damage);return hit;
}
function addFrost(batch,segment,count=1,options={},random=Math.random) {
  const i=state.ilyra;
  if(!i||!segment||segment.hp<=0||!isSegmentVisible(segment)||count<=0)return 0;
  const before=frostStacks(segment);
  segment.frostStacks=before+count;segment.frostTime=i.frostDuration;
  ilyraEffect("frost",segment,12,"#bcefff");
  if(segment.frostStacks>=ilyraFrostGoal())triggerIcebreak(batch,segment,options,random);
  return Math.max(0,segment.frostStacks-before);
}
function triggerIcebreak(batch,segment,options={},random=Math.random) {
  const i=state.ilyra;if(!i||!state.snake.includes(segment)||!isSegmentVisible(segment))return;
  segment.frostStacks=i.absoluteCold?skillValue("ilyra","absoluteCold",1,2):0;
  segment.frostTime=segment.frostStacks?i.frostDuration:0;
  let damage=i.icebreakDamage*skillValue("ilyra","icebreak",1,1.2)*(1+i.icebreakBonus+(i.winterActive>0?.25+i.winterIcebreakBonus:0));
  damage=ilyraBaseDamage(damage);
  const hit=ilyraCriticalDamage(damage,random);addDamage(batch,segment,hit.damage);
  segment.icebreakPendingDeath=true;segment.icebreakTransferred=!!options.transferred;
  const instance=snakeInstanceForSegment(segment);if(instance)instance.ilyraBreakSlow=1.5;
  ilyraEffect("icebreak",segment,24,"#e4fbff");
  i.icebreakCount++;

  if(i.splitterCount){
    const targets=visibleTargets().filter(s=>s!==segment);
    for(let n=0;n<i.splitterCount&&targets.length;n++){
      const index=Math.min(targets.length-1,Math.floor(random()*targets.length)),target=targets.splice(index,1)[0];
      ilyraAddCriticalDamage(batch,target,i.splitterDamage,random);ilyraEffect("splitter",target,10,"#a7ecff");
    }
  }
  if(i.chainChance&&!options.transferred){
    const neighbors=ilyraNeighbors(segment);const procs=ilyraProcCount(i.chainChance,random);
    let first=null;
    for(let n=0;n<procs&&neighbors.length;n++){
      let target;
      if(n===0)target=neighbors[Math.floor(random()*neighbors.length)];
      else if(neighbors.length>1&&random()>=.5)target=neighbors.find(s=>s!==first)||first;
      else target=first||neighbors[0];
      first ||= target;addFrost(batch,target,1,{transferred:true},random);
    }
  }
  if(i.iceAge&&i.icebreakCount%skillValue("ilyra","iceAge",5,4)===0)triggerFrostNova(segment,{small:true},random,batch);
}
function ilyraFrostPlagueTargets(destroyed,instance,count) {
  const list=ilyraInstanceSegments(instance),offset=destroyed.pathOffset;
  return list.filter(s=>s.hp>0&&isSegmentVisible(s)).sort((a,b)=>Math.abs(a.pathOffset-offset)-Math.abs(b.pathOffset-offset)).slice(0,count);
}
function queueIlyraDeath(segment,instance) {
  if(!state.ilyra||!segment.icebreakPendingDeath)return;
  state.ilyraDeaths.push({segment,instance,transferred:!!segment.icebreakTransferred});
}
function resolveIlyraDeaths(random=Math.random) {
  const i=state.ilyra;if(!i||!state.ilyraDeaths?.length)return;
  const deaths=state.ilyraDeaths.splice(0),batch=new Map();
  for(const death of deaths){
    const center=death.segment,radius=i.explosionRadius*(1+i.explosionRadiusBonus);
    for(const target of state.snake)if(segmentInArea(target,center,radius))ilyraAddCriticalDamage(batch,target,i.explosionDamage,random);
    ilyraEffect("explosion",center,radius,"#8de8ff");
    if(i.frostPlague&&!death.transferred){
      const count=skillValue("ilyra","frostPlague",2,3);
      for(const target of ilyraFrostPlagueTargets(center,death.instance,count))addFrost(batch,target,1,{transferred:true},random);
    }
  }
  if(batch.size)applyDamageBatch(batch);
}
function ilyraHitRoll(segment,bullet,random=Math.random) {
  let damage=ilyraDirectDamage(segment);
  return ilyraCriticalDamage(damage,random);
}
function ilyraHit(segment,hit,bullet,random=Math.random) {
  const i=state.ilyra,batch=new Map();addDamage(batch,segment,hit.damage);
  let stacks=i.winterActive>0?2:1;
  if(hit.critical)stacks+=ilyraProcCount(i.criticalFrostChance,random);
  if(frostStacks(segment)+stacks>=ilyraFrostGoal()&&i.triggerHitBonus)addDamage(batch,segment,hit.damage*i.triggerHitBonus);
  addFrost(batch,segment,stacks,{},random);
  applyDamageBatch(batch);
}
function fireIlyraProjectile() {
  const i=state.ilyra,target=ilyraTarget();if(!i||!target)return;
  const x=ilyraX(),y=state.player.y+PLATFORM_SHOT_Y,dx=target.x-x,dy=target.y-y,d=Math.hypot(dx,dy)||1,speed=510*i.projectileSpeed;
  state.bullets.push({owner:"ilyra",x,y,vx:dx/d*speed,vy:dy/d*speed,hitsLeft:1+i.pierce,dead:false,size:i.projectileSize,targetId:target.id});
  i.pulse=.18;
}
function triggerFrostNova(center,options={},random=Math.random,existingBatch=null) {
  const i=state.ilyra;if(!i||!center||!isSegmentVisible(center))return;
  const small=!!options.small,radius=i.novaRadius*(1+i.novaRadiusBonus)*(small?.5:1),batch=existingBatch||new Map();
  const affectedInstances=new Set();
  for(const target of [...visibleTargets()])if(segmentInArea(target,center,radius)){
    const base=(target===center?i.novaMainDamage:i.novaAreaDamage)*(small?.5:1)*skillValue("ilyra","nova",1,1.2);
    ilyraAddCriticalDamage(batch,target,base,random);
    const extra=small?0:ilyraProcCount(i.novaExtraChance,random);
    addFrost(batch,target,1+extra,{},random);
    const instance=snakeInstanceForSegment(target);if(instance)affectedInstances.add(instance);
  }
  if(!small)for(const instance of affectedInstances)instance.ilyraNovaSlow=i.novaSlowDuration;
  ilyraEffect("nova",center,radius,small?"#9cdfff":"#d8f8ff");
  if(!existingBatch&&batch.size)applyDamageBatch(batch);
}
function activateWinterStillness(random=Math.random) {
  const i=state.ilyra,batch=new Map();i.winterActive=i.winterDuration;i.winterSeen=new Set();
  for(const segment of visibleTargets()){
    i.winterSeen.add(segment.id);addFrost(batch,segment,skillValue("ilyra","nullPoint",1,2),{},random);
  }
  i.effects.push({kind:"winter",x:state.width/2,y:state.height/2,radius:Math.max(state.width,state.height),color:"#d8f9ff",life:1,maxLife:1});
  if(batch.size)applyDamageBatch(batch);
}
function updateIlyra(dt,random=Math.random) {
  const i=state.ilyra;if(!i)return;
  i.pulse=Math.max(0,i.pulse-dt);i.fireTimer-=dt;i.novaRemaining=Math.max(0,i.novaRemaining-dt);
  if(i.fireTimer<=0){fireIlyraProjectile();i.fireTimer+=1/(state.weapon.shotsPerSecond*ilyraRateMultiplier());}
  if(i.novaRemaining===0){const target=nearestIlyraVisibleSegment();if(target){triggerFrostNova(target,{},random);i.novaRemaining=i.novaCooldown;}}
  for(const instance of livingSnakeInstances()){
    instance.ilyraBreakSlow=Math.max(0,(instance.ilyraBreakSlow||0)-dt);
    instance.ilyraNovaSlow=Math.max(0,(instance.ilyraNovaSlow||0)-dt);
  }
  for(const segment of state.snake)if(frostStacks(segment)>0){segment.frostTime=Math.max(0,(segment.frostTime||0)-dt);if(segment.frostTime===0)segment.frostStacks=0;}
  if(i.blackIce){
    i.blackIceTick+=dt;
    while(i.blackIceTick>=.5){i.blackIceTick-=.5;const batch=new Map();for(const segment of visibleTargets())if(frostStacks(segment))ilyraAddCriticalDamage(batch,segment,skillValue("ilyra","blackIce",.025,.0325)*frostStacks(segment),random);if(batch.size)applyDamageBatch(batch);}
  }
  if(i.nullPoint){
    if(i.winterActive>0){
      i.winterActive=Math.max(0,i.winterActive-dt);const batch=new Map();
      for(const segment of visibleTargets())if(!i.winterSeen.has(segment.id)){i.winterSeen.add(segment.id);addFrost(batch,segment,skillValue("ilyra","nullPoint",1,2),{},random);}
      if(batch.size)applyDamageBatch(batch);
      if(i.winterActive===0)i.winterRemaining=i.winterCooldown;
    }else{i.winterRemaining=Math.max(0,i.winterRemaining-dt);if(i.winterRemaining===0&&visibleTargets().length)activateWinterStillness(random);}
  }
  for(const effect of i.effects)effect.life-=dt;i.effects=i.effects.filter(e=>e.life>0);
}

function ilyraUpgradePool() {
  const i=state.ilyra;if(!i)return [];
  const pool=[],card=(id,rarity,name,text,apply)=>pool.push({id:"ilyra-"+id,rarity,name,text:"Ilyra · "+skillCardText("ilyra",id,text),apply});
  const rarities=["grey","green","purple"];
  const additive=[
    ["bite","Frostbiss",skillValue("ilyra","bite",[.15,.30,.50],[.20,.35,.55]),v=>`+${v*100} % Eisbruch-Schaden.`,v=>i.icebreakBonus+=v],
    ["deepCold","Tiefe Kälte",skillValue("ilyra","deepCold",[.0125,.015,.02],[.015,.0175,.0225]),v=>`${v*100} % zusätzliche Verlangsamung je Froststapel.`,v=>i.frostSlow+=v],
    ["precision","Eisige Präzision",skillValue("ilyra","precision",[.05,.10,.20],[.10,.15,.25]),v=>`+${v*100} % Direktschaden gegen vereiste Segmente.`,v=>i.precision+=v],
    ["crystalCrit","Kristallkrit",skillValue("ilyra","crystalCrit",[.25,.50,1],[.35,.60,1.10]),v=>`${v*100} % Chance auf +1 Frost bei Krit.`,v=>i.criticalFrostChance+=v],
    ["chain","Kältekette",skillValue("ilyra","chain",[.20,.40,.70],[.30,.50,.80]),v=>`${v*100} % Chance auf Frost am Nachbarsegment.`,v=>i.chainChance+=v],
    ["breakRadius","Größerer Frostbruch",skillValue("ilyra","breakRadius",[.15,.30,.50],[.25,.40,.60]),v=>`+${v*100} % Kristallexplosionsradius.`,v=>i.explosionRadiusBonus+=v],
    ["projectile","Gletscherprojektil",skillValue("ilyra","projectile",[.10,.20,.35],[.15,.25,.40]),v=>`+${v*100} % Projektilgröße.`,v=>i.projectileSize+=v],
    ["pierce","Eisdurchstoß",skillValue("ilyra","pierce",[1,2,3],[2,3,4]),v=>`+${v} Durchschlag; jedes getroffene Segment erhält Frost.`,v=>i.pierce+=v],
    ["novaRadius","Große Frostnova",skillValue("ilyra","novaRadius",[.20,.35,.55],[.30,.45,.65]),v=>`+${v*100} % Frostnova-Radius.`,v=>i.novaRadiusBonus+=v],
    ["novaFocus","Konzentrierte Frostnova",skillValue("ilyra","novaFocus",[.20,.50,1],[.30,.60,1.10]),v=>`${v*100} % Chance auf +1 zusätzlichen Frost.`,v=>i.novaExtraChance+=v]
  ];
  if(i.nullPoint)additive.push(["winterRule","Eisige Herrschaft",skillValue("ilyra","winterRule",[.15,.30,.50],[.25,.40,.60]),v=>`Während Winterstille +${v*100} % Eisbruch-Schaden.`,v=>i.winterIcebreakBonus+=v]);
  for(const [id,name,values,label,apply] of additive)for(let n=0;n<3;n++)if(!i.taken[id+rarities[n]])card(id+"-"+rarities[n],rarities[n],name,label(values[n]),()=>{apply(values[n]);i.taken[id+rarities[n]]=true;});
  const fixed=[
    ["permafrost","Permafrost",skillValue("ilyra","permafrost",[5,6,8],[6,7,9]),v=>`Froststapel halten ${v} Sekunden.`,v=>i.frostDuration=Math.max(i.frostDuration,v)],
    ["splitter","Splitterbruch",skillValue("ilyra","splitter",[[1,.30],[2,.35],[3,.45]],[[1,.36],[2,.42],[3,.54]]),v=>`${v[0]} Splitter mit je ${v[1]} Schaden.`,v=>{if(v[0]>=i.splitterCount){i.splitterCount=v[0];i.splitterDamage=v[1];}}],
    ["explosion","Kristallexplosion",skillValue("ilyra","explosion",[.50,.75,1.10],[.60,.90,1.32]),v=>`${v} Schaden beim Eisbruch-Tod.`,v=>i.explosionDamage=Math.max(i.explosionDamage,v)],
    ["winterBreath","Winteratem",skillValue("ilyra","winterBreath",[[.18,2],[.22,2.5],[.30,3]],[[.21,2.5],[.25,3],[.33,3.5]]),v=>`Frostnova: −${v[0]*100} % für ${v[1]} Sekunden.`,v=>{if(v[0]>=i.novaSlow){i.novaSlow=v[0];i.novaSlowDuration=v[1];}}],
    ["novaQuick","Schnellere Frostnova",skillValue("ilyra","novaQuick",[16,14,11],[15,13,10]),v=>`Frostnova-Cooldown ${v} Sekunden.`,v=>{i.novaCooldown=Math.min(i.novaCooldown,v);i.novaRemaining=Math.min(i.novaRemaining,v);}]
  ];
  if(i.nullPoint)fixed.push(
    ["longWinter","Langer Winter",skillValue("ilyra","longWinter",[7,8,10],[8,9,11]),v=>`Winterstille dauert ${v} Sekunden.`,v=>i.winterDuration=Math.max(i.winterDuration,v)],
    ["winterComes","Winter kommt",skillValue("ilyra","winterComes",[27,24,20],[25,22,18]),v=>`Winterstille-Cooldown ${v} Sekunden.`,v=>{i.winterCooldown=Math.min(i.winterCooldown,v);i.winterRemaining=Math.min(i.winterRemaining,v);}]
  );
  for(const [id,name,values,label,apply] of fixed)for(let n=0;n<3;n++)if(!i.taken[id+rarities[n]])card(id+"-"+rarities[n],rarities[n],name,label(values[n]),()=>{apply(values[n]);i.taken[id+rarities[n]]=true;i.tiers[id]=Math.max(i.tiers[id]??-1,n);});
  for(let n=0;n<3;n++)if(!i.taken["quickFrost"+rarities[n]]){
    const text=n===0?"Eisbruch weiter bei 5 Stapeln; auslösender Treffer +20 % Schaden.":n===1?"Eisbruch bereits bei 4 Froststapeln.":"Eisbruch bei 4 Stapeln und +20 % Eisbruch-Schaden.";
    card("quickFrost-"+rarities[n],rarities[n],"Schnellfrost",text,()=>{if(n===0)i.triggerHitBonus=Math.max(i.triggerHitBonus,skillValue("ilyra","quickFrost",.20,.30));else i.frostGoal=4;if(n===2)i.icebreakBonus+=skillValue("ilyra","quickFrost",.20,.30);i.taken["quickFrost"+rarities[n]]=true;});
  }
  if(!i.absoluteCold)card("absoluteCold","purple","Absolute Kälte","Nach Eisbruch bleibt 1 Froststapel bestehen.",()=>i.absoluteCold=true);
  if(!i.glacierHeart)card("glacierHeart","purple","Gletscherherz","Ab 20 % Verlangsamung +30 % Direktschaden gegen diese Schlange.",()=>i.glacierHeart=true);
  if(!i.iceAge)card("iceAge","purple","Eiszeit","Nach jedem 5. Eisbruch entsteht eine kleine Frostnova.",()=>i.iceAge=true);
  if(!i.frostPlague)card("frostPlague","orange","Frostseuche","Eisbruch-Tod gibt den zwei nächsten sichtbaren Segmenten derselben Schlange je 1 Frost.",()=>i.frostPlague=true);
  if(!i.blackIce)card("blackIce","orange","Schwarzes Eis","Froststapel verursachen zweimal pro Sekunde zusammen 0,05 Schaden je Stapel und Sekunde.",()=>i.blackIce=true);
  if(!i.nullPoint)card("nullPoint","orange","Nullpunkt","Schaltet Winterstille frei; währenddessen Eisbruch bei 3 Froststapeln.",()=>{i.nullPoint=true;i.winterRemaining=30;});
  return pool;
}

function renderIlyraProfile() {
  const p=progress.data,b=document.querySelector("#unlockIlyra");
  b.disabled=true;b.textContent="Ilyra freigeschaltet · 0 Münzen";
  for(const side of ["left","right"]){const button=document.querySelector("#equipIlyra"+side);button.disabled=!p.ilyraUnlocked;button.textContent=(side==="left"?"Links":"Rechts")+(p.ilyraSlot===side?" · Aktiv":" einsetzen");if(p.ilyraSlot===side)document.querySelector("#heroSlot"+side).innerHTML='<img src="ilyra-front.png" alt="Ilyra"><strong>Ilyra</strong><small>Frostzepter · Aktiv</small>';}
  document.querySelector("#unequipIlyra").disabled=!p.ilyraSlot;
}
function bindIlyraMenu() {
  document.querySelector("#unlockIlyra").addEventListener("click",()=>{if(state.mode!=="start")return;progress.unlockHero("ilyra");renderProfile();document.querySelector("#heroStatus").textContent="Ilyra ist bereits kostenlos freigeschaltet.";});
  for(const side of ["left","right",null])document.querySelector(side?"#equipIlyra"+side:"#unequipIlyra").addEventListener("click",()=>{if(state.mode!=="start")return;const ok=progress.equipHero("ilyra",side);renderProfile();document.querySelector("#heroStatus").textContent=ok?(side?"Ilyra kämpft ab der nächsten Runde "+(side==="left"?"links":"rechts")+".":"Ilyra wurde aus dem Team genommen."):progress.message;});
}
function drawIlyra() {
  const i=state.ilyra;if(!i)return;
  for(const segment of state.snake)if(frostStacks(segment)&&isSegmentVisible(segment)){
    const goal=ilyraFrostGoal(),ratio=Math.min(1,frostStacks(segment)/goal);ctx.save();ctx.strokeStyle="#bdefff";ctx.fillStyle="rgba(185,239,255,"+(.08+.18*ratio)+")";ctx.shadowColor="#70dfff";ctx.shadowBlur=5+ratio*10;ctx.lineWidth=1.5+ratio;ctx.beginPath();ctx.arc(segment.x,segment.y,17+ratio*3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#e7fbff";ctx.font="bold 9px system-ui";ctx.textAlign="center";ctx.fillText(frostStacks(segment)+"/"+goal,segment.x,segment.y+3);ctx.restore();
  }
  for(const e of i.effects){const t=Math.max(0,e.life/e.maxLife);ctx.save();ctx.globalAlpha=t*.8;ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=14;ctx.lineWidth=e.kind==="winter"?4:2;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(1.15-t*.15),0,Math.PI*2);ctx.stroke();ctx.restore();}
  const x=ilyraX(),y=state.player.y,lift=i.pulse>0?Math.sin(i.pulse/.18*Math.PI)*2:0;ctx.save();
  ctx.shadowColor="#bfefff";ctx.shadowBlur=14;ctx.fillStyle="#173752";ctx.strokeStyle="#b9d5df";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+34,18,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle="#8de8ff";ctx.fillRect(x-12,y+33,5,2);ctx.fillRect(x+7,y+33,5,2);ctx.fillStyle="rgba(207,246,255,.24)";ctx.beginPath();ctx.ellipse(x,y+31,14,4,0,0,Math.PI*2);ctx.fill();
  for(let n=0;n<4;n++){const angle=state.elapsed*1.8+n*Math.PI/2,px=x+Math.cos(angle)*15,py=y+32+Math.sin(angle)*4;ctx.fillStyle="#d9f8ff";ctx.fillRect(px-1.5,py-1.5,3,3);}
  if(ilyraSprite.complete&&ilyraSprite.naturalWidth)ctx.drawImage(ilyraSprite,x-20,y-15-lift,40,56);else{ctx.fillStyle="#eefcff";ctx.fillRect(x-8,y,16,27);ctx.fillStyle="#295a91";ctx.fillRect(x-14,y+25,28,16);}ctx.restore();
}
