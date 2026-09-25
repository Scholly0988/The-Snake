"use strict";

function newSeraphine(slot) {
  return slot ? {
    slot, fireTimer:0, pulse:0, ringPulse:0,
    burnDuration:4, burnDps:skillValue("seraphine","burn",.20,.25),
    maxBurn:3, burnBonus:0, precision:0, criticalBurnChance:0,
    projectileSize:1.10, projectileSpeed:.95, pierce:0,
    explosionMain:1.5, explosionArea:.5, explosionBonus:0, explosionRadius:55, explosionRadiusBonus:0,
    transferChance:.25, transferCount:1, sparkCount:0, sparkDamage:0,
    thresholdReduction:0, triggerHitBonus:0,
    waveRadius:100, waveRadiusBonus:0, waveMain:1.2, waveArea:.6,
    waveExtraChance:0, waveCooldown:18, waveRemaining:18, waveInFlight:false,
    infernoActive:0, infernoDuration:6, infernoCooldown:30, infernoRemaining:30, infernoBurnBonus:0,
    eternalEmber:false, flamePath:false, firePlague:false, hellEmber:false, firestorm:false, sunCore:false,
    explosionCount:0, burnTick:0, reactionId:0,
    taken:{}, tiers:{}, effects:[], sparks:[]
  } : null;
}

function seraphineX() { return state.player.x+(state.seraphine.slot==="left"?-36:36); }
function seraphineFlatDamage() { return 1+Math.max(0,(state.weapon.damage||1)-1); }
function seraphineGeneralDamageFactor() { return seraphineFlatDamage(); }
function seraphineBaseDamage(base) { return base*seraphineGeneralDamageFactor(); }
function seraphineDirectDamage(segment=null) {
  let damage=seraphineFlatDamage()*skillValue("seraphine","attack",1,1.2);
  if(segment&&burnStacks(segment)>0)damage*=1+state.seraphine.precision;
  return damage;
}
function seraphineRateMultiplier() { return state.seraphine?.slot ? .85 : 0; }
function seraphineCriticalDamage(base,random=Math.random) {
  const critical=random()*100<(state.weapon.critChance||0);
  return {critical,damage:base*(critical?(state.weapon.critDamage||150)/100:1)};
}
function seraphineProcCount(chance,random=Math.random) {
  chance=Math.max(0,chance);
  if(chance<1)return random()<chance?1:0;
  return 1+(random()<Math.min(1,chance-1)?1:0);
}
function burnStacks(segment) { return segment.burnStacks||0; }
function seraphineInstanceSegments(instance) { return instance?.segments||state.snake; }
function seraphineThreshold() {
  const s=state.seraphine;
  if(s?.sunCore&&s.infernoActive>0)return 2;
  return Math.max(1,(s?.maxBurn||3)-(s?.thresholdReduction||0));
}
function seraphineReaction(blockTransfer=false) {
  const s=state.seraphine;
  return {id:++s.reactionId,exploded:new Set(),blockTransfer};
}
function seraphineTarget() {
  const x=seraphineX(),y=state.player.y+PLATFORM_SHOT_Y,candidates=[];
  for(const instance of livingSnakeInstances()){
    const list=seraphineInstanceSegments(instance),visible=list.filter(s=>s.hp>0&&isSegmentVisible(s));
    if(!visible.length)continue;
    const reference=snakeHead(instance),distance=Math.hypot((reference&&isSegmentVisible(reference)?reference.x:visible[0].x)-x,(reference&&isSegmentVisible(reference)?reference.y:visible[0].y)-y);
    visible.sort((a,b)=>Number(!!b.overheated)-Number(!!a.overheated)||burnStacks(b)-burnStacks(a)||list.indexOf(a)-list.indexOf(b));
    candidates.push({target:visible[0],distance});
  }
  return candidates.sort((a,b)=>a.distance-b.distance)[0]?.target||null;
}
function seraphineNeighbors(segment,instance=snakeInstanceForSegment(segment)) {
  const list=seraphineInstanceSegments(instance),index=list.indexOf(segment);
  return [list[index-1],list[index+1]].filter(s=>s&&s.hp>0&&isSegmentVisible(s));
}
function seraphineEffect(kind,center,radius=18,color="#ff8138") {
  state.seraphine?.effects.push({kind,x:center.x,y:center.y,radius,color,life:.65,maxLife:.65});
}
function addSeraphineDamage(batch,segment,base,random=Math.random) {
  const hit=seraphineCriticalDamage(seraphineBaseDamage(base),random);addDamage(batch,segment,hit.damage);return hit;
}
function extraCriticalBurn(hit,random=Math.random) {
  return hit?.critical?seraphineProcCount(state.seraphine.criticalBurnChance,random):0;
}

