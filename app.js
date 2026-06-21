document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const startScreen = $('start-screen'), gameScreen = $('game-screen');
  const freeConfig = $('free-config'), timeConfig = $('time-config');
  const startBtn = $('start-btn'), backBtn = $('back-btn');
  const scoreDisplay = $('score-display'), timerDisplay = $('timer-display');
  const gradeLabel = $('grade-label'), taskDisplay = $('task-display');
  const answerInput = $('answer-input'), submitBtn = $('submit-btn');
  const answerSection = $('answer-section'), colorButtons = $('color-buttons');
  const recognizeBtn = $('recognize-btn');

  let state = { grade: null, mode: null, score: 0, tasksCompleted: 0, currentTask: null, timeLeft: 0, timerInterval: null, attempts: 0 };
  let tafelReady = false;

  loadSettings();

  // Event delegation for grade and mode buttons (most compatible across devices)
  document.querySelector('.grade-buttons').addEventListener('click', e => {
    const btn = e.target.closest('.grade-btn');
    if (!btn) return;
    document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.grade = parseInt(btn.dataset.grade);
    freeConfig.classList.toggle('hidden', btn.dataset.grade !== '0');
  });

  document.querySelector('.mode-buttons').addEventListener('click', e => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    timeConfig.classList.toggle('hidden', state.mode !== 'zeit');
  });

  startBtn.addEventListener('click', () => {
    if (state.grade === null || !state.mode) return;
    saveSettings();
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    document.body.classList.add('game-active');
    if (!tafelReady) {
      Tafel.init('tafel-canvas');
      tafelReady = true;
    } else {
      Tafel.resize();
    }
    startGame();
  });

  backBtn.addEventListener('click', () => {
    stopTimer();
    document.body.classList.remove('game-active');
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    resetState();
  });

  submitBtn.addEventListener('click', checkAnswer);
  answerInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });

  // Recognize button - read drawing from canvas
  recognizeBtn.addEventListener('click', () => {
    const buf = Tafel.getBuffer();
    const result = Recognize.recognize(buf);
    if (result) {
      answerInput.value = result;
    }
  });

  $('tool-chalk').addEventListener('click', () => { setActiveTool('tool-chalk'); Tafel.setTool('chalk'); });
  $('tool-eraser').addEventListener('click', () => { setActiveTool('tool-eraser'); Tafel.setTool('eraser'); });
  $('tool-clear').addEventListener('click', () => Tafel.clear(true));
  document.querySelectorAll('.color-btn').forEach(btn => btn.addEventListener('click', () => Tafel.setColor(btn.dataset.color)));

  window.addEventListener('resize', () => { if (tafelReady) Tafel.resize(); });

  function setActiveTool(id) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    $(id).classList.add('active');
  }

  function startGame() {
    state.score = 0; state.tasksCompleted = 0; state.attempts = 0;
    Rewards.resetScore(); Rewards.resetStreak();
    updateScore();
    gradeLabel.textContent = state.grade === 0 ? 'Frei' : `Klasse ${state.grade}`;

    if (state.mode === 'frei') {
      answerSection.classList.add('hidden');
      taskDisplay.classList.add('hidden');
      colorButtons.classList.remove('hidden');
      timerDisplay.classList.add('hidden');
    } else {
      answerSection.classList.remove('hidden');
      taskDisplay.classList.remove('hidden');
      colorButtons.classList.add('hidden');
      if (state.mode === 'zeit') {
        const radio = document.querySelector('#time-config input[type=radio]:checked');
        state.timeLeft = radio ? parseInt(radio.value) : 60;
        timerDisplay.classList.remove('hidden');
        updateTimerDisplay();
        startTimer();
      } else {
        timerDisplay.classList.add('hidden');
      }
      nextTask();
    }
  }

  function nextTask() {
    state.attempts = 0;
    const options = state.grade === 0 ? getFreeOptions() : {};
    state.currentTask = MathGen.generateTask(state.grade, options);
    taskDisplay.textContent = state.currentTask.question;
    answerInput.value = '';
    Tafel.clear(false);
  }

  function getFreeOptions() {
    const ops = [];
    document.querySelectorAll('#free-config input[name="op"]:checked').forEach(cb => ops.push(cb.value));
    const maxNum = parseInt($('max-number')?.value) || 100;
    return { operations: ops.length ? ops : ['+'], maxNumber: maxNum };
  }

  function checkAnswer() {
    if (!state.currentTask || state.mode === 'frei') return;
    const userRaw = answerInput.value.trim();
    if (!userRaw) return;

    if (compareAnswers(userRaw, state.currentTask.answer)) {
      Rewards.addStreak();
      Rewards.showSuccess();
      Rewards.addPoints(10);
      const bonus = Rewards.checkStreakBonus();
      if (bonus) Rewards.addPoints(bonus);
      state.score = Rewards.getScore();
      updateScore();
      Rewards.pointsAnimation(10 + bonus, scoreDisplay);
      if (Rewards.getStreak() % 5 === 0) Rewards.confetti();
      state.tasksCompleted++;
      if (state.tasksCompleted % 10 === 0) Rewards.showMilestone(`${state.tasksCompleted} Aufgaben geschafft! 🌟`);
      Tafel.clear(true);
      setTimeout(nextTask, 1500);
    } else {
      state.attempts++;
      Rewards.resetStreak();
      Rewards.showError();
      if (state.attempts >= 3 && state.currentTask.hint) {
        setTimeout(() => Rewards.showHint('💡 ' + state.currentTask.hint), 1600);
      }
    }
    answerInput.value = '';
  }

  function compareAnswers(user, correct) {
    const normalize = s => String(s).replace(/,/g, '.').replace(/\s/g, '').toLowerCase();
    const u = normalize(user), c = normalize(correct);
    if (u === c) return true;
    const uNum = parseFloat(u), cNum = parseFloat(c);
    if (!isNaN(uNum) && !isNaN(cNum) && Math.abs(uNum - cNum) < 0.01) return true;
    return false;
  }

  function startTimer() {
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      updateTimerDisplay();
      if (state.timeLeft <= 0) { stopTimer(); endGame(); }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  }

  function updateTimerDisplay() {
    const m = Math.floor(state.timeLeft / 60), s = state.timeLeft % 60;
    timerDisplay.textContent = `⏱ ${m}:${s.toString().padStart(2, '0')}`;
  }

  function endGame() {
    const key = `hs_${state.grade}_${state.mode}`;
    const prev = Rewards.getHighscore(key);
    if (state.score > prev) {
      Rewards.saveHighscore(key, state.score);
      Rewards.showMilestone('Neuer Rekord! 🏅');
    }
    taskDisplay.textContent = `⏱ Zeit vorbei! ${state.tasksCompleted} Aufgaben, ${state.score} Punkte.`;
    answerSection.classList.add('hidden');
  }

  function updateScore() {
    scoreDisplay.textContent = `⭐ ${state.score}`;
  }

  function resetState() {
    stopTimer();
    state.score = 0; state.tasksCompleted = 0; state.currentTask = null; state.timeLeft = 0; state.attempts = 0;
    Rewards.resetScore(); Rewards.resetStreak();
  }

  function saveSettings() {
    try { localStorage.setItem('zaubertafel_settings', JSON.stringify({ grade: state.grade, mode: state.mode })); } catch(e) {}
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('zaubertafel_settings'));
      if (!s) return;
      if (s.grade !== null && s.grade !== undefined) {
        const btn = document.querySelector(`.grade-btn[data-grade="${s.grade}"]`);
        if (btn) { btn.classList.add('active'); state.grade = s.grade; freeConfig.classList.toggle('hidden', s.grade !== 0); }
      }
      if (s.mode) {
        const btn = document.querySelector(`.mode-btn[data-mode="${s.mode}"]`);
        if (btn) { btn.classList.add('active'); state.mode = s.mode; timeConfig.classList.toggle('hidden', s.mode !== 'zeit'); }
      }
    } catch(e) {}
  }
});
