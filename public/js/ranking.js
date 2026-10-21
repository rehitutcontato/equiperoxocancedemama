/**
 * ROSA EM ALERTA — RANKING ESCOLAR & PODIUM CONTROLLER
 * Exibe participantes, diferencia Professores e Alunos (mostrando a sala),
 * filtros por turma, busca em tempo real e exportação em CSV.
 */

let currentFilterRole = 'TODOS';
let currentTurmaFilter = 'TODAS';
let currentSearchQuery = '';
let currentRankingData = [];

document.addEventListener('DOMContentLoaded', () => {
  loadRankingLeaderboard();
  setupRankingEvents();
});

// EXPORTA FUNÇÃO GLOBAL PARA ATUALIZAÇÃO APÓS O QUIZ
window.refreshRankingLeaderboard = function () {
  loadRankingLeaderboard();
};

// CARREGAR DADOS DO RANKING VIA API
async function loadRankingLeaderboard() {
  try {
    const params = new URLSearchParams();
    if (currentFilterRole !== 'TODOS') params.append('role', currentFilterRole);
    if (currentTurmaFilter !== 'TODAS') params.append('turma', currentTurmaFilter);
    if (currentSearchQuery.trim() !== '') params.append('search', currentSearchQuery);

    const res = await fetch(`/api/ranking?${params.toString()}`);
    const data = await res.json();

    if (data.success && data.ranking) {
      currentRankingData = data.ranking;
      renderPodium(data.ranking);
      renderRankingTable(data.ranking);
    }
  } catch (err) {
    console.error('Erro ao carregar o ranking:', err);
  }
}

// RENDERIZAR PÓDIO (TOP 3)
function renderPodium(ranking) {
  const top1 = ranking && ranking[0] ? ranking[0] : null;
  const top2 = ranking && ranking[1] ? ranking[1] : null;
  const top3 = ranking && ranking[2] ? ranking[2] : null;

  renderPodiumStep('first', top1, '👑', 'Aguardando 1º lugar');
  renderPodiumStep('second', top2, '🥈', 'Aguardando 2º lugar');
  renderPodiumStep('third', top3, '🥉', 'Aguardando 3º lugar');
}

function renderPodiumStep(stepClass, participant, icon, placeholder = 'Aguardando') {
  const stepEl = document.querySelector(`.podium-step.${stepClass}`);
  if (!stepEl) return;

  const avatarEl = stepEl.querySelector('.podium-avatar');
  const nameEl = stepEl.querySelector('.podium-participant-name');
  const roleEl = stepEl.querySelector('.podium-role-tag');
  const classEl = stepEl.querySelector('.podium-classroom');
  const pointsEl = stepEl.querySelector('.podium-points');
  const crownEl = stepEl.querySelector('.podium-crown');

  if (!participant) {
    stepEl.style.opacity = '0.5';
    if (avatarEl) avatarEl.textContent = '--';
    if (crownEl) crownEl.textContent = icon;
    if (nameEl) nameEl.textContent = placeholder;
    if (roleEl) {
      roleEl.textContent = 'Disponível';
      roleEl.className = 'podium-role-tag aluno';
    }
    if (classEl) classEl.textContent = 'Faça o quiz para entrar!';
    if (pointsEl) pointsEl.textContent = '0 pts';
    return;
  }

  stepEl.style.opacity = '1';
  if (avatarEl) avatarEl.textContent = getInitials(participant.nome);
  if (crownEl) crownEl.textContent = icon;
  if (nameEl) {
    nameEl.textContent = participant.nome;
    nameEl.title = participant.nome;
  }

  if (roleEl) {
    roleEl.textContent = participant.role === 'PROFESSOR' ? 'Docente' : 'Estudante';
    roleEl.className = `podium-role-tag ${participant.role.toLowerCase()}`;
  }

  if (classEl) {
    if (participant.role === 'ALUNO') {
      classEl.textContent = `📍 ${participant.turma || 'Turma Geral'}`;
    } else {
      classEl.textContent = `🎓 ${participant.turma || 'Corpo Docente'}`;
    }
  }

  if (pointsEl) {
    pointsEl.textContent = `${participant.pontos} pts`;
  }
}

