(function() {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const dec = n => String(n).replace('.', ',');

  function grade1() {
    const op = pick(['+', '-']);
    let a, b;
    if (op === '+') { a = rand(0, 20); b = rand(0, 20 - a); }
    else { a = rand(0, 20); b = rand(0, a); }
    const answer = op === '+' ? a + b : a - b;
    return { question: `${a} ${op} ${b} = ?`, answer, hint: op === '+' ? `Zähle von ${a} weiter` : `Zähle von ${a} rückwärts` };
  }

  function grade2() {
    const type = rand(0, 2);
    if (type === 0) {
      const op = pick(['+', '-']);
      let a, b;
      if (op === '+') { a = rand(10, 99); b = rand(1, 100 - a); }
      else { a = rand(10, 100); b = rand(1, a); }
      const answer = op === '+' ? a + b : a - b;
      return { question: `${a} ${op} ${b} = ?`, answer, hint: op === '+' ? `Zerlege ${b} in Zehner und Einer` : `Zähle von ${b} bis ${a}` };
    } else if (type === 1) {
      const op = pick(['+', '-']);
      let a, b;
      if (op === '+') { a = rand(1, 90); b = rand(1, 100 - a); }
      else { a = rand(10, 100); b = rand(1, a); }
      const result = op === '+' ? a + b : a - b;
      const pos = rand(0, 1);
      if (pos === 0) return { question: `? ${op} ${b} = ${result}`, answer: a, hint: 'Welche Zahl fehlt?' };
      return { question: `${a} ${op} ? = ${result}`, answer: b, hint: 'Welche Zahl fehlt?' };
    } else {
      const start = rand(1, 90);
      const step = pick([2, 3, 5, 10]);
      const seq = [start, start + step, start + 2 * step];
      const answer = start + 3 * step;
      return { question: `${seq.join(', ')}, ? (Zahlenreihe)`, answer, hint: `Die Schrittweite ist ${step}` };
    }
  }

  function grade3() {
    const type = rand(0, 2);
    if (type === 0) {
      const a = rand(1, 10), b = rand(1, 10);
      return { question: `${a} × ${b} = ?`, answer: a * b, hint: `${a}er-Reihe: zähle ${a} mal ${b}` };
    } else if (type === 1) {
      const b = rand(1, 10), answer = rand(1, 10), a = b * answer;
      return { question: `${a} ÷ ${b} = ?`, answer, hint: `Wie oft passt ${b} in ${a}?` };
    } else {
      const a = rand(10, 500), b = rand(10, 500);
      const op = pick(['+', '-']);
      if (op === '-' && a < b) return { question: `${b} ${op} ${a} = ?`, answer: b - a, hint: 'Rechne schriftlich' };
      return { question: `${a} ${op} ${b} = ?`, answer: op === '+' ? a + b : a - b, hint: 'Rechne schriftlich' };
    }
  }

  function grade4() {
    const type = rand(0, 2);
    if (type === 0) {
      const a = rand(10, 999), b = rand(10, 99);
      const op = pick(['×', '÷']);
      if (op === '×') return { question: `${a} × ${b} = ?`, answer: a * b, hint: 'Nutze schriftliche Multiplikation' };
      const divisor = b, quotient = rand(10, 99), remainder = rand(0, divisor - 1);
      const dividend = divisor * quotient + remainder;
      if (remainder === 0) return { question: `${dividend} ÷ ${divisor} = ?`, answer: quotient, hint: 'Teile schriftlich' };
      return { question: `${dividend} ÷ ${divisor} = ? Rest ?`, answer: `${quotient} Rest ${remainder}`, hint: 'Teile schriftlich, notiere den Rest' };
    } else if (type === 1) {
      const a = rand(100, 9999), b = rand(100, 9999);
      const op = pick(['+', '-']);
      const x = Math.max(a, b), y = Math.min(a, b);
      return { question: `${x} ${op} ${y} = ?`, answer: op === '+' ? x + y : x - y, hint: 'Stelle die Zahlen untereinander' };
    } else {
      const n = rand(2, 8), price = rand(2, 20);
      const answer = n * price;
      return { question: `${n} Hefte kosten je ${price} €. Wie viel kosten alle zusammen?`, answer: `${answer} €`, hint: 'Multipliziere Anzahl × Preis' };
    }
  }

  function grade56() {
    const type = rand(0, 3);
    if (type === 0) {
      const d = pick([2, 3, 4, 5, 6, 8]);
      const n1 = rand(1, d - 1), n2 = rand(1, d - 1);
      const op = pick(['+', '-']);
      let num = op === '+' ? n1 + n2 : n1 - n2;
      if (op === '-' && num < 0) num = n2 - n1;
      const rn = op === '-' && n1 < n2 ? n2 : n1;
      const rn2 = op === '-' && n1 < n2 ? n1 : n2;
      const resNum = op === '+' ? rn + rn2 : rn - rn2;
      // redo cleanly
      const a = rand(1, d - 1), b = rand(1, d - 1);
      if (op === '-' && a < b) {
        const sum = a + b, diff = b - a;
        const g = gcd(sum, d);
        return { question: `${b}/${d} − ${a}/${d} = ?`, answer: `${diff / gcd(diff, d)}/${d / gcd(diff, d)}`, hint: 'Gleicher Nenner: ziehe die Zähler ab' };
      }
      const res = op === '+' ? a + b : a - b;
      const g = gcd(Math.abs(res), d);
      return { question: `${a}/${d} ${op === '+' ? '+' : '−'} ${b}/${d} = ?`, answer: `${res / g}/${d / g}`, hint: 'Gleicher Nenner: verrechne die Zähler' };
    } else if (type === 1) {
      const a = rand(1, 99) / 10, b = rand(1, 99) / 10;
      const op = pick(['+', '-']);
      const res = op === '+' ? a + b : Math.abs(a - b);
      const answer = Math.round(res * 100) / 100;
      return { question: `${dec(a)} ${op} ${dec(b)} = ?`, answer, hint: 'Achte auf das Komma' };
    } else if (type === 2) {
      const whole = rand(10, 500), pct = pick([10, 20, 25, 50, 75]);
      const answer = Math.round(whole * pct / 100 * 100) / 100;
      return { question: `${pct}% von ${whole} = ?`, answer, hint: `Teile durch ${100 / pct} oder rechne ${whole} × ${pct} ÷ 100` };
    } else {
      const a = rand(-20, -1), b = rand(-20, 20);
      const op = pick(['+', '-']);
      const answer = op === '+' ? a + b : a - b;
      return { question: `(${a}) ${op} (${b}) = ?`, answer, hint: 'Beachte die Vorzeichenregeln' };
    }
  }

  function grade0(options = {}) {
    const ops = options.operations || ['+', '-', '*', '/'];
    const max = options.maxNumber || 100;
    const op = pick(ops);
    let a, b, question, answer;
    if (op === '+') { a = rand(0, max); b = rand(0, max - a); answer = a + b; question = `${a} + ${b} = ?`; }
    else if (op === '-') { a = rand(0, max); b = rand(0, a); answer = a - b; question = `${a} - ${b} = ?`; }
    else if (op === '*') { a = rand(1, Math.min(max, 20)); b = rand(1, Math.floor(max / a) || 1); answer = a * b; question = `${a} × ${b} = ?`; }
    else { b = rand(1, Math.min(max, 20)); answer = rand(1, Math.floor(max / b) || 1); a = b * answer; question = `${a} ÷ ${b} = ?`; }
    return { question, answer, hint: 'Rechne Schritt für Schritt' };
  }

  function generateTask(grade, options) {
    switch (grade) {
      case 1: return grade1();
      case 2: return grade2();
      case 3: return grade3();
      case 4: return grade4();
      case 5: case 6: return grade56();
      case 0: return grade0(options);
      default: return grade1();
    }
  }

  window.MathGen = { generateTask };
})();
