/* Capítulos de la historia. {n} = nombre de tu primer amor. */
(function () {
  const LP = (window.LP = window.LP || {});

  // Progresiones (semitonos desde la tónica)
  const I_V_vi_IV = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
  const vi_IV_I_V = [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]];
  const I_vi_IV_V = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]];
  const I_iii_IV_iv = [[0, 4, 7], [4, 7, 11], [5, 9, 12], [5, 8, 12]];

  const GAZE = { away: [3, 5.2], warn: 0.85, look: [1.3, 2.1] };

  LP.LEVELS = [
    {
      id: 'mirada',
      title: 'La primera mirada',
      scene: 'aula',
      story:
        'Primer día de clase. {n} se sienta junto a la ventana y, por alguna razón, el aire se volvió más dulce. Hoy solo quieres llegar hasta su pupitre y decir «hola».',
      hint: 'Mantén pulsado para acercarte. Suelta para respirar. Si tu corazón llega al límite… te pondrás rojísimo.',
      time: 50,
      rise: 12,
      speed: 0.05,
      calm: 17,
      gaze: GAZE,
      goals: { perfect: 4, eye: 2.5 },
      tutorial: true,
      music: { tempo: 76, root: 64, prog: I_V_vi_IV, pattern: [0, null, 1, 2, null, 1, 3, null] },
      memory: 'Su silueta a contraluz, junto a la ventana.',
      fragments: [
        { k: 'tus ojos', t: 'Desde el primer día, tus ojos se quedaron en mi cabeza.' },
        { k: 'la ventana', t: 'Fingía mirar por la ventana solo para verte a ti.' },
        { k: 'tu risa', t: 'Tu risa sonaba mejor que el timbre del recreo.' },
        { k: 'mi cuaderno', t: 'Mi cuaderno se llenó de garabatos con tu inicial.' },
      ],
    },
    {
      id: 'nota',
      title: 'La nota',
      scene: 'aula',
      variant: 'nota',
      story:
        'Has escrito una nota doblada mil veces: «¿Te gusta la misma canción que a mí?». Tienes que llevársela a {n}… sin que el profe se dé cuenta.',
      hint: 'Nuevo: el profe se gira de vez en cuando. Si te ve avanzar, retrocedes. ¡Suelta cuando te mire!',
      time: 55,
      rise: 12.5,
      speed: 0.052,
      calm: 17,
      gaze: GAZE,
      teacher: { away: [2.6, 4.8], warn: 0.95, look: [1.4, 2.3] },
      goals: { perfect: 5, eye: 3 },
      music: { tempo: 84, root: 62, prog: I_vi_IV_V, pattern: [0, 2, null, 1, null, 3, 2, null] },
      memory: 'Un papelito con un «sí» escrito con prisa.',
      fragments: [
        { k: 'papelito', t: 'Aquel papelito doblado mil veces era mi corazón entero.' },
        { k: 'tu letra', t: 'Guardé tu respuesta y aún reconozco tu letra.' },
        { k: 'casi nos pillan', t: 'Casi nos pillan, y aun así valió la pena.' },
        { k: 'un sí', t: 'Cuando escribiste «sí», el mundo se volvió de colores.' },
      ],
    },
    {
      id: 'bus',
      title: 'El autobús',
      scene: 'bus',
      story:
        'De vuelta a casa, {n} va en el mismo autobús. Hay un asiento libre a su lado. Solo tienes que llegar hasta allí… si los baches te dejan.',
      hint: 'Nuevo: ¡baches! Si te pillan avanzando, el corazón te da un vuelco. Suelta cuando veas el aviso.',
      time: 50,
      rise: 13,
      speed: 0.055,
      calm: 17,
      gaze: GAZE,
      bumps: { every: [3.2, 5.6], warn: 0.75 },
      goals: { perfect: 6, eye: 3.5 },
      music: { tempo: 92, root: 65, prog: vi_IV_I_V, pattern: [0, 1, 2, null, 1, 2, 3, 1] },
      memory: 'Un corazón dibujado en la ventanilla empañada.',
      fragments: [
        { k: 'tu hombro', t: 'Cada bache me acercaba un poco más a tu hombro.' },
        { k: 'auriculares', t: 'Compartimos auriculares y una canción que ahora es nuestra.' },
        { k: 'la ventanilla', t: 'Dibujaste un corazón en la ventanilla empañada.' },
        { k: 'mi parada', t: 'Me pasé de parada solo por seguir a tu lado.' },
      ],
    },
    {
      id: 'lluvia',
      title: 'Bajo la lluvia',
      scene: 'lluvia',
      story:
        'Empieza a llover a la salida. {n} tiene un paraguas pequeño y te mira como diciendo «cabemos los dos». El viento no piensa ponértelo fácil.',
      hint: 'Nuevo: ráfagas de viento que te empujan hacia atrás. Aguanta… o aprovecha para respirar.',
      time: 55,
      rise: 13,
      speed: 0.056,
      calm: 17,
      gaze: GAZE,
      wind: { every: [3.8, 6.4], warn: 0.9, dur: [1.6, 2.6], push: 0.035 },
      goals: { perfect: 7, eye: 4 },
      music: { tempo: 70, root: 60, prog: I_iii_IV_iv, pattern: [0, null, 2, null, 1, null, 3, 2] },
      memory: 'Un paraguas pequeño que nunca fue tan grande.',
      fragments: [
        { k: 'paraguas', t: 'Un paraguas pequeño nunca fue tan grande.' },
        { k: 'charcos', t: 'Saltamos charcos riéndonos como si nada más existiera.' },
        { k: 'manos frías', t: 'Tenías las manos frías y yo el corazón en llamas.' },
        { k: 'olor a lluvia', t: 'Ahora el olor a lluvia siempre me recuerda a ti.' },
      ],
    },
    {
      id: 'baile',
      title: 'El baile lento',
      scene: 'baile',
      story:
        'La fiesta de fin de curso. Suena una canción lenta y {n} está en mitad de la pista, mirando hacia ti. Esta vez, tu corazón late al ritmo de la música.',
      hint: 'Nuevo: el latido sigue la música. Suelta justo en el compás: cada respiración perfecta te acerca más.',
      time: 60,
      rise: 13.5,
      speed: 0.05,
      calm: 17,
      gaze: { away: [2.4, 4], warn: 0.75, look: [1.4, 2.2] },
      dance: { tempo: 88, bonus: 0.03 },
      goals: { perfect: 10, eye: 4.5 },
      music: { tempo: 88, root: 67, prog: I_V_vi_IV, pattern: [0, 2, 1, 2, 3, 2, 1, 2] },
      memory: 'Las luces de colores girando sobre la pista.',
      fragments: [
        { k: 'nuestra canción', t: 'Bailamos sin saber bailar, y fue perfecto.' },
        { k: 'tus pasos', t: 'Te pisé dos veces y te reíste las dos.' },
        { k: 'las luces', t: 'Entre tantas luces, solo te veía a ti.' },
        { k: 'tu perfume', t: 'Todavía recuerdo tu perfume de aquella noche.' },
      ],
    },
    {
      id: 'mano',
      title: 'La mano',
      scene: 'mano',
      story:
        'Atardecer en el parque. {n} y tú, sentados muy cerca. Su mano está ahí, a unos centímetros. Lo más difícil del mundo: no temblar.',
      hint: 'Nuevo: al final, tu mano solo avanza si el latido está dentro de la zona dulce (verde menta).',
      time: 55,
      rise: 13.5,
      speed: 0.055,
      calm: 18,
      gaze: GAZE,
      zone: { start: 0.78, min: 100, max: 128 },
      goals: { perfect: 8, eye: 4.5 },
      music: { tempo: 74, root: 63, prog: vi_IV_I_V, pattern: [0, null, 1, null, 2, null, 3, 1] },
      memory: 'Dos sombras largas tocándose en la hierba.',
      fragments: [
        { k: 'atardecer', t: 'Aquel atardecer se puso de tu color favorito.' },
        { k: 'temblor', t: 'Me temblaba la mano, pero no quería soltarla.' },
        { k: 'luciérnagas', t: 'Hasta las luciérnagas parecían celebrar.' },
        { k: 'tus dedos', t: 'Tus dedos encajaron con los míos como si siempre hubiera sido así.' },
      ],
    },
    {
      id: 'confesion',
      title: 'La confesión',
      scene: 'confesion',
      story:
        'Noche de estrellas en lo alto de la colina. Llevas todo el curso guardando algo dentro. Ha llegado el momento de decírselo a {n}.',
      hint: 'Todo junto: miradas, rachas de viento y la zona dulce al final. Las palabras que recogiste formarán tu carta.',
      time: 70,
      rise: 14,
      speed: 0.048,
      calm: 18,
      gaze: { away: [2.6, 4.4], warn: 0.75, look: [1.3, 2.1] },
      wind: { every: [5, 8], warn: 0.9, dur: [1.4, 2.2], push: 0.03 },
      zone: { start: 0.84, min: 104, max: 130 },
      goals: { perfect: 12, eye: 5 },
      music: { tempo: 72, root: 64, prog: I_vi_IV_V, pattern: [0, null, 2, 1, null, 2, 3, null] },
      memory: 'Una estrella fugaz, justo cuando lo dijiste.',
      fragments: [
        { k: 'estrellas', t: 'Bajo todas esas estrellas, por fin me atreví.' },
        { k: 'valentía', t: 'Me costó mil latidos encontrar las palabras.' },
        { k: 'siempre', t: 'Pase lo que pase, siempre serás mi primer amor.' },
        { k: 'me gustas', t: 'Me gustas. Me gustas muchísimo.' },
      ],
    },
  ];

  LP.ENDLESS = {
    id: 'endless',
    title: 'Mariposas en el estómago',
    music: { tempo: 96, root: 65, prog: I_V_vi_IV, pattern: [0, 2, 1, 3, 0, 2, 1, 2] },
  };

  LP.SCENE_ORDER = ['aula', 'aula-nota', 'bus', 'lluvia', 'baile', 'mano', 'confesion'];

  LP.fmt = function (str) {
    const n = (LP.Store && LP.Store.data.crush) || '';
    return str.replace(/\{n\}/g, n || 'esa persona');
  };
})();
