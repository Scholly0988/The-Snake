"use strict";

const KIKO_ID="kiko";
const kikoSprite=new Image();
kikoSprite.src="kiko-front.png?v=24-0";

function kikoSkill(key,base,upgraded){return skillValue("kiko",key,base,upgraded);}
function kikoNormalBaseDamage(){return kikoSkill("banana",.4,.5);}
function kikoGeneralDamageFactor(){return 1+Math.max(0,(state.weapon?.damage||1)-1)*.25/.4;}
function kikoDamage(base){return base*kikoGeneralDamageFactor();}
function kikoMaxActive(d){return d.maxActive+(d.chaosRemaining>0?2:0);}
function kikoThrowInterval(d){return d.chaosRemaining>0?kikoSkill("chaos",1.5,1.35):d.throwInterval;}
function kikoBananaCount(d){return d.traps.filter(t=>t.kind==="banana").length+d.throws.filter(t=>t.trap.kind==="banana").length;}
function kikoVisibleInstances(){return livingSnakeInstances().filter(instance=>instance.segments.some(s=>s.hp>0&&isSegmentVisible(s)));}

function kikoTargetInstance(anchor){
  return kikoVisibleInstances().map(instance=>{
    const visible=instance.segments.filter(s=>s.hp>0&&isSegmentVisible(s));
    const head=snakeHead(instance),reference=head&&isSegmentVisible(head)?head:visible[0];
    return {instance,distance:Math.hypot(reference.x-anchor.x,reference.y-anchor.y)};
  }).sort((a,b)=>a.distance-b.distance)[0]?.instance||null;
}

function kikoPredictedPoint(instance,seconds=1.5){
  if(!instance)return null;
  const visible=instance.segments.filter(s=>s.hp>0&&isSegmentVisible(s));
  if(!visible.length)return null;
  const reference=visible.sort((a,b)=>a.pathOffset-b.pathOffset)[0];
  const speed=Math.min(22+state.elapsed*.25,45)*snakeSpeedMultiplier(instance)*(1-Math.min(.60,kikoSnakeSlow(instance)+alchemistSlow()+ilyraSnakeSlow(instance)));
  const point=instancePathPoint(instance,instance.headDistance-reference.pathOffset+speed*seconds);
  return {x:Math.max(18,Math.min(state.width-18,point.x)),y:Math.max(26,Math.min(state.player.y-45,point.y))};
}

function kikoTrapSpec(d,kind,random=Math.random){
  if(kind==="pile")return {id:state.nextId++,kind,x:0,y:0,life:d.pileLife,radius:34*(1+d.pileRadiusBonus),damage:kikoDamage(kikoSkill("pile",.8,1))*(1+d.pileDamageBonus),slow:.20+d.pileSlowBonus,slowDuration:3,chainBoost:false,hitIds:new Set()};
  const golden=d.goldenChosen&&random()<kikoSkill("golden",.20,.25),chaos=d.chaosRemaining>0;
  return {id:state.nextId++,kind:"banana",x:0,y:0,life:d.bananaLife,radius:18*(1+d.radiusBonus),damage:kikoDamage(kikoNormalBaseDamage())*(1+d.bananaDamageBonus)*(chaos?1.5:1)*(golden?2:1),slow:.12+d.bananaSlowBonus+(chaos?.08:0),slowDuration:2.5*(golden?2:1),golden,chainBoost:false,hitIds:new Set()};
}

function kikoStartThrow(member,kind,seconds=1.5,random=Math.random,bypassCap=false){
  const d=member.data,anchor=secondaryAnchor(member.slot),instance=kikoTargetInstance(anchor);
  if(!instance||kind==="banana"&&!bypassCap&&kikoBananaCount(d)>=kikoMaxActive(d))return false;
  const target=kikoPredictedPoint(instance,seconds);if(!target)return false;
  if(kind==="pile")d.traps=d.traps.filter(t=>t.kind!=="pile");
  const trap=kikoTrapSpec(d,kind,random);
  d.throws.push({id:state.nextId++,fromX:anchor.x,fromY:anchor.y-12,toX:target.x,toY:target.y,age:0,duration:.45,trap});
  d.throwPulse=.22;
  return true;
}

