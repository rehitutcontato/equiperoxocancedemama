const fs = require('fs');
const path = require('path');

const RANKING_FILE = path.join(__dirname, '..', 'data', 'ranking.json');
const QUESTIONS_FILE = path.join(__dirname, '..', 'data', 'questions.json');
const COMMUNITY_FILE = path.join(__dirname, '..', 'data', 'community.json');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

// Helpers para leitura e gravação local em arquivo
function readJSON(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Erro ao ler ${filePath}:`, err);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Erro ao escrever em ${filePath}:`, err);
    return false;
  }
}

// -------------------------------------------------------------
// SERVIÇO DE QUIZ (Validação Segura no Servidor)
// -------------------------------------------------------------
function getQuizQuestions() {
  const allQuestions = readJSON(QUESTIONS_FILE, []);
  return allQuestions.map(q => ({
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    points: q.points,
    question: q.question,
    options: q.options
  }));
}

function validateQuizSubmission(userAnswers) {
  const allQuestions = readJSON(QUESTIONS_FILE, []);
  let score = 0;
  let correctCount = 0;
  const results = [];

  allQuestions.forEach((q, index) => {
    const selected = userAnswers[q.id] !== undefined ? userAnswers[q.id] : userAnswers[index];
    const isCorrect = selected === q.correct;
    
    if (isCorrect) {
      score += q.points || 25;
      correctCount++;
    }

    results.push({
      id: q.id,
      question: q.question,
      selectedOption: selected,
      correctOption: q.correct,
      isCorrect,
      explanation: q.explanation,
      source: q.source,
      sourceUrl: q.sourceUrl
    });
  });

  return {
    score,
    correctCount,
    totalQuestions: allQuestions.length,
    percentage: Math.round((correctCount / allQuestions.length) * 100),
    results
  };
}

// -------------------------------------------------------------
// SERVIÇO DE RANKING ESCOLAR (SUPABASE OU LOCAL)
// -------------------------------------------------------------
async function getRanking({ role, turma, search } = {}) {
  // 1. Tenta buscar do Supabase se configurado
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      let queryUrl = `${SUPABASE_URL}/rest/v1/ranking_escolar?select=*&order=pontos.desc,acertos.desc,created_at.asc`;
      if (role && role !== 'TODOS') {
        queryUrl += `&role=eq.${encodeURIComponent(role)}`;
      }
      
      const response = await fetch(queryUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (response.ok) {
        let supabaseData = await response.json();
        
        let ranking = supabaseData.map((item, index) => ({
          id: item.id,
          nome: item.nome,
          role: item.role,
          turma: item.turma,
          pontos: item.pontos,
          acertos: item.acertos,
          totalPerguntas: item.total_perguntas,
          data: item.created_at,
          posicao: index + 1
        }));

        if (turma && turma !== 'TODAS') {
          ranking = ranking.filter(item => item.turma && item.turma.toLowerCase().includes(turma.toLowerCase()));
        }

        if (search && search.trim() !== '') {
          const s = search.toLowerCase();
          ranking = ranking.filter(item => 
            item.nome.toLowerCase().includes(s) || 
            (item.turma && item.turma.toLowerCase().includes(s))
          );
        }

        return ranking;
      }
    } catch (sbError) {
      console.warn('Falha na consulta ao Supabase, utilizando armazenamento local:', sbError.message);
    }
  }

  // 2. Fallback para Armazenamento Local
  let ranking = readJSON(RANKING_FILE, []);

  ranking.sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.acertos !== a.acertos) return b.acertos - a.acertos;
    return new Date(b.data || 0) - new Date(a.data || 0);
  });

  ranking = ranking.map((item, index) => ({
    ...item,
    posicao: index + 1
  }));

  if (role && role !== 'TODOS') {
    ranking = ranking.filter(item => item.role === role);
  }

  if (turma && turma !== 'TODAS') {
    ranking = ranking.filter(item => item.turma && item.turma.toLowerCase().includes(turma.toLowerCase()));
  }

  if (search && search.trim() !== '') {
    const s = search.toLowerCase();
    ranking = ranking.filter(item => 
      item.nome.toLowerCase().includes(s) || 
      (item.turma && item.turma.toLowerCase().includes(s))
    );
  }

  return ranking;
}

