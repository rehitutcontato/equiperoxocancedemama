-- ============================================================
-- PROJETO OUTUBRO ROSA: ROSA EM ALERTA
-- SCHEMA OFICIAL DE BANCO DE DADOS RELACIONAL (MySQL / MariaDB / SQLite)
-- Baseado no Plano de Desenvolvimento Funcional e Técnico
-- ============================================================

-- 1. TABELA DE USUÁRIOS / PARTICIPANTES
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    apelido VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ALUNO', 'PROFESSOR', 'VISITANTE')),
    turma VARCHAR(50) DEFAULT NULL, -- Obrigatório para ALUNO (Ex: 3º Ano A - Informática)
    email VARCHAR(150) UNIQUE DEFAULT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CONTEÚDO EDUCATIVO (Curadoria INCA / MS)
CREATE TABLE IF NOT EXISTS conteudos_educativos (
    id VARCHAR(36) PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'ESTATISTICA', 'PREVENCAO', 'SINAIS', 'RASTREAMENTO', 'MITOS'
    corpo TEXT NOT NULL,
    fonte_nome VARCHAR(100) NOT NULL, -- Ex: 'INCA', 'Ministério da Saúde'
    fonte_url VARCHAR(255) NOT NULL,
    ano_referencia VARCHAR(20) NOT NULL,
    data_consulta DATE NOT NULL,
    revisor VARCHAR(100) DEFAULT 'Equipe de Saúde Escolar',
    status VARCHAR(20) DEFAULT 'PUBLICADO'
);

-- 3. TABELA DE PERGUNTAS DO QUIZ
CREATE TABLE IF NOT EXISTS perguntas_quiz (
    id VARCHAR(36) PRIMARY KEY,
    conteudo_id VARCHAR(36),
    enunciado TEXT NOT NULL,
    dificuldade VARCHAR(20) DEFAULT 'MEDIA', -- 'FACIL', 'MEDIA', 'DIFICIL'
    explicacao TEXT NOT NULL,
    fonte_citada VARCHAR(255) NOT NULL,
    pontos INT DEFAULT 20,
    status VARCHAR(20) DEFAULT 'ATIVO',
    FOREIGN KEY (conteudo_id) REFERENCES conteudos_educativos(id) ON DELETE SET NULL
);

-- 4. TABELA DE ALTERNATIVAS DO QUIZ
CREATE TABLE IF NOT EXISTS alternativas (
    id VARCHAR(36) PRIMARY KEY,
    pergunta_id VARCHAR(36) NOT NULL,
    texto VARCHAR(255) NOT NULL,
    is_correta BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (pergunta_id) REFERENCES perguntas_quiz(id) ON DELETE CASCADE
);

-- 5. TABELA DE TENTATIVAS DE QUIZ
CREATE TABLE IF NOT EXISTS tentativas_quiz (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    modo VARCHAR(50) DEFAULT 'QUIZ_OFICIAL',
    pontuacao_total INT DEFAULT 0,
    acertos INT DEFAULT 0,
    total_perguntas INT DEFAULT 10,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 6. TABELA DE RESPOSTAS DO USUÁRIO
CREATE TABLE IF NOT EXISTS respostas_usuario (
    id VARCHAR(36) PRIMARY KEY,
    tentativa_id VARCHAR(36) NOT NULL,
    pergunta_id VARCHAR(36) NOT NULL,
    alternativa_escolhida VARCHAR(36) NOT NULL,
    is_correto BOOLEAN NOT NULL,
    pontos_obtidos INT DEFAULT 0,
    data_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tentativa_id) REFERENCES tentativas_quiz(id) ON DELETE CASCADE,
    FOREIGN KEY (pergunta_id) REFERENCES perguntas_quiz(id) ON DELETE CASCADE
);

-- 7. TABELA DE RANKING ESCOLAR (Agregado em Tempo Real & Auditável)
CREATE TABLE IF NOT EXISTS ranking_escolar (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ALUNO', 'PROFESSOR')),
    turma VARCHAR(80) DEFAULT NULL, -- Se aluno, exibe '3º Ano A' etc.
    pontos_totais INT DEFAULT 0,
    partidas_jogadas INT DEFAULT 0,
    acertos_totais INT DEFAULT 0,
    taxa_precisao DECIMAL(5,2) DEFAULT 0.00,
    posicao_ranking INT DEFAULT NULL,
    ultima_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 8. TABELA DA COMUNIDADE / MURAL DE APOIO
CREATE TABLE IF NOT EXISTS comunidade_posts (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36),
    autor_nome VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    turma VARCHAR(80) DEFAULT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    categoria VARCHAR(50) DEFAULT 'DEPOIMENTO', -- 'DUVIDA', 'APOIO', 'CONSCIENTIZACAO'
    curtidas INT DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comunidade_respostas (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    autor_nome VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    is_reposta_util BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES comunidade_posts(id) ON DELETE CASCADE
);

-- ÍNDICES PARA ALTA PERFORMANCE DE CONSULTA NO HACKATHON
CREATE INDEX idx_ranking_pontos ON ranking_escolar(pontos_totais DESC);
CREATE INDEX idx_ranking_role ON ranking_escolar(role);
CREATE INDEX idx_ranking_turma ON ranking_escolar(turma);