function kikoLandThrows(d,dt){
  for(const flight of d.throws)flight.age+=dt;
  const landed=d.throws.filter(f=>f.age>=f.duration);
  d.throws=d.throws.filter(f=>f.age<f.duration);
  for(const flight of landed){flight.trap.x=flight.toX;flight.trap.y=flight.toY;d.traps.push(flight.trap);}
}

function kikoApplySlow(instance,source,amount,duration){
  if(!instance)return;
  instance.kikoSlows ||= {};
  const current=instance.kikoSlows[source]||{amount:0,remaining:0};
  current.amount=Math.max(current.amount,amount);current.remaining=Math.max(current.remaining,duration);
  instance.kikoSlows[source]=current;
}

function kikoSnakeSlow(instance){
  if(!instance?.kikoSlows)return 0;
  return Object.values(instance.kikoSlows).reduce((sum,e)=>sum+(e.remaining>0?e.amount:0),0);
}

function kikoUpdateSlows(dt){
  for(const instance of livingSnakeInstances())if(instance.kikoSlows)for(const effect of Object.values(instance.kikoSlows))effect.remaining=Math.max(0,effect.remaining-dt);
}

function kikoContacts(field){
  const contacts=[];
  for(const instance of kikoVisibleInstances()){
    const head=snakeHead(instance),front=firstVisibleSegment(instance);
    if(head&&front&&isSegmentVisible(head)&&Math.hypot(head.x-field.x,head.y-field.y)<=field.radius+SEGMENT_RADIUS)contacts.push({instance,segment:front,head:true});
    for(const segment of instance.segments)if(segment.hp>0&&isSegmentVisible(segment)&&Math.hypot(segment.x-field.x,segment.y-field.y)<=field.radius+SEGMENT_RADIUS)contacts.push({instance,segment,head:false});
  }
  return contacts.filter((entry,index,list)=>list.findIndex(other=>other.segment.id===entry.segment.id)===index);
}

function kikoBoostAnotherField(d,excludedId,random=Math.random){
  const candidates=[...d.traps,...d.slicks].filter(field=>field.id!==excludedId);
  if(!candidates.length)return false;
  const target=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
  target.chainBoost=true;return true;
}

function kikoSpawnSlick(d,trap,triggerSegment=null){
  const pile=trap.kind==="pile";
  d.slicks.push({id:state.nextId++,kind:"slick",x:trap.x,y:trap.y,life:pile?2:kikoSkill("slick",1.5,1.8)*(1+d.slickDurationBonus),radius:pile?trap.radius:22,damage:kikoDamage(kikoSkill("slick",.15,.20)),slow:.08+d.slickSlowBonus,slowDuration:1.5,chainBoost:false,hitIds:new Set(triggerSegment?[triggerSegment.id]:[])});
}

function kikoFieldDamage(field,segment,batch){
  const multiplier=field.chainBoost?1.5:1;
  addDamage(batch,segment,field.damage*multiplier);
  if(field.chainBoost)field.chainBoost=false;
}

function kikoResolveFields(member,random=Math.random){
  const d=member.data;
  for(const trap of [...d.traps]){
    const contact=kikoContacts(trap)[0];if(!contact)continue;
    const batch=new Map();kikoFieldDamage(trap,contact.segment,batch);kikoApplySlow(contact.instance,trap.kind,trap.slow,trap.slowDuration);
    kikoSpawnSlick(d,trap,contact.segment);
    d.traps.splice(d.traps.indexOf(trap),1);
    if(trap.kind==="banana"&&d.chainChosen&&random()<kikoSkill("chain",.35,.45))kikoBoostAnotherField(d,trap.id,random);
    burst(trap.x,trap.y,trap.golden?"#ffe978":"#f6d94b",trap.kind==="pile"?10:6);
    applyDamageBatch(batch);if(state.mode!=="playing")return;
  }
  for(const field of [...d.slicks]){
    const batch=new Map();
    for(const contact of kikoContacts(field))if(!field.hitIds.has(contact.segment.id)){
      field.hitIds.add(contact.segment.id);kikoFieldDamage(field,contact.segment,batch);kikoApplySlow(contact.instance,"slick",field.slow,field.slowDuration);
    }
    if(batch.size){applyDamageBatch(batch);if(state.mode!=="playing")return;}
  }
}

