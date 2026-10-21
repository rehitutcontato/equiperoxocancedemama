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
// BASE DE CONHECIMENTO CIENTÍFICA INCA / MINISTÉRIO DA SAÚDE
// -------------------------------------------------------------
const KNOWLEDGE_BASE = [
  {
    id: 'prevencao_protecao',
    keywords: [
      'proteger', 'proteção', 'proteger-se', 'se proteger', 'como se proteger',
      'prevenção', 'prevenir', 'evitar', 'como evitar', 'cuidado', 'cuidados',
      'autocuidado', 'hábitos', 'habito', 'alimentação', 'exercício', 'exercicio',
      'atividade física', 'esporte', 'peso', 'emagrecer', 'obesidade', 'álcool',
      'alcool', 'bebida', 'beber', 'fumo', 'fumar', 'cigarro', 'tabaco',
      'amamentar', 'amamentação', '28%'
    ],
    response: `🌿 **Como se Proteger e Prevenir o Câncer de Mama:**\n\nSegundo dados oficiais do **INCA**, adotar um estilo de vida saudável pode **ajudar a evitar cerca de 28% dos casos** da doença. As principais medidas protetoras comprovadas são:\n\n1. 🏃‍♀️ **Praticar atividade física regularmente:** Pelo menos 150 minutos por semana de caminhada, corrida, dança ou esportes.\n2. ⚖️ **Manter o peso corporal adequado:** Principalmente após a menopausa, pois a gordura corporal em excesso eleva os níveis de estrogênio.\n3. 🥗 **Alimentação saudável e variada:** Rica em frutas, legumes, verduras, grãos integrais e pobre em ultraprocessados.\n4. 🚫 **Evitar ou reduzir bebidas alcoólicas:** O consumo de álcool é um dos fatores modificáveis mais relevantes no risco celular.\n5. 🤱 **Amamentar quando possível:** A amamentação estimula a renovação celular nos ductos mamários e atua como forte fator protetor para mãe e bebê.\n6. 🚭 **Não fumar:** A nicotina e as toxinas do cigarro afetam o DNA e a saúde imunológica.\n\n*Atenção: Hábitos saudáveis protegem muito, mas devem sempre ser acompanhados da mamografia periódica no SUS a partir dos 50 anos.*`
  },
  {
    id: 'sinais_sintomas',
    keywords: [
      'sinal', 'sinais', 'sintoma', 'sintomas', 'caroço', 'caroco', 'nódulo', 'nodulo',
      'nódulos', 'nodulos', 'pele', 'laranja', 'casca de laranja', 'mamilo', 'bico',
      'secreção', 'secrecao', 'líquido', 'liquido', 'sangue', 'axila', 'axilas',
      'íngua', 'ingua', 'pescoço', 'inchaço', 'inchaco', 'dor', 'doer', 'dói',
      'abaulamento', 'vermelhidão', 'coceira'
    ],
    response: `🔍 **Principais Sinais e Sintomas de Alerta (INCA):**\n\nAo observar ou apalpar as mamas, procure avaliação médica se notar:\n\n- 🔴 **Nódulo ou caroço na mama:** Principalmente se for endurecido, fixo, indolor e que não desaparece após o ciclo menstrual.\n- 🍊 **Pele com aspecto de "casca de laranja":** Retração cutânea, repuxamento, rugosidade ou calor localizado.\n- 🔄 **Alterações no mamilo:** Retração repentina, inversão (bico voltado para dentro) ou desvio de posição.\n- 💧 **Saída espontânea de secreção:** Líquido saindo de um dos mamilos sem apertar, em especial se for transparente ou com sangue.\n- 🩺 **Nódulos ou caroços nas axilas ou pescoço:** Linfonodos aumentados que persistem por mais de 3 semanas.\n- ⚠️ **Inchaço assimétrico:** Edema ou aumento progressivo evidente de uma das mamas.\n\n*Importante: Perceber uma alteração NÃO é diagnóstico de câncer, mas exige consulta rápida em uma Unidade Básica de Saúde (UBS).*`
  },
  {
    id: 'rastreamento_mamografia_sus',
    keywords: [
      'mamografia', 'rastreamento', 'idade', 'quantos anos', 'qual idade', 'com quantos anos',
      'quando fazer', 'de quanto em quanto', 'anual', 'bienal', '2 anos', '50 anos', '74 anos',
      'faixa etária', 'exame de rotina', 'ultrassom', 'eco', 'ultrassonografia'
    ],
    response: `🏥 **Diretrizes Oficiais de Mamografia no SUS (Ministério da Saúde):**\n\n- **Público-alvo de Rotina:** Mulheres entre **50 e 74 anos** que não apresentam sintomas.\n- **Periodicidade recomendada:** A cada **2 anos (bienal)**.\n- **Por que essa faixa etária?** Evidências científicas internacionais comprovam que é nessa idade que o rastreamento mamográfico traz o maior benefício de redução da mortalidade com menor incidência de falso-positivos.\n- **Se houver sintomas suspeitos em qualquer idade:** A avaliação médica e o exame diagnóstico (mamografia ou ultrassonografia) são garantidos **em qualquer idade** na rede pública!\n\n*Procure a Unidade Básica de Saúde (UBS) do seu bairro para requisição e agendamento gratuito.*`
  },
  {
    id: 'atendimento_locais',
    keywords: [
      'onde ir', 'onde buscar', 'onde tem', 'atendimento', 'onde fazer', 'como agendar',
      'ubs', 'posto de saúde', 'posto de saude', 'posto', 'hospital', '136', 'disque 136',
      'disque saúde', 'disque saude', 'meu sus digital', 'conecte sus', 'consulta',
      'marcação', 'marcar', 'gratuito', 'de graça', 'cacon', 'unacon'
    ],
    response: `📍 **Onde Buscar Informações e Atendimento no Brasil:**\n\nO Sistema Único de Saúde (SUS) oferece acolhimento, exames e tratamento 100% gratuitos:\n\n1. 🏥 **Unidade Básica de Saúde (UBS / Postinho):** É a porta de entrada. Vá à UBS mais próxima de sua casa com o documento de identidade e Cartão SUS para consulta e solicitação de exames.\n2. 📞 **Disque Saúde 136:** Central telefônica gratuita do Ministério da Saúde. Funciona 24 horas para tirar dúvidas sobre sintomas, saber onde fazer mamografia e obter orientações.\n3. 📱 **Aplicativo Meu SUS Digital:** Permite consultar histórico de consultas, resultados de exames e a rede credenciada de saúde.\n4. 🎗️ **Centros de Alta Complexidade (CACON e UNACON):** Hospitais de referência em oncologia credenciados pelo Ministério da Saúde em todos os estados brasileiros (ex: INCA no RJ, Hospital de Amor e hospitais universitários).`
  },
  {
    id: 'dados_estatisticas',
    keywords: [
      'número', 'numero', 'números', 'numeros', 'dado', 'dados', 'estatística', 'estatisticas',
      'quantos casos', 'quantas pessoas', 'quantas mulheres', 'morte', 'mortes', 'óbito',
      'obito', 'óbitos', 'obitos', 'mortalidade', 'incidência', 'incidencia', '78',
      '78.610', '71,57', '30%', '20.165', '2026', '2028', '2023', 'brasil', 'triênio'
    ],
    response: `📊 **Dossiê Estatístico do Câncer de Mama no Brasil (INCA):**\n\n- **78.610 novos casos estimados por ano** no triênio 2026–2028.\n- **71,57 casos novos a cada 100 mil mulheres** (taxa bruta de incidência).\n- **30,0% de todos os novos tumores femininos**, sendo o **1º tipo de câncer mais incidente** entre mulheres no país (exceto pele não melanoma).\n- **20.165 óbitos** registrados em mulheres no Brasil (dados consolidados de 2023).\n- **11,71 óbitos por 100 mil mulheres** (taxa de mortalidade ajustada por idade em 2021).\n- **28% dos diagnósticos** poderiam ser evitados exclusivamente com hábitos de vida saudáveis.\n\n*Fonte oficial: Instituto Nacional de Câncer (INCA) — Estimativa 2026–2028.*`
  },
  {
    id: 'mitos_verdades',
    keywords: [
      'mito', 'mitos', 'verdade', 'verdades', 'sutiã', 'sutia', 'bojo', 'aro',
      'desodorante', 'antitranspirante', 'homem', 'homens', 'família', 'familia',
      'hereditário', 'hereditario', 'genética', 'genetica', 'mãe', 'mae', 'avó',
      'avo', 'cura', 'tem cura', 'amamentação protege'
    ],
    response: `💡 **Mitos e Verdades sobre o Câncer de Mama:**\n\n❌ **Mito: "Usar desodorante antitranspirante ou sutiã de bojo/aro causa câncer."**\n*Falso! Não há nenhuma evidência científica ou biológica de que o alumínio de antitranspirantes ou o suporte do sutiã causem mutações celulares.*\n\n❌ **Mito: "Ter caso na família significa que eu certamente terei câncer."**\n*Falso! Apenas 5% a 10% dos casos são causados por mutações genéticas hereditárias (como nos genes BRCA1 e BRCA2). Histórico exige atenção e exames regulares, mas não é garantia de adoecimento.*\n\n✅ **Verdade: "Homens também podem desenvolver câncer de mama."**\n*Verdade! Embora raro, homens possuem tecido mamário e representam cerca de 1% do total de diagnósticos.*\n\n✅ **Verdade: "Quanto mais cedo for diagnosticado, maiores são as chances de cura."**\n*Verdade! Quando detectado na fase inicial por exames preventivos, as chances de cura superam 95%.*`
  },
  {
    id: 'autoconhecimento_corpo',
    keywords: [
      'conhecer o corpo', 'conhecer meu corpo', 'autoexame', 'auto-exame', 'autoexame substitui',
      'tocar', 'apalpar', 'como apalpar', 'espelho', 'banho', 'deitada', 'deitar'
    ],
    response: `🪞 **Conhecimento do Próprio Corpo e Cuidados com as Mamas:**\n\nA auto-observação deve ser um hábito natural em três momentos fáceis:\n\n1. 🪞 **Em frente ao espelho:** Com os braços caídos, depois levantados e depois apoiados na cintura, observe o contorno, o formato e se há alguma deformação ou pele franzida.\n2. 🚿 **Durante o banho:** Com a pele úmida e ensaboada, levante um braço e use as pontas dos dedos da outra mão para apalpar suavemente em círculos toda a extensão da mama e axila.\n3. 🛏️ **Ao deitar-se:** Coloque uma almofada sob o ombro e palpe a mama procurando qualquer caroço ou ponto endurecido.\n\n*⚠️ Lembrete de ouro: Conhecer o corpo ajuda você a notar mudanças precoces, mas NÃO substitui a mamografia bienal aos 50–74 anos nem a consulta médica.*`
  }
];

