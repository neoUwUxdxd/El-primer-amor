# 💗 El Primer Amor — un juego de latidos

Un juego sobre los nervios del primer amor. Acércate a esa persona… sin que tu corazón explote.

## Cómo se juega

- **Mantén pulsado** (pantalla, ratón o `Espacio`) para acercarte. Tu latido (BPM) sube.
- **Suelta** para respirar y calmarte. Si el latido llega a **180**, te pones rojísimo y pierdes.
- **Su mirada**: cuando aparece el `!` se va a girar. Si sigues avanzando mientras te mira consigues **contacto visual**: avanzas el triple, pero el corazón se dispara.
- **Respiración perfecta**: suelta justo cuando el anillo toca el corazón. Baja el latido, sube el combo y a veces deja caer una **palabra** para tu carta.
- Llega antes de que se acabe el tiempo. Cada capítulo da hasta **3 estrellas** (llegar, respiraciones perfectas y segundos de contacto visual).

## Contenido

- **7 capítulos**, cada uno con un giro: la primera mirada, la nota (¡cuidado con el profe!), el autobús (baches), bajo la lluvia (viento), el baile lento (respira al compás), la mano (zona dulce) y la confesión.
- **La carta**: las 28 frases que recuperas con respiraciones perfectas forman tu carta de confesión, con el nombre de tu primer amor.
- **Mariposas en el estómago**: modo infinito para batir tu récord.
- **Diario de recuerdos**: fotos de cada capítulo y 11 logros.
- Personajes personalizables y nombres propios en la historia.
- Arte y música generados por código (sin archivos externos). Funciona en móvil (táctil y vibración), tablet y PC.

## Ejecutar

No necesita instalación ni compilación:

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

También funciona abriendo `index.html` directamente, y se puede publicar tal cual en GitHub Pages
(Settings → Pages → rama y carpeta raíz).

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Pantallas e interfaz |
| `css/style.css` | Estilos |
| `js/levels.js` | Capítulos, frases de la carta y música |
| `js/game.js` | Lógica: latido, miradas, giros, puntuación |
| `js/render.js` | Escenarios, personajes, partículas y HUD (canvas) |
| `js/audio.js` | Música y efectos con Web Audio |
| `js/input.js` | Pulsar/soltar (táctil, ratón, teclado) |
| `js/storage.js` | Guardado en el navegador |
| `js/main.js` | Flujo de pantallas y bucle principal |
