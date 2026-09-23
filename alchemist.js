"use strict";

function newAlchemist(slot) {
  return slot ? {
    slot, fireTimer:0, throws:0, pulse:0, targetId:null,
    poisonDamage:.20, poisonBonus:0, poisonDuration:4, maxStacks:3,
    transferChance:.25, transferStacks:1,
    explosion:0, explosionRadius:42, corrosive:0, slow:0,
    chainChance:0, cloud:false, cloudRadius:64, cloudDuration:4,
    cloudExtraChance:0, cloudCooldown:18, cloudRemaining:18,
    reactiveChance:0, unstableChance:0, unstableDamage:0,
    overdose:0, plagueInterval:0, plagueTimer:0,
    experiment:false, experimentCooldown:30, experimentRemaining:30,
    experimentDuration:6, experimentActive:0, experimentPoisonBonus:0,
    cocktail:false, epidemic:false, rain:false, mutation:false, living:false,
    livingTimer:3, effects:[], clouds:[], taken:{}, tiers:{}
  } : null;
}
function alchemistX() { return state.player.x+(state.alchemist.slot==="left"?-36:36); }
function alchemistDamage() { return Math.max(.1,state.weapon.damage-.2)*skillValue("alchemist","attack",1,1.26); }
function alchemistHitRoll(random=Math.random) {
  const critical=random()*100<(state.weapon.critChance||0);
  return {critical,damage:alchemistDamage()*(critical?state.weapon.critDamage/100:1)};
}
function poisonLimit() {
  const a=state.alchemist;
  return a.maxStacks+(a.experimentActive>0?2:0);
}
function poisonStacks(segment) { return (segment.poisonStacks||[]).length; }
function alchemistTarget() {
  const a=state.alchemist;if(!a)return null;
  const visible=visibleTargets();
  if(!visible.length){a.targetId=null;return null;}
  const current=visible.find(segment=>segment.id===a.targetId);
  if(current&&poisonStacks(current)<poisonLimit())return current;
  const x=alchemistX(),y=state.player.y+PLATFORM_SHOT_Y;
  const target=nearestSnakeSegment(x,y,segment=>poisonStacks(segment)<poisonLimit())||nearestSnakeTarget(x,y)||visible[0];
  a.targetId=target.id;
  return target;
}
function alchemistProjectileTarget(bullet) {
  const visible=visibleTargets();
  if(!visible.length)return null;
  const current=visible.find(segment=>segment.id===bullet.targetId);
  if(current&&poisonStacks(current)<poisonLimit())return current;
  const target=alchemistTarget()||current||visible[0];
  bullet.targetId=target.id;
  return target;
}
function addPoison(segment,count=1,duration=null) {
  const a=state.alchemist;
  if(!a||!isSegmentVisible(segment)||segment.hp<=0)return 0;
  segment.poisonStacks ||= [];
  let added=0,life=duration??a.poisonDuration;
  while(count-->0&&segment.poisonStacks.length<poisonLimit()){
    segment.poisonStacks.push(life);added++;
  }
  if(added){segment.poisonAge=segment.poisonAge||0;segment.alchemistTouched=true;}
  return added;
}
function poisonDamagePerStack(segment) {
  const a=state.alchemist;
  const base=skillValue("alchemist","poison",a.poisonDamage,a.poisonDamage*1.3);
  let damage=base*(1+a.poisonBonus+a.experimentPoisonBonus+(a.experimentActive>0?.5:0));
  if(a.mutation&&segment.poisonAge>=skillValue("alchemist","mutation",4,3))damage*=1.5;
  if(poisonStacks(segment)>=poisonLimit())damage*=1+a.overdose;
  return damage;
}
function alchemistArea(batch,center,radius,damage,poison=0) {
  const targets=[];
  for(const segment of state.snake)if(segmentInArea(segment,center,radius)){
    if(damage)addDamage(batch,segment,damage);
    if(poison)addPoison(segment,poison);
    targets.push(segment);
  }
  state.alchemist.effects.push({x:center.x,y:center.y,radius,life:.45,maxLife:.45,color:"#7cff59"});
  return targets;
}
function visiblePoisoned(exclude=null){return visibleTargets().filter(s=>s!==exclude&&poisonStacks(s)>0);}
function randomVisibleTarget(exclude=null,random=Math.random){
  const list=visibleTargets().filter(s=>s!==exclude);
  return list.length?list[Math.min(list.length-1,Math.floor(random()*list.length))]:null;
}
function transferPoison(source,target,count,keepRemaining=false){
  if(!target||!source.poisonStacks?.length)return 0;
  const stacks=[...source.poisonStacks].sort((a,b)=>b-a).slice(0,count);
  let added=0;for(const remaining of stacks)added+=addPoison(target,1,keepRemaining?remaining:null);
  return added;
}
function resolveAlchemistDeath(segment,neighbors,random=Math.random){
  const a=state.alchemist;if(!a||!segment.poisonStacks?.length)return;
  const visibleNeighbors=neighbors.filter(s=>state.snake.includes(s)&&isSegmentVisible(s)&&s.hp>0);
  if(random()<Math.min(1,a.transferChance+(segment.plagueMixture?.25:0))){
    const target=visibleNeighbors[Math.floor(random()*visibleNeighbors.length)];
    if(target)transferPoison(segment,target,a.transferStacks);
  }
  if(a.epidemic&&random()<skillValue("alchemist","epidemic",.30,.40)){
    const target=randomVisibleTarget(null,random);
    if(target)transferPoison(segment,target,segment.poisonStacks.length,true);
  }
  if(a.chainChance&&segment.poisonStacks.length>=3&&random()<a.chainChance){
    state.alchemist.clouds.push({x:segment.x,y:segment.y,radius:a.cloudRadius*.6,life:2,tick:0,direct:false,small:true});
  }
}
function throwAlchemistBottle(options={}){
  const a=state.alchemist,target=alchemistTarget();if(!a||!target)return;
  a.throws++;
  let mixture=null;
  if(a.cocktail&&a.throws%5===0)mixture=["fire","frost","acid","plague"][Math.floor(Math.random()*4)];
  state.bullets.push({owner:"alchemist",x:alchemistX(),y:state.player.y+PLATFORM_SHOT_Y,
    vx:0,vy:-510*.9,hitsLeft:1,dead:false,targetId:target.id,mixture,...options});
  if(a.rain&&a.throws%10===0){
    const targets=[...visibleTargets()].sort(()=>Math.random()-.5).slice(0,5),batch=new Map();
    for(const s of targets){addDamage(batch,s,alchemistDamage()*skillValue("alchemist","rain",.5,.65));addPoison(s,1);a.effects.push({x:s.x,y:s.y,radius:12,life:.35,maxLife:.35,color:"#b8ff64"});}
    if(batch.size)applyDamageBatch(batch);
  }
}
function alchemistHit(segment,hit,bullet,random=Math.random){
  const a=state.alchemist,batch=new Map();
  let damage=hit.damage*(poisonStacks(segment)?1+a.corrosive:1);
  if(bullet.mixture==="acid")damage*=1.5;
  if(bullet.mixture)damage*=skillValue("alchemist","cocktail",1,1.2);
  addDamage(batch,segment,damage);
  let stacks=a.experimentActive>0?2:1;
  if(hit.critical&&random()<a.reactiveChance)stacks++;
  addPoison(segment,stacks);
  if(bullet.mixture==="frost")segment.frostPoison=true;
  if(bullet.mixture==="plague")segment.plagueMixture=true;
  const areaMultiplier=bullet.mixture==="fire"?.5:a.explosion||(a.experimentActive>0?.25:0);
  if(areaMultiplier)alchemistArea(batch,segment,a.explosionRadius,damage*areaMultiplier,0);
  a.effects.push({x:segment.x,y:segment.y,radius:15,life:.35,maxLife:.35,color:"#7cff59"});
  applyDamageBatch(batch);
}
function spawnPoisonCloud(){
  const a=state.alchemist,targets=visibleTargets().sort((x,y)=>y.y-x.y);if(!targets.length)return;
  const target=targets[0],batch=new Map(),duration=a.cloudDuration;
  alchemistArea(batch,target,a.cloudRadius,(state.weapon.damage+1)*skillValue("alchemist","cloud",1,1.1),1);
  if(Math.random()<a.cloudExtraChance)addPoison(target,1);
  a.clouds.push({x:target.x,y:target.y,radius:a.cloudRadius,life:duration,tick:1,direct:true});
  applyDamageBatch(batch);
}
function updatePoison(dt,random=Math.random){
  const a=state.alchemist;if(!a)return;
  const batch=new Map();
  for(const segment of [...state.snake]){
    if(!segment.poisonStacks?.length)continue;
    segment.poisonAge=(segment.poisonAge||0)+dt;
    segment.poisonTick=(segment.poisonTick||0)+dt;
    segment.poisonStacks=segment.poisonStacks.map(t=>t-dt).filter(t=>t>0);
    while(segment.poisonTick>=1&&segment.poisonStacks.length){
      segment.poisonTick-=1;
      let damage=poisonDamagePerStack(segment)*segment.poisonStacks.length;
      for(let i=0;i<segment.poisonStacks.length;i++)if(random()<a.unstableChance)damage+=a.unstableDamage;
      addDamage(batch,segment,damage);
    }
    if(!segment.poisonStacks.length){segment.poisonAge=0;segment.poisonTick=0;segment.frostPoison=false;segment.plagueMixture=false;}
  }
  if(batch.size)applyDamageBatch(batch);
}
function updatePoisonClouds(dt){
  const a=state.alchemist;
  for(const cloud of a.clouds){
    cloud.life-=dt;cloud.tick-=dt;
    while(cloud.life>0&&cloud.tick<=0){
      cloud.tick+=1;
      const targets=state.snake.filter(s=>segmentInArea(s,cloud,cloud.radius));
      for(const s of targets){addPoison(s,1);if(Math.random()<a.cloudExtraChance)addPoison(s,1);}
    }
  }
  a.clouds=a.clouds.filter(c=>c.life>0);
}
function updateAlchemist(dt){
  const a=state.alchemist;if(!a)return;
  a.pulse=Math.max(0,a.pulse-dt);a.fireTimer-=dt;
  if(a.fireTimer<=0){throwAlchemistBottle();a.fireTimer+=1/(state.weapon.shotsPerSecond*.9);a.pulse=.18;}
  if(a.cloud){a.cloudRemaining=Math.max(0,a.cloudRemaining-dt);if(a.cloudRemaining===0){spawnPoisonCloud();a.cloudRemaining=a.cloudCooldown;}}
  if(a.experiment){
    if(a.experimentActive>0)a.experimentActive=Math.max(0,a.experimentActive-dt);
    else {a.experimentRemaining=Math.max(0,a.experimentRemaining-dt);if(a.experimentRemaining===0){a.experimentActive=a.experimentDuration;a.experimentRemaining=a.experimentCooldown;}}
  }
  a.plagueTimer-=dt;if(a.plagueInterval&&a.plagueTimer<=0){
    a.plagueTimer=a.plagueInterval;
    for(const source of visiblePoisoned().filter(s=>poisonStacks(s)>=poisonLimit())){const target=randomVisibleTarget(source);if(target)addPoison(target,1);}
  }
  a.livingTimer-=dt;if(a.living&&a.livingTimer<=0){
    a.livingTimer+=skillValue("alchemist","living",3,2.5);
    const sources=[...visiblePoisoned()];for(const source of sources){const target=randomVisibleTarget(source);if(target)addPoison(target,1);}
  }
  updatePoisonClouds(dt);updatePoison(dt);
  for(const e of a.effects)e.life-=dt;a.effects=a.effects.filter(e=>e.life>0);
}