function addBurn(batch,segment,count=1,options={},random=Math.random) {
  const s=state.seraphine;
  if(!s||!segment||segment.hp<=0||!isSegmentVisible(segment)||count<=0)return 0;
  segment.overheated=!!segment.overheated;
  const reaction=options.reaction||seraphineReaction(!!options.blockTransfer),wasEmpty=burnStacks(segment)===0;
  let added=0;
  for(let n=0;n<count;n++){
    if(segment.overheated){
      triggerOverheatExplosion(batch,segment,{...options,reaction},random);
      break;
    }
    segment.burnStacks=burnStacks(segment)+1;added++;
    if(segment.burnStacks>=seraphineThreshold()){
      segment.burnStacks=seraphineThreshold();segment.overheated=true;
    }
  }
  if(burnStacks(segment)>0){
    segment.burnTime=s.burnDuration;
    if(wasEmpty&&segment.burnPlagueTime==null)segment.burnPlagueTime=3;
    seraphineEffect("burn",segment,12,"#ff9d3f");
  }
  return added;
}

function triggerOverheatExplosion(batch,segment,options={},random=Math.random) {
  const s=state.seraphine,reaction=options.reaction||seraphineReaction(!!options.blockTransfer);
  if(!s||!segment||!state.snake.includes(segment)||!isSegmentVisible(segment)||reaction.exploded.has(segment.id))return false;
  reaction.exploded.add(segment.id);
  const snapshot=Math.max(burnStacks(segment),seraphineThreshold());
  const retain=s.eternalEmber?skillValue("seraphine","eternalEmber",1,2):0;
  segment.burnStacks=retain;segment.burnTime=retain?s.burnDuration:0;segment.overheated=retain>=seraphineThreshold();
  if(!retain)segment.burnPlagueTime=null;
  const inferno=s.infernoActive>0?.25+(s.sunCore?skillValue("seraphine","sunCore",0,.15):0):0;
  const bonus=skillValue("seraphine","overheat",1,1.2)*(1+s.explosionBonus+inferno);
  const mainHit=addSeraphineDamage(batch,segment,s.explosionMain*bonus,random);
  segment.seraphineExplosionDeath={reaction,stacks:snapshot,blockTransfer:reaction.blockTransfer};
  const radius=s.explosionRadius*(1+s.explosionRadiusBonus);
  for(const target of [...visibleTargets()])if(target!==segment&&segmentInArea(target,segment,radius)){
    const areaHit=addSeraphineDamage(batch,target,s.explosionArea*bonus,random);
    const existingMarker=target.seraphineExplosionDeath;
    const deathMarker=existingMarker||{reaction,stacks:burnStacks(target),blockTransfer:reaction.blockTransfer};
    if(!existingMarker)target.seraphineExplosionDeath=deathMarker;
    addBurn(batch,target,1+extraCriticalBurn(areaHit,random),{reaction,blockTransfer:reaction.blockTransfer},random);
    if(!existingMarker&&target.seraphineExplosionDeath===deathMarker)deathMarker.stacks=Math.max(deathMarker.stacks,burnStacks(target));
  }
  if(s.sparkCount){
    const allTargets=visibleTargets().filter(target=>target!==segment),unused=[...allTargets];
    for(let n=0;n<s.sparkCount&&allTargets.length;n++){
      const source=unused.length?unused:allTargets,index=Math.min(source.length-1,Math.floor(random()*source.length)),target=source[index];
      if(unused.length)unused.splice(index,1);
      addSeraphineDamage(batch,target,s.sparkDamage,random);seraphineEffect("spark",target,8,"#ffd16a");
    }
  }
  s.explosionCount++;
  seraphineEffect("explosion",segment,radius,"#ff5b24");s.ringPulse=Math.max(s.ringPulse,.3);
  if(s.firestorm&&s.explosionCount%skillValue("seraphine","firestorm",5,4)===0)triggerFireWave(segment,{small:true,reaction},random,batch);
  return true;
}

