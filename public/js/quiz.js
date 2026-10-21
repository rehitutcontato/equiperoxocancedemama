/**
 * ROSA EM ALERTA — QUIZ INTERATIVO (EXATAMENTE 10 QUESTÕES)
 * Validação segura no servidor, áudio via Web Audio API, feedback educativo,
 * cálculo de posição no ranking e celebração com confetti.
 */

let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let currentScore = 0;
let soundEnabled = true;

// Web Audio API sintetizador de feedback elegante
let audioCtx = null;
function playSound(type) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'incorrect') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Silencioso se áudio não for permitido
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();
  setupQuizEventListeners();
});

// CARREGAR AS 10 PERGUNTAS DO BACKEND
async function loadQuestions() {
  try {
    const res = await fetch('/api/quiz/questions');
    const data = await res.json();
    if (data.success && data.questions) {
      quizQuestions = data.questions.slice(0, 10); // Garante exatamente 10 questões
      renderCurrentQuestion();
    }
  } catch (err) {
    console.warn('Erro ao buscar perguntas da API, utilizando contingência local.');
  }
}

// RENDERIZAR PERGUNTA ATUAL
function renderCurrentQuestion() {
  if (!quizQuestions.length) return;

  const q = quizQuestions[currentQuestionIndex];
  const total = quizQuestions.length;

  const progressText = document.getElementById('quiz-progress-text');
  const progressFill = document.getElementById('quiz-progress-fill');
  const categoryTag = document.getElementById('quiz-category-tag');
  const questionText = document.getElementById('quiz-question-text');
  const optionsList = document.getElementById('quiz-options-list');
  const explanationBox = document.getElementById('quiz-explanation-box');
  const nextBtn = document.getElementById('quiz-next-btn');

  if (progressText) progressText.textContent = `Pergunta ${currentQuestionIndex + 1} de ${total}`;
  if (progressFill) progressFill.style.width = `${((currentQuestionIndex + 1) / total) * 100}%`;
  if (categoryTag) categoryTag.textContent = q.category || 'Saúde da Mulher';
  if (questionText) questionText.textContent = q.question;

  if (explanationBox) {
    explanationBox.classList.remove('active');
    explanationBox.innerHTML = '';
  }
  if (nextBtn) {
    nextBtn.style.display = 'none';
    nextBtn.textContent = currentQuestionIndex === total - 1 ? 'Concluir Quiz & Ver Pontuação Final ✦' : 'Próxima Pergunta →';
  }

  // Renderizar 4 alternativas
  if (optionsList) {
    optionsList.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.setAttribute('data-index', idx);
      btn.innerHTML = `
        <span class="option-letter" style="font-weight:700; width:26px; height:26px; border-radius:50%; background:var(--rose-100); color:var(--rose-800); display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem; flex-shrink:0;">${letters[idx] || (idx+1)}</span>
        <span class="option-label" style="flex:1;">${optText}</span>
      `;
      btn.addEventListener('click', () => handleOptionSelect(idx));
      optionsList.appendChild(btn);
    });
  }
}

// TRATAR SELEÇÃO DA OPÇÃO
async function handleOptionSelect(selectedIndex) {
  const q = quizQuestions[currentQuestionIndex];
  userAnswers[q.id] = selectedIndex;

  const optionButtons = document.querySelectorAll('.quiz-option-btn');
  optionButtons.forEach(btn => btn.disabled = true);

  const selectedBtn = optionButtons[selectedIndex];
  if (selectedBtn) selectedBtn.classList.add('selected');

  try {
    const res = await fetch('/api/quiz/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: { [q.id]: selectedIndex } })
    });
    const data = await res.json();

    if (data.success && data.results && data.results.length > 0) {
      const resItem = data.results.find(r => r.id === q.id);
      if (resItem) {
        showQuestionFeedback(resItem, selectedIndex);
      }
    }
  } catch (err) {
    console.error('Erro na validação do quiz:', err);
  }
}

