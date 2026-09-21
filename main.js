const defaultCategories = [];

let categories = [...defaultCategories];

const categoryRow = document.querySelector('#category-row');
const clueGrid = document.querySelector('#clue-grid');
const playerList = document.querySelector('#player-list');
const dialog = document.querySelector('#clue-dialog');
const dialogCategory = document.querySelector('#dialog-category');
const dialogValue = document.querySelector('#dialog-value');
const dialogClue = document.querySelector('#dialog-clue');
const dialogAnswer = document.querySelector('#dialog-answer');
const answerForm = document.querySelector('#answer-form');
const answerInput = document.querySelector('#answer-input');
const scoringActions = document.querySelector('#scoring-actions');
const customQuestionForm = document.querySelector('#custom-question-form');
const customCategoryInput = document.querySelector('#custom-category');
const customQuestionInput = document.querySelector('#custom-question');
const customAnswerInput = document.querySelector('#custom-answer');
const customValueInput = document.querySelector('#custom-value');
let activeClue = null;
let scores = [0, 0];
let activePlayer = 0;
let playerCount = 2;
let played = 0;

const playerCountSelect = document.querySelector('#player-count');
const playerNames = ['ALEX', 'JORDAN'];

function getTotalClues() {
  return categories.reduce((total, category) => total + category.clues.length, 0);
}

function updateProgress() {
  const totalClues = getTotalClues();
  document.querySelector('#clues-played').textContent = `${played} / ${totalClues}`;
  document.querySelector('#progress-bar').style.width = `${(played / Math.max(totalClues, 1)) * 100}%`;
}

function normalizeAnswer(rawText) {
  return String(rawText || '')
    .toLowerCase()
    .replace(/^(what is|who is|where is|when is|which is|the )\s*/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAnswerCorrect(submittedText, correctAnswer) {
  const submitted = normalizeAnswer(submittedText);
  const correct = normalizeAnswer(correctAnswer);
  return submitted === correct || submitted.includes(correct) || correct.includes(submitted);
}

function renderBoard() {
  categoryRow.replaceChildren();
  clueGrid.replaceChildren();

  categories.forEach((category) => {
    const heading = document.createElement('div');
    heading.className = 'category-cell';
    heading.textContent = category.name;
    categoryRow.append(heading);

    category.clues.forEach((clue) => {
      const button = document.createElement('button');
      button.className = 'clue-cell';
      button.type = 'button';
      button.textContent = `$${clue[2]}`;
      button.addEventListener('click', () => openClue(button, category, clue));
      clueGrid.append(button);
    });
  });
}

function renderPlayers() {
  playerList.replaceChildren();
  for (let index = 0; index < playerCount; index += 1) {
    const card = document.createElement('div');
    card.className = `player-card${index === activePlayer ? ' active-player' : ''}`;
    const marker = document.createElement('span');
    marker.className = 'player-marker';
    marker.textContent = String(index + 1);
    const label = document.createElement('label');
    label.textContent = `PLAYER ${index + 1}`;
    const input = document.createElement('input');
    input.value = playerNames[index] || '';
    input.placeholder = 'Your name';
    input.maxLength = 16;
    input.setAttribute('aria-label', `Player ${index + 1} name`);
    input.addEventListener('input', () => { playerNames[index] = input.value; });
    const score = document.createElement('strong');
    score.id = `score-${index}`;
    score.textContent = `$${scores[index] || 0}`;
    card.append(marker, label, input, score);
    card.addEventListener('click', (event) => {
      if (event.target.matches('input')) return;
      activePlayer = index;
      renderPlayers();
    });
    playerList.append(card);
  }
}

playerCountSelect.addEventListener('change', () => {
  playerCount = Math.min(100, Math.max(1, Number(playerCountSelect.value) || 1));
  playerCountSelect.value = playerCount;
  while (scores.length < playerCount) scores.push(0);
  if (activePlayer >= playerCount) activePlayer = 0;
  renderPlayers();
});

customQuestionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const categoryValue = customCategoryInput.value.trim();
  const questionValue = customQuestionInput.value.trim();
  const answerValue = customAnswerInput.value.trim();
  const clueValue = Number(customValueInput.value) || 200;

  if (!categoryValue || !questionValue || !answerValue) return;

  const categoryName = categoryValue.toUpperCase();
  let category = categories.find((entry) => entry.name.toUpperCase() === categoryName);

  if (!category) {
    category = { name: categoryName, clues: [] };
    categories.push(category);
  }

  category.clues.push([questionValue, answerValue, clueValue]);
  renderBoard();
  updateProgress();
  customQuestionForm.reset();
  customValueInput.value = '200';
});

renderPlayers();
renderBoard();
updateProgress();

function openClue(button, category, clue) {
  if (button.disabled) return;
  activeClue = { button, clue };
  dialogCategory.textContent = category.name;
  dialogValue.textContent = `$${clue[2]}`;
  dialogClue.textContent = clue[0];
  dialogAnswer.textContent = clue[1];
  dialogAnswer.hidden = true;
  answerInput.value = '';
  answerInput.disabled = false;
  answerForm.hidden = false;
  answerForm.querySelector('button').hidden = false;
  scoringActions.hidden = true;
  dialog.showModal();
  answerInput.focus();
}

answerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!answerInput.value.trim() || !activeClue) return;

  const submittedAnswer = answerInput.value.trim();
  const points = activeClue.clue[2];
  const correct = isAnswerCorrect(submittedAnswer, activeClue.clue[1]);

  scores[activePlayer] += correct ? points : -points;
  document.querySelector(`#score-${activePlayer}`).textContent = `$${scores[activePlayer].toLocaleString()}`;

  activeClue.button.disabled = true;
  activeClue.button.classList.add('played');
  played += 1;
  updateProgress();

  dialogAnswer.textContent = correct
    ? `Correct! The answer was ${activeClue.clue[1]}.`
    : `Incorrect. The correct answer was ${activeClue.clue[1]}.`;
  dialogAnswer.hidden = false;
  answerInput.disabled = true;
  answerForm.querySelector('button').hidden = true;

  setTimeout(() => {
    dialog.close();
    activeClue = null;
  }, 1400);
});

document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());

document.querySelector('#reset-game').addEventListener('click', () => {
  scores = Array(playerCount).fill(0);
  played = 0;
  updateProgress();
  document.querySelector('#progress-bar').style.width = '0%';
  document.querySelectorAll('.clue-cell').forEach((button) => { button.disabled = false; button.classList.remove('played'); });
  renderPlayers();
});
