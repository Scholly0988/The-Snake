"use strict";

function newShooter() {
  return {
    projectileSpeed:0, projectileSize:0, precisionDamage:0, armorDamage:0,
    criticalSalvo:0, quickHands:0, quickHandsRemaining:0,
    heavyDamage:0, heavySpeed:0, lightRate:0, lightDamage:0,
    lastPierceDamage:0, splitterChance:0, splitterDamage:.35,
    doubleChance:0, focusDamage:0, sustainedRate:0, sustainedRemaining:0,
    fullHitDamage:0, triple:false, rain:false, perfect:false,
    unstoppable:false, overload:false, chain:false, salvoMaster:false,
    precisionMode:false, precisionStill:0, precisionActive:false,
    bulletStorm:false, stormRemaining:skillValue("shooter","bulletStorm",25,22), stormActive:0,
    marksman:false, shotSequences:0, rainProjectiles:0, perfectHits:0,
    overloadShots:0, effects:[], taken:{}, tiers:{}
  };
}

function shooterDamageMultiplier() {
  const s=state.shooter;if(!s)return 1;
  return Math.max(.5,1+s.heavyDamage-s.lightDamage)*(s.precisionActive?skillValue("shooter","precisionMode",1.25,1.30):1);
}
function shooterRateMultiplier() {
  const s=state.shooter;if(!s)return 1;
  return 1+s.lightRate+(s.quickHandsRemaining>0?s.quickHands:0)+
    (s.sustainedRemaining>0?s.sustainedRate:0)+(s.stormActive>0?.5:0);
}
function shooterProjectileSpeedMultiplier() {
  const s=state.shooter;if(!s)return 1;
  return Math.max(.4,1+s.projectileSpeed-s.heavySpeed);
}
function shooterCritChance() {
  return Math.min(100,(state.weapon.critChance||0)+(state.shooter?.precisionActive?skillValue("shooter","precisionMode",10,12):0));
}

function updateShooter(dt,moved=false) {
  const s=state.shooter;if(!s)return;
  s.quickHandsRemaining=Math.max(0,s.quickHandsRemaining-dt);
  s.sustainedRemaining=Math.max(0,s.sustainedRemaining-dt);
  if(s.precisionMode){
    const stillTime=skillValue("shooter","precisionMode",2,1.5);
    if(moved){s.precisionStill=0;s.precisionActive=false;}
    else {s.precisionStill=Math.min(stillTime,s.precisionStill+dt);s.precisionActive=s.precisionStill>=stillTime;}
  }
  if(s.bulletStorm){
    if(s.stormActive>0){s.stormActive=Math.max(0,s.stormActive-dt);if(s.stormActive===0)s.stormRemaining=skillValue("shooter","bulletStorm",25,22);}
    else {s.stormRemaining=Math.max(0,s.stormRemaining-dt);if(s.stormRemaining===0)s.stormActive=skillValue("shooter","bulletStorm",5,6);}
  }
  for(const effect of s.effects)effect.life-=dt;
  s.effects=s.effects.filter(effect=>effect.life>0);
}

function shooterBulletCount(){return state.weapon.bullets+(state.shooter?.stormActive>0?1:0);}
function shooterShotGeometry(count,index) {
  const spread=state.weapon.spread||(count>state.weapon.bullets?18:0);
  const offset=(index-(count-1)/2)*spread,spacing=count>1?Math.min(10,(state.width-12)/(count-1)):0;
  const halfWidth=(count-1)*spacing/2,center=Math.max(6+halfWidth,Math.min(state.width-6-halfWidth,state.player.x));
  return {x:state.weapon.parallel?center+(index-(count-1)/2)*spacing:state.player.x,vx:state.weapon.parallel?0:offset*3};
}
function spawnShooterBullet(options={}) {
  const speed=510*shooterProjectileSpeedMultiplier()*(state.weapon.parallel?skillValue("shooter","parallel",1,1.2):1);
  const bullet={owner:"shooter",x:options.x??state.player.x,y:options.y??state.player.y+PLATFORM_SHOT_Y,
    vx:options.vx??0,vy:options.vy??-speed,hitsLeft:(options.pierce??state.weapon.pierce+(state.shooter?.stormActive>0?1:0))+1,
    hitsDone:0,dead:false,size:(1+(state.shooter?.projectileSize||0))*(options.overloaded?2:1),
    damageMultiplier:options.damageMultiplier??1,...options};
  state.bullets.push(bullet);
  if(options.countForRain!==false&&!options.rain&&!options.derived)countShooterProjectile();
  return bullet;
}
function spawnHomingShooterBullet(target,options={}) {
  if(!target)return null;
  return spawnShooterBullet({x:options.x??state.player.x,y:options.y??state.player.y+PLATFORM_SHOT_Y,
    vx:0,vy:0,targetId:target.id,shooterHoming:true,...options});
}
function countShooterProjectile() {
  const s=state.shooter;if(!s?.rain)return;
  if(++s.rainProjectiles<skillValue("shooter","rain",20,18))return;s.rainProjectiles=0;
  for(let i=0;i<3;i++){const target=nearestSnakeTarget(state.player.x,state.player.y+PLATFORM_SHOT_Y);
    if(target)spawnHomingShooterBullet(target,{rain:true,countForRain:false,damageMultiplier:3,x:Math.max(12,Math.min(state.width-12,state.player.x+(i-1)*18))});}
}

