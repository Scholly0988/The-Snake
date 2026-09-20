"use strict";
function newNecromancer(slot) {
  return slot ? {slot,fireTimer:0,pulse:0,limit:3,soulBonus:0,speedBonus:0,markChance:.05,markCooldown:0,
    binding:0,endless:0,explosion:0,strongDamage:3,choir:0,siphon:0,curse:0,chain:0,harvest:0,
    storm:false,legion:false,elite:0,seal:false,sealCount:0,ultimate:false,remaining:22,charge:0,
    taken:{},tiers:{}} : null;
}
function necromancerX() { return state.player.x+(state.necromancer.slot==="left"?-36:36); }
function necromancerDamage() { return (state.weapon.damage+.2)*skillValue("necromancer","attack",1,1.2); }
function necromancerHitRoll(random) {
  const critical=random()*100<Math.min(100,state.weapon.critChance+5);
  return {critical,damage:necromancerDamage()*(critical?state.weapon.critDamage/100:1)};
}
function necroDamage(segment,damage) {
  if (!isSegmentVisible(segment)) return 0;
  segment.necroTouched=true;
  return damage;
}
function prepareNecroHit(segment,hit,random) {
  const n=state.necromancer;
  if (segment===state.snake[0] && n.markCooldown<=0) {
    n.markCooldown=skillValue("necromancer","markChance",1,.75);
    if (random()<n.markChance) {
      const candidates=visibleTargets().filter(s=>!s.soulMark);
      if(candidates.length) {
        const target=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
        target.soulMark=true;
      }
    }
  }
  hit.damage=necroDamage(segment,hit.damage);
  if (hit.critical && random()<n.harvest) spawnSoul(segment,{small:true});
}
function regularSoulCount() { return state.souls.filter(s=>!s.dead&&!s.temporary&&!s.swirl).length; }
function spawnSoul(center,options={}) {
  const n=state.necromancer;
  if (!n || (!options.temporary&&!options.swirl&&regularSoulCount()>=n.limit)) return null;
  const soul={x:center.x,y:center.y,originX:center.x,originY:center.y,age:0,wait:.3,
    phase:"attack",attacks:0,rest:0,angle:0,radius:0,hitIds:new Set(),jumps:0,hits:0,dead:false,...options};
  if (soul.strong && !soul.swirl) { soul.orbitTime=0; soul.wait=0; }
  state.souls.push(soul);
  // Each successful creation counts, including temporary and vortex souls.
  if (n.ultimate) n.remaining=Math.max(0,n.remaining-n.siphon);
  return soul;
}
function soulDamage(soul, area = false) {
  const n=state.necromancer;
  const base=soul.swirl?skillValue("necromancer","seal",2,2.5):soul.elite?[2.2,3.3,4.4][Math.max(0,Math.min(2,n.elite-1))]:soul.strong?n.strongDamage:soul.small?skillValue("necromancer","harvest",1.5,2):2;
  const permanent=soul.elite?skillValue("necromancer","elite",1,1.2):!soul.swirl&&!soul.small?skillValue("necromancer","soul",1,1.2):1;
  return permanent*(base+((area || soul.swirl) ? state.weapon.damage : (state.weapon.soulDamageBonus || 0)))*(1+n.soulBonus)*(n.legion?skillValue("necromancer","legion",.8,.9):1)*(n.storm&&state.souls.filter(s=>!s.dead).length>=skillValue("necromancer","storm",5,4)?1.2:1);
}
function necroArea(batch,center,radius,damage) {
  for (const s of state.snake) if (segmentInArea(s,center,radius))
    addDamage(batch,s,necroDamage(s,damage));
  state.soulEffects.push({x:center.x,y:center.y,radius,life:.4});
}
function resolveNecroDeaths() {
  const n=state.necromancer;
  if (!n || n.resolving) return;
  n.resolving=true;
  try {
    while (state.necroDeaths.length) {
      const deaths=state.necroDeaths.splice(0), batch=new Map();
      for (const {segment:s,neighbors} of deaths) {
        if (s.necroTouched || s.soulMark) spawnSoul(s,{strong:!!s.soulMark,elite:!!(s.soulMark&&n.curse>0&&n.elite)});
        if (!s.soulMark) continue;
        if (n.chain && Math.random()<n.chain) {
          const candidates=visibleTargets().filter(t=>!t.soulMark);
          const neighbor=candidates[Math.floor(Math.random()*candidates.length)];
          if (neighbor) neighbor.soulMark=true;
        }
        if (n.seal) {
          if (++n.sealCount>=5) {
            n.sealCount=0;
            for (let i=0;i<50;i++) spawnSoul(s,{swirl:true,temporary:true,wait:0,angle:i*Math.PI*2/50});
          }
        } else if (n.explosion) necroArea(batch,s,52.5,(n.explosion+state.weapon.damage)*(1+n.soulBonus)*skillValue("necromancer","explosion",1,1.2));
      }
      for (const s of state.snake) if (isSegmentVisible(s) && batch.has(s.id)) s.hp-=batch.get(s.id)*segmentDamageMultiplier(s);
      for (let i=state.snake.length-1;i>=0;i--) if (state.snake[i].hp<=0) destroySegment(i,false);
    }
  } finally { n.resolving=false; }
}
// Earliest contact along this frame's flight, independent of snake order.
function soulContactTime(soul, target) {
  const ax=soul.previousX??soul.x, ay=soul.previousY??soul.y;
  const dx=soul.x-ax, dy=soul.y-ay;
  const ox=ax-target.x, oy=ay-target.y;
  const c=ox*ox+oy*oy-SEGMENT_HIT_RADIUS**2;
  if(c<=0)return 0;
  const a=dx*dx+dy*dy;
  if(!a)return Infinity;
  const b=2*(ox*dx+oy*dy), discriminant=b*b-4*a*c;
  if(discriminant<0)return Infinity;
  const t=(-b-Math.sqrt(discriminant))/(2*a);
  return t>=0&&t<=1?t:Infinity;
}
function hitVortexSoul(soul) {
  if(soul.dead)return;
  const head=snakeHead();
  const contacts=state.snake.map((segment,index)=>({
    segment,
    time:Math.min(soulContactTime(soul,segment),
      index===0&&head?soulContactTime(soul,head):Infinity)
  })).filter(c=>isSegmentVisible(c.segment)&&Number.isFinite(c.time)&&!soul.hitIds.has(c.segment.id))
    .sort((a,b)=>a.time-b.time);
  const batch=new Map(), damage=soulDamage(soul);
  for(const {segment} of contacts) {
    if(soul.hits>=3)break;
    soul.hitIds.add(segment.id);
    addDamage(batch,segment,necroDamage(segment,damage));
    state.soulEffects.push({x:segment.x,y:segment.y,radius:12,life:.4});
    soul.hits++;
  }
  if(soul.hits>=3)soul.dead=true;
  if(batch.size)applyDamageBatch(batch);
}
function chooseSoulTarget(soul, random=Math.random) {
  const candidates=visibleTargets().filter(t=>t.hp>0&&!soul.hitIds.has(t.id));
  const marked=candidates.filter(t=>t.soulMark);
  if(marked.length)return marked[Math.min(marked.length-1,Math.floor(random()*marked.length))];
  return candidates.sort((a,b)=>Math.hypot(a.x-soul.x,a.y-soul.y)-Math.hypot(b.x-soul.x,b.y-soul.y))[0];
}
function finishSoulAttack(soul) {
  soul.attacks++;
  soul.targetId=null;
  if(soul.attacks>=3+state.necromancer.endless)soul.dead=true;
  else {soul.phase="return";soul.rest=0;soul.angle=0;}
}
function moveSoulTo(soul,x,y,speed,dt) {
  const dx=x-soul.x,dy=y-soul.y,d=Math.hypot(dx,dy),step=Math.min(d,speed*dt);
  if(d){soul.x+=dx/d*step;soul.y+=dy/d*step;}
  return d<=step;
}
function restSoul(soul,speed,dt) {
  const x=Math.min(30,state.width/2),y=Math.max(20,state.height-32),radius=12;
  if(soul.phase==="return") {
    if(moveSoulTo(soul,x+radius,y,speed,dt)){soul.phase="rest";soul.rest=state.necromancer.endless>0?skillValue("necromancer","endless",5,4):5;soul.angle=0;}
  } else {
    soul.rest=Math.max(0,soul.rest-dt);soul.angle+=dt*Math.PI*2;
    soul.x=x+radius*Math.cos(soul.angle);soul.y=y+radius*Math.sin(soul.angle);
    if(soul.rest===0){soul.phase="attack";soul.targetId=null;soul.hitIds.clear();soul.jumps=0;}
  }
}
function updateNecromancer(dt) {
  const n=state.necromancer;
  if (!n) return;
  resolveNecroDeaths();
  n.markCooldown=Math.max(0,n.markCooldown-dt);
  n.pulse=Math.max(0,n.pulse-dt);
  n.fireTimer-=dt;
  if (n.fireTimer<=0) {
    state.bullets.push({owner:"necromancer",x:necromancerX(),y:state.player.y+PLATFORM_SHOT_Y,
      vx:0,vy:-510*.9,hitsLeft:1+state.weapon.pierce,dead:false});
    n.fireTimer+=1/(state.weapon.shotsPerSecond*.85);n.pulse=.2;
  }
  if (n.ultimate) {
    if (n.charge>0) {
      n.charge=Math.max(0,n.charge-dt);
      if (!n.charge) {
        n.remaining=skillValue("necromancer","call",22,20);
        for (let i=0;i<2+n.choir;i++) spawnSoul({x:necromancerX(),y:state.player.y+PLATFORM_SHOT_Y},{temporary:true,wait:0});
        state.souls.forEach(s=>{if(!s.swirl&&s.phase==="attack"){s.wait=0;s.targetId=null;}});
      }
    } else {
      n.remaining=Math.max(0,n.remaining-dt);
      if (!n.remaining && visibleTargets().length) n.charge=.5;
    }
  }
  for (const e of state.soulEffects) e.life-=dt;
  state.soulEffects=state.soulEffects.filter(e=>e.life>0);
  // Snapshot: newly born souls are processed next frame, never recursively.
  for (const s of [...state.souls]) {
    if (s.dead) continue;
    if (n.charge>0) continue;
    s.age+=dt;
    if (s.swirl&&s.age>12) {s.dead=true;continue;}
    // Marked souls complete one small circle before targeting or dealing damage.
    // A separate timer keeps Totenruf and upgrades from skipping the entrance.
    if (s.orbitTime !== undefined && s.orbitTime < .65) {
      s.orbitTime=Math.min(.65,s.orbitTime+dt);
      const angle=s.orbitTime/.65*Math.PI*2;
      s.x=s.originX+14*Math.sin(angle);
      s.y=s.originY+14*(1-Math.cos(angle));
      continue;
    }
    if (s.wait>0) {s.wait-=dt;continue;}
    const speed=180*(1+n.speedBonus)*(n.storm&&state.souls.filter(t=>!t.dead).length>=skillValue("necromancer","storm",5,4)?1.25:1);
    if(!s.swirl&&s.phase!=="attack"){restSoul(s,speed,dt);continue;}
    s.previousX=s.x;s.previousY=s.y;
    if (s.swirl) {
      s.radius+=speed*.65*dt;s.angle+=1.5*dt;
      s.x=s.originX+Math.cos(s.angle)*s.radius;s.y=s.originY+Math.sin(s.angle)*s.radius;
      hitVortexSoul(s);
      if (s.radius>Math.hypot(state.width,state.height)+50) s.dead=true;
    } else {
      let target=visibleTargets().find(t=>t.id===s.targetId&&t.hp>0&&!s.hitIds.has(t.id));
      if (!target) target=chooseSoulTarget(s);
      if (!target) continue;
      s.targetId=target.id;
      const dx=target.x-s.x,dy=target.y-s.y,d=Math.hypot(dx,dy),step=Math.min(d,speed*dt);
      if(d){s.x+=dx/d*step;s.y+=dy/d*step;}
      if (projectileHits(s,target)) {
        s.hitIds.add(target.id);s.hits++;s.targetId=null;
        // First contact is the initial attack; subsequent contacts are jumps.
        s.jumps=s.hitIds.size-1;
        const damage=soulDamage(s)*(s.jumps>0?skillValue("necromancer","binding",1,1.2):1);
        const batch=new Map([[target.id,necroDamage(target,damage)]]);
        if(n.binding===5 && s.jumps===5) necroArea(batch,target,80,soulDamage(s,true)*2*skillValue("necromancer","binding",1,1.2));
        if (s.jumps>=n.binding || !chooseSoulTarget(s)) finishSoulAttack(s);
        state.soulEffects.push({x:target.x,y:target.y,radius:15,life:.4});
        applyDamageBatch(batch);
      }
    }
    if(state.mode!=="playing")break;
  }
  state.souls=state.souls.filter(s=>!s.dead);
}
function necromancerUpgradePool() {
  const n=state.necromancer;if(!n)return [];
  const pool=[];
  function card(id,rarity,name,text,apply) {
    pool.push({id:"necro-"+id,rarity,name,text:"Vaelric · "+skillCardText("necromancer",id,text),apply});
  }
  const repeat=[
    ["limit","Ruhelose Seelen",[1,2,3],"maximale Seelen"],
    ["soulBonus","Seelenhunger",[.15,.30,.50],"Seelenschaden"],
    ["speedBonus","Geisterflug",[.20,.40,.70],"Seelengeschwindigkeit"],
    ["explosion","Seelenexplosion",[.3,.6,1],"Explosionsschaden (Radius 52,5)"],
    ["strongDamage","Verstärkte Bindung",[1.7,2,2.5],"Schaden markierter Seelen"],
    ["choir","Totenchor",[1,2,4],"temporäre Seelen bei Totenruf"],
    ["curse","Fluch des Todes",[.10,.20,.35],"Schaden gegen markierte Segmente"]
  ];
  const once=[
    ["markChance","Dunkles Mal",[.05,.10,.15]],
    ["endless","Endlose Diener",[1,2,3]],
    ["harvest","Unheilige Ernte",[.05,.10,.20]]
  ];
  const highest=[
    ["siphon","Seelensog",[.3,.5,.8],"s kürzere Totenruf-Abklingzeit je erzeugter Seele"],
    ["chain","Kettenfluch",[.20,.35,.55],"Chance, eine Marke weiterzugeben"]
  ];
  for (const [i,rarity] of ["grey","green","purple"].entries()) {
    for (const [key,name,values,unit] of repeat) {
      if(key==="choir"&&!n.ultimate || key==="explosion"&&n.seal)continue;
      const v=values[i]+necroSkillDelta(key),percent=["soulBonus","speedBonus","curse"].includes(key);
      const amount=String(v).replace(".",",");
      const description={
        limit:"Erhöht die Anzahl gleichzeitig gebundener Seelen um "+v+".",
        soulBonus:"Erhöht den Schaden aller beschworenen Seelen um "+Math.round(v*100)+" %.",
        speedBonus:"Deine Seelen fliegen "+Math.round(v*100)+" % schneller.",
        explosion:"Stirbt ein markiertes Segment, explodiert es. Erhöht den Schaden dieser Explosion um "+amount+" im Umkreis von 52,5 Pixeln. Der aktuelle Standardwaffenschaden wird vor Prozentboni addiert.",
        strongDamage:"Seelen aus markierten Segmenten verursachen "+amount+" zusätzlichen Basisschaden.",
        choir:"Totenruf beschwört "+v+" zusätzliche Seelen.",
        curse:"Markierte Segmente erleiden "+Math.round(v*100)+" % mehr Schaden durch alle Helden, Angriffe, Seelen und Flächeneffekte."
      }[key];
      card(key+"-"+rarity,rarity,name,description,()=>n[key]+=v);
    }
    for (const [key,name,values] of once) {
      const id=key+"-"+rarity,v=values[i];
      if(!n.taken[id]) card(id,rarity,name,{
        endless:"Jede Seele führt "+v+" zusätzliche Angriffszyklen aus. Dazwischen kehrt sie zurück und kreist 5 Sekunden unten links.",
        markChance:"Höchstens einmal pro Sekunde kann ein Stabtreffer auf das erste Segment ein zufälliges unmarkiertes Segment im sichtbaren Spielfeld markieren. Erhöht diese Chance um "+Math.round(v*100)+" Prozentpunkte. Markierte Segmente hinterlassen stärkere Seelen.",
        harvest:"Erhöht die Chance, bei einem kritischen Stabtreffer eine kleine Seele zu beschwören, um "+Math.round(v*100)+" Prozentpunkte."
      }[key],()=>{if(!n.taken[id]){n[key]+=v;n.taken[id]=true;}});
    }
    for (const [key,name,values,unit] of highest) {
      if(key==="siphon"&&!n.ultimate)continue;
      const v=values[i]+necroSkillDelta(key);
      if((n.tiers[key]??-1)<i)card(key+"-"+rarity,rarity,name,(key==="siphon"?"Jede neu beschworene Seele verkürzt die verbleibende Abklingzeit von Totenruf um "+String(v).replace(".",",")+" Sekunden.":"Stirbt ein markiertes Segment, springt seine Marke mit "+Math.round(v*100)+" % Chance auf ein zufälliges unmarkiertes sichtbares Segment über."),()=>{n[key]=Math.max(n[key],v);n.tiers[key]=Math.max(n.tiers[key]??-1,i);});
    }
  }
  for(const [rarity,jumps] of [["grey",1],["green",2],["purple",3],["orange",5]]) {
    if(n.binding<jumps)card("binding-"+rarity,rarity,"Verdammte Bindung",
      "Nach dem ersten Treffer springt jede Seele zu "+jumps+" weiteren Zielen und fügt ihnen Schaden zu. Danach kehrt sie zurück."+
      (jumps===5?" Beim 5. Sprung: zusätzlich 200 % Seelenschaden im Radius von 80 px.":""),
      ()=>n.binding=Math.max(n.binding,jumps));
  }
  if(!n.storm)card("storm","green","Seelensturm","Solange mindestens 5 Seelen aktiv sind, fliegen sie 25 % schneller und verursachen 20 % mehr Schaden.",()=>n.storm=true);
  if(n.elite<3)card("elite","purple","Letzter Fluch","Mit Fluch des Todes hinterlassen zerstörte markierte Segmente Elite-Seelen mit "+String([2.2,3.3,4.4][n.elite]).replace(".",",")+" Basisschaden.",()=>n.elite=Math.min(3,n.elite+1));
  if(!n.legion)card("legion","purple","Seelenlegion","Du kannst 5 weitere Seelen gleichzeitig binden. Dafür verursachen alle Seelen 20 % weniger Schaden. Seelenexplosion ist davon ausgenommen.",()=>{if(!n.legion){n.legion=true;n.limit+=5;}});
  if(!n.seal)card("seal","orange","Todessiegel","Nach 5 zerstörten markierten Segmenten brechen 50 Seelen spiralförmig hervor. Jede verursacht 2 Basisschaden plus Standardwaffenschaden pro Treffer und trifft bis zu 3 Segmente. Ersetzt die Explosion beim Tod markierter Segmente.",()=>n.seal=true);
  if(!n.ultimate)card("call","orange","Totenruf","Alle 22 s gemeinsamer Seelenangriff und 2 temporäre Seelen. Schaltet Totenchor und Seelensog frei.",()=>{n.ultimate=true;n.remaining=skillValue("necromancer","call",22,20);});
  return pool;
}
function renderNecromancerProfile() {
  const p=progress.data,b=document.querySelector("#unlockNecromancer");
  b.disabled=p.necromancerUnlocked||p.coins<progress.heroCost();
  b.textContent=p.necromancerUnlocked?"Vaelric freigeschaltet":"Vaelric freischalten · "+progress.heroCost()+" Münzen";
  for(const side of ["left","right"]) {
    const button=document.querySelector("#equipNecromancer"+side);
    button.disabled=!p.necromancerUnlocked;
    button.textContent=(side==="left"?"Links":"Rechts")+(p.necromancerSlot===side?" · Aktiv":" einsetzen");
    if(p.necromancerSlot===side)document.querySelector("#heroSlot"+side).innerHTML='<img src="necromancer-platform.png" alt="Vaelric"><strong>Vaelric</strong><small>Seelenstab · Aktiv</small>';
  }
  document.querySelector("#unequipNecromancer").disabled=!p.necromancerSlot;
}
function bindNecromancerMenu() {
  document.querySelector("#unlockNecromancer").addEventListener("click",()=>{
    if(state.mode!=="start")return;
    const ok=progress.unlockHero("necromancer");renderProfile();
    document.querySelector("#heroStatus").textContent=ok?"Vaelric freigeschaltet. Wähle links oder rechts.":progress.message;
  });
  for(const side of ["left","right",null])document.querySelector(side?"#equipNecromancer"+side:"#unequipNecromancer").addEventListener("click",()=>{
    if(state.mode!=="start")return;
    progress.equipHero("necromancer",side);renderProfile();
  });
}
function soulColor(soul = {}) {
  if(soul.swirl)return "#ff83bd";
  if(soul.elite)return "#ffd36a";
  if(soul.small)return "#66dfff";
  if(soul.strong)return "#bf8aff";
  return "#8fffd0";
}
function drawSoulOrb(x,y,size,soul = {}) {
  const color=soulColor(soul);
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=10;
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+size);ctx.lineTo(x-3,y+size+7);ctx.stroke();
  ctx.fillStyle="#392355";ctx.fillRect(x-2,y-1,1,2);ctx.fillRect(x+1,y-1,1,2);ctx.restore();
}
function drawNecromancer() {
  const n=state.necromancer;if(!n)return;
  const x=necromancerX(),y=state.player.y;
  ctx.save();
  if(necromancerSprite.complete&&necromancerSprite.naturalWidth)ctx.drawImage(necromancerSprite,x-20,y-15,40,56);
  else{ctx.fillStyle="#a695c5";ctx.fillRect(x-14,y+25,28,16);ctx.fillStyle="#894ac0";ctx.fillRect(x-8,y,16,26);}
  if(n.pulse)drawSoulOrb(x+10,y-8,3+n.pulse*10);
  for(const s of state.snake)if(s.soulMark&&s.y>=0){
    ctx.strokeStyle="#ce9bff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,17,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#edcaff";ctx.font="12px system-ui";ctx.textAlign="center";ctx.fillText("☠",s.x,s.y+4);
  }
  for(const s of state.souls)drawSoulOrb(s.x,s.y,s.elite?7:s.small?3:5,s);
  for(const e of state.soulEffects){
    const remaining=Math.max(0,Math.min(1,e.life/.4));
    ctx.globalAlpha=remaining;ctx.strokeStyle="#ad81ff";ctx.beginPath();
    ctx.arc(e.x,e.y,Math.max(0,e.radius)*(1-remaining),0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
