"use strict";

function newRunemaster(slot) {
  return slot ? {
    slot, fireTimer:0, pulse:0, shots:0, breakCount:0,
    chargeGoal:5, breakDamage:2, breakBonus:0, neighborDamage:.75, radius:52.5, radiusBonus:0,
    restChance:.40, echoChance:0, runeSpark:0, precision:0, overload:0,
    splitterCount:0, splitterDamage:0, strikeCooldown:20, strikeRemaining:20,
    strikeCharges:3, strikeBonus:0, doubleChance:0, unstableChance:0, unstableDamage:0,
    chainChance:0, resonanceBonus:0, masteryFifthBonus:0,
    endless:false, storm:false, mirror:false, perfect:false, mastery:false, domino:false,
    ultimate:false, ultimateCharges:2, ultimateRate:.25, ultimateDuration:5,
    ultimateCooldown:skillValue("runemaster","circleAttack",30,25), ultimateRemaining:skillValue("runemaster","circleAttack",30,25), ultimateDamageBonus:0, rateBuff:0,
    taken:{}, tiers:{}, effects:[]
  } : null;
}

function runemasterX() { return state.player.x+(state.runemaster.slot==="left"?-36:36); }
function runeCharges(segment) { return segment.runeCharges||0; }
function runemasterDamage(segment=null) {
  const r=state.runemaster;
  let damage=state.weapon.damage*skillValue("runemaster","attack",1,1.2);
  if(segment&&runeCharges(segment)>0)damage*=1+r.precision;
  return damage;
}
function runemasterRateMultiplier(){
  const r=state.runemaster;if(!r)return 0;
  const marked=visibleTargets().filter(s=>runeCharges(s)>0).length;
  const resonance=marked>=3?r.resonanceBonus:0;
  return .95*(1+resonance+(r.rateBuff>0?r.ultimateRate:0));
}
function runemasterTarget(preferredId=null){
  const visible=visibleTargets();
  return visible.find(s=>s.id===preferredId)||visible[0]||null;
}
function runemasterHitRoll(segment,bullet,random=Math.random){
  const critical=random()*100<(state.weapon.critChance||0);
  let damage=runemasterDamage(segment)*(critical?state.weapon.critDamage/100:1);
  if(bullet.runeStrike)damage*=1.5*(1+state.runemaster.strikeBonus);
  if(runeCharges(segment)===state.runemaster.chargeGoal-1)damage*=1+state.runemaster.overload;
  return {critical,damage};
}
function randomRuneTarget(exclude=null,random=Math.random){
  const targets=visibleTargets().filter(s=>s!==exclude);
  return targets.length?targets[Math.min(targets.length-1,Math.floor(random()*targets.length))]:null;
}
function runeEffect(kind,segment,color="#58bfff",radius=20){
  state.runemaster?.effects.push({kind,x:segment.x,y:segment.y,color,radius,life:.55,maxLife:.55});
}
function runeNeighbors(segment){
  const index=state.snake.indexOf(segment);
  return [state.snake[index-1],state.snake[index+1]].filter(s=>s&&isSegmentVisible(s)&&s.hp>0);
}
function triggerRuneBreak(batch,segment,options={},random=Math.random){
  const r=state.runemaster;
  if(!r||!state.snake.includes(segment)||!isSegmentVisible(segment))return;
  const charges=segment.runeCharges||r.chargeGoal;
  segment.runeCharges=r.endless?skillValue("runemaster","endless",1,2):0;
  let main=r.breakDamage*skillValue("runemaster","break",1,1.2)*(1+r.breakBonus+(options.ultimate?r.ultimateDamageBonus:0));
  if(options.mirrored)main*=skillValue("runemaster","mirror",1,1.2);
  if(r.masteryFifthBonus)main*=1+r.masteryFifthBonus;
  addDamage(batch,segment,main);segment.runeKilled=true;
  for(const other of state.snake)if(other!==segment&&segmentInArea(other,segment,r.radius*(1+r.radiusBonus))){
    addDamage(batch,other,r.neighborDamage*skillValue("runemaster","break",1,1.2));other.runeKilled=true;
  }
  runeEffect("break",segment,"#62c8ff",r.radius*(1+r.radiusBonus));
  r.breakCount++;

  if(r.echoChance&&random()<r.echoChance){const target=runeNeighbors(segment)[0]||randomRuneTarget(segment,random);if(target)addRuneCharges(batch,target,1,{echo:true},random);}
  if(r.splitterCount)for(let i=0;i<r.splitterCount;i++){const target=randomRuneTarget(segment,random);if(target){addDamage(batch,target,r.splitterDamage);runeEffect("splitter",target,"#9be7ff",10);}}
  if(r.unstableChance&&random()<r.unstableChance){
    const extra=main*r.unstableDamage;
    for(const target of state.snake)if(segmentInArea(target,segment,r.radius*(1+r.radiusBonus)))addDamage(batch,target,extra);
    runeEffect("break",segment,"#b48cff",r.radius*(1+r.radiusBonus)*.8);
  }
  if(r.chainChance){
    const candidates=runeNeighbors(segment).filter(s=>runeCharges(s)>=3);
    if(candidates.length&&random()<r.chainChance)addRuneCharges(batch,candidates[0],r.chargeGoal,{chain:true},random);
  }
  if(r.mirror&&!options.mirrored){
    const target=randomRuneTarget(segment,random);
    if(target)addRuneCharges(batch,target,charges,{mirrored:true},random);
  }
  if(r.storm&&r.breakCount%5===0){
    const targets=visibleTargets();
    const count=skillValue("runemaster","storm",8,10);
    for(let i=0;i<count&&targets.length;i++){
      const target=targets[Math.floor(random()*targets.length)];
      addDamage(batch,target,runemasterDamage(target));runeEffect("rain",target,"#70d7ff",14);
    }
  }
}
function addRuneCharges(batch,segment,count,options={},random=Math.random){
  const r=state.runemaster;
  if(!r||!segment||!isSegmentVisible(segment)||segment.hp<=0)return 0;
  const before=runeCharges(segment);
  segment.runeCharges=Math.min(r.chargeGoal,before+count);
  runeEffect("charge",segment,"#58bfff",13);
  if(segment.runeCharges>=r.chargeGoal)triggerRuneBreak(batch,segment,options,random);
  return segment.runeCharges-before;
}
function runemasterHit(segment,hit,bullet,random=Math.random){
  const r=state.runemaster,batch=new Map();
  addDamage(batch,segment,hit.damage);
  let charges=bullet.perfect?r.chargeGoal:bullet.runeStrike?r.strikeCharges:1;
  if(!bullet.perfect&&!bullet.runeStrike&&random()<r.doubleChance)charges++;
  if(hit.critical&&random()<r.runeSpark)charges++;
  addRuneCharges(batch,segment,charges,{},random);
  applyDamageBatch(batch);
}
function resolveRunemasterDeath(segment,neighbors,random=Math.random){
  const r=state.runemaster;if(!r)return;
  if(runeCharges(segment)>0&&random()<r.restChance){
    const targets=neighbors.filter(s=>s&&isSegmentVisible(s)&&s.hp>0);
    const target=targets[Math.floor(random()*targets.length)]||randomRuneTarget(segment,random);
    if(target){const batch=new Map();addRuneCharges(batch,target,1,{rest:true},random);if(batch.size)applyDamageBatch(batch);}
  }
  if(r.domino&&segment.runeKilled){
    const targets=visibleTargets().filter(s=>s!==segment);
    const max=Math.max(-1,...targets.map(runeCharges));
    const strongest=targets.filter(s=>runeCharges(s)===max);
    const target=strongest[Math.floor(random()*strongest.length)];
    if(target){const batch=new Map();addRuneCharges(batch,target,1,{domino:true},random);if(batch.size)applyDamageBatch(batch);}
  }
}
function fireRuneProjectile(){
  const r=state.runemaster,target=runemasterTarget();if(!r||!target)return;
  r.shots++;
  const runeStrike=r.strikeRemaining<=0;
  if(runeStrike)r.strikeRemaining=r.strikeCooldown;
  const perfect=r.perfect&&!runeStrike&&r.shots%skillValue("runemaster","perfect",10,8)===0;
  state.bullets.push({owner:"runemaster",x:runemasterX(),y:state.player.y+PLATFORM_SHOT_Y,
    vx:0,vy:-510,hitsLeft:1,dead:false,targetId:target.id,runeStrike,perfect});
  r.pulse=.18;
}
function activateRuneCircle(random=Math.random){
  const r=state.runemaster,batch=new Map();
  for(const segment of [...visibleTargets()])addRuneCharges(batch,segment,r.ultimateCharges,{ultimate:true},random);
  r.rateBuff=r.ultimateDuration;r.ultimateRemaining=r.ultimateCooldown;
  r.effects.push({kind:"circle",x:state.width/2,y:state.height/2,color:"#75d4ff",radius:Math.min(state.width,state.height)*.42,life:1,maxLife:1});
  if(batch.size)applyDamageBatch(batch);
}
function updateRunemaster(dt){
  const r=state.runemaster;if(!r)return;
  r.pulse=Math.max(0,r.pulse-dt);r.fireTimer-=dt;r.strikeRemaining=Math.max(0,r.strikeRemaining-dt);r.rateBuff=Math.max(0,r.rateBuff-dt);
  if(r.fireTimer<=0){fireRuneProjectile();r.fireTimer+=1/(state.weapon.shotsPerSecond*runemasterRateMultiplier());}
  if(r.ultimate){r.ultimateRemaining=Math.max(0,r.ultimateRemaining-dt);if(r.ultimateRemaining===0&&visibleTargets().length)activateRuneCircle();}
  for(const e of r.effects)e.life-=dt;r.effects=r.effects.filter(e=>e.life>0);
}