function kikoActivateChaos(member,random=Math.random){
  const d=member.data;d.chaosRemaining=d.chaosDuration;d.chaosTimer=d.chaosCooldown;d.chaosPulse=1;
  const count=3+d.chaosExtra;
  for(let n=0;n<count;n++)kikoStartThrow(member,"banana",.75+1.5*n/Math.max(1,count-1),random,true);
}

function updateKiko(member,dt,anchor,random=Math.random){
  const d=member.data;
  kikoUpdateSlows(dt);kikoLandThrows(d,dt);
  d.throwPulse=Math.max(0,d.throwPulse-dt);d.chaosPulse=Math.max(0,d.chaosPulse-dt);d.chaosRemaining=Math.max(0,d.chaosRemaining-dt);
  d.normalTimer=Math.max(0,d.normalTimer-dt);d.pileTimer=Math.max(0,d.pileTimer-dt);d.chaosTimer=Math.max(0,d.chaosTimer-dt);
  for(const field of [...d.traps,...d.slicks])field.life=Math.max(0,field.life-dt);
  d.traps=d.traps.filter(t=>t.life>0);d.slicks=d.slicks.filter(t=>t.life>0);
  if(d.chaosTimer===0)kikoActivateChaos(member,random);
  const empty=!d.traps.some(t=>t.kind==="banana")&&!d.throws.some(f=>f.trap.kind==="banana");
  if(empty&&d.instinctChosen)d.normalTimer=Math.min(d.normalTimer,kikoSkill("instinct",1,.7));
  if(d.normalTimer===0&&kikoStartThrow(member,"banana",1.5,random,false))d.normalTimer=kikoThrowInterval(d);
  if(d.pileTimer===0&&kikoStartThrow(member,"pile",1.5,random,true))d.pileTimer=d.pileCooldown;
  kikoResolveFields(member,random);
}

function kikoUpgradePool(member){
  const d=member.data,pool=[],rarities=["grey","green","purple"];
  const card=(id,rarity,name,text,apply)=>pool.push({id,rarity,name,text:skillCardText("kiko",id,text),apply});
  const additive=[
    ["smooth","Glatte Schale",[.04,.08,.12],v=>`+${v*100} Prozentpunkte Bananen-Slow.`,v=>d.bananaSlowBonus+=v],
    ["firm","Feste Banane",[.15,.30,.50],v=>`+${v*100} % Schaden normaler und goldener Bananen.`,v=>d.bananaDamageBonus+=v],
    ["radius","Größere Rutschfläche",[.15,.30,.50],v=>`+${v*100} % Auslöseradius normaler Bananen.`,v=>d.radiusBonus+=v],
    ["sticky","Klebriger Fleck",[.20,.40,.70],v=>`+${v*100} % Dauer des rutschigen Flecks.`,v=>d.slickDurationBonus+=v],
    ["slick","Extra rutschig",[.04,.08,.12],v=>`+${v*100} Prozentpunkte Slow des rutschigen Flecks.`,v=>d.slickSlowBonus+=v],
    ["pileRadius","Großer Bananenhaufen",[.20,.35,.50],v=>`+${v*100} % Radius des Bananenhaufens.`,v=>d.pileRadiusBonus+=v],
    ["heavyPile","Schwerer Haufen",[[.15,.04],[.30,.08],[.50,.12]],v=>`+${v[0]*100} % Schaden und +${v[1]*100} Prozentpunkte Slow.`,v=>{d.pileDamageBonus+=v[0];d.pileSlowBonus+=v[1];}]
  ];
  for(const [id,name,values,label,apply] of additive)for(let n=0;n<3;n++)card(id+"-"+rarities[n],rarities[n],name,label(values[n]),()=>apply(values[n]));
  const fixed=[
    ["more","Mehr Schalen",[1,2,3],v=>`+${v} maximale aktive Bananenschalen.`,v=>d.maxActive=Math.max(d.maxActive,3+v)],
    ["quick","Schneller Werfer",[4,3.5,2.8],v=>`Wurfintervall ${String(v).replace(".",",")} Sekunden.`,v=>{d.throwInterval=Math.min(d.throwInterval,v);d.normalTimer=Math.min(d.normalTimer,v);}],
    ["lasting","Liegende Schalen",[12,15,18],v=>`Bananenschalen bleiben ${v} Sekunden liegen.`,v=>d.bananaLife=Math.max(d.bananaLife,v)],
    ["wildChaos","Wildes Chaos",[1,2,4],v=>`Dschungelchaos dauert ${6+v} Sekunden.`,v=>d.chaosDuration=Math.max(d.chaosDuration,6+v)],
    ["moreChaos","Noch mehr Chaos",[1,2,3],v=>`Beim Start ${v} zusätzliche Bananenschale${v===1?"":"n"}.`,v=>d.chaosExtra=Math.max(d.chaosExtra,v)]
  ];
  for(const [id,name,values,label,apply] of fixed)for(let n=0;n<3;n++)card(id+"-"+rarities[n],rarities[n],name,label(values[n]),()=>{apply(values[n]);d.tiers[id]=Math.max(d.tiers[id]??-1,n);});
  if(!d.goldenChosen)card("golden","orange","Goldene Banane","20 % Chance: doppelter Schaden und doppelte Slow-Dauer.",()=>d.goldenChosen=true);
  if(!d.chainChosen)card("chain","purple","Bananenkette","35 % Chance: Ein anderes Bodenfeld erhält für seinen nächsten Treffer +50 % Schaden.",()=>d.chainChosen=true);
  if(!d.instinctChosen)card("instinct","purple","Affeninstinkt","Liegt keine Banane, folgt der nächste Wurf bereits nach 1 Sekunde.",()=>d.instinctChosen=true);
  return pool;
}

