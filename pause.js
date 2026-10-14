'use strict';

const PAUSE_LEVEL_KEY = 'tetris.startLevel';
const PAUSE_MAX_START_LEVEL = 10;

const pauseOverlay = document.getElementById('pause-overlay');
const pauseBox = document.getElementById('pause-box');
const pauseMainView = document.getElementById('pause-main');
const pauseControlsView = document.getElementById('pause-controls');
const pauseLevelSelect = document.getElementById('pause-level');

// startLevel: elegido en el selector, se aplica en la próxima partida.
// gameStartLevel: nivel con el que empezó la partida en curso.
let startLevel = loadStartLevel();
let gameStartLevel = startLevel;

function parseStartLevel(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= PAUSE_MAX_START_LEVEL ? n : 1;
}

function loadStartLevel() {
  try {
    return parseStartLevel(localStorage.getItem(PAUSE_LEVEL_KEY));
  } catch (err) {
    return 1;
  }
}

function saveStartLevel() {
  try {
    localStorage.setItem(PAUSE_LEVEL_KEY, String(startLevel));
  } catch (err) {
    // sin almacenamiento disponible: el valor solo dura esta sesión
  }
}

function showPauseView(showControls) {
  pauseMainView.classList.toggle('hidden', showControls);
  pauseControlsView.classList.toggle('hidden', !showControls);
}

function openPauseMenu() {
  showPauseView(false);
  pauseOverlay.classList.remove('hidden');
  pauseBox.focus();
}

function closePauseMenu() {
  const active = document.activeElement;
  if (active && pauseOverlay.contains(active)) active.blur();
  pauseOverlay.classList.add('hidden');
}

// Escape sobre el selector solo cierra su lista y le quita el foco; no reanuda la partida.
function pauseKeepsMenuOpen(e) {
  if (!paused || e.code !== 'Escape' || e.target !== pauseLevelSelect) return false;
  pauseBox.focus();
  return true;
}

// Con el menú abierto: evita el scroll de Space/flechas salvo en los controles del menú.
function pauseFilterKey(e) {
  const scrollKey = e.code === 'Space' || e.code.startsWith('Arrow');
  const tag = e.target && e.target.tagName;
  if (scrollKey && tag !== 'BUTTON' && tag !== 'SELECT') e.preventDefault();
}

for (let n = 1; n <= PAUSE_MAX_START_LEVEL; n++) {
  const option = document.createElement('option');
  option.value = String(n);
  option.textContent = String(n);
  pauseLevelSelect.appendChild(option);
}
pauseLevelSelect.value = String(startLevel);

pauseLevelSelect.addEventListener('change', () => {
  startLevel = parseStartLevel(pauseLevelSelect.value);
  saveStartLevel();
});

document.getElementById('pause-resume-btn').addEventListener('click', () => {
  if (paused) togglePause();
});

document.getElementById('pause-restart-btn').addEventListener('click', () => {
  init();
  closePauseMenu();
});

document.getElementById('pause-controls-btn').addEventListener('click', () => {
  showPauseView(true);
  pauseBox.focus();
});

document.getElementById('pause-back-btn').addEventListener('click', () => {
  showPauseView(false);
  pauseBox.focus();
});