function fireShooterWeapon(random=Math.random) {
  const s=state.shooter||(state.shooter=newShooter());s.shotSequences++;
  if(s.sustainedRate&&s.shotSequences%10===0)s.sustainedRemaining=2;
  let overloaded=false;if(s.overload&&++s.overloadShots>skillValue("shooter","overload",15,12)){s.overloadShots=0;overloaded=true;}
  const overloadMultiplier=overloaded?skillValue("shooter","overload",2,2.25):1;
  const salvoMultiplier=s.salvoMaster?skillValue("shooter","salvoMaster",1.3,1.4):1;
  const baseCount=shooterBulletCount(),triple=s.triple&&s.shotSequences%skillValue("shooter","triple",8,7)===0,salvo=baseCount>1||triple;
  for(let i=0;i<baseCount;i++){const geometry=shooterShotGeometry(baseCount,i);spawnShooterBullet({...geometry,overloaded,salvo,damageMultiplier:overloadMultiplier*(salvo?salvoMultiplier:1)});}
  if(triple)for(let i=0;i<3;i++){const geometry=shooterShotGeometry(3,i);spawnShooterBullet({...geometry,overloaded,salvo:true,damageMultiplier:overloadMultiplier*salvoMultiplier});}
  if(s.doubleChance&&random()<s.doubleChance){const target=nearestSnakeTarget(state.player.x,state.player.y+PLATFORM_SHOT_Y);if(target)spawnHomingShooterBullet(target,{doubleShot:true});}
}

function shooterContactDistance(bullet,target) {
  const ax=bullet.previousX??bullet.x,ay=bullet.previousY??bullet.y,dx=bullet.x-ax,dy=bullet.y-ay;
  const t=dx*dx+dy*dy?Math.max(0,Math.min(1,((target.x-ax)*dx+(target.y-ay)*dy)/(dx*dx+dy*dy))):0;
  return Math.hypot(target.x-ax-t*dx,target.y-ay-t*dy);
}
function shooterHitRoll(segment,bullet,random=Math.random) {
  const s=state.shooter,counts=bullet.countsAsHit!==false;let perfect=false,marksman=false;
  if(counts){if(s.perfect&&++s.perfectHits%skillValue("shooter","perfect",10,8)===0)perfect=true;segment.shooterFocusHits=(segment.shooterFocusHits||0)+1;segment.shooterMarksmanHits=(segment.shooterMarksmanHits||0)+1;if(s.marksman&&segment.shooterMarksmanHits>=skillValue("shooter","marksman",5,4)){segment.shooterMarksmanHits=0;marksman=true;}}
  const critical=perfect||marksman||random()*100<shooterCritChance();
  let damage=state.weapon.damage*skillValue("shooter","attack",1,1.2)*shooterDamageMultiplier()*(bullet.damageMultiplier||1);
  const precise=s.precisionDamage&&shooterContactDistance(bullet,segment)<=SEGMENT_HIT_RADIUS*.4;if(precise)damage*=1+s.precisionDamage;
  if((segment.shooterFocusHits||0)>3)damage*=1+s.focusDamage;
  if((bullet.hitsDone||0)>=1)damage*=1+s.armorDamage;
  if(s.unstoppable&&(bullet.hitsDone||0)>=2)damage*=1+skillValue("shooter","unstoppable",.5,.75);
  if(s.lastPierceDamage&&(bullet.hitsDone||0)>=1&&bullet.hitsLeft===1)damage*=1+s.lastPierceDamage;
  if(marksman)damage*=skillValue("shooter","marksman",2,2.25);if(critical)damage*=(state.weapon.critDamage/100)+s.fullHitDamage;
  return {critical,damage,precise,perfect,marksman};
}
function shooterSecondaryTarget(segment,random=Math.random) {
  const targets=visibleTargets().filter(target=>target!==segment&&target.hp>0);return targets.length?targets[Math.min(targets.length-1,Math.floor(random()*targets.length))]:null;
}
function shooterAfterHit(batch,segment,hit,bullet,random=Math.random) {
  const s=state.shooter;if(!s)return;
  if(hit.precise)s.effects.push({x:segment.x,y:segment.y,color:"#fff1a2",radius:16,life:.3,maxLife:.3});
  if(hit.marksman)s.effects.push({x:segment.x,y:segment.y,color:"#ffb34e",radius:24,life:.5,maxLife:.5});
  if(hit.critical&&s.quickHands)s.quickHandsRemaining=2;if(bullet.noProc)return;
  if(s.splitterChance&&random()<s.splitterChance){const target=shooterSecondaryTarget(segment,random);if(target){addDamage(batch,target,hit.damage*s.splitterDamage);s.effects.push({x:target.x,y:target.y,color:"#ffd98b",radius:10,life:.3,maxLife:.3});}}
  if(s.chain&&random()<skillValue("shooter","chain",.20,.30)){const target=shooterSecondaryTarget(segment,random);if(target)spawnHomingShooterBullet(target,{derived:true,countForRain:false,countsAsHit:false,noProc:true});}
  if(hit.critical&&s.criticalSalvo&&random()<s.criticalSalvo){const target=nearestSnakeTarget(state.player.x,state.player.y+PLATFORM_SHOT_Y);if(target)spawnHomingShooterBullet(target,{derived:true,countForRain:false,noProc:true,criticalSalvo:true});}
}

