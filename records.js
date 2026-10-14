'use strict';

const RECORDS_KEY = 'tetris.records';
const RECORDS_NAME_KEY = 'tetris.lastName';
const RECORDS_MAX = 5;
const RECORDS_NAME_MAX = 12;
const RECORDS_DEFAULT_NAME = 'Anónimo';

const startOverlay = document.getElementById('start-overlay');
const startRecordsEl = document.getElementById('start-records');
const startPlayBtn = document.getElementById('start-play-btn');
const startResetBtn = document.getElementById('start-reset-btn');
const recordsGameOverEl = document.getElementById('records-gameover');
const recordsNewEl = document.getElementById('records-new');
const recordsFormEl = document.getElementById('records-form');
const recordsNameInput = document.getElementById('records-name');
const recordsSaveBtn = document.getElementById('records-save-btn');
const recordsListEl = document.getElementById('records-list');
const recordsResetBtn = document.getElementById('records-reset-btn');

let recordsPending = false;
let recordsSaved = false;

function emptyRecords() {
  return { scores: [], bestCombo: 0, maxLines: 0 };
}

function recordsCount(value) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function recordsTrimName(value) {
  return String(value).trim().slice(0, RECORDS_NAME_MAX);
}

function loadRecords() {
  const records = emptyRecords();
  let data;
  try {
    data = JSON.parse(localStorage.getItem(RECORDS_KEY));
  } catch (err) {
    return records;
  }
  if (!data || typeof data !== 'object') return records;
  if (Array.isArray(data.scores)) {
    records.scores = data.scores
      .filter(e => e && typeof e === 'object' && typeof e.name === 'string' && recordsCount(e.score) > 0)
      .map(e => ({
        name: recordsTrimName(e.name) || RECORDS_DEFAULT_NAME,
        score: recordsCount(e.score),
        lines: recordsCount(e.lines),
        level: recordsCount(e.level) || 1,
        date: typeof e.date === 'string' ? e.date : '',
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, RECORDS_MAX);
  }
  records.bestCombo = recordsCount(data.bestCombo);
  records.maxLines = recordsCount(data.maxLines);
  return records;
}

function saveRecords(records) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    // sin localStorage los records no se conservan
  }
}

function loadLastName() {
  try {
    const name = localStorage.getItem(RECORDS_NAME_KEY);
    return typeof name === 'string' ? recordsTrimName(name) : '';
  } catch (err) {
    return '';
  }
}

function qualifiesForTop(records, points) {
  if (!(points > 0)) return false;
  return records.scores.length < RECORDS_MAX || points > records.scores[RECORDS_MAX - 1].score;
}

function recordsCell(tag, text, className) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderRecords(container, records, highlight) {
  container.textContent = '';
  if (!records.scores.length) {
    container.appendChild(recordsCell('p', 'Aún no hay records', 'records-empty'));
  } else {
    const table = document.createElement('table');
    table.className = 'records-table';
    const head = table.createTHead().insertRow();
    ['#', 'Nombre', 'Puntos', 'Líneas', 'Nivel'].forEach((title, i) => {
      head.appendChild(recordsCell('th', title, i === 1 ? 'records-name-cell' : ''));
    });
    const body = table.createTBody();
    records.scores.forEach((entry, i) => {
      const row = body.insertRow();
      if (i === highlight) row.className = 'records-highlight';
      row.appendChild(recordsCell('td', String(i + 1)));
      row.appendChild(recordsCell('td', entry.name, 'records-name-cell'));
      row.appendChild(recordsCell('td', entry.score.toLocaleString()));
      row.appendChild(recordsCell('td', String(entry.lines)));
      row.appendChild(recordsCell('td', String(entry.level)));
    });
    container.appendChild(table);
  }
  container.appendChild(recordsCell(
    'p',
    `Mejor combo: ${records.bestCombo} · Líneas máximas: ${records.maxLines}`,
    'records-stats'
  ));
}

function showStartScreen() {
  renderRecords(startRecordsEl, loadRecords(), -1);
  startOverlay.classList.remove('hidden');
  startPlayBtn.focus();
}

function startGame() {
  startPlayBtn.blur();
  startOverlay.classList.add('hidden');
  init();
}

function applyRunStats(records) {
  records.bestCombo = Math.max(records.bestCombo, maxCombo);
  records.maxLines = Math.max(records.maxLines, lines);
}

function updateRecordsForm(records) {
  recordsPending = !recordsSaved && qualifiesForTop(records, score);
  recordsNewEl.classList.toggle('records-hidden', !recordsPending);
  recordsFormEl.classList.toggle('records-hidden', !recordsPending);
}

// Llamado desde endGame(): actualiza las marcas históricas y prepara el overlay.
function showGameOverRecords() {
  const records = loadRecords();
  if (maxCombo > records.bestCombo || lines > records.maxLines) {
    applyRunStats(records);
    saveRecords(records);
  }
  recordsSaved = false;
  recordsNameInput.value = loadLastName();
  updateRecordsForm(records);
  renderRecords(recordsListEl, records, -1);
  recordsGameOverEl.classList.remove('records-hidden');
}

function hideGameOverRecords() {
  recordsPending = false;
  recordsGameOverEl.classList.add('records-hidden');
}

function saveCurrentScore() {
  if (!recordsPending) return;
  recordsPending = false;
  recordsSaved = true;
  const typed = recordsTrimName(recordsNameInput.value);
  const entry = {
    name: typed || RECORDS_DEFAULT_NAME,
    score,
    lines,
    level,
    date: new Date().toISOString(),
  };
  const records = loadRecords();
  applyRunStats(records);
  records.scores.push(entry);
  records.scores.sort((a, b) => b.score - a.score);
  records.scores = records.scores.slice(0, RECORDS_MAX);
  saveRecords(records);
  if (typed) {
    try {
      localStorage.setItem(RECORDS_NAME_KEY, typed);
    } catch (err) {
      // nada que hacer
    }
  }
  recordsNameInput.blur();
  recordsFormEl.classList.add('records-hidden');
  renderRecords(recordsListEl, records, records.scores.indexOf(entry));
}

function resetRecords() {
  if (!confirm('¿Borrar todos los records guardados?')) return;
  try {
    localStorage.removeItem(RECORDS_KEY);
  } catch (err) {
    // nada que borrar
  }
  const records = loadRecords();
  renderRecords(startRecordsEl, records, -1);
  renderRecords(recordsListEl, records, -1);
  if (!recordsGameOverEl.classList.contains('records-hidden')) updateRecordsForm(records);
}

startPlayBtn.addEventListener('click', startGame);
startResetBtn.addEventListener('click', resetRecords);
recordsResetBtn.addEventListener('click', resetRecords);
recordsSaveBtn.addEventListener('click', saveCurrentScore);
recordsNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.isComposing) saveCurrentScore();
});
