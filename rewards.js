(function () {
  let score = 0;
  let streak = 0;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SUCCESS_MSGS = [
    'Super gemacht! ⭐', 'Rechenprofi! 🏆', 'Genial! 🎉', 'Weiter so! 🚀',
    'Mathematik-Star! ✨', 'Toll! 👏', 'Richtig! 💪', 'Klasse! 🌟'
  ];

  function createOverlay(text, extra) {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '9999', pointerEvents: 'none'
    });
    const msg = document.createElement('div');
    Object.assign(msg.style, {
      background: '#fff', borderRadius: '16px', padding: '32px 48px',
      fontSize: '2rem', fontFamily: 'sans-serif', boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      textAlign: 'center', ...extra
    });
    if (!reducedMotion()) {
      msg.style.animation = 'rewards-pop 0.3s ease';
    }
    msg.textContent = text;
    el.appendChild(msg);
    document.body.appendChild(el);
    return el;
  }

  function showTimed(text, ms, extra) {
    const el = createOverlay(text, extra);
    setTimeout(() => el.remove(), ms);
  }

  function ensureStyles() {
    if (document.getElementById('rewards-styles')) return;
    const style = document.createElement('style');
    style.id = 'rewards-styles';
    style.textContent = `
      @keyframes rewards-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes rewards-milestone { 0% { transform: scale(0.5) rotate(-5deg); opacity: 0; } 50% { transform: scale(1.1) rotate(2deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
      @keyframes rewards-fall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
      @keyframes rewards-float { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-60px); } }
    `;
    document.head.appendChild(style);
  }

  ensureStyles();

  window.Rewards = {
    showSuccess() {
      const msg = SUCCESS_MSGS[Math.floor(Math.random() * SUCCESS_MSGS.length)];
      showTimed(msg, 1500);
    },
    showError() {
      showTimed('Hmm, versuche es nochmal! 🤔', 1500, { background: '#fff3cd' });
    },
    showHint(text) {
      showTimed(text, 3000, { background: '#d1ecf1', border: '2px solid #0c5460', fontSize: '1.4rem' });
    },
    showMilestone(text) {
      const el = createOverlay(text, { background: 'linear-gradient(135deg, #ffd700, #ffec8b)', fontSize: '2.4rem' });
      if (!reducedMotion()) {
        el.querySelector('div').style.animation = 'rewards-milestone 0.5s ease';
      }
      setTimeout(() => el.remove(), 2500);
    },
    confetti() {
      if (reducedMotion()) return;
      const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
      const container = document.createElement('div');
      Object.assign(container.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '9998', overflow: 'hidden' });
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        Object.assign(p.style, {
          position: 'absolute', top: '-10px',
          left: Math.random() * 100 + '%',
          width: (6 + Math.random() * 8) + 'px',
          height: (6 + Math.random() * 8) + 'px',
          background: colors[Math.floor(Math.random() * colors.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '0',
          animation: `rewards-fall ${1.5 + Math.random() * 1}s linear forwards`,
          animationDelay: Math.random() * 0.5 + 's'
        });
        container.appendChild(p);
      }
      document.body.appendChild(container);
      setTimeout(() => container.remove(), 2000);
    },
    pointsAnimation(points, targetEl) {
      if (reducedMotion()) return;
      const rect = targetEl.getBoundingClientRect();
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'fixed', left: rect.left + rect.width / 2 + 'px', top: rect.top + 'px',
        fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50', pointerEvents: 'none',
        zIndex: '9999', animation: 'rewards-float 1s ease forwards'
      });
      el.textContent = '+' + points;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    },
    addPoints(n) { score += n; },
    getScore() { return score; },
    resetScore() { score = 0; },
    getStreak() { return streak; },
    addStreak() { streak++; },
    resetStreak() { streak = 0; },
    checkStreakBonus() {
      if (streak === 10) return 20;
      if (streak === 5) return 10;
      if (streak === 3) return 5;
      return 0;
    },
    saveHighscore(key, s) {
      try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) {}
    },
    getHighscore(key) {
      try { return JSON.parse(localStorage.getItem(key)) || 0; } catch (e) { return 0; }
    }
  };
})();
