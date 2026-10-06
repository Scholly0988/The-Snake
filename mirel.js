"use strict";

const MIREL_ID="mirel";
const mirelSprite=new Image();
mirelSprite.src="mirel-front.png?v=25-0";

function mirelSkill(key,base,upgraded){return skillValue("mirel",key,base,upgraded);}
function mirelMember(){return activeSecondaries().find(member=>member.id===MIREL_ID)||null;}
function mirelCurses(segment){return segment.mirelCurses||(segment.mirelCurses={});}
function mirelActiveEntries(segment){return Object.values(segment?.mirelCurses||{}).filter(c=>c&&c.remaining>0);}
function mirelIsCursed(segment){return mirelActiveEntries(segment).length>0;}
function mirelGeneralDamageFactor(){return 1+Math.max(0,(state.weapon?.damage||1)-1)*.25/.4;}
function mirelRuneDamage(){return mirelSkill("runeSpark",.15,.20)*mirelGeneralDamageFactor();}
function mirelVisibleTargets(){return visibleTargets().filter(segment=>segment.hp>0);}

function mirelRandomTarget(random=Math.random,excluded=new Set(),preferUncursed=true){
  let targets=mirelVisibleTargets().filter(segment=>!excluded.has(segment.id));
  if(preferUncursed){const fresh=targets.filter(segment=>!mirelIsCursed(segment));if(fresh.length)targets=fresh;}
  return targets.length?targets[Math.min(targets.length-1,Math.floor(random()*targets.length))]:null;
}

function mirelApplyCurse(segment,type,bonus,duration,member,options={}){
  if(!segment||segment.hp<=0)return false;
  const curses=mirelCurses(segment),current=curses[type];
  curses[type]={type,bonus,remaining:duration,duration,hits:options.hits??current?.hits??0,jumps:options.jumps??current?.jumps??0};
  if(options.countEvent!==false)mirelCountCurseEvent(member,segment,options.waveTargets);
  addSecondaryEffect({kind:"mirel-cast",x:segment.x,y:segment.y,life:.42,maxLife:.42});
  return true;
}

function mirelCountCurseEvent(member,target,waveTargets=null){
  const d=member?.data;if(!d)return;
  d.curseEvents++;
  if(!d.masterCurse||d.curseEvents%(mirelSkill("masterCurse",5,4))!==0)return;
  const candidates=(waveTargets||[target]).filter(Boolean),chosen=candidates[Math.floor(Math.random()*candidates.length)]||target;
  if(chosen)mirelApplyCurse(chosen,"master",.25,6,member,{countEvent:false});
}

function mirelNormalCapacity(d){
  return state.snake.filter(segment=>segment.mirelCurses?.normal?.remaining>0).length<d.maxNormal;
}

function mirelStartNormal(member,random=Math.random){
  const d=member.data;if(!mirelNormalCapacity(d))return false;
  const target=mirelRandomTarget(random);if(!target)return false;
  const anchor=secondaryAnchor(member.slot);
  d.projectiles.push({id:state.nextId++,targetId:target.id,fromX:anchor.x,fromY:anchor.y-12,toX:target.x,toY:target.y,age:0,duration:.45});
  d.castPulse=.3;return true;
}

function mirelLandProjectiles(member,dt){
  const d=member.data;
  for(const projectile of d.projectiles)projectile.age+=dt;
  const landed=d.projectiles.filter(p=>p.age>=p.duration);d.projectiles=d.projectiles.filter(p=>p.age<p.duration);
  for(const projectile of landed){
    const target=state.snake.find(segment=>segment.id===projectile.targetId&&segment.hp>0);
    if(!target||!isSegmentVisible(target))continue;
    const batch=new Map();addDamage(batch,target,mirelRuneDamage());
    applyDamageBatch(batch);if(state.mode!=="playing")return;
    const survivor=state.snake.find(segment=>segment.id===projectile.targetId&&segment.hp>0);
    if(survivor)mirelApplyCurse(survivor,"normal",d.normalBonus,d.normalDuration,member);
  }
}

function mirelCastWave(member,random=Math.random){
  const d=member.data,targets=[],excluded=new Set();
  for(let n=0;n<d.waveTargets;n++){
    const target=mirelRandomTarget(random,excluded,false);if(!target)break;
    targets.push(target);excluded.add(target.id);
  }
  if(!targets.length)return false;
  for(const target of targets)mirelApplyCurse(target,"wave",d.waveBonus,d.waveDuration,member,{countEvent:false});
  mirelCountCurseEvent(member,targets[0],targets);d.wavePulse=.65;return true;
}

