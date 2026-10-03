"use strict";

const HalloweenEvent = (() => {
  const STORAGE_KEY="the-snake.halloween-event.v1";
  const MAX_LEVEL=24;
  const PLAYABLE_LEVEL=7;
  const BASE_SEGMENTS=50;
  const LEVEL_ONE_FIRST_HP=44;
  const LEVEL_ONE_LAST_HP=7800;
  let volatileProgress=null;

  const upgrades=Object.freeze([
    {id:"damage",name:"Schaden",max:30,startCost:50,costStep:25,effect:"+2 % Schaden pro Stufe"},
    {id:"rate",name:"Feuerrate",max:30,startCost:50,costStep:25,effect:"+2 % Feuerrate pro Stufe"},
    {id:"critChance",name:"Krit-Chance",max:20,startCost:50,costStep:25,effect:"+0,5 % Krit-Chance pro Stufe"},
    {id:"critDamage",name:"Krit-Schaden",max:20,startCost:50,costStep:25,effect:"+5 % Krit-Schaden pro Stufe"},
    {id:"pierce",name:"Durchschlag",max:15,startCost:100,costStep:50,effect:"Zwischenstufen +0,5 Schaden · Stufe 5/10/15 +1 Durchschlag"},
    {id:"pumpkinDamage",name:"Kürbisschaden",max:20,startCost:50,costStep:25,effect:"+5 % Schaden gegen Feldkürbisse pro Stufe"},
    {id:"pumpkinHunter",name:"Kürbisjäger",max:10,startCost:75,costStep:30,effect:"−3 % Feldkürbis-HP pro Stufe"},
    {id:"resistance",name:"Event-Widerstand",max:20,startCost:75,costStep:30,effect:"+1 % Schaden und −0,25 % Tempo der Hauptschlange pro Stufe"},
    {id:"skillHunter",name:"Skilljäger",max:10,startCost:75,costStep:30,effect:"−2 % Bonusschlangen-Tempo und −3 % Skillsegment-HP pro Stufe"},
    {id:"currency",name:"Halloween-Münzen",max:10,startCost:100,costStep:50,effect:"+5 % Event-Belohnung pro Stufe"}
  ]);
  const upgradeById=new Map(upgrades.map(upgrade=>[upgrade.id,upgrade]));

  const dialogue=Object.freeze([
    {speaker:"Morgana",side:"left",image:"morgana-neutral.webp",text:"„Willkommen, Held. Mein Name ist Morgana. Eigentlich sollte dies eine ruhige Halloween-Nacht werden … mit Kürbissen, Süßigkeiten und ein wenig Zauberei.“"},
    {speaker:"Morgana",side:"left",image:"morgana-neutral.webp",text:"„Doch in dieser Nacht ist etwas geschehen, womit niemand gerechnet hat. Die Magie von Halloween ist stärker geworden als je zuvor.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Einer der Kürbisse auf den Feldern wurde von dieser Magie erfasst … und ist erwacht.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Aber er ist nicht einfach nur lebendig geworden. Die dunkle Kraft hat ihn verändert. Er ist zu einer gewaltigen Kürbis-Schlange mutiert.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Jetzt zieht dieses Monster durch die Felder und bewegt sich direkt auf die Stadt zu. Überall, wo es auftaucht, erwachen weitere Kürbisse und schließen sich ihm an.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Wenn wir es nicht aufhalten, wird die Kürbis-Schlange die Stadt erreichen … und Halloween wird für uns alle zu einem Albtraum.“"},
    {speaker:"Morgana",side:"left",image:"morgana-happy.webp",text:"„Aber jetzt bist du hier! Vielleicht ist unsere Halloween-Nacht doch noch nicht verloren.“"},
    {speaker:"Morgana",side:"left",image:"morgana-happy.webp",text:"„Du hast schon ganz andere Kreaturen besiegt. Mit dir und deinen Gefährten haben wir endlich eine Chance, die Stadt zu retten!“"},
    {speaker:"Hauptheld",side:"right",image:"main-hero-chat.webp",keepMorgana:true,text:"„Dann verlieren wir keine Zeit. Meine Gefährten und ich werden euch helfen. Diese Kürbis-Schlange kommt keinen Schritt weiter.“"},
    {speaker:"Morgana",side:"left",image:"morgana-happy.webp",text:"„Das wollte ich hören! Folge dem Weg zum Kürbisfeld. Dort wurde das Monster zuletzt gesehen.“"},
    {speaker:"Morgana",side:"left",image:"morgana-happy.webp",text:"„Und pass auf dich auf. Die Halloween-Magie verändert nicht nur den großen Kürbis … auf den Feldern wartet noch einiges auf euch.“"}
  ]);

  function normalBounds(level) {
    const hp=typeof LEVEL_DEFINITIONS!=="undefined"?LEVEL_DEFINITIONS[Math.max(0,Math.min(LEVEL_DEFINITIONS.length-1,level-1))]?.hp:null;
    return hp||{first:5,last:5500};
  }
  function hpBounds(level) {
    const base=normalBounds(1),current=normalBounds(level);
    return {
      first:Math.round(LEVEL_ONE_FIRST_HP*(current.first/base.first)),
      last:Math.round(LEVEL_ONE_LAST_HP*(current.last/base.last))
    };
  }
  function segmentRatio(level) {
    const {first,last}=hpBounds(level);
    return Math.pow(last/first,1/(BASE_SEGMENTS-1));
  }
  function segmentHp(level,index) {
    const {first}=hpBounds(level);
    return Math.max(first+index,Math.round(first*Math.pow(segmentRatio(level),index)));
  }
  function levelsTemplate(){return Object.fromEntries(upgrades.map(upgrade=>[upgrade.id,0]));}
  function upgradeLevel(value,id){return value?.upgrades?.[id]||0;}
  function modifiers(value){
    const pierceLevel=upgradeLevel(value,"pierce");
    return {
      damageMultiplier:1+upgradeLevel(value,"damage")*.02,
      rateMultiplier:1+upgradeLevel(value,"rate")*.02,
      critChance:upgradeLevel(value,"critChance")*.5,
      critDamage:upgradeLevel(value,"critDamage")*5,
      pierce:Math.floor(pierceLevel/5),
      pierceDamage:(pierceLevel-Math.floor(pierceLevel/5))*.5,
      pumpkinDamageMultiplier:1+upgradeLevel(value,"pumpkinDamage")*.05,
      pumpkinHpMultiplier:Math.max(.1,1-upgradeLevel(value,"pumpkinHunter")*.03),
      eventDamageMultiplier:1+upgradeLevel(value,"resistance")*.01,
      eventSpeedMultiplier:Math.max(.1,1-upgradeLevel(value,"resistance")*.0025),
      bonusSpeedMultiplier:Math.max(.1,1-upgradeLevel(value,"skillHunter")*.02),
      skillHpMultiplier:Math.max(.1,1-upgradeLevel(value,"skillHunter")*.03),
      currencyMultiplier:1+upgradeLevel(value,"currency")*.05
    };
  }
  function pumpkinHp(referenceHp,value) { return Math.max(1,Math.round(referenceHp*.5*modifiers(value).pumpkinHpMultiplier)); }
  function bonusSegmentHp(referenceHp,index,level,value,isSkill=false) {
    const base=pumpkinHp(referenceHp)*Math.pow(segmentRatio(level),index);
    return Math.max(1,Math.round(base*(isSkill?modifiers(value).skillHpMultiplier:1)));
  }
  function backgroundForLevel(level) {
    if(level===24)return "halloween-event-level-24.webp";
    if(level>=9)return "halloween-event-levels-9-23.webp";
    return "halloween-event-levels-1-8.webp";
  }
  function freshProgress(){return {completed:0,selected:1,introSeen:false,coins:0,firstClears:Array(MAX_LEVEL).fill(false),upgrades:levelsTemplate()};}
  function hydrate(value){
      const fresh=freshProgress();
      if(!value||typeof value!=="object")return fresh;
      fresh.completed=Math.max(0,Math.min(PLAYABLE_LEVEL,Number.isInteger(value.completed)?value.completed:0));
      fresh.selected=Math.max(1,Math.min(fresh.completed+1,PLAYABLE_LEVEL,Number.isInteger(value.selected)?value.selected:1));
      fresh.introSeen=value.introSeen===true;
      fresh.coins=Number.isSafeInteger(value.coins)&&value.coins>=0?Math.min(1000000000,value.coins):0;
      if(Array.isArray(value.firstClears))for(let index=0;index<MAX_LEVEL;index++)fresh.firstClears[index]=value.firstClears[index]===true;
      if(value.upgrades&&typeof value.upgrades==="object")for(const upgrade of upgrades){
        const level=value.upgrades[upgrade.id];
        fresh.upgrades[upgrade.id]=Number.isInteger(level)&&level>=0?Math.min(upgrade.max,level):0;
      }
      return fresh;
  }
  function load(storage=window.localStorage) {
    try {
      const stored=storage.getItem(STORAGE_KEY),value=stored?JSON.parse(stored):volatileProgress;
      return hydrate(value);
    } catch {return hydrate(volatileProgress);}
  }
  function save(value,storage=window.localStorage) {
    volatileProgress=hydrate(value);
    try {storage.setItem(STORAGE_KEY,JSON.stringify(volatileProgress));return true;}catch{return true;}
  }

  function upgradeCost(value,id){
    const upgrade=upgradeById.get(id),level=upgradeLevel(value,id);
    return !upgrade||level>=upgrade.max?null:upgrade.startCost+upgrade.costStep*level;
  }
  function buyUpgrade(value,id,storage=window.localStorage){
    const upgrade=upgradeById.get(id),cost=upgradeCost(value,id);
    if(!upgrade||cost===null||value.coins<cost)return false;
    value.coins-=cost;value.upgrades[id]=upgradeLevel(value,id)+1;
    return save(value,storage);
  }
  function rewardForLevel(value,level){
    const first=!value.firstClears[level-1],multiplier=modifiers(value).currencyMultiplier;
    const base=Math.round(level*50*multiplier),firstBonus=first?Math.round(level*100*multiplier):0;
    return {base,firstBonus,total:base+firstBonus,first,multiplier};
  }
  function completeLevel(value,level,storage=window.localStorage){
    if(!Number.isInteger(level)||level<1||level>PLAYABLE_LEVEL||level>value.completed+1)return null;
    const reward=rewardForLevel(value,level);
    value.coins=Math.min(1000000000,value.coins+reward.total);
    value.firstClears[level-1]=true;
    value.completed=Math.max(value.completed,level);
    value.selected=Math.min(PLAYABLE_LEVEL,level+1);
    save(value,storage);return reward;
  }

  return Object.freeze({STORAGE_KEY,MAX_LEVEL,PLAYABLE_LEVEL,BASE_SEGMENTS,dialogue,upgrades,hpBounds,segmentRatio,segmentHp,pumpkinHp,bonusSegmentHp,backgroundForLevel,load,save,upgradeCost,buyUpgrade,rewardForLevel,completeLevel,modifiers});
})();