function findBestKnowledgeResponse(userMessage) {
  const clean = userMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos para facilitar correspondência

  let bestMatch = null;
  let highestScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      const cleanKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (clean.includes(cleanKw)) {
        // Palavras maiores valem mais pontos de especificidade
        score += cleanKw.length > 5 ? 3 : 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item.response;
    }
  }

  return highestScore > 0 ? bestMatch : null;
}

// -------------------------------------------------------------
// ENDPOINT DE CHAT DA DRA. ROSA
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Mensagem vazia' });
    }

    // 1. Tentar consulta ao Gemini se houver chave válida do Google (começando com AIza)
    if (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIza') && GEMINI_API_KEY.length > 25) {
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
                parts: [{ text: systemPrompt + "\n\nPergunta do usuário: " + message }]
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
        console.log('Gemini API offline ou chave com restrição, utilizando Motor Especializado Rosa IA.');
      }
    }

    // 2. Motor de Conhecimento Científico Especializado (INCA / MS)
    const matchedResponse = findBestKnowledgeResponse(message);

    if (matchedResponse) {
      return res.json({
        success: true,
        reply: matchedResponse,
        provider: 'Dra. Rosa IA (Curadoria INCA / Ministério da Saúde)'
      });
    }

    // Resposta padrão caso nenhuma palavra-chave médica seja identificada
    const defaultResponse = `🌸 Olá! Sou a **Dra. Rosa**, assistente virtual educativa da campanha *Rosa em Alerta*.\n\nPosso esclarecer qualquer dúvida com base nas diretrizes oficiais do **INCA** e **Ministério da Saúde**:\n\n- 🛡️ **Como se proteger e hábitos saudáveis** (que evitam até 28% dos casos)\n- 🔍 **Sinais de alerta** (nódulos, retração cutânea e secreções)\n- 🏥 **Mamografia no SUS** (idade recomendada e periodicidade de 2 anos)\n- 📍 **Onde buscar atendimento gratuito** (UBS e Disque Saúde 136)\n- 📊 **Estatísticas no Brasil** (78.610 novos casos estimados no triênio 2026–2028)\n- 💡 **Mitos e verdades** (desodorantes, sutiãs e histórico familiar)\n\n*Digite sua dúvida (ex: "como se proteger?", "onde fazer mamografia?") ou selecione um dos botões abaixo!*`;

    res.json({
      success: true,
      reply: defaultResponse,
      provider: 'Dra. Rosa IA (Curadoria INCA / Ministério da Saúde)'
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
