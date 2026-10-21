/**
 * ROSA EM ALERTA — AGENTE DE IA (DRA. ROSA)
 * Conexão com a API do Gemini com fallback para motor especializado do INCA.
 * Suporta leitura por voz (SpeechSynthesis) e chips de perguntas rápidas.
 */

let isChatOpen = false;
let isAudioReadingEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
  initChatWidget();
});

function initChatWidget() {
  const launcherBtn = document.getElementById('chat-launcher-btn');
  const chatBox = document.getElementById('chat-widget-box');
  const closeBtn = document.getElementById('chat-close-btn');
  const chatForm = document.getElementById('chat-input-form');
  const chatInput = document.getElementById('chat-input-field');
  const quickChips = document.querySelectorAll('.quick-chip');
  const audioVoiceBtn = document.getElementById('chat-voice-btn');

  // Toggle abrir / fechar
  if (launcherBtn && chatBox) {
    launcherBtn.addEventListener('click', () => {
      isChatOpen = !isChatOpen;
      chatBox.classList.toggle('active', isChatOpen);
      if (isChatOpen) {
        chatInput.focus();
      }
    });
  }

  if (closeBtn && chatBox) {
    closeBtn.addEventListener('click', () => {
      isChatOpen = false;
      chatBox.classList.remove('active');
    });
  }

  // Enviar mensagem
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      sendChatMessage(text);
    });
  }

  // Chips de perguntas rápidas
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (query) {
        sendChatMessage(query);
      }
    });
  });

  // Toggle leitura por voz
  if (audioVoiceBtn) {
    audioVoiceBtn.addEventListener('click', () => {
      isAudioReadingEnabled = !isAudioReadingEnabled;
      audioVoiceBtn.style.opacity = isAudioReadingEnabled ? '1' : '0.5';
      audioVoiceBtn.title = isAudioReadingEnabled ? 'Voz ativada' : 'Voz desativada';
      if (!isAudioReadingEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
  }
}

// ENVIAR MENSAGEM AO SERVIDOR / GEMINI
async function sendChatMessage(userText) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  // Renderizar mensagem do usuário
  appendMessage('user', userText);

  // Renderizar indicador de digitação
  const typingIndicator = appendTypingIndicator();
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    const data = await res.json();

    // Remover indicador de digitação
    if (typingIndicator) typingIndicator.remove();

    if (data.success && data.reply) {
      appendMessage('bot', data.reply, data.provider);
      if (isAudioReadingEnabled) {
        speakText(data.reply);
      }
    } else {
      appendMessage('bot', 'Desculpe, ocorreu uma instabilidade temporária. Consulte as diretrizes oficiais do INCA na seção de fontes.');
    }
  } catch (err) {
    if (typingIndicator) typingIndicator.remove();
    appendMessage('bot', 'No momento estou operando no modo de contingência. Para informações oficiais, acesse a seção de Fontes e Dados Oficiais do INCA.');
  }

  container.scrollTop = container.scrollHeight;
}

// ADICIONAR MENSAGEM NO CHAT
function appendMessage(sender, text, provider = null) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = `chat-message-row ${sender}`;

  const avatar = document.createElement('div');
  avatar.className = 'chat-msg-avatar';
  avatar.textContent = sender === 'user' ? 'Você' : '🌸';

  const bubble = document.createElement('div');
  bubble.className = 'chat-msg-bubble';
  bubble.innerHTML = formatMarkdownToHTML(text);

  if (sender === 'bot' && provider) {
    const provBadge = document.createElement('div');
    provBadge.style.fontSize = '0.68rem';
    provBadge.style.color = 'var(--text-light)';
    provBadge.style.marginTop = '6px';
    provBadge.style.fontStyle = 'italic';
    provBadge.textContent = `⚡ ${provider}`;
    bubble.appendChild(provBadge);
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

// INDICADOR DE DIGITAÇÃO
function appendTypingIndicator() {
  const container = document.getElementById('chat-messages-container');
  const row = document.createElement('div');
  row.className = 'chat-message-row bot typing-row';
  row.innerHTML = `
    <div class="chat-msg-avatar">🌸</div>
    <div class="chat-msg-bubble">
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  container.appendChild(row);
  return row;
}

// CONVERSOR SIMPLES DE MARKDOWN PARA HTML SEGURO
function formatMarkdownToHTML(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Negrito **texto**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Itálico *texto*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Listas com traço ou ponto
  html = html.replace(/^[•\-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  // Quebras de linha
  html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');

  return `<p>${html}</p>`;
}

// LEITURA POR VOZ (ACESSIBILIDADE)
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  // Limpar formatação markdown
  const clean = text.replace(/[*_#•\-]/g, '');
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'pt-BR';
  utter.rate = 1.05;
  window.speechSynthesis.speak(utter);
}
