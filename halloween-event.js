"use strict";

const HalloweenEvent = (() => {
  const STORAGE_KEY="the-snake.halloween-event.v1";
  const MAX_LEVEL=24;
  const PLAYABLE_LEVEL=7;
  const BASE_SEGMENTS=50;
  const LEVEL_ONE_FIRST_HP=44;
  const LEVEL_ONE_LAST_HP=7800;

  const dialogue=Object.freeze([
    {speaker:"Morgana",side:"left",image:"morgana-neutral.webp",text:"„Willkommen, Held. Mein Name ist Morgana. Eigentlich sollte dies eine ruhige Halloween-Nacht werden … mit Kürbissen, Süßigkeiten und ein wenig Zauberei.“"},
    {speaker:"Morgana",side:"left",image:"morgana-neutral.webp",text:"„Doch in dieser Nacht ist etwas geschehen, womit niemand gerechnet hat. Die Magie von Halloween ist stärker geworden als je zuvor.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Einer der Kürbisse auf den Feldern wurde von dieser Magie erfasst … und ist erwacht.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Aber er ist nicht einfach nur lebendig geworden. Die dunkle Kraft hat ihn verändert. Er ist zu einer gewaltigen Kürbis-Schlange mutiert.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Jetzt zieht dieses Monster durch die Felder und bewegt sich direkt auf die Stadt zu. Überall, wo es auftaucht, erwachen weitere Kürbisse und schließen sich ihm an.“"},
    {speaker:"Morgana",side:"left",image:"morgana-sad.webp",text:"„Wenn wir es nicht aufhalten, wird die Kürbis-Schlange die Stadt erreichen … und Halloween wird für uns alle zu einem Albtraum.“"},
    {speaker:"Morgana",side:"left",image:"morgana-happy.webp",text:"„Aber jetzt bist du hier! Vielleicht ist unsere Halloween-Nacht doch noch nicht verloren.“"},
    {speaker:"Morgana",side:"left",image:"morgana-happy.webp",text:"„Du hast schon ganz andere Kreaturen besiegt. Mit dir und deinen Gefährten haben wir endlich eine Chance, die Stadt zu retten!“"},
    {speaker:"Hauptheld",side:"right",image:"player-front.png",keepMorgana:true,text:"„Dann verlieren wir keine Zeit. Meine Gefährten und ich werden euch helfen. Diese Kürbis-Schlange kommt keinen Schritt weiter.“"},
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
  function pumpkinHp(referenceHp) { return Math.max(1,Math.round(referenceHp*.5)); }
  function bonusSegmentHp(referenceHp,index,level) {
    return Math.max(1,Math.round(pumpkinHp(referenceHp)*Math.pow(segmentRatio(level),index)));
  }
  function backgroundForLevel(level) {
    if(level===24)return "halloween-event-level-24.webp";
    if(level>=9)return "halloween-event-levels-9-23.webp";
    return "halloween-event-levels-1-8.webp";
  }
  function freshProgress(){return {completed:0,selected:1,introSeen:false};}
  function load(storage=window.localStorage) {
    try {
      const value=JSON.parse(storage.getItem(STORAGE_KEY)||"null"),fresh=freshProgress();
      if(!value||typeof value!=="object")return fresh;
      fresh.completed=Math.max(0,Math.min(PLAYABLE_LEVEL,Number.isInteger(value.completed)?value.completed:0));
      fresh.selected=Math.max(1,Math.min(fresh.completed+1,PLAYABLE_LEVEL,Number.isInteger(value.selected)?value.selected:1));
      fresh.introSeen=value.introSeen===true;
      return fresh;
    } catch {return freshProgress();}
  }
  function save(value,storage=window.localStorage) {
    try {storage.setItem(STORAGE_KEY,JSON.stringify(value));return true;}catch{return false;}
  }

  return Object.freeze({STORAGE_KEY,MAX_LEVEL,PLAYABLE_LEVEL,BASE_SEGMENTS,dialogue,hpBounds,segmentRatio,segmentHp,pumpkinHp,bonusSegmentHp,backgroundForLevel,load,save});
})();