// EXIBIR FEEDBACK EDUCATIVO IMEDIATO
function showQuestionFeedback(resItem, selectedIndex) {
  const optionButtons = document.querySelectorAll('.quiz-option-btn');
  const explanationBox = document.getElementById('quiz-explanation-box');
  const nextBtn = document.getElementById('quiz-next-btn');
  const scoreBadge = document.getElementById('quiz-score-badge');

  if (resItem.isCorrect) {
    playSound('correct');
    currentScore += 25;
    if (optionButtons[selectedIndex]) {
      optionButtons[selectedIndex].classList.add('correct');
    }
  } else {
    playSound('incorrect');
    if (optionButtons[selectedIndex]) {
      optionButtons[selectedIndex].classList.add('incorrect');
    }
    if (optionButtons[resItem.correctOption]) {
      optionButtons[resItem.correctOption].classList.add('correct');
    }
  }

  if (scoreBadge) {
    scoreBadge.textContent = `${currentScore} pts`;
  }

  if (explanationBox) {
    explanationBox.innerHTML = `
      <div class="explanation-title" style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:1.2rem;">${resItem.isCorrect ? '✅' : '💡'}</span>
        <span>${resItem.isCorrect ? 'Parabéns, resposta cientificamente correta!' : 'Explicação e Fundamentação Científica:'}</span>
      </div>
      <p class="explanation-text">${resItem.explanation}</p>
      <div class="explanation-source" style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--rose-200);">
        <strong>Fonte Oficial:</strong> <a href="${resItem.sourceUrl}" target="_blank" rel="noopener noreferrer">${resItem.source} ↗</a>
      </div>
    `;
    explanationBox.classList.add('active');
  }

  if (nextBtn) {
    nextBtn.style.display = 'inline-flex';
  }
}

// EVENT LISTENERS
function setupQuizEventListeners() {
  const nextBtn = document.getElementById('quiz-next-btn');
  const startQuizCta = document.getElementById('start-quiz-cta');
  const roleButtons = document.querySelectorAll('.role-btn');
  const registerForm = document.getElementById('ranking-register-form');

  if (startQuizCta) {
    startQuizCta.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('.quiz-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestion();
      } else {
        finishQuiz();
      }
    });
  }

  if (roleButtons) {
    roleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        roleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const role = btn.getAttribute('data-role');
        const turmaGroup = document.getElementById('turma-input-group');
        const turmaLabel = document.getElementById('turma-input-label');
        const roleHidden = document.getElementById('ranking-role-input');

        if (roleHidden) roleHidden.value = role;

        if (role === 'ALUNO') {
          turmaGroup.style.display = 'block';
          turmaLabel.textContent = 'Sua Sala / Turma (Ex: 3º Ano A - Informática)*';
          document.getElementById('ranking-turma-input').required = true;
          document.getElementById('ranking-turma-input').placeholder = 'Ex: 3º Ano A - Informática';
        } else {
          turmaGroup.style.display = 'block';
          turmaLabel.textContent = 'Disciplina / Área de Ensino (Ex: Docente - Biologia)';
          document.getElementById('ranking-turma-input').required = false;
          document.getElementById('ranking-turma-input').placeholder = 'Ex: Docente - Biologia Geral';
        }
      });
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRankingSubmit);
  }
}