function seraphineClosestAlongSnake(destroyed,instance,count) {
  const list=seraphineInstanceSegments(instance),offset=destroyed.pathOffset;
  return list.filter(s=>s.hp>0&&isSegmentVisible(s)).sort((a,b)=>Math.abs(a.pathOffset-offset)-Math.abs(b.pathOffset-offset)).slice(0,count);
}
function queueSeraphineDeath(segment,instance,neighbors=[]) {
  const s=state.seraphine;if(!s)return;
  const explosion=segment.seraphineExplosionDeath;
  const stacks=explosion?.stacks||burnStacks(segment);
  if(stacks<=0&&!explosion)return;
  state.seraphineDeaths.push({segment,instance,neighbors:neighbors.filter(n=>n&&n.hp>0&&isSegmentVisible(n)),stacks,
    explosion:!!explosion,reaction:explosion?.reaction||seraphineReaction(false),blockTransfer:!!explosion?.blockTransfer});
}
function resolveSeraphineDeaths(random=Math.random) {
  const s=state.seraphine;if(!s||state.resolvingSeraphineDeaths||!state.seraphineDeaths?.length)return;
  state.resolvingSeraphineDeaths=true;
  try{
    while(state.seraphineDeaths.length){
      const death=state.seraphineDeaths.shift(),batch=new Map(),reaction=death.reaction||seraphineReaction(death.blockTransfer);
      if(!death.blockTransfer&&death.stacks>0){
        const inferno=s.infernoActive>0?.25:0,procs=seraphineProcCount(s.transferChance+inferno,random);
        const available=death.neighbors.filter(n=>state.snake.includes(n)&&n.hp>0&&isSegmentVisible(n));let first=null;
        for(let n=0;n<procs&&available.length;n++){
          let target;
          if(n===0)target=available[Math.min(available.length-1,Math.floor(random()*available.length))];
          else target=available.find(x=>x!==first)||first||available[0];
          first ||= target;
          const child={id:reaction.id,exploded:reaction.exploded,blockTransfer:true};
          addBurn(batch,target,Math.min(death.stacks,s.transferCount),{reaction:child,blockTransfer:true},random);
        }
      }
      if(s.flamePath&&death.explosion){
        const count=skillValue("seraphine","flamePath",2,3);
        const child={id:reaction.id,exploded:reaction.exploded,blockTransfer:true};
        for(const target of seraphineClosestAlongSnake(death.segment,death.instance,count))addBurn(batch,target,1,{reaction:child,blockTransfer:true},random);
      }
      if(batch.size)applyDamageBatch(batch);
    }
  } finally { state.resolvingSeraphineDeaths=false; }
}

