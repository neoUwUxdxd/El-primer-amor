/* Pulsar / soltar unificado: táctil, ratón y teclado. */
(function () {
  const LP = (window.LP = window.LP || {});
  const pointers = new Set();
  const keys = new Set();
  const HOLD_KEYS = ['Space', 'ArrowUp', 'ArrowRight', 'KeyW', 'KeyD', 'Enter'];

  const I = {
    enabled: false,
    get held() {
      return I.enabled && (pointers.size > 0 || keys.size > 0);
    },
    clear() {
      pointers.clear();
      keys.clear();
    },
    onAnyPress: null,
    init(el) {
      el.addEventListener('pointerdown', (e) => {
        if (e.button != null && e.button > 0) return;
        pointers.add(e.pointerId);
        try {
          el.setPointerCapture(e.pointerId);
        } catch (err) {}
        if (I.onAnyPress) I.onAnyPress();
        e.preventDefault();
      });
      const up = (e) => pointers.delete(e.pointerId);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());

      window.addEventListener('keydown', (e) => {
        if (!I.enabled) return;
        if (HOLD_KEYS.indexOf(e.code) !== -1) {
          if (!e.repeat) keys.add(e.code);
          if (I.onAnyPress) I.onAnyPress();
          e.preventDefault();
        }
      });
      window.addEventListener('keyup', (e) => keys.delete(e.code));
      window.addEventListener('blur', () => I.clear());
    },
  };
  LP.Input = I;
})();
