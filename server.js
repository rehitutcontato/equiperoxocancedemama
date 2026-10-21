const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// ROTAS DE API: QUIZ
// -------------------------------------------------------------
app.get('/api/quiz/questions', (req, res) => {
  try {
    const questions = db.getQuizQuestions();
    res.json({ success: true, count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar perguntas do quiz' });
  }
});

app.post('/api/quiz/validate', (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Respostas inválidas fornecidas' });
    }
    const result = db.validateQuizSubmission(answers);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao validar respostas' });
  }
});

// -------------------------------------------------------------
// ROTAS DE API: RANKING ESCOLAR (SUPABASE / LOCAL)
// -------------------------------------------------------------
app.get('/api/ranking', async (req, res) => {
  try {
    const { role, turma, search } = req.query;
    const ranking = await db.getRanking({ role, turma, search });
    
    const totalParticipantes = ranking.length;
    const mediaPontos = totalParticipantes > 0 
      ? Math.round(ranking.reduce((acc, cur) => acc + (cur.pontos || 0), 0) / totalParticipantes)
      : 0;

    res.json({
      success: true,
      stats: { totalParticipantes, mediaPontos },
      ranking
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao carregar o ranking escolar' });
  }
});

app.post('/api/ranking', async (req, res) => {
  try {
    const { nome, role, turma, pontos, acertos, totalPerguntas } = req.body;
    if (!nome || !role) {
      return res.status(400).json({ success: false, error: 'Nome e Perfil (Aluno/Professor) são obrigatórios.' });
    }
    if (role === 'ALUNO' && (!turma || turma.trim() === '')) {
      return res.status(400).json({ success: false, error: 'Para alunos, a turma/sala é obrigatória.' });
    }

    const saved = await db.saveRankingParticipant({ nome, role, turma, pontos, acertos, totalPerguntas });
    const updatedRanking = await db.getRanking();

    res.json({
      success: true,
      message: 'Pontuação registrada com sucesso no banco de dados!',
      participant: saved,
      ranking: updatedRanking
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao registrar pontuação' });
  }
});

// -------------------------------------------------------------
// ROTAS DE API: COMUNIDADE ESCOLAR
// -------------------------------------------------------------
app.get('/api/community', async (req, res) => {
  try {
    const posts = await db.getCommunityPosts();
    res.json({ success: true, count: posts.length, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao obter mensagens da comunidade' });
  }
});

app.post('/api/community', async (req, res) => {
  try {
    const { autorNome, role, turma, titulo, mensagem, categoria } = req.body;
    if (!mensagem || mensagem.trim() === '') {
      return res.status(400).json({ success: false, error: 'A mensagem não pode ser vazia.' });
    }
    const newPost = await db.addCommunityPost({ autorNome, role, turma, titulo, mensagem, categoria });
    res.json({ success: true, post: newPost });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao publicar no mural da comunidade' });
  }
});

app.post('/api/community/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const likes = await db.likeCommunityPost(id);
    if (likes === null) {
      return res.status(404).json({ success: false, error: 'Post não encontrado' });
    }
    res.json({ success: true, likes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao curtir post' });
  }
});

// -------------------------------------------------------------
// ROTAS DE API: CHATBOT IA "DRA. ROSA" (GEMINI + KNOWLEDGE ENGINE)
// -------------------------------------------------------------
const KNOWLEDGE_RESPONSES = [
  {
    keywords: ['número', 'dado', 'estatística', 'casos', 'quantos', 'estimativa', '78', '78.610'],
    response: `🌸 **Dados Oficiais do INCA (Triênio 2026–2028):**\n\n- **78.610 novos casos por ano** estimados no Brasil.\n- **71,57 novos casos a cada 100 mil mulheres** (taxa de incidência).\n- **30% de todos os cânceres femininos** diagnosticados no país, ocupando o **1º lugar** em incidência.\n- Em 2023, foram registrados **20.165 óbitos** femininos.\n\n*Fonte oficial: INCA — Síntese de Resultados e Comentários 2026–2028.*`
  },
  {
    keywords: ['prevenção', 'hábitos', 'prevenir', 'evitar', 'alimentação', 'atividade', '28%'],
    response: `🌿 **Prevenção Primária segundo o INCA:**\n\nO INCA estima que até **28% dos casos de câncer de mama podem ser evitados** através de hábitos saudáveis:\n\n1. **Atividade física regular** (caminhada, esportes, dança).\n2. **Manutenção do peso adequado** (especialmente após a menopausa).\n3. **Alimentação saudável e variada** (rica em vegetais, frutas e fibras).\n4. **Evitar ou reduzir bebidas alcoólicas**.\n5. **Amamentação** (fator protetor comprovado para mães e bebês).\n6. **Não fumar** e evitar terapias hormonais sem indicação médica.\n\n*Lembre-se: ter hábitos saudáveis protege o corpo, mas o diagnóstico precoce continua fundamental!*`
  },
  {
    keywords: ['sinais', 'sintomas', 'caroço', 'nódulo', 'pele', 'laranja', 'mamilo', 'secreção'],
    response: `🔍 **Principais Sinais de Alerta para Avaliação Médica:**\n\n- **Nódulo ou caroço na mama**, fixo, endurecido e indolor.\n- **Pele com aspecto de 'casca de laranja'** ou retração cutânea.\n- **Alterações no mamilo** (inversão, desvio ou dor localizada).\n- **Saída espontânea de secreção** (especialmente transparente ou sanguinolenta).\n- **Pequenos nódulos palpáveis nas axilas ou no pescoço**.\n\n⚠️ *Importante: Notar qualquer um desses sinais NÃO significa necessariamente ter câncer, mas exige consulta imediata em uma Unidade Básica de Saúde (UBS).*`
  },
  {
    keywords: ['mamografia', 'sus', 'idade', 'rastreamento', 'exame', '50', '74', 'atendimento', '136'],
    response: `🏥 **Diretrizes de Rastreamento no SUS (Ministério da Saúde):**\n\n- **Público-alvo assintomático:** Mulheres de **50 a 74 anos**.\n- **Periodicidade:** A cada **2 anos** (mamografia bienal).\n- **Com sintomas suspeitos:** A avaliação médica e os exames de imagem diagnósticos são garantidos **em qualquer idade** pelo SUS!\n- **Onde buscar:** Unidade Básica de Saúde (UBS) do seu bairro ou ligue gratuitamente para o **Disque Saúde 136**.\n\n*Diferença essencial: Rastreamento é o exame preventivo de rotina; Diagnóstico é o exame investigativo quando já existe alteração percebida.*`
  },
  {
    keywords: ['mito', 'sutiã', 'desodorante', 'hereditário', 'genética', 'família'],
    response: `💡 **Mitos e Verdades sobre o Câncer de Mama:**\n\n❌ **Mito:** Desodorante ou sutiã de bojo causam câncer. *(Falso! Não há nenhuma base biológica ou científica nisso).* \n❌ **Mito:** Ter caso na família significa que eu terei a doença. *(Apenas 5% a 10% dos casos são hereditários. Histórico requer acompanhamento regular, mas não é sentença).* \n✅ **Verdade:** Homens também podem ter câncer de mama, correspondendo a cerca de 1% do total de casos.\n✅ **Verdade:** O autoexame ajuda no autoconhecimento, mas NÃO substitui a mamografia.`
  }
];

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Mensagem vazia' });
    }

    const lower = message.toLowerCase();

    if (GEMINI_API_KEY && !GEMINI_API_KEY.includes(' ') && GEMINI_API_KEY.length > 20) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
        
        const systemPrompt = `Você é a "Dra. Rosa", a Inteligência Artificial e Consultora Educacional Oficial da plataforma "Rosa em Alerta" (Outubro Rosa), desenvolvida pela Equipe Roxa.
Sua missão é responder com empatia, tom sofisticado e acolhedor, fundamentando-se com absoluto rigor científico nas diretrizes oficiais do INCA e Ministério da Saúde do Brasil:
- Casos anuais: 78.610 (triênio 2026-2028).
- Taxa de incidência: 71,57 por 100 mil mulheres.
- 1º tipo de câncer mais incidente entre mulheres (cerca de 30% dos novos casos).
- 20.165 óbitos em 2023.
- Prevenção: 28% dos casos podem ser evitados com atividade física, alimentação saudável e controle de peso.
- Rastreamento no SUS: mamografia a cada 2 anos para mulheres de 50 a 74 anos assintomáticas.
- Sempre reforce que você é uma IA educativa e que nenhuma informação substitui a consulta presencial com profissionais de saúde.
Responda de forma clara, formatada com tópicos e emojis gentis.`;

        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt + "\n\nPergunta do usuário: " + message }
                ]
              }
            ]
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (response.ok) {
          const geminiData = await response.json();
          const replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return res.json({
              success: true,
              reply: replyText,
              provider: 'Gemini 1.5 Flash'
            });
          }
        }
      } catch (geminiError) {
        console.log('Gemini API offline ou chave de teste, utilizando Motor Especializado Rosa IA.');
      }
    }

    let matchedResponse = null;
    for (const item of KNOWLEDGE_RESPONSES) {
      if (item.keywords.some(k => lower.includes(k))) {
        matchedResponse = item.response;
        break;
      }
    }

    if (!matchedResponse) {
      matchedResponse = `🌸 Olá! Sou a **Dra. Rosa**, assistente virtual da campanha Rosa em Alerta.\n\nPosso te ajudar com informações verificadas sobre:\n- 📊 **Estatísticas Oficiais do INCA (2026–2028)**\n- 🏃‍♀️ **Prevenção Primária (hábitos que reduzem em 28% os riscos)**\n- 🔍 **Sinais de Alerta que merecem atenção médica**\n- 🏥 **Diretrizes de Mamografia no SUS e Disque 136**\n- 💡 **Mitos e Verdades sobre a saúde das mamas**\n\n*Como posso ajudar você hoje? Digite sua dúvida ou selecione uma das opções acima!*`;
    }

    res.json({
      success: true,
      reply: matchedResponse,
      provider: 'Motor Especializado Rosa IA (INCA/MS Curadoria)'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro no processamento do assistente virtual' });
  }
});

// Inicialização do servidor
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🌸 PLATAFORMA ROSA EM ALERTA (EQUIPE ROXA)`);
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