function seraphineHitRoll(segment,bullet,random=Math.random) {
  return seraphineCriticalDamage(seraphineDirectDamage(segment),random);
}
function seraphineHit(segment,hit,bullet,random=Math.random) {
  const s=state.seraphine,reaction=seraphineReaction(false),batch=new Map();
  if(bullet.fireWave){
    triggerFireWave(segment,{reaction},random,batch);
    if(s.waveRemaining===0){s.waveRemaining=s.waveCooldown;s.waveInFlight=false;}
  }else{
    addDamage(batch,segment,hit.damage);
    const stacks=(s.infernoActive>0?2:1)+extraCriticalBurn(hit,random);
    if(segment.overheated&&s.triggerHitBonus)addDamage(batch,segment,hit.damage*s.triggerHitBonus);
    addBurn(batch,segment,stacks,{reaction},random);
  }
  applyDamageBatch(batch);
}
function fireSeraphineProjectile() {
  const s=state.seraphine,target=seraphineTarget();if(!s||!target)return;
  const x=seraphineX(),y=state.player.y+PLATFORM_SHOT_Y,dx=target.x-x,dy=target.y-y,d=Math.hypot(dx,dy)||1,speed=510*s.projectileSpeed;
  const fireWave=s.waveRemaining===0&&!s.waveInFlight;
  state.bullets.push({owner:"seraphine",x,y,vx:dx/d*speed,vy:dy/d*speed,hitsLeft:1+s.pierce,dead:false,size:s.projectileSize,targetId:target.id,fireWave});
  if(fireWave)s.waveInFlight=true;
  s.pulse=.18;s.ringPulse=Math.max(s.ringPulse,.16);
}
function triggerFireWave(center,options={},random=Math.random,existingBatch=null) {
  const s=state.seraphine;if(!s||!center||!isSegmentVisible(center))return;
  const small=!!options.small,reaction=options.reaction||seraphineReaction(false);
  const radius=s.waveRadius*(1+s.waveRadiusBonus)*(small?.5:1),batch=existingBatch||new Map();
  for(const target of [...visibleTargets()])if(segmentInArea(target,center,radius)){
    const raw=(target===center?s.waveMain+s.waveArea:s.waveArea)*(small?.5:1)*skillValue("seraphine","wave",1,1.2);
    const hit=addSeraphineDamage(batch,target,raw,random);
    const baseStacks=small?1:(s.infernoActive>0?2:1);
    const hot=small?0:seraphineProcCount(s.waveExtraChance,random);
    addBurn(batch,target,baseStacks+hot+(small?0:extraCriticalBurn(hit,random)),{reaction},random);
  }
  seraphineEffect("wave",center,radius,small?"#ff9b38":"#ff6a20");s.ringPulse=Math.max(s.ringPulse,small?.28:.42);
  if(!existingBatch&&batch.size)applyDamageBatch(batch);
}
function activateInferno() {
  const s=state.seraphine;if(!s)return;
  s.infernoActive=s.infernoDuration;s.infernoRemaining=s.infernoCooldown;s.ringPulse=Math.max(s.ringPulse,.8);
  s.effects.push({kind:"inferno",x:seraphineX(),y:state.player.y+28,radius:42,color:"#ff4a18",life:1,maxLife:1});
}
function updateSeraphine(dt,random=Math.random) {
  const s=state.seraphine;if(!s)return;
  s.pulse=Math.max(0,s.pulse-dt);s.ringPulse=Math.max(0,s.ringPulse-dt);s.fireTimer-=dt;
  s.waveRemaining=Math.max(0,s.waveRemaining-dt);s.infernoRemaining=Math.max(0,s.infernoRemaining-dt);s.infernoActive=Math.max(0,s.infernoActive-dt);
  if(s.infernoRemaining===0)activateInferno();
  if(s.fireTimer<=0){fireSeraphineProjectile();s.fireTimer+=1/(state.weapon.shotsPerSecond*seraphineRateMultiplier());}
  if(s.waveInFlight&&!state.bullets.some(b=>b.owner==="seraphine"&&b.fireWave&&!b.dead))s.waveInFlight=false;
  const dotBatch=new Map();s.burnTick+=dt;
  for(const segment of state.snake)if(burnStacks(segment)>0){
    segment.burnTime=Math.max(0,(segment.burnTime||0)-dt);
    if(segment.burnTime===0){segment.burnStacks=0;segment.overheated=false;segment.burnPlagueTime=null;continue;}
    if(s.firePlague){
      segment.burnPlagueTime=(segment.burnPlagueTime??3)-dt;
      while(segment.burnPlagueTime<=0){segment.burnPlagueTime+=3;if(isSegmentVisible(segment)&&random()<skillValue("seraphine","firePlague",.30,.40)){
        const targets=seraphineNeighbors(segment),target=targets[Math.min(targets.length-1,Math.floor(random()*targets.length))];
        if(target)addBurn(dotBatch,target,1,{reaction:seraphineReaction(false)},random);
      }}
    }
  }
  while(s.burnTick>=.5){
    s.burnTick-=.5;
    for(const segment of visibleTargets())if(burnStacks(segment)>0){
      const inferno=s.infernoActive>0?skillValue("seraphine","inferno",.50,.65)+s.infernoBurnBonus:0;
      const normal=seraphineCriticalDamage(seraphineBaseDamage(s.burnDps*.5*burnStacks(segment)*(1+s.burnBonus+inferno)),random);
      addDamage(dotBatch,segment,normal.damage);
      if(s.hellEmber){
        const hell=seraphineCriticalDamage(seraphineBaseDamage(skillValue("seraphine","hellEmber",.05,.065)*burnStacks(segment)),random);
        addDamage(dotBatch,segment,hell.damage);
      }
    }
  }
  if(dotBatch.size)applyDamageBatch(dotBatch);
  for(const effect of s.effects)effect.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
}

