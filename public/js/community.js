/**
 * ROSA EM ALERTA — COMUNIDADE & MURAL ESCOLAR
 * Mural colaborativo de apoio, dúvidas educativas e mensagens de conscientização.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadCommunityPosts();
  setupCommunityForm();
});

// CARREGAR POSTS DA COMUNIDADE
async function loadCommunityPosts() {
  const container = document.getElementById('community-posts-container');
  if (!container) return;

  try {
    const res = await fetch('/api/community');
    const data = await res.json();

    if (data.success && data.posts) {
      renderCommunityPosts(data.posts);
    }
  } catch (err) {
    console.error('Erro ao carregar mensagens da comunidade:', err);
  }
}

// RENDERIZAR CARDS DA COMUNIDADE
function renderCommunityPosts(posts) {
  const container = document.getElementById('community-posts-container');
  if (!container) return;

  container.innerHTML = '';

  if (posts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text-light); grid-column:1/-1;">
        Seja a primeira pessoa a deixar uma mensagem de conscientização no mural!
      </div>
    `;
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'community-card';
    card.style.cssText = `
      background: #FFFFFF;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: var(--transition-smooth);
    `;

    const categoryBadge = post.categoria === 'APOIO' ? '💗 Apoio' : (post.categoria === 'DUVIDA' ? '❓ Dúvida' : '📢 Conscientização');

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:0.75rem; font-weight:700; color:var(--rose-700); background:var(--rose-100); padding:3px 10px; border-radius:var(--radius-full);">
            ${categoryBadge}
          </span>
          <span style="font-size:0.75rem; color:var(--text-light);">
            ${post.data ? post.data.split('T')[0] : 'Hoje'}
          </span>
        </div>
        <h5 style="font-family:var(--font-serif); font-size:1.15rem; color:var(--wine-deep); margin-bottom:8px;">
          ${escapeHTML(post.titulo)}
        </h5>
        <p style="font-size:0.88rem; color:var(--text-body); line-height:1.55; margin-bottom:18px;">
          ${escapeHTML(post.mensagem)}
        </p>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:14px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:50%; background:var(--rose-200); color:var(--rose-800); font-size:0.75rem; font-weight:700; display:flex; align-items:center; justify-content:center;">
            ${getInitials(post.autorNome)}
          </div>
          <div>
            <div style="font-size:0.82rem; font-weight:700; color:var(--wine-deep); line-height:1.1;">
              ${escapeHTML(post.autorNome)}
            </div>
            <div style="font-size:0.72rem; color:var(--text-light);">
              ${post.role === 'PROFESSOR' ? 'Docente' : 'Aluno'} • ${escapeHTML(post.turma || '')}
            </div>
          </div>
        </div>

        <button class="btn-like-post" data-id="${post.id}" style="background:none; border:1px solid var(--rose-200); border-radius:var(--radius-full); padding:4px 12px; font-size:0.78rem; font-weight:600; color:var(--rose-700); cursor:pointer; display:flex; align-items:center; gap:4px; transition:var(--transition-smooth);">
          <span>❤️</span> <span class="like-counter">${post.curtidas || 0}</span>
        </button>
      </div>
    `;

    // Ação do Like
    const likeBtn = card.querySelector('.btn-like-post');
    if (likeBtn) {
      likeBtn.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/community/${post.id}/like`, { method: 'POST' });
          const resData = await res.json();
          if (resData.success) {
            const counter = likeBtn.querySelector('.like-counter');
            if (counter) counter.textContent = resData.likes;
            likeBtn.style.background = 'var(--rose-100)';
            likeBtn.style.borderColor = 'var(--rose-400)';
          }
        } catch (e) {
          console.error(e);
        }
      });
    }

    container.appendChild(card);
  });
}

// SETUP DO FORMULÁRIO DE NOVA POSTAGEM
function setupCommunityForm() {
  const form = document.getElementById('community-new-post-form');
  const roleSelect = document.getElementById('comm-role-select');
  const turmaInput = document.getElementById('comm-turma-input');

  if (roleSelect && turmaInput) {
    roleSelect.addEventListener('change', () => {
      turmaInput.placeholder = roleSelect.value === 'ALUNO' 
        ? 'Sua Sala / Turma (Ex: 3º Ano A)' 
        : 'Sua Área (Ex: Biologia / Física)';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const autorNome = document.getElementById('comm-author-input').value.trim();
      const role = document.getElementById('comm-role-select').value;
      const turma = document.getElementById('comm-turma-input').value.trim();
      const titulo = document.getElementById('comm-title-input').value.trim();
      const mensagem = document.getElementById('comm-message-input').value.trim();
      const categoria = document.getElementById('comm-category-select').value;
      const submitBtn = document.getElementById('comm-submit-btn');

      if (!mensagem) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publicando...';
      }

      try {
        const res = await fetch('/api/community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ autorNome, role, turma, titulo, mensagem, categoria })
        });
        const data = await res.json();

        if (data.success) {
          form.reset();
          loadCommunityPosts();
        }
      } catch (err) {
        console.error('Erro ao postar na comunidade:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Publicar no Mural ✦';
        }
      }
    });
  }
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