function mirelCastDoom(member,random=Math.random){
  const target=mirelRandomTarget(random,new Set(),false);if(!target)return false;
  const d=member.data;
  mirelApplyCurse(target,"doom",d.doomBonus,d.doomDuration,member,{hits:0,jumps:0});
  d.doomPulse=.9;return true;
}

function mirelUpdateCurses(dt){
  for(const instance of livingSnakeInstances())for(const segment of instance.segments){
    for(const [key,curse] of Object.entries(segment.mirelCurses||{})){
      curse.remaining=Math.max(0,curse.remaining-dt);if(curse.remaining===0)delete segment.mirelCurses[key];
    }
  }
}

function updateMirel(member,dt,anchor,random=Math.random){
  const d=member.data;
  mirelUpdateCurses(dt);mirelLandProjectiles(member,dt);
  d.castPulse=Math.max(0,d.castPulse-dt);d.wavePulse=Math.max(0,d.wavePulse-dt);d.doomPulse=Math.max(0,d.doomPulse-dt);
  d.normalTimer=Math.max(0,d.normalTimer-dt);d.waveTimer=Math.max(0,d.waveTimer-dt);d.doomTimer=Math.max(0,d.doomTimer-dt);
  if(d.normalTimer===0&&mirelStartNormal(member,random))d.normalTimer=d.normalInterval;
  if(d.waveTimer===0&&mirelCastWave(member,random))d.waveTimer=d.waveCooldown;
  if(d.doomTimer===0&&mirelCastDoom(member,random))d.doomTimer=d.doomCooldown;
}

function mirelIncomingBonus(segment){
  const member=mirelMember();if(!member||!segment)return 0;
  const d=member.data,own=Math.max(0,...mirelActiveEntries(segment).map(c=>c.bonus));
  let bonus=own;
  if(own>0&&segment.hp/Math.max(1,segment.maxHp)<(mirelSkill("deathMark",.20,.25))&&d.deathMark)bonus+=.15;
  if(d.darkConnection){
    const instance=snakeInstanceForSegment(segment),threshold=mirelSkill("darkConnection",3,2);
    if(instance&&instance.segments.filter(mirelIsCursed).length>=threshold)bonus+=.10;
  }
  return bonus;
}

function mirelCriticalMultiplier(segment,critical){
  if(critical&&segment?.bossBody&&typeof halloweenBossDamageReaction==="function")halloweenBossDamageReaction(segment,true);
  const d=mirelMember()?.data;
  return critical&&d&&mirelIsCursed(segment)?1+d.criticalBonus:1;
}

function mirelSnakeSlow(instance){
  const d=mirelMember()?.data;if(!d||!instance||d.slow<=0)return 0;
  return instance.segments.some(mirelIsCursed)?d.slow:0;
}

function mirelTrackHit(batch,segment,count=1){
  if(!batch||!segment||count<=0)return;
  batch.mirelHitCounts ||= new Map();
  batch.mirelHitCounts.set(segment.id,(batch.mirelHitCounts.get(segment.id)||0)+count);
}

function mirelPrepareDamageBatch(batch){
  const member=mirelMember();if(!member||!batch?.size)return;
  const pulse=mirelSkill("doomImpulse",.5,.65)*mirelGeneralDamageFactor();
  for(const [id] of [...batch]){
    const segment=state.snake.find(s=>s.id===id),doom=segment?.mirelCurses?.doom;
    if(!doom?.remaining)continue;
    const hits=batch.mirelHitCounts?.get(id)||1,old=doom.hits||0;doom.hits=old+hits;
    const impulses=Math.floor(doom.hits/5)-Math.floor(old/5);
    if(impulses>0){batch.set(id,(batch.get(id)||0)+pulse*impulses);addSecondaryEffect({kind:"mirel-impulse",x:segment.x,y:segment.y,life:.35,maxLife:.35});}
  }
}

function mirelClosestSameSnake(destroyed,instance,exclude=new Set()){
  return (instance?.segments||[]).filter(segment=>segment.hp>0&&isSegmentVisible(segment)&&!exclude.has(segment.id))
    .sort((a,b)=>Math.abs(a.pathOffset-destroyed.pathOffset)-Math.abs(b.pathOffset-destroyed.pathOffset));
}