function seraphineUpgradePool() {
  const s=state.seraphine;if(!s)return [];
  const pool=[],card=(id,rarity,name,text,apply)=>pool.push({id:"seraphine-"+id,rarity,name,text:"Seraphine · "+skillCardText("seraphine",id,text),apply});
  const rarities=["grey","green","purple"];
  const additive=[
    ["emberPower","Glutverstärkung",skillValue("seraphine","emberPower",[.15,.30,.50],[.20,.35,.55]),v=>`+${v*100} % Brandschaden.`,v=>s.burnBonus+=v],
    ["explosive","Explosive Glut",skillValue("seraphine","explosive",[.15,.30,.50],[.20,.35,.55]),v=>`+${v*100} % Überhitzungsschaden.`,v=>s.explosionBonus+=v],
    ["radius","Flammenradius",skillValue("seraphine","radius",[.15,.30,.50],[.25,.40,.60]),v=>`+${v*100} % Explosionsradius.`,v=>s.explosionRadiusBonus+=v],
    ["precision","Brennende Präzision",skillValue("seraphine","precision",[.05,.10,.20],[.10,.15,.25]),v=>`+${v*100} % Direktschaden gegen brennende Segmente.`,v=>s.precision+=v],
    ["criticalFlame","Kritische Flamme",skillValue("seraphine","criticalFlame",[.25,.50,1],[.35,.60,1.10]),v=>`${v*100} % Chance auf zusätzlichen Brand bei Krit.`,v=>s.criticalBurnChance+=v],
    ["pierce","Glutdurchstoß",skillValue("seraphine","pierce",[1,2,3],[2,3,4]),v=>`+${v} Durchschlag; jede Feuerwellen-Kugel löst je Treffer eine volle Welle aus.`,v=>s.pierce+=v],
    ["waveRadius","Große Feuerwelle",skillValue("seraphine","waveRadius",[.20,.35,.55],[.30,.45,.65]),v=>`+${v*100} % Feuerwellenradius.`,v=>s.waveRadiusBonus+=v],
    ["hotWave","Heiße Feuerwelle",skillValue("seraphine","hotWave",[.20,.50,1],[.30,.60,1.10]),v=>`${v*100} % Chance auf +1 zusätzlichen Brand.`,v=>s.waveExtraChance+=v],
    ["burningInferno","Brennendes Inferno",skillValue("seraphine","burningInferno",[.15,.30,.50],[.25,.40,.60]),v=>`Während Inferno zusätzlich +${v*100} % Brandschaden.`,v=>s.infernoBurnBonus+=v]
  ];
  for(const [id,name,values,label,apply] of additive)for(let n=0;n<3;n++)if(!s.taken[id+rarities[n]])card(id+"-"+rarities[n],rarities[n],name,label(values[n]),()=>{apply(values[n]);s.taken[id+rarities[n]]=true;});
  const fixed=[
    ["longFlame","Langanhaltende Flamme",skillValue("seraphine","longFlame",[5,6,8],[6,7,9]),v=>`Brand hält ${v} Sekunden.`,v=>s.burnDuration=Math.max(s.burnDuration,v)],
    ["fuel","Brennstoff",skillValue("seraphine","fuel",[1,2,3],[2,3,4]),v=>`+${v} maximale Brandstapel.`,v=>s.maxBurn=Math.max(s.maxBurn,3+v)],
    ["chain","Flammenkette",skillValue("seraphine","chain",[.40,.55,.75],[.50,.65,.85]),v=>`${v*100} % Feuerübertragungs-Chance.`,v=>s.transferChance=Math.max(s.transferChance,v)],
    ["legacy","Feuererbe",skillValue("seraphine","legacy",[2,3,4],[3,4,5]),v=>`Bis zu ${v} Brandstapel je übertragenem Ziel.`,v=>s.transferCount=Math.max(s.transferCount,v)],
    ["sparks","Feuerfunken",skillValue("seraphine","sparks",[[1,.30],[2,.35],[3,.45]],[[1,.36],[2,.42],[3,.54]]),v=>`${v[0]} Funken mit je ${v[1]} Schaden.`,v=>{if(v[0]>=s.sparkCount){s.sparkCount=v[0];s.sparkDamage=v[1];}}],
    ["waveQuick","Schnellere Feuerwelle",skillValue("seraphine","waveQuick",[16,14,11],[15,13,10]),v=>`Feuerwellen-Cooldown ${v} Sekunden.`,v=>{s.waveCooldown=Math.min(s.waveCooldown,v);s.waveRemaining=Math.min(s.waveRemaining,v);}],
    ["longInferno","Langes Inferno",skillValue("seraphine","longInferno",[7,8,10],[8,9,11]),v=>`Inferno dauert ${v} Sekunden.`,v=>s.infernoDuration=Math.max(s.infernoDuration,v)],
    ["infernoCall","Inferno-Ruf",skillValue("seraphine","infernoCall",[27,24,20],[25,22,18]),v=>`Inferno-Cooldown ${v} Sekunden.`,v=>{s.infernoCooldown=Math.min(s.infernoCooldown,v);s.infernoRemaining=Math.min(s.infernoRemaining,v);}]
  ];
  for(const [id,name,values,label,apply] of fixed)for(let n=0;n<3;n++)if(!s.taken[id+rarities[n]])card(id+"-"+rarities[n],rarities[n],name,label(values[n]),()=>{apply(values[n]);s.taken[id+rarities[n]]=true;s.tiers[id]=Math.max(s.tiers[id]??-1,n);});
  for(let n=0;n<3;n++)if(!s.taken["quickOverheat"+rarities[n]]){
    const text=n===0?"Schwelle unverändert; auslösender Treffer +20 % Schaden.":n===1?"Überhitzung benötigt 1 Stapel weniger.":"Überhitzung benötigt 1 Stapel weniger und Explosion +20 % Schaden.";
    card("quickOverheat-"+rarities[n],rarities[n],"Schnellere Überhitzung",text,()=>{if(n===0)s.triggerHitBonus=Math.max(s.triggerHitBonus,skillValue("seraphine","quickOverheat",.20,.30));else s.thresholdReduction=1;if(n===2)s.explosionBonus+=skillValue("seraphine","quickOverheat",.20,.30);s.taken["quickOverheat"+rarities[n]]=true;});
  }
  if(!s.eternalEmber)card("eternalEmber","purple","Ewige Glut","Nach einer Explosion bleibt 1 Brandstapel zurück.",()=>s.eternalEmber=true);
  if(!s.firePlague)card("firePlague","purple","Feuerseuche","Brennende Segmente entzünden alle 3 Sekunden mit 30 % Chance einen Nachbarn.",()=>s.firePlague=true);
  if(!s.firestorm)card("firestorm","purple","Feuersturm","Nach jeder 5. Überhitzungsexplosion entsteht eine kleine Feuerwelle.",()=>s.firestorm=true);
  if(!s.flamePath)card("flamePath","orange","Flammenpfad","Explosions-Tod entzündet zwei nahe sichtbare Segmente derselben Schlange.",()=>s.flamePath=true);
  if(!s.hellEmber)card("hellEmber","orange","Höllenglut","Je Brandstapel +0,05 Schaden pro Halbsekunden-Tick.",()=>s.hellEmber=true);
  if(!s.sunCore)card("sunCore","orange","Sonnenkern","Während Inferno liegt die Überhitzungsgrenze fest bei 2 Stapeln.",()=>s.sunCore=true);
  return pool;
}

