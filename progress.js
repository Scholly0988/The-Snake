"use strict";

// No network requests: this profile belongs to this browser and site origin.
const SnakeProgress = (() => {
  const KEY = "the-snake.progress.v1";
  const fresh = () => ({
    game: "the-snake", version: 1, coins: 0, best: 0, defeated: 0,
    runs: 0, damageLevel: 0, rateLevel: 0, difficulty: 0.10,
    paladinUnlocked: false, paladinSlot: null
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
    if (![0.10, 0.15, 0.20].includes(value.difficulty))
      throw new Error("Ungültige Schwierigkeit.");
    result.difficulty = value.difficulty;
    // Version 1 saves made before heroes migrate without losing progress.
    if (value.paladinUnlocked !== undefined && typeof value.paladinUnlocked !== "boolean")
      throw new Error("Ungültige Heldenfreischaltung.");
    result.paladinUnlocked = value.paladinUnlocked ?? false;
    result.paladinSlot = value.paladinSlot ?? null;
    if (![null, "left", "right"].includes(result.paladinSlot) || (!result.paladinUnlocked && result.paladinSlot !== null))
      throw new Error("Ungültiger Heldenplatz.");
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
    return {
      get data() { return data; },
      get message() { return message; },
      save,
      reward(coins, score) {
        data.coins = Math.min(1000000000, data.coins + coins);
        data.defeated = Math.min(1000000000, data.defeated + 1);
        data.best = Math.min(1000000000, Math.max(data.best, score));
        save();
      },
      cost(key) { return 20 * (data[key] + 1) ** 2; },
      buy(key) {
        if (!["damageLevel", "rateLevel"].includes(key) || data[key] >= 30) return false;
        const cost = this.cost(key);
        if (data.coins < cost) return false;
        const old = {...data};
        data.coins -= cost; data[key]++;
        if (!save()) { data = old; return false; }
        return true;
      },
      export() { return JSON.stringify(validate(data), null, 2); },
      unlockPaladin() {
        if (data.paladinUnlocked || data.coins < 100) return false;
        const old = {...data};
        data.coins -= 100;
        data.paladinUnlocked = true;
        if (!save()) { data = old; return false; }
        return true;
      },
      equipPaladin(slot) {
        if (!data.paladinUnlocked || ![null, "left", "right"].includes(slot)) return false;
        const old = {...data};
        data.paladinSlot = slot;
        if (!save()) { data = old; return false; }
        return true;
      },
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