function drawKikoField(field){
  const pulse=.92+.08*Math.sin(state.elapsed*5+field.id);
  ctx.save();ctx.translate(field.x,field.y);ctx.globalAlpha=Math.min(1,field.life*2);
  if(field.kind==="slick"){
    ctx.fillStyle="rgba(250,218,78,.22)";ctx.strokeStyle=field.chainBoost?"#fff4a0":"rgba(255,230,105,.7)";ctx.lineWidth=field.chainBoost?3:1.5;ctx.beginPath();ctx.ellipse(0,0,field.radius*pulse,field.radius*.45*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  }else if(field.kind==="pile"){
    for(let n=0;n<4;n++){ctx.save();ctx.rotate(n*.7-.9);ctx.fillStyle="#f4cf27";ctx.strokeStyle="#8f6911";ctx.lineWidth=1;ctx.beginPath();ctx.arc(n*2-3,0,8,0,Math.PI);ctx.stroke();ctx.fill();ctx.restore();}
  }else{
    ctx.rotate(Math.sin(field.id)*.5);ctx.strokeStyle=field.chainBoost?"#fff8b5":"#987116";ctx.lineWidth=field.chainBoost?3:1.5;ctx.fillStyle=field.golden?"#fff06a":"#f2cf2d";ctx.beginPath();ctx.arc(-5,0,8,-1.1,1.2);ctx.stroke();ctx.beginPath();ctx.arc(5,0,8,1.9,4.4);ctx.stroke();
  }
  if(field.chainBoost){ctx.shadowColor="#fff27a";ctx.shadowBlur=12;ctx.strokeStyle="#fff27a";ctx.beginPath();ctx.arc(0,0,field.radius*.75,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}

function drawKiko(member,ctx,anchor){
  const d=member.data;
  for(const field of d.slicks)drawKikoField(field);for(const trap of d.traps)drawKikoField(trap);
  for(const flight of d.throws){const t=Math.min(1,flight.age/flight.duration),x=flight.fromX+(flight.toX-flight.fromX)*t,y=flight.fromY+(flight.toY-flight.fromY)*t-Math.sin(t*Math.PI)*38;ctx.save();ctx.translate(x,y);ctx.rotate(t*Math.PI*4);ctx.fillStyle=flight.trap.golden?"#fff27b":"#f2cf2d";ctx.strokeStyle="#7d5d12";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,7,-1.1,1.1);ctx.stroke();ctx.restore();}
  const x=anchor.x,y=anchor.y,lift=Math.sin(state.elapsed*3+member.slot.length)*1.5+(d.throwPulse>0?Math.sin(d.throwPulse/.22*Math.PI)*3:0);
  ctx.save();ctx.translate(x,y+30);ctx.fillStyle="#704b25";ctx.fillRect(-16,-2,32,7);ctx.fillStyle="#416e2c";ctx.beginPath();ctx.ellipse(-13,-3,8,3,-.5,0,Math.PI*2);ctx.ellipse(13,-3,8,3,.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f2ce31";ctx.beginPath();ctx.arc(8,1,5,0,Math.PI);ctx.strokeStyle="#8e6916";ctx.stroke();
  if(d.chaosRemaining>0){ctx.strokeStyle="rgba(255,232,91,.9)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,24+Math.sin(state.elapsed*8)*3,0,Math.PI*2);ctx.stroke();}
  ctx.restore();ctx.save();
  if(kikoSprite.complete&&kikoSprite.naturalWidth)ctx.drawImage(kikoSprite,x-18,y-17-lift,36,42);else{ctx.fillStyle="#b8782e";ctx.beginPath();ctx.arc(x,y-lift,12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#79a842";ctx.fillRect(x-10,y+8-lift,20,4);}
  ctx.restore();
}

function createKikoState(){return {
  normalTimer:1,pileTimer:kikoSkill("pile",18,16),chaosTimer:kikoSkill("chaos",30,27),chaosCooldown:kikoSkill("chaos",30,27),chaosRemaining:0,throwPulse:0,chaosPulse:0,
  throwInterval:4.5,maxActive:3,bananaLife:10,bananaSlowBonus:0,bananaDamageBonus:0,radiusBonus:0,
  slickDurationBonus:0,slickSlowBonus:0,pileCooldown:kikoSkill("pile",18,16),pileLife:12,pileRadiusBonus:0,pileDamageBonus:0,pileSlowBonus:0,
  chaosDuration:6,chaosExtra:0,goldenChosen:false,chainChosen:false,instinctChosen:false,tiers:{},traps:[],slicks:[],throws:[]
};}

registerSecondary({id:KIKO_ID,name:"Kiko",kind:"trap",createState:createKikoState,update:updateKiko,draw:drawKiko,upgradePool:kikoUpgradePool});

function renderKikoProfile(){
  const p=progress.data,unlocked=p.secondaryUnlocked.includes(KIKO_ID),button=document.querySelector("#unlockKiko");
  button.disabled=true;button.textContent="Kiko freigeschaltet · 0 Münzen";
  for(const slot of SECONDARY_SLOTS){
    const element=document.querySelector("#secondarySlot"+slot),active=p.secondarySlots[slot]===KIKO_ID,label={left:"Links",center:"Mitte",right:"Rechts"}[slot];
    element.innerHTML=active?'<img src="kiko-front.png?v=24-0" alt="Kiko"><strong>Kiko</strong><small>Bananenwerfer · Aktiv</small>':'<span aria-hidden="true">＋</span><strong>'+label+'</strong><small>Noch frei</small>';
    const equip=document.querySelector("#equipKiko"+slot);equip.disabled=!unlocked;equip.textContent=label+(active?" · Aktiv":" einsetzen");
  }
  document.querySelector("#unequipKiko").disabled=!Object.values(p.secondarySlots).includes(KIKO_ID);
}

function bindKikoMenu(){
  document.querySelector("#unlockKiko").addEventListener("click",()=>{if(state.mode!=="start")return;renderProfile();document.querySelector("#heroStatus").textContent="Kiko ist bereits kostenlos freigeschaltet.";});
  for(const slot of [...SECONDARY_SLOTS,null])document.querySelector(slot?"#equipKiko"+slot:"#unequipKiko").addEventListener("click",()=>{
    if(state.mode!=="start")return;const ok=progress.equipSecondary(slot?KIKO_ID:null,slot||SECONDARY_SLOTS.find(s=>progress.data.secondarySlots[s]===KIKO_ID));renderProfile();
    document.querySelector("#heroStatus").textContent=ok?(slot?"Kiko unterstützt ab der nächsten Runde den Sekundärslot "+({left:"links",center:"in der Mitte",right:"rechts"}[slot])+".":"Kiko wurde aus dem Team genommen."):progress.message;
  });
}