function renderSeraphineProfile() {
  const p=progress.data,b=document.querySelector("#unlockSeraphine");
  b.disabled=true;b.textContent="Seraphine freigeschaltet · 0 Münzen";
  for(const side of ["left","right"]){const button=document.querySelector("#equipSeraphine"+side);button.disabled=!p.seraphineUnlocked;button.textContent=(side==="left"?"Links":"Rechts")+(p.seraphineSlot===side?" · Aktiv":" einsetzen");if(p.seraphineSlot===side)document.querySelector("#heroSlot"+side).innerHTML='<img src="seraphine-front.png?v=23-0" alt="Seraphine"><strong>Seraphine</strong><small>Glutstab · Aktiv</small>';}
  document.querySelector("#unequipSeraphine").disabled=!p.seraphineSlot;
}
function bindSeraphineMenu() {
  document.querySelector("#unlockSeraphine").addEventListener("click",()=>{if(state.mode!=="start")return;progress.unlockHero("seraphine");renderProfile();document.querySelector("#heroStatus").textContent="Seraphine ist bereits kostenlos freigeschaltet.";});
  for(const side of ["left","right",null])document.querySelector(side?"#equipSeraphine"+side:"#unequipSeraphine").addEventListener("click",()=>{if(state.mode!=="start")return;const ok=progress.equipHero("seraphine",side);renderProfile();document.querySelector("#heroStatus").textContent=ok?(side?"Seraphine kämpft ab der nächsten Runde "+(side==="left"?"links":"rechts")+".":"Seraphine wurde aus dem Team genommen."):progress.message;});
}

