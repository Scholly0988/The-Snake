"use strict";
function newNecromancer(slot) {
  return slot ? {slot,fireTimer:0,pulse:0,limit:3,soulBonus:0,speedBonus:0,markChance:.2,
    binding:0,endless:0,explosion:0,strongDamage:1,choir:0,siphon:0,curse:0,chain:0,harvest:0,
    storm:false,legion:false,elite:0,seal:false,sealCount:0,ultimate:false,remaining:22,charge:0,
    taken:{},tiers:{}} : null;
}
function necromancerX() { return state.player.x+(state.necromancer.slot==="left"?-36:36); }
function necromancerDamage() { return state.weapon.damage+.2; }
function necromancerHitRoll(random) {
  const critical=random()*100<Math.min(100,state.weapon.critChance+5);
  return {critical,damage:necromancerDamage()*(critical?state.weapon.critDamage/100:1)};
}
function necroDamage(segment,damage) {
  segment.necroTouched=true;
  return damage*(segment.soulMark?1+state.necromancer.curse:1);
}
function prepareNecroHit(segment,hit,random) {
  const n=state.necromancer;
  if (random()<n.markChance) segment.soulMark=true;
  hit.damage=necroDamage(segment,hit.damage);
  if (hit.critical && random()<n.harvest) spawnSoul(segment,{small:true});
}
function regularSoulCount() { return state.souls.filter(s=>!s.dead&&!s.temporary&&!s.swirl).length; }
function spawnSoul(center,options={}) {
  const n=state.necromancer;
  if (!n || (!options.temporary&&!options.swirl&&regularSoulCount()>=n.limit)) return null;
  const soul={x:center.x,y:center.y,originX:center.x,originY:center.y,age:0,wait:.3,
    angle:0,radius:0,hitIds:new Set(),jumps:0,hits:0,dead:false,...options};
  state.souls.push(soul);
  // Each successful creation counts, including temporary and vortex souls.
  if (n.ultimate) n.remaining=Math.max(0,n.remaining-n.siphon);
  return soul;
}
function soulDamage(soul) {
  const n=state.necromancer;
  const base=soul.swirl?.9:soul.elite?.6*(n.elite+1):soul.strong?n.strongDamage:soul.small?.3:.6;
  return base*(1+n.soulBonus)*(n.legion?.8:1)*(n.storm&&state.souls.filter(s=>!s.dead).length>=5?1.2:1);
}
function necroArea(batch,center,radius,damage) {
  for (const s of state.snake) if (s.hp>0&&Math.hypot(s.x-center.x,s.y-center.y)<=radius)
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
          const neighbor=neighbors.find(t=>state.snake.includes(t)&&t.hp>0&&!t.soulMark);
          if (neighbor) neighbor.soulMark=true;
        }
        if (n.seal) {
          if (++n.sealCount>=5) {
            n.sealCount=0;
            for (let i=0;i<50;i++) spawnSoul(s,{swirl:true,temporary:true,wait:0,angle:i*Math.PI*2/50});
          }
        } else if (n.explosion) necroArea(batch,s,42,n.explosion*(1+n.soulBonus)*(n.legion?.8:1));
      }
      for (const s of state.snake) if (batch.has(s.id)) s.hp-=batch.get(s.id);
      for (let i=state.snake.length-1;i>=0;i--) if (state.snake[i].hp<=0) destroySegment(i,false);
    }
  } finally { n.resolving=false; }
}
function updateNecromancer(dt) {
  const n=state.necromancer;
  if (!n) return;
  resolveNecroDeaths();
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
        n.remaining=22;
        const targets=visibleTargets();
        for (let i=0;i<2+n.choir;i++) spawnSoul({x:necromancerX(),y:state.player.y+PLATFORM_SHOT_Y},{temporary:true,wait:0});
        state.souls.forEach((s,i)=>{if(!s.swirl){s.wait=0;s.targetId=targets[i%targets.length]?.id;}});
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
    if ((s.swirl&&s.age>12)||(s.temporary&&!s.swirl&&s.age>8)) {s.dead=true;continue;}
    if (s.wait>0) {s.wait-=dt;continue;}
    const speed=180*(1+n.speedBonus)*(n.storm&&state.souls.filter(t=>!t.dead).length>=5?1.25:1);
    s.previousX=s.x;s.previousY=s.y;
    if (s.swirl) {
      s.radius+=speed*.65*dt;s.angle+=1.5*dt;
      s.x=s.originX+Math.cos(s.angle)*s.radius;s.y=s.originY+Math.sin(s.angle)*s.radius;
      const batch=new Map();
      for (const target of visibleTargets()) {
        if (s.hitIds.has(target.id)||!projectileHits(s,target)) continue;
        s.hitIds.add(target.id);addDamage(batch,target,necroDamage(target,soulDamage(s)));
        if (++s.hits===3) {s.dead=true;break;}
      }
      if (s.radius>Math.hypot(state.width,state.height)+50) s.dead=true;
      if(batch.size) applyDamageBatch(batch);
    } else {
      let target=state.snake.find(t=>t.id===s.targetId&&t.y>=0&&!s.hitIds.has(t.id));
      if (!target) target=visibleTargets().filter(t=>!s.hitIds.has(t.id)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
      if (!target) continue;
      s.targetId=target.id;
      const dx=target.x-s.x,dy=target.y-s.y,d=Math.hypot(dx,dy),step=Math.min(d,speed*dt);
      if(d){s.x+=dx/d*step;s.y+=dy/d*step;}
      if (projectileHits(s,target)) {
        s.hitIds.add(target.id);s.hits++;s.targetId=null;
        const extra=s.jumps===0&&Math.random()<n.binding;
        if(extra)s.jumps++;
        if (!extra&&Math.random()>=n.endless) s.dead=true;
        const batch=new Map([[target.id,necroDamage(target,soulDamage(s))]]);
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
    pool.push({id:"necro-"+id,rarity,name,text:"Vaelric · "+text,apply});
  }
  const repeat=[
    ["limit","Ruhelose Seelen",[1,2,3],"maximale Seelen"],
    ["soulBonus","Seelenhunger",[.15,.30,.50],"Seelenschaden"],
    ["speedBonus","Geisterflug",[.20,.40,.70],"Seelengeschwindigkeit"],
    ["explosion","Seelenexplosion",[.3,.6,1],"Explosionsschaden (Radius 42)"],
    ["strongDamage","Verstärkte Bindung",[.2,.5,1],"Schaden markierter Seelen"],
    ["choir","Totenchor",[1,2,4],"temporäre Seelen bei Totenruf"],
    ["curse","Fluch des Todes",[.10,.20,.35],"Schaden gegen markierte Segmente"]
  ];
  const once=[
    ["markChance","Dunkles Mal",[.10,.20,.35]],
    ["endless","Endlose Diener",[.10,.20,.35]],
    ["harvest","Unheilige Ernte",[.05,.10,.20]]
  ];
  const highest=[
    ["binding","Verdammte Bindung",[.20,.40,.70],"Chance auf ein weiteres Ziel"],
    ["siphon","Seelensog",[.3,.5,.8],"s kürzere Totenruf-Abklingzeit je erzeugter Seele"],
    ["chain","Kettenfluch",[.20,.35,.55],"Chance, eine Marke weiterzugeben"]
  ];
  for (const [i,rarity] of ["grey","green","purple"].entries()) {
    for (const [key,name,values,unit] of repeat) {
      if(key==="choir"&&!n.ultimate || key==="explosion"&&n.seal)continue;
      const v=values[i],percent=["soulBonus","speedBonus","curse"].includes(key);
      card(key+"-"+rarity,rarity,name,"+"+(percent?Math.round(v*100)+" %":v)+" "+unit+". Wiederholbar; addiert sich.",()=>n[key]+=v);
    }
    for (const [key,name,values] of once) {
      const id=key+"-"+rarity,v=values[i];
      if(!n.taken[id]) card(id,rarity,name,"+"+Math.round(v*100)+" Prozentpunkte. Jede Seltenheit einmal.",()=>{if(!n.taken[id]){n[key]+=v;n.taken[id]=true;}});
    }
    for (const [key,name,values,unit] of highest) {
      if(key==="siphon"&&!n.ultimate)continue;
      const v=values[i];
      if((n.tiers[key]??-1)<i)card(key+"-"+rarity,rarity,name,(key==="siphon"?v:Math.round(v*100)+" %")+" "+unit+". Ersetzt die niedrigere Stufe.",()=>{n[key]=Math.max(n[key],v);n.tiers[key]=Math.max(n.tiers[key]??-1,i);});
    }
  }
  if(!n.storm)card("storm","green","Seelensturm","Ab 5 aktiven Seelen: +25 % Geschwindigkeit, +20 % Schaden. Einmal.",()=>n.storm=true);
  if(n.elite<3)card("elite","purple","Letzter Fluch",(n.elite+2)*100+" % normalen Seelenschaden für Elite-Seelen. Benötigt Fluch des Todes. Maximal 3 Stufen.",()=>n.elite=Math.min(3,n.elite+1));
  if(!n.legion)card("legion","purple","Seelenlegion","+5 maximale Seelen; −20 % Seelenschaden. Einmal.",()=>{if(!n.legion){n.legion=true;n.limit+=5;}});
  if(!n.seal)card("seal","orange","Todessiegel","Nach 5 markierten Toden: 50 Wirbelseelen mit 150 % Seelenschaden und je 3 Treffern. Ersetzt Todesexplosionen.",()=>n.seal=true);
  if(!n.ultimate)card("call","orange","Totenruf","Alle 22 s gemeinsamer Seelenangriff und 2 temporäre Seelen. Schaltet Totenchor und Seelensog frei.",()=>{n.ultimate=true;n.remaining=22;});
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
function refreshNecromancerHud() {
  const n=state.necromancer;if(!n)return;
  const el=document.querySelector("#paladinStats");
  el.classList.remove("hidden");
  el.textContent+=(state.paladin?" | ":"")+"Vaelric: "+regularSoulCount()+"/"+n.limit+" Seelen · Krit "+Math.min(100,state.weapon.critChance+5)+" %"+(n.ultimate?" · Ruf "+(n.charge?"lädt":Math.ceil(n.remaining)+" s"):"");
}
function drawSoulOrb(x,y,size,elite) {
  ctx.save();ctx.shadowColor="#a264ff";ctx.shadowBlur=10;
  ctx.fillStyle=elite?"#f4dbff":"#8fffd0";ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#a378ef";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+size);ctx.lineTo(x-3,y+size+7);ctx.stroke();
  ctx.fillStyle="#392355";ctx.fillRect(x-2,y-1,1,2);ctx.fillRect(x+1,y-1,1,2);ctx.restore();
}
function drawNecromancer() {
  const n=state.necromancer;if(!n)return;
  const x=necromancerX(),y=state.player.y;
  ctx.save();
  if(necromancerSprite.complete&&necromancerSprite.naturalWidth)ctx.drawImage(necromancerSprite,x-20,y-15,40,56);
  else{ctx.fillStyle="#a695c5";ctx.fillRect(x-14,y+25,28,16);ctx.fillStyle="#894ac0";ctx.fillRect(x-8,y,16,26);}
  if(n.pulse)drawSoulOrb(x+10,y-8,3+n.pulse*10,false);
  for(const s of state.snake)if(s.soulMark&&s.y>=0){
    ctx.strokeStyle="#ce9bff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,17,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#edcaff";ctx.font="12px system-ui";ctx.textAlign="center";ctx.fillText("☠",s.x,s.y+4);
  }
  for(const s of state.souls)drawSoulOrb(s.x,s.y,s.elite?7:s.small?3:5,s.elite);
  for(const e of state.soulEffects){ctx.globalAlpha=e.life/.4;ctx.strokeStyle="#ad81ff";ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(1-e.life/.4),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