function shooterUpgradePool() {
  const s=state.shooter;if(!s)return [];const pool=[],rarities=["grey","green","purple"];
  const card=(id,rarity,name,text,apply)=>pool.push({id:"shooter-"+id,rarity,name,text:"Schütze · "+skillCardText("shooter",id,text),apply});
  const tiered=[
    ["speed","Beschleunigte Geschosse",skillValue("shooter","speed",[.15,.30,.50],[.20,.35,.55]),v=>`+${v*100} % Projektilgeschwindigkeit.`,v=>s.projectileSpeed+=v],
    ["caliber","Größere Kaliber",skillValue("shooter","caliber",[.10,.20,.35],[.15,.25,.40]),v=>`+${v*100} % Projektilgröße.`,v=>s.projectileSize+=v],
    ["armor","Panzerbrecher",skillValue("shooter","armor",[.10,.20,.35],[.15,.25,.40]),v=>`Nach dem ersten Durchschlag +${v*100} % Schaden.`,v=>s.armorDamage+=v],
    ["criticalSalvo","Kritische Salve",skillValue("shooter","criticalSalvo",[.10,.20,.35],[.15,.25,.40]),v=>`Krits: ${v*100} % Chance auf einen Zusatzschuss.`,v=>s.criticalSalvo=Math.min(1,s.criticalSalvo+v)],
    ["quickHands","Schnelle Hände",skillValue("shooter","quickHands",[.08,.15,.25],[.13,.20,.30]),v=>`Nach einem Krit +${v*100} % Feuerrate für 2 s.`,v=>s.quickHands+=v],
    ["heavy","Schweres Geschoss",skillValue("shooter","heavy",[[.15,.05],[.30,.08],[.50,.10]],[[.20,.05],[.35,.08],[.55,.10]]),v=>`+${v[0]*100} % Schaden, −${v[1]*100} % Speed.`,v=>{s.heavyDamage+=v[0];s.heavySpeed+=v[1];}],
    ["light","Leichtmunition",skillValue("shooter","light",[[.10,.05],[.20,.08],[.35,.10]],[[.15,.05],[.25,.08],[.40,.10]]),v=>`+${v[0]*100} % Feuerrate, −${v[1]*100} % Schaden.`,v=>{s.lightRate+=v[0];s.lightDamage+=v[1];}],
    ["pierceForce","Durchschlagswucht",skillValue("shooter","pierceForce",[.20,.40,.70],[.30,.50,.80]),v=>`Letzter Durchschlagstreffer +${v*100} % Schaden.`,v=>s.lastPierceDamage+=v],
    ["splitter","Splittergeschoss",skillValue("shooter","splitter",[.15,.25,.40],[.20,.30,.45]),v=>`${v*100} % Chance auf einen Splitter.`,v=>s.splitterChance=Math.min(1,s.splitterChance+v)],
    ["double","Doppelschlag",skillValue("shooter","double",[.05,.10,.18],[.10,.15,.23]),v=>`${v*100} % Chance auf einen zweiten Schuss.`,v=>s.doubleChance=Math.min(1,s.doubleChance+v)],
    ["focus","Zielerfassung",skillValue("shooter","focus",[.05,.10,.20],[.10,.15,.25]),v=>`Nach 3 Treffern auf dasselbe Segment +${v*100} % Schaden.`,v=>s.focusDamage+=v],
    ["sustained","Dauerfeuer",skillValue("shooter","sustained",[.10,.15,.25],[.15,.20,.30]),v=>`Alle 10 Schüsse +${v*100} % Feuerrate für 2 s.`,v=>s.sustainedRate+=v],
    ["fullHit","Volltreffer",skillValue("shooter","fullHit",[.10,.20,.35],[.20,.30,.45]),v=>`Krits verursachen +${v*100} % zusätzlichen Schaden.`,v=>s.fullHitDamage+=v]
  ];
  for(const [id,name,values,label,apply] of tiered)for(let i=0;i<3;i++)if(!s.taken[id+rarities[i]])card(id+"-"+rarities[i],rarities[i],name,label(values[i]),()=>{apply(values[i]);s.taken[id+rarities[i]]=true;});
  const precisionValues=skillValue("shooter","precision",[.05,.10,.20],[.10,.15,.25]);for(let i=0;i<3;i++)card("precision-"+rarities[i],rarities[i],"Präzisionsschuss",`Mittige Treffer +${precisionValues[i]*100} % Schaden; unbegrenzt wählbar.`,()=>s.precisionDamage+=precisionValues[i]);
  const once=[["triple","purple","Dreifachsalve","Jeder 8. normale Schuss erzeugt 3 Zusatzgeschosse."],["rain","purple","Geschossregen","Nach 20 Projektilen: 3 zielsuchende Geschosse mit 300 % Schaden."],["perfect","purple","Perfekter Treffer","Jeder 10. Haupttreffer ist garantiert kritisch."],["unstoppable","purple","Unaufhaltsam","Ab dem dritten Durchschlagstreffer +50 % Schaden."],["overload","purple","Überladung","Nach 15 Schüssen: nächste Salve doppelt groß und +100 % Schaden."],["chain","purple","Kettenprojektil","20 % Chance auf einen Sprung zu einem weiteren sichtbaren Segment."],["precisionMode","purple","Präzisionsmodus","Nach 2 s Stillstand: +25 % Schaden und +10 % Krit-Chance."],["bulletStorm","orange","Kugelhagel","Alle 25 s für 5 s: +50 % Feuerrate, +1 Projektil und +1 Durchschlag."],["marksman","orange","Meisterschütze","Jeder 5. Treffer pro Segment: +100 % Schaden und garantiert kritisch."]];
  for(const [id,rarity,name,text] of once)if(!s[id])card(id,rarity,name,text,()=>s[id]=true);
  if(state.weapon.bullets>1&&!s.salvoMaster)card("salvoMaster","purple","Salvenmeister","Mehrfachsalven verursachen mit jedem Geschoss +30 % Schaden.",()=>s.salvoMaster=true);
  return pool;
}

