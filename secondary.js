"use strict";

// Secondary supporters occupy a smaller back row behind the three main slots.
// Concrete supporters register their behaviour here when they are added later.
const SECONDARY_SLOTS=Object.freeze(["left","center","right"]);
const SECONDARY_SLOT_SCALE=.8;
const SECONDARY_REGISTRY=new Map();

function validSecondaryId(id) {
  return typeof id==="string"&&/^[a-z][a-z0-9-]{0,47}$/.test(id);
}

function registerSecondary(definition) {
  if(!definition||!validSecondaryId(definition.id)||typeof definition.name!=="string"||!definition.name.trim())
    throw new Error("Ungültige Sekundärhelden-Definition.");
  if(SECONDARY_REGISTRY.has(definition.id))throw new Error("Sekundärheld bereits registriert: "+definition.id);
  const entry=Object.freeze({
    id:definition.id,
    name:definition.name.trim(),
    kind:definition.kind||"support",
    createState:typeof definition.createState==="function"?definition.createState:()=>({}),
    update:typeof definition.update==="function"?definition.update:null,
    draw:typeof definition.draw==="function"?definition.draw:null,
    modify:typeof definition.modify==="function"?definition.modify:null,
    onEvent:typeof definition.onEvent==="function"?definition.onEvent:null,
    upgradePool:typeof definition.upgradePool==="function"?definition.upgradePool:null
  });
  SECONDARY_REGISTRY.set(entry.id,entry);
  return entry;
}

function secondaryAnchor(slot) {
  if(!SECONDARY_SLOTS.includes(slot))return null;
  const offset={left:-36,center:0,right:36}[slot];
  return {slot,x:state.player.x+offset,y:state.player.y-18,scale:SECONDARY_SLOT_SCALE};
}

function createSecondaryTeam(equipped={}) {
  const slots={left:null,center:null,right:null};
  for(const slot of SECONDARY_SLOTS){
    const id=equipped?.[slot],definition=id?SECONDARY_REGISTRY.get(id):null;
    if(!definition)continue;
    const member={id,slot,definition,data:null,takenUpgrades:new Set(),upgrades:[]};
    member.data=definition.createState({slot,anchor:secondaryAnchor(slot),member})||{};
    slots[slot]=member;
  }
  return {slots,effects:[]};
}

function activeSecondaries() {
  return SECONDARY_SLOTS.map(slot=>state.secondaryTeam?.slots?.[slot]).filter(Boolean);
}

function updateSecondaryTeam(dt) {
  for(const member of activeSecondaries())member.definition.update?.(member,dt,secondaryAnchor(member.slot));
  const effects=state.secondaryTeam?.effects;
  if(!effects)return;
  for(const effect of effects)effect.life=Math.max(0,(effect.life??0)-dt);
  state.secondaryTeam.effects=effects.filter(effect=>effect.life>0);
}

function drawSecondaryTeam() {
  for(const member of activeSecondaries())member.definition.draw?.(member,ctx,secondaryAnchor(member.slot));
}

// Future buffers call this hook from the affected main-slot calculation.
function secondaryModify(mainSlot,stat,value,context={}) {
  const member=state.secondaryTeam?.slots?.[mainSlot];
  if(!member?.definition.modify)return value;
  const result=member.definition.modify(member,stat,value,{...context,mainSlot,anchor:secondaryAnchor(mainSlot)});
  return Number.isFinite(result)?result:value;
}

function emitSecondaryEvent(type,payload={}) {
  for(const member of activeSecondaries())member.definition.onEvent?.(member,type,payload,secondaryAnchor(member.slot));
}

function addSecondaryEffect(effect) {
  if(!state.secondaryTeam||!effect||!Number.isFinite(effect.life)||effect.life<=0)return false;
  state.secondaryTeam.effects.push({...effect});
  if(state.secondaryTeam.effects.length>24)state.secondaryTeam.effects.splice(0,state.secondaryTeam.effects.length-24);
  return true;
}

function secondaryUpgradePool() {
  const pool=[];
  for(const member of activeSecondaries()){
    const cards=member.definition.upgradePool?.(member)||[];
    for(const card of cards){
      if(!card||typeof card.name!=="string"||typeof card.text!=="string"||typeof card.apply!=="function")continue;
      const rarity=["grey","green","purple","orange"].includes(card.rarity)?card.rarity:"grey";
      const localId=String(card.id||card.name),key=member.id+":"+localId;
      if(!card.repeatable&&member.takenUpgrades.has(key))continue;
      pool.push({
        id:"secondary-"+key,rarity,name:card.name,
        text:member.definition.name+" · "+card.text,
        secondarySlot:member.slot,secondaryId:member.id,
        apply:()=>{
          card.apply(member);
          if(!card.repeatable)member.takenUpgrades.add(key);
          member.upgrades.push({id:localId,name:card.name,rarity,text:card.text});
        }
      });
    }
  }
  return pool;
}
