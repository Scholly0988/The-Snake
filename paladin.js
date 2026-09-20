"use strict";

function newPaladin(slot) {
  return slot ? {slot, fireTimer: 0, hits: 0, impactEvery: 4, damageMultiplier: 1,
    blade:false,bladeEvery:5,throws:0,size: 1.4, speed: .85, radius: 50, explosionMultiplier: 1, pierce: 0,
    revenge: false, morningChance: 0, morningGreen: false, morningPurple: false,
    ultimate: false, cooldown: 20, remaining: 20, charge: 0, swing: 0} : null;
}
function paladinX() { return state.player.x + (state.paladin.slot === "left" ? -36 : 36); }
function paladinDamage() { return (state.weapon.damage + 1) * state.paladin.damageMultiplier; }
// A segment becomes damageable when its center enters the visible canvas.
function isSegmentVisible(s) { return s.x >= 0 && s.x <= state.width && s.y >= 0 && s.y <= state.height; }
function visibleTargets() { return state.snake.filter(s => s.hp > 0 && isSegmentVisible(s)); }
function addDamage(batch, segment, damage) { if (!isSegmentVisible(segment)) return; batch.set(segment.id, (batch.get(segment.id) || 0) + damage); }
function segmentInArea(segment, center, radius) {
  return segment.hp > 0 && isSegmentVisible(segment) && Math.hypot(segment.x-center.x, segment.y-center.y) <= radius + SEGMENT_HIT_RADIUS;
}
function holyArea(batch, center, radius, damage, excludeId = null) {
  for (const s of state.snake) {
    if (s.id !== excludeId && segmentInArea(s, center, radius)) addDamage(batch, s, damage);
  }
  state.holyEffects.push({x:center.x, y:center.y, radius, life:.45, maxLife:.45, kind:"ring"});
}
function paladinExplosion(batch, center, radius, damage, excludeId, random) {
  holyArea(batch, center, radius, damage, excludeId);
  // Second light strike is terminal: it cannot trigger itself or critical effects.
  if (random() < state.paladin.morningChance) {
    holyArea(batch, center, radius, paladinDamage() * .5 * state.paladin.explosionMultiplier);
    state.holyEffects.push({x:center.x,y:center.y,radius:radius*.6,life:.6,maxLife:.6,kind:"light"});
  }
}
function paladinHit(batch, segment, hit, random) {
  const p = state.paladin;
  p.hits++;
  state.holyEffects.push({x:segment.x,y:segment.y,radius:12,life:.2,maxLife:.2,kind:"ring"});
  if (p.hits % p.impactEvery === 0) {
    paladinExplosion(batch, segment, p.radius, paladinDamage() * .5 * p.explosionMultiplier, null, random);
  }
  if (p.revenge && hit.critical) {
    addDamage(batch, segment, paladinDamage() * .5);
    state.holyEffects.push({x:segment.x,y:segment.y,radius:18,life:.4,maxLife:.4,kind:"light"});
  }
}
function updatePaladin(dt) {
  const p = state.paladin;
  if (!p) return;
  p.swing = Math.max(0, p.swing - dt);
  p.fireTimer -= dt;
  if (p.fireTimer <= 0) {
    const x = paladinX();
    if(p.blade)p.throws++;
    const fullSweep=p.blade && p.throws%p.bladeEvery===0;
    // Side platform may overhang; its projectile does not teleport into the arena.
    state.bullets.push({owner:"paladin",x,y:state.player.y+PLATFORM_SHOT_Y,vx:0,
      vy:-510*p.speed,size:p.size,hitsLeft:Infinity,dead:false,hammerPhase:"approach",fullSweep,
      sweepIds:fullSweep?visibleTargets().map(s=>s.id):null,
      charged:p.hits % p.impactEvery === p.impactEvery-1});
    p.fireTimer += 1 / (state.weapon.shotsPerSecond * .65);
    p.swing = .18;
  }
  if (!p.ultimate) return;
  if (p.charge > 0) {
    p.charge = Math.max(0, p.charge - dt);
    if (p.charge === 0) {
      const targets = visibleTargets().sort((a,b)=>b.y-a.y);
      if (!targets.length) { p.remaining = 0; return; }
      const target = targets[0];
      const batch = new Map();
      const radius = p.radius * 2;
      paladinExplosion(batch, target, radius, paladinDamage()*5*p.explosionMultiplier, null, Math.random);
      state.holyEffects.push({x:target.x,y:target.y,radius:36,life:.65,maxLife:.65,kind:"judgment"});
      p.remaining = p.cooldown;
      applyDamageBatch(batch);
    }
  } else {
    p.remaining = Math.max(0, p.remaining - dt);
    if (p.remaining === 0 && visibleTargets().length) p.charge = .45;
  }
}
function moveHeroProjectile(bullet,x,y,speed,dt) {
  const dx=x-bullet.x,dy=y-bullet.y,d=Math.hypot(dx,dy),step=Math.min(d,speed*dt);
  if(d){bullet.x+=dx/d*step;bullet.y+=dy/d*step;}
  return d<=step;
}
function advanceHammer(bullet,dt) {
  const p=state.paladin;
  if(!p){bullet.dead=true;return;}
  const speed=510*p.speed;
  if(bullet.hammerPhase==="return"){
    if(moveHeroProjectile(bullet,paladinX(),state.player.y+PLATFORM_SHOT_Y,speed,dt))bullet.dead=true;
    return;
  }
  if(bullet.fullSweep){
    bullet.hitIds ||= new Set();
    const target=state.snake.find(s=>bullet.sweepIds.includes(s.id) && isSegmentVisible(s) && s.hp>0 && !bullet.hitIds.has(s.id));
    if(!target){bullet.hammerPhase="return";return;}
    moveHeroProjectile(bullet,target.x,target.y,speed,dt);
    return;
  }
  if(!bullet.arc){
    const targets=visibleTargets();
    if(!targets.length){bullet.hammerPhase="return";return;}
    const lowest=targets.reduce((a,b)=>a.y>b.y?a:b);
    const leftToRight=bullet.x<=state.width/2;
    bullet.arc={startX:leftToRight?24:state.width-24,endX:leftToRight?state.width-24:24,
      y:lowest.y+16,controlY:Math.max(10,lowest.y-48),t:0};
  }
  const a=bullet.arc;
  if(bullet.hammerPhase==="approach"){
    if(moveHeroProjectile(bullet,a.startX,a.y,speed,dt))bullet.hammerPhase="sweep";
    return;
  }
  a.t=Math.min(1,a.t+dt*speed/Math.max(80,Math.abs(a.endX-a.startX)));
  const t=a.t;
  bullet.x=a.startX+(a.endX-a.startX)*t;
  bullet.y=(1-t)*(1-t)*a.y+2*(1-t)*t*a.controlY+t*t*a.y;
  // Process the final outbound collision before disabling return-flight damage.
  if(t===1)bullet.returnAfterHits=true;
}
function paladinUpgradePool() {
  const p = state.paladin;
  if (!p) return [];
  const card = (id,rarity,name,text,apply) => ({id,rarity,name,text:"Aldric · "+text,apply});
  const pool = [
    card("consecrated","grey","Geweihter Hammer","+20 % Hammerschaden.",()=>p.damageMultiplier*=1.2),
    card("steel","green","Gesegneter Stahl","+15 % Projektilgröße.",()=>p.size*=1.15),
    card("flight","green","Hammerflug","+20 % Projektilgeschwindigkeit.",()=>p.speed*=1.2)
  ];
  if(!p.blade)pool.push(card("blade","orange","Heilige Klinge","Jeder 5. Hammer fliegt alle beim Wurf sichtbaren Schlangensegmente ab und trifft jedes einmal.",()=>{p.blade=true;p.throws=0;}));
  else if(p.bladeEvery===5)pool.push(card("ancestors","purple","Hammer der Vorfahren","Heilige Klinge wird bei jedem 4. Hammerwurf ausgelöst.",()=>{p.bladeEvery=4;p.throws=0;}));
  for (const [rarity,radius,damage] of [["grey",15,10],["green",30,20],["purple",50,40]]) {
    pool.push(card("force-"+rarity,rarity,"Heilige Wucht","+"+radius+" % Explosionsradius.",()=>p.radius*=1+radius/100));
    pool.push(card("breaker-"+rarity,rarity,"Lichtbrecher","+"+damage+" % Explosionsschaden.",()=>p.explosionMultiplier*=1+damage/100));
  }
  if (p.impactEvery===4) pool.push(card("verdict","green","Richterspruch","Heiliger Einschlag bei jedem 3. statt 4. Treffer. Einmal pro Runde.",()=>{p.impactEvery=3;p.hits=0;}));
  if (!p.ultimate) pool.push(card("wrath-unlock","orange","Göttlicher Zorn","Schaltet Göttliches Urteil frei: alle 20 s ein Flächentreffer mit 500 % Hammerschaden.",()=>{p.ultimate=true;p.remaining=p.cooldown;}));
  else pool.push(card("wrath-cooldown","purple","Göttlicher Zorn","20 % kürzere Abklingzeit für Göttliches Urteil.",()=>{p.cooldown*=.8;p.remaining*=.8;}));
  if (!p.revenge) pool.push(card("revenge","purple","Vergeltung","Kritische Hammertreffer lösen einen Lichtschlag mit 50 % Hammerschaden aus. Einmal pro Runde.",()=>p.revenge=true));
  if (!p.morningGreen) pool.push(card("morning-green","green","Morgenlicht","+20 Prozentpunkte Chance auf einen zweiten Lichtschlag. Einmal pro Runde.",()=>{p.morningGreen=true;p.morningChance=(p.morningGreen ? .2 : 0)+(p.morningPurple ? .5 : 0);}));
  if (!p.morningPurple) pool.push(card("morning-purple","purple","Morgenlicht","+50 Prozentpunkte Chance auf einen zweiten Lichtschlag. Einmal pro Runde.",()=>{p.morningPurple=true;p.morningChance=(p.morningGreen ? .2 : 0)+(p.morningPurple ? .5 : 0);}));
  return pool;
}