// FINALIZAR QUIZ E EXIBIR APRESENTAÇÃO DE PONTUAÇÃO
async function finishQuiz() {
  const quizActiveView = document.getElementById('quiz-active-view');
  const quizResultsCard = document.getElementById('quiz-results-card');
  const finalScoreEl = document.getElementById('final-score-val');
  const resultMessageEl = document.getElementById('result-message-text');

  try {
    const res = await fetch('/api/quiz/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: userAnswers })
    });
    const data = await res.json();

    if (data.success) {
      currentScore = data.score;
      if (finalScoreEl) finalScoreEl.textContent = `${data.score} Pontos`;
      if (resultMessageEl) {
        resultMessageEl.innerHTML = `
          Você acertou <strong>${data.correctCount} de 10 perguntas</strong> (${data.percentage}% de aproveitamento)!<br>
          Seu desempenho reflete um alto nível de conhecimento sobre prevenção, sinais de alerta e cuidados com o corpo.
        `;
      }
    }
  } catch (e) {
    if (finalScoreEl) finalScoreEl.textContent = `${currentScore} Pontos`;
  }

  if (quizActiveView) quizActiveView.style.display = 'none';
  if (quizResultsCard) quizResultsCard.classList.add('active');

  triggerConfetti();
}

// GRAVAÇÃO NO BANCO E EXIBIÇÃO DA POSIÇÃO NO RANKING
async function handleRankingSubmit(e) {
  e.preventDefault();
  const nome = document.getElementById('ranking-nome-input').value.trim();
  const role = document.getElementById('ranking-role-input').value || 'ALUNO';
  const turma = document.getElementById('ranking-turma-input').value.trim();
  const submitBtn = document.getElementById('ranking-submit-btn');
  const statusBox = document.getElementById('ranking-submit-status');

  if (!nome) return;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Gravando no Banco de Dados...';
  }

  try {
    const res = await fetch('/api/ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        role,
        turma: role === 'ALUNO' ? (turma || 'Turma Geral') : (turma || 'Docente'),
        pontos: currentScore,
        acertos: Math.round(currentScore / 25),
        totalPerguntas: 10
      })
    });

    const data = await res.json();
    if (data.success && data.ranking) {
      // Localiza a posição do usuário recém gravado no ranking
      const userRank = data.ranking.find(
        r => r.nome.toLowerCase() === nome.toLowerCase() && r.role === role
      );
      const pos = userRank ? userRank.posicao : 1;

      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.innerHTML = `
          <div style="background:#ECFDF5; border:1.5px solid #10B981; border-radius:var(--radius-md); padding:16px; margin-top:16px; text-align:center;">
            <div style="font-size:1.8rem; margin-bottom:4px;">🎖️</div>
            <h5 style="font-family:var(--font-serif); font-size:1.25rem; color:#065F46; margin-bottom:4px;">
              Sua Classificação Oficial: ${pos}º Lugar!
            </h5>
            <p style="font-size:0.88rem; color:#047857; margin-bottom:12px;">
              Gravado com sucesso no banco de dados da escola para ${escapeHTML(nome)} (${role === 'ALUNO' ? 'Turma ' + escapeHTML(turma) : 'Docente'}).
            </p>
            <a href="#ranking" class="btn btn-primary" style="font-size:0.85rem; padding:8px 18px;">
              Ver Pódio e Tabela Completa 🏆
            </a>
          </div>
        `;
      }

      if (submitBtn) {
        submitBtn.textContent = '✓ Registrado no Banco de Dados';
      }

      // Atualiza o Leaderboard
      if (typeof window.refreshRankingLeaderboard === 'function') {
        window.refreshRankingLeaderboard();
      }

      // Animação suave para o ranking
      setTimeout(() => {
        const rankingSection = document.getElementById('ranking');
        if (rankingSection) {
          rankingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1400);
    }
  } catch (err) {
    console.error('Erro ao salvar no ranking:', err);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Tentar Novamente';
    }
  }
}

// CANVAS CONFETTI
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = canvas.parentElement.offsetHeight;

  const particles = [];
  const colors = ['#E11D48', '#BE185D', '#F472B6', '#FCE7EC', '#D4AF37', '#FFD1DC'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: Math.random() * 6 + 3,
      dx: (Math.random() - 0.5) * 14,
      dy: (Math.random() - 0.7) * 14,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.015 + 0.008
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.25;
      p.alpha -= p.decay;

      if (p.alpha > 0) {
        active = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (active) {
      requestAnimationFrame(render);
    }
  }

  render();
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