async function saveRankingParticipant({ nome, role, turma, pontos, acertos, totalPerguntas }) {
  if (!nome || !role) {
    throw new Error('Nome e perfil (Aluno/Professor) são obrigatórios.');
  }

  const cleanRole = role.toUpperCase() === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO';
  const cleanTurma = cleanRole === 'ALUNO' ? (turma || 'Turma Geral') : (turma || 'Docente');
  const cleanPontos = Number(pontos) || 0;
  const cleanAcertos = Number(acertos) || 0;
  const cleanTotal = Number(totalPerguntas) || 10;

  // 1. Tenta salvar no Supabase
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/ranking_escolar`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          nome: nome.trim(),
          role: cleanRole,
          turma: cleanTurma.trim(),
          pontos: cleanPontos,
          acertos: cleanAcertos,
          total_perguntas: cleanTotal
        })
      });

      if (response.ok) {
        const savedData = await response.json();
        return savedData[0] || savedData;
      }
    } catch (sbError) {
      console.warn('Erro ao salvar no Supabase, salvando localmente:', sbError.message);
    }
  }

  // 2. Gravação Local
  const ranking = readJSON(RANKING_FILE, []);
  const existingIndex = ranking.findIndex(
    u => u.nome.trim().toLowerCase() === nome.trim().toLowerCase() && u.role === cleanRole
  );

  const newEntry = {
    id: existingIndex >= 0 ? ranking[existingIndex].id : 'rnk-' + Date.now(),
    nome: nome.trim(),
    role: cleanRole,
    turma: cleanTurma.trim(),
    pontos: cleanPontos,
    acertos: cleanAcertos,
    totalPerguntas: cleanTotal,
    data: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    if (newEntry.pontos >= ranking[existingIndex].pontos) {
      ranking[existingIndex] = newEntry;
    }
  } else {
    ranking.push(newEntry);
  }

  writeJSON(RANKING_FILE, ranking);
  return newEntry;
}

// -------------------------------------------------------------
// SERVIÇO DE COMUNIDADE ESCOLAR
// -------------------------------------------------------------
async function getCommunityPosts() {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/comunidade_posts?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (response.ok) {
        const sbPosts = await response.json();
        return sbPosts.map(p => ({
          id: p.id,
          autorNome: p.autor_nome,
          role: p.role,
          turma: p.turma,
          titulo: p.titulo,
          mensagem: p.mensagem,
          categoria: p.categoria,
          curtidas: p.curtidas,
          data: p.created_at
        }));
      }
    } catch (e) {
      console.warn('Erro consulta comunidade Supabase:', e.message);
    }
  }

  const posts = readJSON(COMMUNITY_FILE, []);
  return posts.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
}

async function addCommunityPost({ autorNome, role, turma, titulo, mensagem, categoria }) {
  const cleanAutor = (autorNome || 'Estudante').trim();
  const cleanRole = role === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO';
  const cleanTurma = (turma || (cleanRole === 'PROFESSOR' ? 'Docente' : 'Comunidade')).trim();
  const cleanTitulo = (titulo || 'Mensagem de Apoio').trim();
  const cleanMensagem = (mensagem || '').trim();
  const cleanCat = categoria || 'CONSCIENTIZACAO';

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/comunidade_posts`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          autor_nome: cleanAutor,
          role: cleanRole,
          turma: cleanTurma,
          titulo: cleanTitulo,
          mensagem: cleanMensagem,
          categoria: cleanCat,
          curtidas: 0
        })
      });
      if (response.ok) {
        const result = await response.json();
        return result[0] || result;
      }
    } catch (e) {
      console.warn('Erro insert comunidade Supabase:', e.message);
    }
  }

  const posts = readJSON(COMMUNITY_FILE, []);
  const newPost = {
    id: 'post-' + Date.now(),
    autorNome: cleanAutor,
    role: cleanRole,
    turma: cleanTurma,
    titulo: cleanTitulo,
    mensagem: cleanMensagem,
    categoria: cleanCat,
    curtidas: 0,
    data: new Date().toISOString()
  };

  posts.unshift(newPost);
  writeJSON(COMMUNITY_FILE, posts);
  return newPost;
}

async function likeCommunityPost(postId) {
  const posts = readJSON(COMMUNITY_FILE, []);
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.curtidas = (post.curtidas || 0) + 1;
    writeJSON(COMMUNITY_FILE, posts);
    return post.curtidas;
  }
  return 1;
}

module.exports = {
  getQuizQuestions,
  validateQuizSubmission,
  getRanking,
  saveRankingParticipant,
  getCommunityPosts,
  addCommunityPost,
  likeCommunityPost
};
