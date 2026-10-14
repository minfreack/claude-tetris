'use strict';

const SKIN_STORAGE_KEY = 'tetris.skin';
const SKIN_DEFAULT = 'retro';

function skinRoundRect(context, x, y, w, h, radius) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, w, h, r);
    return;
  }
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

const SKINS = {
  retro: {
    name: 'Retro',
    colors: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#7986cb', '#ffb74d'],
    background: '#1a1a25',
    grid: '#22222e',
    drawBlock(context, px, py, size, color, alpha) {
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.fillRect(px + 1, py + 1, size - 2, size - 2);
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(px + 1, py + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },

  neon: {
    name: 'Neon',
    colors: [null, '#00f0ff', '#fff200', '#d400ff', '#39ff14', '#ff1744', '#2979ff', '#ff9100'],
    background: '#000000',
    grid: '#14141f',
    drawBlock(context, px, py, size, color, alpha) {
      const inset = Math.max(2, Math.round(size * 0.1));
      const side = size - inset * 2;
      context.save();
      context.fillStyle = color;
      context.globalAlpha = alpha * 0.22;
      context.fillRect(px + inset, py + inset, side, side);
      // el glow se atenúa con globalAlpha, así el fantasma brilla menos que la pieza
      context.globalAlpha = alpha;
      context.shadowColor = color;
      context.shadowBlur = size * 0.45;
      context.strokeStyle = color;
      context.lineWidth = Math.max(1, size / 15);
      context.strokeRect(px + inset, py + inset, side, side);
      context.restore();
    },
  },

  pastel: {
    name: 'Pastel',
    colors: [null, '#9ad8e6', '#f9df8c', '#d3b0e8', '#a9dcae', '#f4a6a6', '#a9b6ec', '#f9c592'],
    background: '#fbf7f2',
    grid: '#ece2d9',
    drawBlock(context, px, py, size, color, alpha) {
      const radius = Math.max(2, size * 0.26);
      context.save();
      context.globalAlpha = alpha;
      skinRoundRect(context, px + 1.5, py + 1.5, size - 3, size - 3, radius);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = 'rgba(80,60,100,0.3)';
      context.lineWidth = 1;
      context.stroke();
      skinRoundRect(context, px + 4, py + 4, size - 8, (size - 8) * 0.38, radius * 0.6);
      context.fillStyle = 'rgba(255,255,255,0.4)';
      context.fill();
      context.restore();
    },
  },

  pixel: {
    name: 'Pixel art',
    colors: [null, '#29adff', '#ffec27', '#b05cff', '#00e436', '#ff004d', '#4060ff', '#ffa300'],
    background: '#12121c',
    grid: '#1c1c2a',
    drawBlock(context, px, py, size, color, alpha) {
      const x = Math.round(px);
      const y = Math.round(py);
      const s = Math.round(size);
      const u = Math.max(1, Math.floor(s / 10));
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.fillRect(x, y, s, s);
      // bisel: las franjas no se solapan entre sí para que las esquinas queden limpias
      context.fillStyle = 'rgba(255,255,255,0.45)';
      context.fillRect(x, y, s, u);
      context.fillRect(x, y + u, u, s - u);
      context.fillStyle = 'rgba(0,0,0,0.4)';
      context.fillRect(x + u, y + s - u, s - u, u);
      context.fillRect(x + s - u, y + u, u, s - u * 2);
      // trama de puntos
      context.fillStyle = 'rgba(0,0,0,0.2)';
      for (let ty = y + u * 2; ty + u <= y + s - u * 2; ty += u * 2)
        for (let tx = x + u * 2; tx + u <= x + s - u * 2; tx += u * 2)
          context.fillRect(tx, ty, u, u);
      context.globalAlpha = 1;
    },
  },
};

const skinSelect = document.getElementById('skin-select');

let skinId = SKIN_DEFAULT;
let skin = SKINS[skinId];

function isSkinId(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SKINS, id);
}

function loadSkinId() {
  try {
    const saved = localStorage.getItem(SKIN_STORAGE_KEY);
    if (isSkinId(saved)) return saved;
  } catch (e) {}
  return SKIN_DEFAULT;
}

function saveSkinId(id) {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, id);
  } catch (e) {}
}

function applySkin(id) {
  skinId = isSkinId(id) ? id : SKIN_DEFAULT;
  skin = SKINS[skinId];
  document.body.dataset.skin = skinId;
  if (skinSelect) skinSelect.value = skinId;
}

// loop() no corre en pausa ni en game over: se repinta a mano
function redrawSkin() {
  if (board && current) draw();
  if (next) drawNext();
}

function initSkins() {
  if (skinSelect) {
    for (const id of Object.keys(SKINS)) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = SKINS[id].name;
      skinSelect.appendChild(option);
    }
    skinSelect.addEventListener('change', () => {
      applySkin(skinSelect.value);
      saveSkinId(skinId);
      redrawSkin();
      skinSelect.blur();
    });
  }
  applySkin(loadSkinId());
}

initSkins();