// RENDERIZAR TABELA DE CLASSIFICAÇÃO COMPLETA
function renderRankingTable(ranking) {
  const tbody = document.getElementById('ranking-table-body');
  const emptyState = document.getElementById('ranking-empty-state');
  const countBadge = document.getElementById('ranking-total-count');

  if (countBadge) {
    countBadge.textContent = `${ranking.length} participantes`;
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (ranking.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  ranking.forEach((user, index) => {
    const pos = index + 1;
    let posBadgeClass = '';
    let posIcon = `${pos}º`;

    if (pos === 1) {
      posBadgeClass = 'gold';
      posIcon = '🥇 1º';
    } else if (pos === 2) {
      posBadgeClass = 'silver';
      posIcon = '🥈 2º';
    } else if (pos === 3) {
      posBadgeClass = 'bronze';
      posIcon = '🥉 3º';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="rank-position-cell">
        <span class="pos-badge ${posBadgeClass}">${posIcon}</span>
      </td>
      <td>
        <div class="rank-user-info">
          <div class="user-mini-avatar">${getInitials(user.nome)}</div>
          <div>
            <div class="user-name-cell">${escapeHTML(user.nome)}</div>
            <div style="font-size:0.75rem; color:var(--text-light);">
              ${user.role === 'PROFESSOR' ? 'Professor(a)' : 'Aluno(a)'}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span class="user-classroom-cell ${user.role === 'PROFESSOR' ? 'teacher' : ''}">
          ${user.role === 'ALUNO' ? '🏫 ' + escapeHTML(user.turma || 'Turma Geral') : '📚 ' + escapeHTML(user.turma || 'Docente')}
        </span>
      </td>
      <td style="color:var(--text-muted); font-size:0.85rem;">
        ${user.acertos || 0}/10 acertos
      </td>
      <td class="rank-points-cell">
        <strong style="color:var(--rose-700);">${user.pontos}</strong> <span style="font-size:0.8rem; font-weight:normal; color:var(--text-light);">pts</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// SETUP DE EVENTOS (FILTROS, BUSCA, EXPORTAÇÃO)
function setupRankingEvents() {
  const filterButtons = document.querySelectorAll('.filter-btn[data-role]');
  const searchInput = document.getElementById('ranking-search-input');
  const exportBtn = document.getElementById('btn-export-csv');

  // Filtros de Categoria (Todos, Alunos, Professores)
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterRole = btn.getAttribute('data-role');
      loadRankingLeaderboard();
    });
  });

  // Busca em Tempo Real (debounce leve)
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearchQuery = e.target.value;
        loadRankingLeaderboard();
      }, 250);
    });
  }

  // Exportar para CSV
  if (exportBtn) {
    exportBtn.addEventListener('click', exportRankingToCSV);
  }
}

// EXPORTAR RANKING EM CSV (PARA PROFESSORES / COORDENAÇÃO)
function exportRankingToCSV() {
  if (!currentRankingData.length) {
    alert('Nenhum registro para exportar no momento.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM para Excel
  csvContent += 'Posicao,Nome,Categoria,Turma_Sala,Pontos,Acertos,Total_Questoes,Data\n';

  currentRankingData.forEach((row, i) => {
    const pos = i + 1;
    const nome = `"${(row.nome || '').replace(/"/g, '""')}"`;
    const role = row.role;
    const turma = `"${(row.turma || '').replace(/"/g, '""')}"`;
    const pontos = row.pontos;
    const acertos = row.acertos || 0;
    const total = row.totalPerguntas || 10;
    const data = row.data ? row.data.split('T')[0] : '';

    csvContent += `${pos},${nome},${role},${turma},${pontos},${acertos},${total},${data}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ranking_outubro_rosa_escola_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// HELPERS
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