function runemasterUpgradePool(){
  const r=state.runemaster;if(!r)return [];
  const pool=[],card=(id,rarity,name,text,apply)=>pool.push({id:"runemaster-"+id,rarity,name,text:"Kaelvar · "+skillCardText("runemaster",id,text),apply});
  const rarities=["grey","green","purple"];
  const additive=[
    ["power","Runenmacht",skillValue("runemaster","power",[.15,.30,.50],[.25,.40,.60]),v=>`+${v*100} % Runenbruch-Schaden.`,v=>r.breakBonus+=v],
    ["glyph","Größere Glyphe",skillValue("runemaster","glyph",[.15,.30,.50],[.25,.40,.60]),v=>`+${v*100} % Wirkungsradius.`,v=>r.radiusBonus+=v],
    ["precision","Arkane Präzision",skillValue("runemaster","precision",[.05,.10,.20],[.10,.15,.25]),v=>`+${v*100} % Direktschaden gegen geladene Segmente.`,v=>r.precision+=v],
    ["overload","Überladene Rune",skillValue("runemaster","overload",[.20,.40,.70],[.30,.50,.80]),v=>`+${v*100} % Schaden beim vollendenden Treffer.`,v=>r.overload+=v],
    ["circleDamage","Kreis der Zerstörung",skillValue("runemaster","circleDamage",[.15,.30,.50],[.25,.40,.60]),v=>`+${v*100} % Schaden für Runenbrüche der Ultimate.`,v=>r.ultimateDamageBonus+=v]
  ];
  for(const [id,name,values,label,apply] of additive)for(let i=0;i<3;i++)if(!r.taken[id+rarities[i]])card(id+"-"+rarities[i],rarities[i],name,label(values[i]),()=>{apply(values[i]);r.taken[id+rarities[i]]=true;});
  const highest=[
    ["wave","Runenwelle",skillValue("runemaster","wave",[1,1.25,1.6],[1.2,1.5,1.92]),v=>`${v} Schaden im Runenbruch-Radius.`,v=>r.neighborDamage=v],
    ["rest","Runenrest",skillValue("runemaster","rest",[.55,.70,1],[.65,.80,1]),v=>`${v*100} % Chance, eine Ladung weiterzugeben.`,v=>r.restChance=v],
    ["echo","Nachhall",skillValue("runemaster","echo",[.20,.40,.70],[.30,.50,.80]),v=>`${v*100} % Chance auf eine Ladung am Nachbarsegment.`,v=>r.echoChance=v],
    ["spark","Runenfunke",skillValue("runemaster","spark",[.25,.50,1],[.35,.60,1]),v=>`${v*100} % Krit-Chance auf eine zusätzliche Runenladung.`,v=>r.runeSpark=v],
    ["splitter","Runensplitter",skillValue("runemaster","splitter",[[1,.35],[2,.40],[3,.50]],[[1,.42],[2,.48],[3,.60]]),v=>`${v[0]} Splitter mit je ${v[1]} Schaden.`,v=>{r.splitterCount=v[0];r.splitterDamage=v[1];}],
    ["quick","Schnellgravur",skillValue("runemaster","quick",[18,16,13],[16.2,14.4,11.7]),v=>`Runenschlag alle ${v} Sekunden.`,v=>{r.strikeCooldown=v;r.strikeRemaining=Math.min(r.strikeRemaining,v);}],
    ["strike","Verstärkter Runenschlag",skillValue("runemaster","strike",[[3,.20],[4,.30],[5,.50]],[[3,.30],[4,.40],[5,.60]]),v=>`${v[0]} Ladungen und +${v[1]*100} % Schaden.`,v=>{r.strikeCharges=v[0];r.strikeBonus=v[1];}],
    ["double","Runendoppelung",skillValue("runemaster","double",[.10,.20,.35],[.20,.30,.45]),v=>`${v*100} % Chance auf zwei Ladungen.`,v=>r.doubleChance=v],
    ["unstable","Instabile Schrift",skillValue("runemaster","unstable",[[.15,.50],[.25,.60],[.40,.75]],[[.15,.60],[.25,.72],[.40,.90]]),v=>`${v[0]*100} % Chance auf eine zweite Explosion mit ${v[1]*100} % Schaden.`,v=>{r.unstableChance=v[0];r.unstableDamage=v[1];}],
    ["chain","Runenkette",skillValue("runemaster","chain",[.15,.30,.50],[.25,.40,.60]),v=>`${v*100} % Chance, eine Nachbarrune ab 3 Ladungen zu aktivieren.`,v=>r.chainChance=v],
    ["resonance","Runenresonanz",skillValue("runemaster","resonance",[.08,.15,.25],[.13,.20,.30]),v=>`Ab 3 markierten Segmenten +${v*100} % Feuerrate.`,v=>r.resonanceBonus=v],
    ["ritual","Beschleunigtes Ritual",skillValue("runemaster","ritual",[27,24,20],[24.3,21.6,18]),v=>`Ultimate-Cooldown ${v} Sekunden.`,v=>{r.ultimateCooldown=v;r.ultimateRemaining=Math.min(r.ultimateRemaining,v);}]
  ];
  for(const [id,name,values,label,apply] of highest)for(let i=0;i<3;i++)if((r.tiers[id]??-1)<i){const v=values[i];card(id+"-"+rarities[i],rarities[i],name,label(v),()=>{apply(v);r.tiers[id]=i;});}
  for(let i=0;i<3;i++)if((r.tiers.master??-1)<i){const texts=["5 Ladungen; der fünfte Treffer verursacht +20 % Schaden.","Nur noch 4 Ladungen benötigt.","4 Ladungen und +20 % Runenbruch-Schaden."];card("master-"+rarities[i],rarities[i],"Meisterglyphen",texts[i],()=>{r.chargeGoal=i?4:5;r.masteryFifthBonus=i===0?.20:i===2?.20:0;r.tiers.master=i;});}
  if(r.ultimate)for(let i=0;i<3;i++)if((r.tiers.circle??-1)<i){const values=skillValue("runemaster","circle",[[2,.30,5],[3,.30,6],[3,.40,8]],[[2,.40,5],[3,.40,6],[3,.50,8]])[i];card("circle-"+rarities[i],rarities[i],"Großer Runenkreis",`+${values[0]} Ladungen und +${values[1]*100} % Feuerrate für ${values[2]} Sekunden.`,()=>{[r.ultimateCharges,r.ultimateRate,r.ultimateDuration]=values;r.tiers.circle=i;});}
  if(!r.endless)card("endless","purple","Endlose Rune","Nach Runenbruch bleibt 1 Runenladung bestehen.",()=>r.endless=true);
  if(!r.mastery)card("mastery","purple","Runenmeisterschaft","+2 % Gesamtschaden je sichtbarem markiertem Segment, maximal +30 %.",()=>r.mastery=true);
  if(!r.domino)card("domino","purple","Domino-Glyphe","Tötet Runenbruch ein Segment, erhält die stärkste sichtbare Rune +1 Ladung.",()=>r.domino=true);
  if(!r.storm)card("storm","orange","Runensturm","Nach 5 Runenbrüchen treffen 8 Runengeschosse zufällige sichtbare Segmente.",()=>r.storm=true);
  if(!r.mirror)card("mirror","orange","Spiegelglyphe","Runenbruch überträgt seine verbrauchten Ladungen auf ein anderes sichtbares Segment.",()=>r.mirror=true);
  if(!r.perfect)card("perfect","orange","Perfekte Schrift","Jeder 10. normale Schuss vollendet sofort eine Rune.",()=>r.perfect=true);
  if(!r.ultimate)card("ultimate","orange","Großer Runenkreis freischalten","Alle 30 Sekunden erhalten alle sichtbaren Segmente +2 Runenladungen; danach 5 Sekunden +25 % Feuerrate.",()=>{r.ultimate=true;r.ultimateRemaining=r.ultimateCooldown;});
  return pool;
}