function alchemistUpgradePool(){
  const a=state.alchemist;if(!a)return [];
  const pool=[],card=(id,rarity,name,text,apply)=>pool.push({id:"alchemist-"+id,rarity,name,text:"Selvara · "+skillCardText("alchemist",id,text),apply});
  for(const [i,rarity] of ["grey","green","purple"].entries()){
    const repeat=[
      ["strength","Giftstärke",skillValue("alchemist","strength",[.15,.30,.50],[.20,.35,.55]),v=>"+"+v*100+" % Giftschaden.",v=>a.poisonBonus+=v],
      ["duration","Langlebiges Gift",skillValue("alchemist","duration",[1,2,4],[2,3,5]),v=>"+"+v+" Sekunden Giftdauer.",v=>a.poisonDuration+=v],
      ["stacks","Konzentriertes Toxin",skillValue("alchemist","stacks",[1,2,3],[2,3,4]),v=>"+"+v+" maximale Giftstapel.",v=>a.maxStacks+=v],
      ["transfer","Ansteckende Mischung",skillValue("alchemist","transfer",[.15,.30,.50],[.20,.35,.55]),v=>"+"+v*100+" Prozentpunkte Giftübertragung.",v=>a.transferChance=Math.min(1,a.transferChance+v)],
      ["explosive","Explosive Mischung",skillValue("alchemist","explosive",[.20,.35,.50],[.28,.43,.58]),v=>Math.round(v*100)+" % Direktschaden als Flächenschaden.",v=>a.explosion+=v],
      ["bottles","Größere Flaschen",skillValue("alchemist","bottles",[.15,.30,.50],[.20,.35,.55]),v=>"+"+v*100+" % Explosionsradius.",v=>a.explosionRadius*=1+v],
      ["corrosive","Ätzendes Gift",skillValue("alchemist","corrosive",[.05,.10,.20],[.10,.15,.25]),v=>"+"+v*100+" % Direktschaden gegen vergiftete Segmente.",v=>a.corrosive+=v],
      ["cloudPower","Verdorbene Wolke",skillValue("alchemist","cloudPower",[[.20,0],[.35,1],[.50,2]],[[.30,0],[.45,1],[.60,2]]),v=>"+"+v[0]*100+" % Wolkenradius"+(v[1]?" und +"+v[1]+" s Dauer.":"."),v=>{a.cloudRadius*=1+v[0];a.cloudDuration+=v[1];}],
      ["cloudStacks","Hochkonzentrierte Wolke",skillValue("alchemist","cloudStacks",[.20,.40,.70],[.30,.50,.80]),v=>v*100+" % Chance auf einen zweiten Giftstapel.",v=>a.cloudExtraChance=Math.min(1,a.cloudExtraChance+v)],
      ["mixer","Schnellmischer",skillValue("alchemist","mixer",[2,4,6],[3,5,7]),v=>"−"+v+" Sekunden Giftwolken-Cooldown.",v=>a.cloudCooldown=Math.max(3,a.cloudCooldown-v)],
      ["overdose","Überdosierung",skillValue("alchemist","overdose",[.15,.30,.50],[.20,.35,.55]),v=>"+"+v*100+" % Giftschaden bei maximalen Stapeln.",v=>a.overdose+=v],
      ["experimentTime","Meisterexperiment verbessern",skillValue("alchemist","experimentTime",[1,2,3],[2,3,4]),v=>"+"+v+" Sekunde(n) Dauer.",v=>a.experimentDuration+=v],
      ["toxicologist","Meistertoxikologe",skillValue("alchemist","toxicologist",[.15,.30,.50],[.20,.35,.55]),v=>"Während Meisterexperiment +"+v*100+" % Giftschaden.",v=>a.experimentPoisonBonus+=v]
    ];
    for(const [id,name,values,label,apply] of repeat){const v=values[i];card(id+"-"+rarity,rarity,name,label(v),()=>apply(v));}
    const highest=[
      ["inheritance","Giftige Erbschaft",skillValue("alchemist","inheritance",[2,3,4],[3,4,5]),"Überträgt bis zu ",v=>a.transferStacks=Math.max(a.transferStacks,v)],
      ["nerve","Nervengift",skillValue("alchemist","nerve",[.05,.10,.20],[.075,.125,.25]),"Vergiftete Segmente verlangsamen die Schlange um ",v=>a.slow=Math.max(a.slow,v)],
      ["chain","Toxische Kettenreaktion",skillValue("alchemist","chain",[.20,.40,.70],[.30,.50,.80]),"Chance auf eine kleine Giftwolke: ",v=>a.chainChance=Math.max(a.chainChance,v)],
      ["unstable","Instabile Formel",skillValue("alchemist","unstable",[[.05,.20],[.10,.30],[.15,.50]],[[.05,.24],[.10,.36],[.15,.60]]),"Gift-Ticks erhalten Schadensspitzen: ",v=>{a.unstableChance=v[0];a.unstableDamage=v[1];}],
      ["focus","Seuchenherd",skillValue("alchemist","focus",[5,4,3],[4.5,3.5,2.5]),"Maximal vergiftete Segmente verbreiten Gift alle ",v=>{a.plagueInterval=v;a.plagueTimer=v;}]
    ];
    for(const [id,name,values,prefix,apply] of highest){if((a.tiers[id]??-1)<i){const v=values[i],label=Array.isArray(v)?Math.round(v[0]*100)+" % / +"+v[1]+" Schaden":id==="nerve"?v*100+" %":id==="chain"?v*100+" %":id==="focus"?v+" s":v+" Stapel";card(id+"-"+rarity,rarity,name,prefix+label+".",()=>{apply(v);a.tiers[id]=i;});}}
    const once=[["reactive","Reaktive Substanz",skillValue("alchemist","reactive",[.25,.50,1],[.35,.60,1])],["epidemic","Epidemie",[null,null,.30]],["mutation","Mutation",[null,null,true]]];
    for(const [id,name,values] of once){const v=values[i];if(v!=null&&!a.taken[id+rarity])card(id+"-"+rarity,rarity,name,id==="reactive"?v*100+" % Chance auf einen zusätzlichen Giftstapel bei Krit.":id==="epidemic"?"30 % Chance, den vollständigen Giftstatus auf ein zufälliges sichtbares Segment zu übertragen.":"Nach 4 Sekunden durchgehender Vergiftung verursacht Gift 50 % mehr Schaden.",()=>{if(id==="reactive")a.reactiveChance=Math.min(1,a.reactiveChance+v);else a[id]=true;a.taken[id+rarity]=true;});}
  }
  if(!a.cloud)card("cloud","orange","Giftwolke","Alle 18 Sekunden: 1,0 Basisschaden plus Waffenschaden, Gift und eine 4 Sekunden anhaltende Wolke.",()=>{a.cloud=true;a.cloudCooldown=skillValue("alchemist","cloud",18,16);a.cloudRemaining=a.cloudCooldown;});
  if(!a.experiment)card("experiment","orange","Meisterexperiment","Alle 30 Sekunden für 6 Sekunden: 2 Giftstapel, +2 Stapellimit, +50 % Gift und kleine Explosionen.",()=>{a.experiment=true;a.experimentDuration=skillValue("alchemist","experiment",6,8);a.experimentRemaining=a.experimentCooldown;});
  if(!a.cocktail)card("cocktail","purple","Giftcocktail","Jeder 5. Wurf nutzt zufällig Feuer-, Frost-, Säure- oder Seuchengift.",()=>a.cocktail=true);
  if(!a.rain)card("rain","orange","Giftregen","Jeder 10. Wurf trifft bis zu 5 verschiedene sichtbare Segmente mit 50 % Direktschaden und einem Giftstapel.",()=>a.rain=true);
  if(!a.living)card("living","orange","Lebende Seuche","Alle 3 Sekunden verbreitet jedes vergiftete sichtbare Segment einen Giftstapel auf ein anderes sichtbares Segment.",()=>{a.living=true;a.livingTimer=skillValue("alchemist","living",3,2.5);});
  return pool;
}