function drawShooterEffects() {
  const s=state.shooter;if(!s)return;
  if(s.precisionActive){ctx.save();ctx.strokeStyle="#8ef4ff";ctx.shadowColor="#8ef4ff";ctx.shadowBlur=12;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(state.player.x,state.player.y-6,17,0,Math.PI*2);ctx.moveTo(state.player.x-23,state.player.y-6);ctx.lineTo(state.player.x+23,state.player.y-6);ctx.stroke();ctx.restore();}
  for(const e of s.effects){const t=Math.max(0,e.life/e.maxLife);ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(1.2-t*.2),0,Math.PI*2);ctx.stroke();ctx.restore();}
}
function shooterStatusText() {
  const s=state.shooter;if(!s)return "";const status=[];
  if(s.precisionMode)status.push("Präzision "+(s.precisionActive?"AKTIV":Math.floor(s.precisionStill*10)/10+"/"+skillValue("shooter","precisionMode",2,1.5)+" s"));
  if(s.bulletStorm)status.push("Kugelhagel "+(s.stormActive>0?Math.ceil(s.stormActive)+" s":Math.ceil(s.stormRemaining)+" s"));
  if(s.overload)status.push("Überladung "+s.overloadShots+"/"+skillValue("shooter","overload",15,12));if(s.rain)status.push("Geschossregen "+s.rainProjectiles+"/"+skillValue("shooter","rain",20,18));return status.join(" · ");
}