function renderRunemasterProfile(){
  const p=progress.data,b=document.querySelector("#unlockRunemaster"),cost=progress.heroCost();
  b.disabled=p.runemasterUnlocked||p.coins<cost;b.textContent=p.runemasterUnlocked?"Kaelvar freigeschaltet":"Kaelvar freischalten · "+cost+" Münzen";
  for(const side of ["left","right"]){const button=document.querySelector("#equipRunemaster"+side);button.disabled=!p.runemasterUnlocked;button.textContent=(side==="left"?"Links":"Rechts")+(p.runemasterSlot===side?" · Aktiv":" einsetzen");if(p.runemasterSlot===side)document.querySelector("#heroSlot"+side).innerHTML='<img src="kaelvar-front.png" alt="Kaelvar"><strong>Kaelvar</strong><small>Runenkanone · Aktiv</small>';}
  document.querySelector("#unequipRunemaster").disabled=!p.runemasterSlot;
}
function bindRunemasterMenu(){
  document.querySelector("#unlockRunemaster").addEventListener("click",()=>{if(state.mode!=="start")return;const ok=progress.unlockHero("runemaster");renderProfile();document.querySelector("#heroStatus").textContent=ok?"Kaelvar freigeschaltet. Wähle links oder rechts.":progress.message;});
  for(const side of ["left","right",null])document.querySelector(side?"#equipRunemaster"+side:"#unequipRunemaster").addEventListener("click",()=>{if(state.mode!=="start")return;progress.equipHero("runemaster",side);renderProfile();});
}
function drawRunemaster(){
  const r=state.runemaster;if(!r)return;
  for(const segment of state.snake)if(runeCharges(segment)&&isSegmentVisible(segment)){
    const ratio=runeCharges(segment)/r.chargeGoal;ctx.save();ctx.strokeStyle="#58c8ff";ctx.shadowColor="#2e9dff";ctx.shadowBlur=8;ctx.lineWidth=2;ctx.beginPath();ctx.arc(segment.x,segment.y,19,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);ctx.stroke();ctx.fillStyle="#c7f2ff";ctx.font="bold 9px system-ui";ctx.textAlign="center";ctx.fillText(runeCharges(segment)+"/"+r.chargeGoal,segment.x,segment.y+3);ctx.restore();
  }
  for(const e of r.effects){const t=Math.max(0,e.life/e.maxLife);ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=12;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(1,e.radius*(1.2-t*.2)),0,Math.PI*2);ctx.stroke();if(e.kind==="rain"){ctx.beginPath();ctx.moveTo(e.x,e.y-55*t);ctx.lineTo(e.x,e.y);ctx.stroke();}ctx.restore();}
  const x=runemasterX(),y=state.player.y,lift=r.pulse>0?Math.sin(r.pulse/.18*Math.PI)*2:0;ctx.save();if(runemasterSprite.complete&&runemasterSprite.naturalWidth)ctx.drawImage(runemasterSprite,x-20,y-15-lift,40,56);else{ctx.fillStyle="#173f78";ctx.fillRect(x-14,y+24,28,16);ctx.fillStyle="#57bcff";ctx.fillRect(x-8,y,16,28);}ctx.restore();
}