function renderAlchemistProfile(){
  const p=progress.data,b=document.querySelector("#unlockAlchemist"),cost=progress.heroCost();
  b.disabled=p.alchemistUnlocked||p.coins<cost;b.textContent=p.alchemistUnlocked?"Selvara freigeschaltet":"Selvara freischalten · "+cost+" Münzen";
  for(const side of ["left","right"]){const button=document.querySelector("#equipAlchemist"+side);button.disabled=!p.alchemistUnlocked;button.textContent=(side==="left"?"Links":"Rechts")+(p.alchemistSlot===side?" · Aktiv":" einsetzen");if(p.alchemistSlot===side)document.querySelector("#heroSlot"+side).innerHTML='<img src="selvara-front.png" alt="Selvara"><strong>Selvara</strong><small>Seuchenfläschchen · Aktiv</small>';}
  document.querySelector("#unequipAlchemist").disabled=!p.alchemistSlot;
}
function bindAlchemistMenu(){
  document.querySelector("#unlockAlchemist").addEventListener("click",()=>{if(state.mode!=="start")return;const ok=progress.unlockHero("alchemist");renderProfile();document.querySelector("#heroStatus").textContent=ok?"Selvara freigeschaltet. Wähle links oder rechts.":progress.message;});
  for(const side of ["left","right",null])document.querySelector(side?"#equipAlchemist"+side:"#unequipAlchemist").addEventListener("click",()=>{if(state.mode!=="start")return;progress.equipHero("alchemist",side);renderProfile();});
}
function alchemistSlow(){
  const a=state.alchemist;if(!a)return 0;
  const poisoned=state.snake.filter(s=>isSegmentVisible(s)&&poisonStacks(s)>0);
  return poisoned.length?Math.max(a.slow,poisoned.some(s=>s.frostPoison)?.10:0):0;
}
function drawAlchemist(){
  const a=state.alchemist;if(!a)return;
  for(const cloud of a.clouds){ctx.save();ctx.globalAlpha=Math.min(.35,cloud.life*.18);ctx.fillStyle="#62d93d";ctx.shadowColor="#a6ff5f";ctx.shadowBlur=16;ctx.beginPath();ctx.arc(cloud.x,cloud.y,cloud.radius,0,Math.PI*2);ctx.fill();ctx.restore();}
  for(const segment of state.snake)if(poisonStacks(segment)&&isSegmentVisible(segment)){ctx.save();ctx.strokeStyle=segment.poisonAge>=skillValue("alchemist","mutation",4,3)&&a.mutation?"#eaff58":"#67e84b";ctx.lineWidth=2;ctx.beginPath();ctx.arc(segment.x,segment.y,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#baff76";ctx.font="bold 10px system-ui";ctx.textAlign="center";ctx.fillText(poisonStacks(segment),segment.x+13,segment.y-10);ctx.restore();}
  for(const e of a.effects){const t=Math.max(0,e.life/e.maxLife);ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(1.4-t*.4),0,Math.PI*2);ctx.stroke();ctx.restore();}
  const x=alchemistX(),y=state.player.y;ctx.save();if(alchemistSprite.complete&&alchemistSprite.naturalWidth)ctx.drawImage(alchemistSprite,x-20,y-15,40,56);else{ctx.fillStyle="#e9dec4";ctx.fillRect(x-8,y,16,27);ctx.fillStyle="#31b884";ctx.fillRect(x-14,y+25,28,16);}ctx.restore();
}