function mirelTransferTarget(destroyed,instance,neighbors,allowFallback=false,random=Math.random){
  const adjacent=(neighbors||[]).filter(segment=>segment.hp>0&&isSegmentVisible(segment));
  if(adjacent.length)return adjacent[Math.floor(random()*adjacent.length)];
  if(allowFallback){
    const same=mirelClosestSameSnake(destroyed,instance);if(same.length)return same[0];
    if(hasSkill("mirel","curseChain"))return mirelRandomTarget(random,new Set(),false);
  }
  return null;
}

function mirelDoomJumpTarget(destroyed,instance,neighbors,random=Math.random){
  const adjacent=(neighbors||[]).filter(segment=>segment.hp>0&&isSegmentVisible(segment));
  if(adjacent.length)return adjacent[Math.floor(random()*adjacent.length)];
  const same=mirelClosestSameSnake(destroyed,instance);if(same.length)return same[Math.floor(random()*same.length)];
  return mirelRandomTarget(random,new Set(),false);
}

function resolveMirelDeath(destroyed,instance,neighbors,random=Math.random){
  const member=mirelMember();if(!member)return;
  const d=member.data,curses=destroyed.mirelCurses||{},doom=curses.doom;
  if(doom?.remaining&&doom.jumps<d.doomJumps){
    const target=mirelDoomJumpTarget(destroyed,instance,neighbors,random);
    if(target)mirelApplyCurse(target,"doom",doom.bonus,doom.remaining,member,{hits:doom.hits,jumps:doom.jumps+1});
  }
  const transferable=[curses.normal,curses.wave].filter(c=>c?.remaining).sort((a,b)=>b.bonus-a.bonus)[0];
  if(!transferable)return;
  const guaranteed=d.curseChain,chance=guaranteed?1:d.transferChance;
  if(random()>=chance)return;
  const target=mirelTransferTarget(destroyed,instance,neighbors,guaranteed,random);if(!target)return;
  const duration=transferable.type==="wave"?d.waveDuration:d.normalDuration;
  mirelApplyCurse(target,transferable.type,transferable.bonus,duration,member);
}

