"use strict";
// One permanent purchase per skill family; all listed rarities benefit.
const HERO_SKILLS = [
  ["shooter","attack","attack","Pistole",[],"Automatische gerade Geschosse.","+20 % direkter Pistolenschaden."],
  ["shooter","damage","upgrade","Schaden",["grey","green","purple"],"+1 / +2 / +4 gemeinsamer Schaden.","Schadensbonus jeder Auswahl +20 %."],
  ["shooter","rate","upgrade","Feuerrate",["grey","green","purple"],"+10 / +20 / +30 % Feuerrate.","Je Auswahl 5 Prozentpunkte mehr."],
  ["shooter","pierce","upgrade","Durchschlag",["grey","green","purple"],"+1 / +2 / +3 Durchschlag.","Je Auswahl 1 zusätzliches Segment."],
  ["shooter","critChance","upgrade","Krit-Chance",["grey","green","purple"],"+2,5 / +5 / +7,5 Prozentpunkte Krit-Chance.","Je Auswahl 1 Prozentpunkt mehr."],
  ["shooter","critDamage","upgrade","Krit-Schaden",["grey","green","purple"],"+15 / +30 / +50 Prozentpunkte Krit-Schaden.","Je Auswahl 10 Prozentpunkte mehr."],
  ["shooter","multi","upgrade","Mehrfachschuss",["grey"],"Ein zusätzliches Geschoss.","2 statt 1 zusätzliches Geschoss je Auswahl."],
  ["shooter","spread","upgrade","Engerer Mehrfachschuss",["green"],"Verringert die Streuung um 50 %.","Verringert die Streuung um 60 %."],
  ["shooter","parallel","upgrade","Paralleler Mehrfachschuss",["purple"],"Geschosse fliegen parallel ohne Streuung.","Parallele Pistolengeschosse fliegen 20 % schneller."],
  ["paladin","attack","attack","Hammer des Morgenlichts",[],"Ein Hammerbogen trifft jedes berührte Segment einmal.","+20 % direkter Hammerschaden; keine Verstärkung der Explosionen."],
  ["paladin","impact","attack","Heiliger Einschlag",[],"Jeder 4. Treffer explodiert mit 50 % Hammerschaden.","+20 % Schaden dieser Explosion (50 → 60 %)."],
  ["paladin","judgment","attack","Göttliches Urteil",["orange"],"500 % Hammerschaden im großen Umkreis. Benötigt Göttlichen Zorn im Run.","750 % statt 500 % Hammerschaden."],
  ["paladin","morning","upgrade","Morgenlicht",["green","purple"],"20 / 50 Prozentpunkte Chance auf einen zweiten Flächentreffer.","Der Zusatztreffer verursacht 75 % statt 50 % Hammerschaden."],
  ["paladin","revenge","upgrade","Vergeltung",["purple"],"Kritische Treffer verursachen 50 % zusätzlichen Hammerschaden am Ziel.","100 % statt 50 % Zusatzschaden."],
  ["paladin","consecrated","upgrade","Geweihter Hammer",["grey"],"+20 % Hammerschaden je Auswahl, einschließlich abgeleiteter Fähigkeiten.","+30 % statt +20 % je Auswahl."],
  ["paladin","steel","upgrade","Gesegneter Stahl",["green"],"+15 % Hammergröße je Auswahl.","+25 % statt +15 % je Auswahl."],
  ["paladin","flight","upgrade","Hammerflug",["green"],"+20 % Fluggeschwindigkeit je Auswahl.","+30 % statt +20 % je Auswahl."],
  ["paladin","blade","upgrade","Heilige Klinge",["orange"],"Jeder 5. Wurf trifft alle beim Wurf sichtbaren Segmente.","Spezialhammer verursacht +25 % direkten Trefferschaden."],
  ["paladin","ancestors","upgrade","Hammer der Vorfahren",["purple"],"Heilige Klinge bei jedem 4. statt 5. Wurf.","Heilige Klinge bei jedem 3. Wurf."],
  ["paladin","force","upgrade","Heilige Wucht",["grey","green","purple"],"+15 / +30 / +50 % Explosionsradius je Auswahl.","+20 / +35 / +55 % Radius je Auswahl."],
  ["paladin","breaker","upgrade","Lichtbrecher",["grey","green","purple"],"+10 / +20 / +40 % Explosionsschaden je Auswahl.","+20 / +30 / +50 % je Auswahl."],
  ["paladin","verdict","upgrade","Richterspruch",["green"],"Heiliger Einschlag bei jedem 3. Treffer.","Heiliger Einschlag bei jedem 2. Treffer."],
  ["paladin","wrath","upgrade","Göttlicher Zorn",["orange","purple"],"Orange: Urteil freischalten (20 s). Lila: 20 % kürzere Abklingzeit.","Orange: 18 s Grundabklingzeit. Lila: 25 % kürzere Abklingzeit."],
  ["necromancer","attack","attack","Seelenstab",[],"Zielsuchender Angriff auf das vorderste Segment.","+20 % direkter Stabschaden."],
  ["necromancer","soul","attack","Gebundene Seele",[],"Normale Seelen: 2 Basisschaden; markierte: 3. Drei Angriffszyklen.","+20 % Schaden normaler und markierter Seelen; auch bei Totenruf."],
  ["necromancer","limit","upgrade","Ruhelose Seelen",["grey","green","purple"],"+1 / +2 / +3 Seelenplätze.","+2 / +3 / +4 Plätze je Auswahl."],
  ["necromancer","soulBonus","upgrade","Seelenhunger",["grey","green","purple"],"+15 / +30 / +50 % Seelenschaden.","+20 / +35 / +55 % je Auswahl."],
  ["necromancer","markChance","upgrade","Dunkles Mal",["grey","green","purple"],"5 % Grundchance; +5 / +10 / +15 Prozentpunkte. Ein Versuch pro Sekunde.","Wartezeit zwischen Versuchen: 0,75 statt 1 Sekunde."],
  ["necromancer","speedBonus","upgrade","Geisterflug",["grey","green","purple"],"+20 / +40 / +70 % Seelengeschwindigkeit.","+30 / +50 / +80 % je Auswahl."],
  ["necromancer","binding","upgrade","Verdammte Bindung",["grey","green","purple","orange"],"1 / 2 / 3 / 5 Sprünge. Orange: Explosion beim 5. Sprung, Radius 80 px.","+20 % Schaden bei Sprungtreffern und der Sprungexplosion."],
  ["necromancer","endless","upgrade","Endlose Diener",["grey","green","purple"],"+1 / +2 / +3 Angriffszyklen; dazwischen 5 s warten.","Mit Endlosen Dienern nur 4 statt 5 s warten."],
  ["necromancer","explosion","upgrade","Seelenexplosion",["grey","green","purple"],"Markierter Tod: +0,3 / +0,6 / +1 Basis plus Waffenschaden, Radius 52,5 px.","+20 % Schaden dieser Explosion."],
  ["necromancer","strongDamage","upgrade","Verstärkte Bindung",["grey","green","purple"],"+1,7 / +2 / +2,5 Basis für markierte Seelen.","+2,2 / +2,5 / +3 Basis je Auswahl."],
  ["necromancer","choir","upgrade","Totenchor",["grey","green","purple"],"Totenruf erzeugt +1 / +2 / +4 Seelen.","+2 / +3 / +5 Seelen je Auswahl."],
  ["necromancer","siphon","upgrade","Seelensog",["grey","green","purple"],"Neue Seelen verkürzen Totenruf um 0,3 / 0,5 / 0,8 s.","0,4 / 0,6 / 0,9 s Verkürzung."],
  ["necromancer","curse","upgrade","Fluch des Todes",["grey","green","purple"],"Markierte Segmente erleiden +10 / +20 / +35 % Schaden von allen Helden.","+15 / +25 / +40 % je Auswahl."],
  ["necromancer","chain","upgrade","Kettenfluch",["grey","green","purple"],"20 / 35 / 55 % Chance auf eine neue zufällige sichtbare Marke.","30 / 45 / 65 % Chance."],
  ["necromancer","storm","upgrade","Seelensturm",["green"],"Ab 5 Seelen: +20 % Schaden und +25 % Geschwindigkeit.","Wird bereits ab 4 Seelen aktiv."],
  ["necromancer","harvest","upgrade","Unheilige Ernte",["grey","green","purple"],"Kritische Treffer erzeugen mit 5 / 10 / 20 % Chance kleine Seelen (1,5 Basis).","Kleine Seelen: 2 statt 1,5 Basisschaden."],
  ["necromancer","elite","upgrade","Letzter Fluch",["purple"],"Mit Fluch des Todes: markierte Segmente hinterlassen Elite-Seelen (2,2 / 3,3 / 4,4 Basis).","+20 % Schaden der Elite-Seelen."],
  ["necromancer","legion","upgrade","Seelenlegion",["purple"],"+5 Seelenplätze, aber −20 % Seelenschaden. Seelenexplosion ausgenommen.","Nur −10 % statt −20 % Seelenschaden."],
  ["necromancer","seal","upgrade","Todessiegel",["orange"],"Nach 5 markierten Toden: 50 Wirbelseelen, je 3 Treffer; ersetzt Seelenexplosion.","Wirbelseelen: 2,5 statt 2 Basisschaden, jeweils plus Waffenschaden."],
  ["necromancer","call","upgrade","Totenruf",["orange"],"Alle 22 s zwei temporäre Seelen und gemeinsamer Angriff.","20 statt 22 s Grundabklingzeit."]
].map(([hero,key,group,name,rarities,description,upgrade])=>({id:hero+"."+key,hero,key,group,name,rarities,description,upgrade}));
function hasSkill(hero,key) { return (state.skillUpgrades || []).includes(hero+"."+key); }
function skillValue(hero,key,base,upgraded) { return hasSkill(hero,key)?upgraded:base; }
let selectedSkillHero = null;
function openHeroSkills(hero) {
  if(state.mode!=="start")return;
  selectedSkillHero=hero;
  document.querySelector("#menuHeroes").scrollTop=0;
  document.querySelector("#heroOverview").classList.add("hidden");
  document.querySelector("#heroSkills").classList.remove("hidden");
  renderHeroSkills();
}
function closeHeroSkills() {
  selectedSkillHero=null;
  document.querySelector("#menuHeroes").scrollTop=0;
  document.querySelector("#heroOverview").classList.remove("hidden");
  document.querySelector("#heroSkills").classList.add("hidden");
}
function renderHeroSkills() {
  if(!selectedSkillHero)return;
  const names={shooter:"Schütze",paladin:"Aldric",necromancer:"Vaelric"};
  document.querySelector("#skillsTitle").textContent=names[selectedSkillHero]+" · Skills";
  document.querySelector("#skillsCoins").textContent=progress.data.coins+" Münzen · Jede Aufwertung einmalig 50 Münzen";
  const list=document.querySelector("#skillsList");list.replaceChildren();
  const unlocked=selectedSkillHero==="shooter"||progress.data[selectedSkillHero+"Unlocked"];
  for(const [group,title] of [["attack","Angriffe"],["upgrade","Upgrade-Skills"]]){
    const heading=document.createElement("h3");heading.textContent=title;list.append(heading);
    for(const skill of HERO_SKILLS.filter(s=>s.hero===selectedSkillHero&&s.group===group)){
      const card=document.createElement("article");card.className="skill-card";
      const name=document.createElement("h4");name.textContent=skill.name;
      const badges=document.createElement("div");badges.className="skill-rarities";
      for(const rarity of skill.rarities.length?skill.rarities:["base"]){
        const badge=document.createElement("span");badge.className="skill-rarity rarity-"+rarity;
        badge.textContent={base:"Basis",grey:"Grau",green:"Grün",purple:"Lila",orange:"Orange"}[rarity];badges.append(badge);
      }
      const detail=document.createElement("p");detail.textContent=skill.description;
      const upgrade=document.createElement("p");upgrade.textContent="Aufwertung: "+skill.upgrade;
      const buy=document.createElement("button"),owned=progress.data.skillUpgrades.includes(skill.id);
      buy.textContent=owned?"Aufgewertet ✓":!unlocked?"Held noch gesperrt":progress.data.coins<50?"50 Münzen · Nicht genug Münzen":"Aufwerten · 50 Münzen";
      buy.disabled=owned||!unlocked||progress.data.coins<50;
      buy.addEventListener("click",()=>{
        if(state.mode!=="start")return;
        const ok=progress.buySkill(skill.id);
        document.querySelector("#skillsStatus").textContent=ok?skill.name+" aufgewertet. Wirkt ab der nächsten Runde.":progress.message;
        renderProfile();
      });
      card.append(name,badges,detail,upgrade,buy);list.append(card);
    }
  }
}
function bindSkillsMenu(){
  for(const hero of ["shooter","paladin","necromancer"])document.querySelector("#skills-"+hero).addEventListener("click",()=>openHeroSkills(hero));
  document.querySelector("#closeSkills").addEventListener("click",closeHeroSkills);
}

function necroSkillDelta(key) {
  if(!hasSkill("necromancer",key))return 0;
  return {limit:1,soulBonus:.05,speedBonus:.10,strongDamage:.5,choir:1,curse:.05,siphon:.1,chain:.1}[key]||0;
}
function skillCardText(hero,id,text){
  const key=id.split("-")[0];
  const keys=id==="wrath-unlock"?["wrath","judgment"]:[key];
  const matches=HERO_SKILLS.filter(s=>s.hero===hero&&keys.includes(s.key)&&hasSkill(hero,s.key));
  if(!matches.length)return text;
  return "Basis: "+text+" Dauerhaft verbessert: "+matches.map(s=>s.upgrade).join(" ");
}
