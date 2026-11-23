/* Guardado local (localStorage protegido con try/catch). */
(function () {
  const LP = (window.LP = window.LP || {});
  const KEY = 'el-primer-amor-v1';

  const defaults = () => ({
    crush: '',
    me: '',
    looks: {
      me: { hair: 0, hairColor: 0, shirt: 1, skin: 1 },
      crush: { hair: 1, hairColor: 2, shirt: 0, skin: 0 },
    },
    setupDone: false,
    unlocked: 1,
    stars: {},
    best: {},
    fragments: {},
    achievements: {},
    endlessBest: 0,
    endlessRound: 0,
    fails: 0,
    wins: 0,
    sound: true,
    vibrate: true,
  });

  let data = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const d = defaults();
      data = Object.assign(d, parsed);
      data.looks = {
        me: Object.assign(d.looks.me, (parsed.looks || {}).me),
        crush: Object.assign(d.looks.crush, (parsed.looks || {}).crush),
      };
    }
  } catch (e) {
    data = defaults();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* sin almacenamiento: el juego sigue funcionando */
    }
  }

  LP.Store = {
    get data() {
      return data;
    },
    save,
    reset() {
      data = defaults();
      save();
    },
    hasFragment(levelId, i) {
      const f = data.fragments[levelId];
      return !!(f && f.indexOf(i) !== -1);
    },
    addFragment(levelId, i) {
      if (!data.fragments[levelId]) data.fragments[levelId] = [];
      if (data.fragments[levelId].indexOf(i) === -1) {
        data.fragments[levelId].push(i);
        save();
        return true;
      }
      return false;
    },
    fragmentCount() {
      let n = 0;
      for (const k in data.fragments) n += data.fragments[k].length;
      return n;
    },
    totalStars() {
      let n = 0;
      for (const k in data.stars) n += data.stars[k];
      return n;
    },
    unlock(id) {
      if (data.achievements[id]) return false;
      data.achievements[id] = Date.now();
      save();
      return true;
    },
  };
})();