function mirelUpgradePool(member){
  const d=member.data,pool=[],rarities=["grey","green","purple"];
  const card=(id,rarity,name,text,apply)=>pool.push({id,rarity,name,text:skillCardText("mirel",id,text),apply});
  const values=(key,base,upgraded)=>hasSkill("mirel",key)?upgraded:base;
  const fixed=[
    ["deep","Tiefer Fluch",values("deep",[.15,.18,.22],[.16,.19,.23]),v=>`${v*100} % eingehender Schaden durch normale Flüche.`,v=>d.normalBonus=Math.max(d.normalBonus,v)],
    ["lasting","Langanhaltender Fluch",values("lasting",[5,6,8],[6,7,9]),v=>`Normale Flüche halten ${v} Sekunden.`,v=>d.normalDuration=Math.max(d.normalDuration,v)],
    ["quick","Schnelle Verfluchung",values("quick",[5.5,5,4],[5.25,4.75,3.75]),v=>`Fluchintervall ${String(v).replace(".",",")} Sekunden.`,v=>{d.normalInterval=Math.min(d.normalInterval,v);d.normalTimer=Math.min(d.normalTimer,v);}],
    ["double","Doppeltes Siegel",values("double",[2,3,4],[3,4,5]),v=>`Bis zu ${v} normale Flüche gleichzeitig.`,v=>d.maxNormal=Math.max(d.maxNormal,v)],
    ["critical","Dunkle Schwäche",values("critical",[.10,.20,.35],[.15,.25,.40]),v=>`Krits gegen verfluchte Ziele erhalten +${v*100} % Endschaden.`,v=>d.criticalBonus=Math.max(d.criticalBonus,v)],
    ["fragile","Zerbrechliches Siegel",values("fragile",[.30,.55,1],[.40,.65,1]),v=>`${v*100} % Übertragungs-Chance beim Tod.`,v=>d.transferChance=Math.max(d.transferChance,v)],
    ["weakening","Schwächender Fluch",values("weakening",[.03,.06,.10],[.05,.08,.12]),v=>`${v*100} % Schlangen-Slow bei aktivem Fluch.`,v=>d.slow=Math.max(d.slow,v)],
    ["waveSize","Größere Fluchwelle",values("waveSize",[4,5,6],[5,6,7]),v=>`${v} Ziele pro Fluchwelle.`,v=>d.waveTargets=Math.max(d.waveTargets,v)],
    ["wavePower","Mächtige Fluchwelle",values("wavePower",[.18,.22,.28],[.20,.24,.30]),v=>`Fluchwelle erhöht Schaden um ${v*100} %.`,v=>d.waveBonus=Math.max(d.waveBonus,v)],
    ["waveQuick","Schnellere Fluchwelle",values("waveQuick",[16,14,11],[15,13,10]),v=>`${v} Sekunden Fluchwellen-Cooldown.`,v=>{d.waveCooldown=Math.min(d.waveCooldown,v);d.waveTimer=Math.min(d.waveTimer,v);}],
    ["doomLong","Langes Untergangszeichen",values("doomLong",[7,8,10],[8,9,11]),v=>`Untergangszeichen hält ${v} Sekunden.`,v=>d.doomDuration=Math.max(d.doomDuration,v)],
    ["doomPower","Tödliches Zeichen",values("doomPower",[.35,.40,.50],[.40,.45,.55]),v=>`Untergangszeichen erhöht Schaden um ${v*100} %.`,v=>d.doomBonus=Math.max(d.doomBonus,v)],
    ["doomJumps","Springender Untergang",values("doomJumps",[3,4,6],[4,5,7]),v=>`Untergangszeichen springt bis zu ${v}-mal.`,v=>d.doomJumps=Math.max(d.doomJumps,v)]
  ];
  for(const [id,name,values,label,apply] of fixed)for(let n=0;n<3;n++)card(id+"-"+rarities[n],rarities[n],name,label(values[n]),()=>apply(values[n]));
  if(!d.curseChain)card("curseChain","purple","Fluchkette","Flüche springen beim Tod garantiert auf ein sichtbares Ziel derselben Schlange.",()=>d.curseChain=true);
  if(!d.masterCurse)card("masterCurse","purple","Meisterfluch","Jeder 5. Fluch erzeugt zusätzlich 25 % Schadensverstärkung für 6 Sekunden.",()=>d.masterCurse=true);
  if(!d.deathMark)card("deathMark","orange","Todesmal","Verfluchte Ziele unter 20 % HP erhalten weitere +15 % Schaden.",()=>d.deathMark=true);
  if(!d.darkConnection)card("darkConnection","orange","Dunkle Verbindung","Drei verfluchte Segmente geben ihrer gesamten Schlange +10 % eingehenden Schaden.",()=>d.darkConnection=true);
  return pool;
}

function mirelDrawCurse(segment){
  const entries=mirelActiveEntries(segment);if(!entries.length||!isSegmentVisible(segment))return;
  const strongest=entries.sort((a,b)=>b.bonus-a.bonus)[0],doom=strongest.type==="doom",pulse=1+.08*Math.sin(state.elapsed*7+segment.id);
  ctx.save();ctx.translate(segment.x,segment.y);ctx.strokeStyle=doom?"#ff4fe5":"#a85cff";ctx.fillStyle=doom?"rgba(116,0,95,.18)":"rgba(50,0,75,.16)";ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=doom?13:8;ctx.lineWidth=doom?2.5:1.8;
  ctx.beginPath();ctx.arc(0,0,(doom?21:18)*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(state.elapsed*(doom?-.8:.5));
  for(let n=0;n<4;n++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,-15*pulse);ctx.lineTo(3,-11*pulse);ctx.lineTo(-3,-11*pulse);ctx.closePath();ctx.stroke();}
  ctx.restore();
}