function hudNumber(value) {
  return value.toLocaleString("de-DE",{maximumFractionDigits:2});
}
function companionHudContent(side) {
  const label=side==="left"?"LINKS":"RECHTS";
  const p=state.paladin,n=state.necromancer;
  let title="",lines=[];
  if(p?.slot===side) {
    title="Aldric";
    lines=[
      "Angriff "+hudNumber(paladinDamage())+" · Rate "+hudNumber(state.weapon.shotsPerSecond*.65/2.7)+"×",
      "Krit "+hudNumber(state.weapon.critChance)+" % · Krit-Schaden "+hudNumber(state.weapon.critDamage)+" %",
      "Einschlag "+(p.hits%p.impactEvery)+"/"+p.impactEvery+" · Klinge "+(p.blade?(p.throws%p.bladeEvery)+"/"+p.bladeEvery:"gesperrt"),
      p.ultimate?"Urteil: "+(p.charge>0?"lädt":Math.ceil(p.remaining)+" s"):"Urteil: gesperrt"
    ];
  } else if(n?.slot===side) {
    title="Vaelric";
    const special=state.souls.filter(s=>!s.dead&&(s.temporary||s.swirl)).length;
    lines=[
      "Angriff "+hudNumber(necromancerDamage())+" · Rate "+hudNumber(state.weapon.shotsPerSecond*.85/2.7)+"×",
      "Krit "+hudNumber(Math.min(100,state.weapon.critChance+5))+" % · Krit-Schaden "+hudNumber(state.weapon.critDamage)+" %",
      "Seelen "+regularSoulCount()+"/"+n.limit+(special?" +"+special:"")+" · Mal "+hudNumber(n.markChance*100)+" %",
      (n.ultimate?"Totenruf: "+(n.charge>0?"lädt":Math.ceil(n.remaining)+" s"):"Totenruf: gesperrt")+(n.seal?" · Siegel "+n.sealCount+"/5":"")
    ];
  }
  return "<strong>"+label+" · "+(title||"Frei")+"</strong>"+
    (title?lines.map(line=>"<span>"+line+"</span>").join(""):"<span>Kein Held ausgerüstet</span>");
}
function refreshPaladinHud() {
  for(const side of ["left","right"])
    document.querySelector("#platformStats"+side).innerHTML=companionHudContent(side);
}
function renderPaladinProfile() {
  const p=progress.data;
  const unlock=document.querySelector('#unlockPaladin');
  unlock.disabled=p.paladinUnlocked || p.coins<progress.heroCost();
  unlock.textContent=p.paladinUnlocked?'Aldric freigeschaltet':'Aldric freischalten · '+progress.heroCost()+' Münzen';
  for (const side of ['left','right']) {
    const button=document.querySelector('#equipPaladin'+side);
    button.disabled=!p.paladinUnlocked;
    button.textContent=(side==='left'?'Links':'Rechts')+(p.paladinSlot===side?' · Aktiv':' einsetzen');
    const slot=document.querySelector('#heroSlot'+side);
    slot.innerHTML=p.paladinSlot===side?'<img src="paladin-front.png" alt="Aldric auf seiner Plattform"><strong>Aldric</strong><small>Hammer · Aktiv</small>':'<span aria-hidden="true">＋</span><strong>'+(side==='left'?'Links':'Rechts')+'</strong><small>Noch frei</small>';
  }
  document.querySelector('#unequipPaladin').disabled=!p.paladinSlot;
}
function drawPaladin() {
  const p=state.paladin;
  if (!p) return;
  const x=paladinX(), y=state.player.y;
  ctx.save();
  ctx.fillStyle='#c9a968';ctx.fillRect(Math.min(x,state.player.x)+16,y+28,4,5);
  const lift=p.swing>0?Math.sin(p.swing/.18*Math.PI)*3:0;
  if (paladinSprite.complete && paladinSprite.naturalWidth) ctx.drawImage(paladinSprite,x-20,y-15-lift,40,56);
  else {ctx.fillStyle='#e4c473';ctx.fillRect(x-14,y+24,28,16);ctx.fillStyle='#7797bd';ctx.fillRect(x-8,y,16,29);}
  if (p.charge>0) {
    ctx.strokeStyle='#fff1ac';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-21,12,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffe28a';ctx.fillRect(x-1,y-29,2,16);ctx.fillRect(x-6,y-24,12,2);
  }
  ctx.restore();
}
function drawHolyEffects() {
  ctx.save();
  for (const e of state.holyEffects) {
    const t=1-e.life/e.maxLife;
    ctx.globalAlpha=Math.max(0,1-t);ctx.strokeStyle='#ffe398';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(.3+.7*t),0,Math.PI*2);ctx.stroke();
    if (e.kind==='light') {ctx.fillStyle='#fff7d0';ctx.fillRect(e.x-2,e.y-24,4,48);ctx.fillRect(e.x-12,e.y-2,24,4);}
    if (e.kind==='judgment') {
      if (hammerSprite.complete && hammerSprite.naturalWidth) ctx.drawImage(hammerSprite,180,140,880,1000,e.x-28,e.y-56*(1-t)-28,56,56);
      ctx.fillStyle='#fff7ce';ctx.fillRect(e.x-3,e.y-65,6,65);
    }
  }
  ctx.restore();
}
