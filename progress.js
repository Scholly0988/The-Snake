"use strict";

// No network requests: this profile belongs to this browser and site origin.
const SnakeProgress = (() => {
  const KEY = "the-snake.progress.v1";
  const fresh = () => ({
    game: "the-snake", version: 1, skillUpgrades: [], completedLevels: 0, selectedLevel: 1, coins: 0, coinRemainder: 0, firstClears: Array(9).fill(false), best: 0, defeated: 0,
    runs: 0, damageLevel: 0, rateLevel: 0, critChanceLevel: 0, critDamageLevel: 0, difficulty: 0.10,
    paladinUnlocked: false, paladinSlot: null, necromancerUnlocked: false, necromancerSlot: null,
    alchemistUnlocked: false, alchemistSlot: null, runemasterUnlocked: false, runemasterSlot: null
  });
  function validate(value) {
    if (!value || value.game !== "the-snake" || value.version !== 1)
      throw new Error("Kein unterstützter The-Snake-Spielstand.");
    const result = fresh();
    for (const key of ["coins", "best", "defeated", "runs", "damageLevel", "rateLevel"]) {
      if (!Number.isSafeInteger(value[key]) || value[key] < 0 ||
          value[key] > (key.endsWith("Level") ? 30 : 1000000000))
        throw new Error("Ungültiger Wert im Spielstand: " + key);
      result[key] = value[key];
    }
    const upgrades=value.skillUpgrades??[];
    const known=new Set(HERO_SKILLS.map(s=>s.id));
    if(!Array.isArray(upgrades)||upgrades.length>known.size||upgrades.some(id=>typeof id!=="string"||!known.has(id))||new Set(upgrades).size!==upgrades.length)
      throw new Error("Ungültige Skill-Aufwertungen.");
    result.skillUpgrades=[...upgrades];
    result.coinRemainder=value.coinRemainder??0;
    if(![0,.5].includes(result.coinRemainder))throw new Error("Ungültiger Münzrest.");
    result.firstClears=value.firstClears??Array(9).fill(false);
    if(!Array.isArray(result.firstClears)||result.firstClears.length!==9||result.firstClears.some(v=>typeof v!=="boolean"))throw new Error("Ungültige Erstabschlüsse.");
    result.firstClears=[...result.firstClears];
    result.completedLevels=value.completedLevels===undefined?0:value.completedLevels;
    result.selectedLevel=value.selectedLevel===undefined?1:value.selectedLevel;
    if(!Number.isInteger(result.completedLevels)||result.completedLevels<0||result.completedLevels>3 ||
       !Number.isInteger(result.selectedLevel)||result.selectedLevel<1||result.selectedLevel>Math.min(3,result.completedLevels+1))
      throw new Error("Ungültiger Levelfortschritt.");
    for (const key of ["critChanceLevel", "critDamageLevel"]) {
      const level = value[key] === undefined ? 0 : value[key];
      if (!Number.isSafeInteger(level) || level < 0 || level > 30)
        throw new Error("Ungültiger Wert im Spielstand: " + key);
      result[key] = level;
    }
    if (![0.10, 0.15, 0.20].includes(value.difficulty))
      throw new Error("Ungültige Schwierigkeit.");
    result.difficulty = value.difficulty;
    for (const hero of ["paladin", "necromancer", "alchemist", "runemaster"]) {
      const unlocked = hero+"Unlocked", slot = hero+"Slot";
      if (value[unlocked] !== undefined && typeof value[unlocked] !== "boolean")
        throw new Error("Ungültige Heldenfreischaltung.");
      result[unlocked] = value[unlocked] ?? false;
      result[slot] = value[slot] ?? null;
      if (![null,"left","right"].includes(result[slot]) || (!result[unlocked] && result[slot] !== null))
        throw new Error("Ungültiger Heldenplatz.");
    }
    const occupied=[result.paladinSlot,result.necromancerSlot,result.alchemistSlot,result.runemasterSlot].filter(Boolean);
    if(new Set(occupied).size!==occupied.length)throw new Error("Ein Platz kann nur einen Helden enthalten.");
    return result;
  }
  function open(storage) {
    let data = fresh(), previous = null, blocked = false;
    let message = "Fortschritt wird in diesem Browser gespeichert.";
    try {
      previous = storage.getItem(KEY);
      if (previous !== null) data = validate(JSON.parse(previous));
    } catch {
      blocked = true;
      message = "Spielstand konnte nicht geladen werden. Vorhandene Daten werden nicht überschrieben.";
    }
    function save() {
      if (blocked) return false;
      try {
        if (storage.getItem(KEY) !== previous) {
          blocked = true;
          message = "Ein anderer Tab hat gespeichert. Bitte diese Runde exportieren und neu laden.";
          return false;
        }
        const next = JSON.stringify(validate(data));
        storage.setItem(KEY, next);
        previous = next;
        message = "Im Browser gespeichert.";
        return true;
      } catch {
        message = "Speichern nicht möglich. Fortschritt bitte exportieren.";
        return false;
      }
    }
    function credit(amount) {
      const total=data.coins+data.coinRemainder+amount;
      data.coins=Math.min(1000000000,Math.floor(total));
      data.coinRemainder=data.coins===1000000000?0:total%1;
    }
    return {
      get data() { return data; },
      get message() { return message; },
      save,
      reward(coins, score) {
        credit(coins);
        data.defeated = Math.min(1000000000, data.defeated + 1);
        data.best = Math.min(1000000000, Math.max(data.best, score));
        save();
      },
      completeLevel(level, difficulty) {
        if(!Number.isInteger(level)||level<1||level>3||level>data.completedLevels+1)return false;
        if(difficulty!==undefined){
          const index=[.10,.15,.20].indexOf(difficulty);
          if(index<0)return false;
          const key=(level-1)*3+index, multiplier=[1,1.5,2][index];
          credit(level*50*multiplier+(data.firstClears[key]?0:level*100*multiplier));
          data.firstClears[key]=true;
        }
        data.completedLevels=Math.max(data.completedLevels,level);
        return save();
      },
      buySkill(id) {
        const skill=HERO_SKILLS.find(s=>s.id===id);
        if(!skill || data.skillUpgrades.includes(id) || data.coins<50 || (skill.hero!=="shooter"&&!data[skill.hero+"Unlocked"]))return false;
        const old={...data,skillUpgrades:[...data.skillUpgrades]};
        data.coins-=50;data.skillUpgrades.push(id);
        if(!save()){data=old;return false;}
        return true;
      },
      cost(key) { return 20 * (data[key] + 1) ** 2; },
      buy(key) {
        if (!["damageLevel", "rateLevel", "critChanceLevel", "critDamageLevel"].includes(key) || data[key] >= 30) return false;
        const cost = this.cost(key);
        if (data.coins < cost) return false;
        const old = {...data};
        data.coins -= cost; data[key]++;
        if (!save()) { data = old; return false; }
        return true;
      },
      export() { return JSON.stringify(validate(data), null, 2); },
      heroCost() { return data.paladinUnlocked || data.necromancerUnlocked || data.alchemistUnlocked || data.runemasterUnlocked ? 300 : 100; },
      unlockHero(hero) {
        if (!["paladin","necromancer","alchemist","runemaster"].includes(hero)) return false;
        const key=hero+"Unlocked", cost=this.heroCost();
        if (data[key] || data.coins<cost) return false;
        const old={...data};
        data.coins-=cost;data[key]=true;
        if (!save()) { data=old;return false; }
        return true;
      },
      equipHero(hero,slot) {
        const heroes=["paladin","necromancer","alchemist","runemaster"];
        if (!heroes.includes(hero) || !data[hero+"Unlocked"] || ![null,"left","right"].includes(slot)) return false;
        const old={...data}, previous=data[hero+"Slot"];
        if(slot)for(const other of heroes)if(other!==hero&&data[other+"Slot"]===slot)data[other+"Slot"]=previous;
        data[hero+"Slot"]=slot;
        if (!save()) { data=old;return false; }
        return true;
      },
      unlockPaladin() { return this.unlockHero("paladin"); },
      equipPaladin(slot) { return this.equipHero("paladin",slot); },
      import(text) {
        if (text.length > 20000) throw new Error("Die Sicherung ist zu groß.");
        const next = validate(JSON.parse(text));
        // Called only after the player's explicit overwrite confirmation.
        storage.setItem(KEY, JSON.stringify(next));
        data = next; previous = JSON.stringify(next); blocked = false;
        message = "Sicherung importiert und im Browser gespeichert.";
      }
    };
  }
  return {open, fresh, validate};
})();