function drawMirel(member,ctx,anchor){
  const d=member.data;
  for(const segment of state.snake)mirelDrawCurse(segment);
  for(const projectile of d.projectiles){const t=Math.min(1,projectile.age/projectile.duration),x=projectile.fromX+(projectile.toX-projectile.fromX)*t,y=projectile.fromY+(projectile.toY-projectile.fromY)*t-Math.sin(t*Math.PI)*24;ctx.save();ctx.translate(x,y);ctx.rotate(state.elapsed*5);ctx.fillStyle="#d9a1ff";ctx.shadowColor="#9a42e8";ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(5,4);ctx.lineTo(-5,4);ctx.closePath();ctx.fill();ctx.restore();}
  for(const effect of state.secondaryTeam.effects.filter(e=>e.kind?.startsWith("mirel-") )){const t=effect.life/effect.maxLife;ctx.save();ctx.globalAlpha=Math.max(0,t);ctx.strokeStyle=effect.kind==="mirel-impulse"?"#ff6bea":"#b96cff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(effect.x,effect.y,8+(1-t)*22,0,Math.PI*2);ctx.stroke();ctx.restore();}
  const x=anchor.x,y=anchor.y,lift=Math.sin(state.elapsed*2.4+member.slot.length)*1.2;
  ctx.save();ctx.translate(x,y+30);ctx.fillStyle="#171020";ctx.beginPath();ctx.ellipse(0,0,18,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#8e4fc3";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,13,state.elapsed,state.elapsed+Math.PI*1.5);ctx.stroke();for(let n=0;n<3;n++){const a=state.elapsed*.5+n*Math.PI*2/3;ctx.fillStyle="#d8a1ff";ctx.fillRect(Math.cos(a)*12-1,Math.sin(a)*4-1,2,2);}ctx.restore();
  ctx.save();if(mirelSprite.complete&&mirelSprite.naturalWidth)ctx.drawImage(mirelSprite,x-17,y-19-lift,34,51);else{ctx.fillStyle="#4b235f";ctx.beginPath();ctx.arc(x,y-lift,12,0,Math.PI*2);ctx.fill();}ctx.restore();
}

function createMirelState(){return {
  normalTimer:6,normalInterval:6,normalDuration:4,normalBonus:mirelSkill("seal",.12,.14),maxNormal:1,
  waveTimer:mirelSkill("wave",18,17),waveCooldown:mirelSkill("wave",18,17),waveDuration:5,waveBonus:.15,waveTargets:3,
  doomTimer:0,doomCooldown:30,doomDuration:6,doomBonus:.30,doomJumps:2,
  criticalBonus:0,transferChance:0,slow:0,curseChain:false,masterCurse:false,deathMark:false,darkConnection:false,
  curseEvents:0,castPulse:0,wavePulse:0,doomPulse:0,projectiles:[]
};}

registerSecondary({id:MIREL_ID,name:"Mirel",kind:"debuff",createState:createMirelState,update:updateMirel,draw:drawMirel,upgradePool:mirelUpgradePool});

function renderMirelProfile(){
  const p=progress.data,unlocked=p.secondaryUnlocked.includes(MIREL_ID),button=document.querySelector("#unlockMirel");
  button.disabled=true;button.textContent="Mirel freigeschaltet · 0 Münzen";
  for(const slot of SECONDARY_SLOTS){
    const active=p.secondarySlots[slot]===MIREL_ID,label={left:"Links",center:"Mitte",right:"Rechts"}[slot];
    if(active)document.querySelector("#secondarySlot"+slot).innerHTML='<img src="mirel-front.png?v=25-0" alt="Mirel"><strong>Mirel</strong><small>Fluchweberin · Aktiv</small>';
    const equip=document.querySelector("#equipMirel"+slot);equip.disabled=!unlocked;equip.textContent=label+(active?" · Aktiv":" einsetzen");
  }
  document.querySelector("#unequipMirel").disabled=!Object.values(p.secondarySlots).includes(MIREL_ID);
}

function bindMirelMenu(){
  document.querySelector("#unlockMirel").addEventListener("click",()=>{if(state.mode!=="start")return;renderProfile();document.querySelector("#heroStatus").textContent="Mirel ist bereits kostenlos freigeschaltet.";});
  for(const slot of [...SECONDARY_SLOTS,null])document.querySelector(slot?"#equipMirel"+slot:"#unequipMirel").addEventListener("click",()=>{
    if(state.mode!=="start")return;const targetSlot=slot||SECONDARY_SLOTS.find(s=>progress.data.secondarySlots[s]===MIREL_ID),ok=targetSlot?progress.equipSecondary(slot?MIREL_ID:null,targetSlot):false;renderProfile();
    document.querySelector("#heroStatus").textContent=ok?(slot?"Mirel unterstützt ab der nächsten Runde den Sekundärslot "+({left:"links",center:"in der Mitte",right:"rechts"}[slot])+".":"Mirel wurde aus dem Team genommen."):progress.message;
  });
}