function drawSeraphine() {
  const s=state.seraphine;if(!s)return;
  for(const segment of state.snake)if(burnStacks(segment)>0&&isSegmentVisible(segment)){
    const threshold=seraphineThreshold(),ratio=Math.min(1,burnStacks(segment)/threshold);ctx.save();ctx.strokeStyle=segment.overheated?"#fff08a":"#ff7132";ctx.fillStyle=`rgba(255,82,22,${.08+.18*ratio})`;ctx.shadowColor="#ff4a18";ctx.shadowBlur=5+ratio*12;ctx.lineWidth=1.5+ratio;ctx.beginPath();ctx.arc(segment.x,segment.y,17+ratio*3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#fff0a6";ctx.font="bold 9px system-ui";ctx.textAlign="center";ctx.fillText(segment.overheated?"HEISS":burnStacks(segment)+"/"+threshold,segment.x,segment.y+3);ctx.restore();
  }
  for(const e of s.effects){const t=Math.max(0,e.life/e.maxLife);ctx.save();ctx.globalAlpha=t*.85;ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=16;ctx.lineWidth=e.kind==="wave"?5:3;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(1.2-t*.2),0,Math.PI*2);ctx.stroke();ctx.restore();}
  const x=seraphineX(),y=state.player.y,lift=3+Math.sin(state.elapsed*2.3)*1.5+(s.pulse>0?Math.sin(s.pulse/.18*Math.PI)*2:0);
  const inferno=s.infernoActive>0,flash=Math.min(1,s.ringPulse/.3),outer=inferno?27:21;
  ctx.save();ctx.translate(x,y+34);ctx.globalCompositeOperation="lighter";
  ctx.shadowColor="#ff4c18";ctx.shadowBlur=12+flash*14;ctx.strokeStyle=`rgba(255,91,28,${.75+flash*.2})`;ctx.lineWidth=2+flash;ctx.beginPath();ctx.arc(0,0,outer+flash*4,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="rgba(255,190,72,.72)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,13+flash*3,0,Math.PI*2);ctx.stroke();
  for(let n=0;n<6;n++){const a=state.elapsed*.65+n*Math.PI/3,r=outer;ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r*.36);ctx.rotate(a+Math.PI/2);ctx.fillStyle="#ffb13c";ctx.fillRect(-2,-1,4,2);ctx.restore();}
  for(let n=0;n<7;n++){const a=-state.elapsed*1.4+n*Math.PI*2/7,r=15+Math.sin(state.elapsed*3+n)*2;ctx.fillStyle=n%2?"#ff6a24":"#ffd166";ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.35,1.6+flash,0,Math.PI*2);ctx.fill();}
  if(inferno){ctx.strokeStyle="rgba(255,50,12,.78)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,32+Math.sin(state.elapsed*4)*2,0,Math.PI*2);ctx.stroke();}
  for(let n=0;n<(inferno?7:3);n++){const a=state.elapsed*(1.2+n*.11)+n*2.1,life=(state.elapsed*.7+n*.31)%1;ctx.fillStyle=`rgba(255,${110+n*9},35,${1-life})`;ctx.beginPath();ctx.arc(Math.cos(a)*outer*.8,-life*24+Math.sin(a)*4,1.6*(1-life)+.4,0,Math.PI*2);ctx.fill();}
  ctx.restore();ctx.save();ctx.shadowColor="#ff6a2a";ctx.shadowBlur=inferno?18:10;
  if(seraphineSprite.complete&&seraphineSprite.naturalWidth)ctx.drawImage(seraphineSprite,x-20,y-17-lift,40,56);else{ctx.fillStyle="#761d22";ctx.fillRect(x-9,y-lift,18,30);ctx.fillStyle="#ffb23e";ctx.fillRect(x+8,y-8-lift,3,34);}ctx.restore();
}
